import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, UserProduct } from '../../../services/product.service';

export interface CategoryTabItem {
  id: string;
  name: string;
  image: string;
}

@Component({
  selector: 'app-room-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './room-product-list.html',
  styleUrl: './room-product-list.css'
})
export class RoomProductList implements OnInit {
  activeFilter: string | null = 'Danh mục';
  currentCategory: string = 'all';
  currentRoom: string = '';
  products: any[] = [];
  isBestSellerOnly: boolean = false;
  sortOption: string = '';
  selectedMaterial: string = '';
  selectedPriceRange: string = '';
  selectedRating: number = 0;
  filters: string[] = ['Danh mục', 'Sắp xếp', 'Chất liệu', 'Giá', 'Đánh giá'];
  isLoading: boolean = false;

  dbCategories: any[] = [];
  dbRooms: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  roomNamesMap: Record<string, string> = {};
  categoryNamesMap: Record<string, string> = {};

  get subCategories(): CategoryTabItem[] {
    if (!this.dbCategories || this.dbCategories.length === 0) {
      return [];
    }
    return this.dbCategories.map(cat => ({
      id: cat.slug || cat._id,
      name: cat.name,
      image: cat.thumbnail || ''
    }));
  }

  get availableMaterials(): string[] {
    const set = new Set<string>();
    this.products.forEach(p => {
      if (Array.isArray(p.materials)) {
        p.materials.forEach((m: string) => {
          if (m && m.trim()) set.add(m.trim());
        });
      }
    });
    return Array.from(set).slice(0, 8);
  }

  get displayedProducts() {
    let result = [...this.products];

    if (this.isBestSellerOnly) {
      result = result.filter(p => p.badge === 'Best seller' || p.badge === 'Bán chạy' || p.badge === 'Hot');
    }

    if (this.selectedPriceRange === 'under3m') {
      result = result.filter(p => p.price < 3000000);
    } else if (this.selectedPriceRange === '3m-10m') {
      result = result.filter(p => p.price >= 3000000 && p.price <= 10000000);
    } else if (this.selectedPriceRange === 'above10m') {
      result = result.filter(p => p.price > 10000000);
    }

    if (this.selectedRating > 0) {
      result = result.filter(p => (p.reviews || 0) > 0 && (p.rating || 0) >= this.selectedRating);
    }

    if (this.selectedMaterial) {
      result = result.filter(p => (p.materials || []).some((m: string) => m.toLowerCase().includes(this.selectedMaterial.toLowerCase())));
    }

    if (this.sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  get bestSellerCount(): number {
    return this.products.filter(p => p.badge === 'Best seller' || p.badge === 'Bán chạy' || p.badge === 'Hot').length;
  }

  get formattedRoomName(): string {
    return this.roomNamesMap[this.currentRoom] || this.currentRoom.replace(/-/g, ' ') || 'Không gian';
  }

  get formattedCategoryName(): string {
    if (!this.currentCategory || this.currentCategory === 'all') {
      return 'Tất cả sản phẩm';
    }
    return this.categoryNamesMap[this.currentCategory] || this.currentCategory.replace(/-/g, ' ');
  }

  get currentDescription(): string {
    return `Khám phá các sản phẩm ${this.formattedCategoryName.toLowerCase()} chất lượng cao của LIVORA, mang lại sự tiện nghi và vẻ đẹp tinh tế cho không gian sống của bạn.`;
  }

  ngOnInit() {
    // 0. Đồng bộ lại dữ liệu 50 sản phẩm và 10 không gian với hình ảnh liên quan chuẩn đẹp
    this.productService.syncMockProducts().subscribe({
      next: () => {
        this.loadProductsForCurrentSelection();
      }
    });

    // 1. Tải danh sách không gian phòng từ Database
    this.productService.getRooms().subscribe({
      next: (rooms) => {
        if (Array.isArray(rooms)) {
          this.dbRooms = rooms.filter((r: any) => r.isActive !== false);
          this.dbRooms.forEach((r: any) => {
            if (r.slug && r.name) this.roomNamesMap[r.slug] = r.name;
            if (r._id && r.name) this.roomNamesMap[r._id] = r.name;
          });
          this.cdr.detectChanges();
        }
      }
    });

    // 2. Tải danh sách loại sản phẩm (Categories) từ Database
    this.productService.getCategories().subscribe({
      next: (cats) => {
        if (Array.isArray(cats)) {
          this.dbCategories = cats.filter((c: any) => c.isActive !== false);
          this.dbCategories.forEach((c: any) => {
            if (c.slug && c.name) this.categoryNamesMap[c.slug] = c.name;
            if (c._id && c.name) this.categoryNamesMap[c._id] = c.name;
          });
          this.cdr.detectChanges();
        }
      }
    });

    // 3. Lắng nghe thay đổi tham số Route để lấy dữ liệu sản phẩm tương ứng từ Database
    this.route.paramMap.subscribe(params => {
      const room = params.get('roomName');
      const category = params.get('categoryName');

      if (room) this.currentRoom = room;
      this.currentCategory = category || 'all';

      // Reset nested filters khi đổi danh mục
      this.selectedMaterial = '';
      this.selectedPriceRange = '';
      this.selectedRating = 0;

      this.loadProductsForCurrentSelection();
    });
  }

  loadProductsForCurrentSelection(): void {
    const categoryParam = this.currentCategory && this.currentCategory !== 'all' ? this.currentCategory : undefined;
    const roomParam = this.currentRoom && this.currentRoom !== 'all' ? this.currentRoom : undefined;

    this.isLoading = true;
    this.cdr.detectChanges();

    this.productService.getProducts({
      room: roomParam,
      category: categoryParam,
      pageSize: 50
    }).subscribe({
      next: (realProducts) => {
        this.isLoading = false;
        if (Array.isArray(realProducts)) {
          this.products = realProducts.map((p: UserProduct) => {
            const mainImg = p.thumbnail || (p.images && p.images.length > 0 ? p.images[0] : '');
            return {
              id: p.id || p.slug,
              name: p.name,
              description: p.description || '',
              dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width} cm` : '',
              price: p.salePrice || p.price,
              originalPrice: p.salePrice ? p.price : undefined,
              image: mainImg,
              images: (p.images && p.images.length > 0) ? p.images : (mainImg ? [mainImg] : []),
              materials: p.materials || [],
              badge: p.badge || (p.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'),
              rating: p.averageRating || 0,
              reviews: p.totalReviews || 0,
              colors: p.colors || [],
              soldQuantity: p.soldQuantity || 0,
            };
          });
        } else {
          this.products = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.products = [];
        console.warn('Lỗi khi tải sản phẩm từ Database:', err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? null : filterName;
    this.cdr.detectChanges();
  }

  onImageError(event: Event, product: any) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.onerror = null;
      // Fallback ảnh nội thất cao cấp của Unsplash khi link ảnh gốc gặp sự cố
      target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
    }
  }
}
