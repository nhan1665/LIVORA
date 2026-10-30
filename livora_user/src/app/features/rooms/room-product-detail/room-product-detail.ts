import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { ProductService, UserProduct } from '../../../services/product.service';

export interface ProductReviewItem {
  id: number;
  name: string;
  author: string;
  country: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  text: string;
  helpful: number;
  response?: string | null;
}

@Component({
  selector: 'app-room-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-product-detail.html',
  styleUrl: './room-product-detail.css'
})
export class RoomProductDetail implements OnInit, OnDestroy {
  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  currentRoom: string = '';
  currentCategory: string = '';
  productId: string | null = null;
  isLoading: boolean = false;

  roomNamesMap: Record<string, string> = {};
  categoryNamesMap: Record<string, string> = {};

  get formattedRoomName(): string {
    return this.roomNamesMap[this.currentRoom] || this.currentRoom.replace(/-/g, ' ') || 'Không gian';
  }

  get formattedCategoryName(): string {
    return this.categoryNamesMap[this.currentCategory] || this.currentCategory.replace(/-/g, ' ') || 'Danh mục';
  }

  product: any = null;
  mainImage: string = '';
  selectedColor: string = 'Mặc định';
  selectedSize: string = 'Tiêu chuẩn';
  isDetailsOpen: boolean = false;

  isReviewModalOpen: boolean = false;
  activeReviewTab: string = 'UK';
  isSortMenuOpen: boolean = false;
  isFilterMenuOpen: boolean = false;
  currentSort: string = 'newest';
  isWriteReviewOpen: boolean = false;

  reviewsList: ProductReviewItem[] = [];
  relatedProductsList: any[] = [];

  get relatedProducts() {
    return this.relatedProductsList;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Tải danh sách phòng từ Database
    this.productService.getRooms().subscribe({
      next: (rooms) => {
        if (Array.isArray(rooms)) {
          rooms.forEach((r: any) => {
            if (r.slug && r.name) this.roomNamesMap[r.slug] = r.name;
            if (r._id && r.name) this.roomNamesMap[r._id] = r.name;
          });
        }
      }
    });

    // 2. Tải danh sách loại sản phẩm từ Database
    this.productService.getCategories().subscribe({
      next: (cats) => {
        if (Array.isArray(cats)) {
          cats.forEach((c: any) => {
            if (c.slug && c.name) this.categoryNamesMap[c.slug] = c.name;
            if (c._id && c.name) this.categoryNamesMap[c._id] = c.name;
          });
        }
      }
    });

    // 3. Lắng nghe tham số Router để tải sản phẩm thực tế từ Database
    this.route.paramMap.subscribe(params => {
      this.currentRoom = params.get('roomName') || '';
      this.currentCategory = params.get('categoryName') || '';
      this.productId = params.get('productId');

      if (this.productId) {
        this.isLoading = true;
        this.productService.getProductDetail(this.productId).subscribe({
          next: (resProduct) => {
            this.isLoading = false;
            if (resProduct) {
              const primaryImage = resProduct.thumbnail || (resProduct.images && resProduct.images.length > 0 ? resProduct.images[0] : '');
              const imageList = (resProduct.images && resProduct.images.length > 0)
                ? resProduct.images
                : (primaryImage ? [primaryImage] : []);

              this.product = {
                id: resProduct.id || resProduct.slug,
                name: resProduct.name,
                type: resProduct.categoryName || this.formattedCategoryName,
                material: (resProduct.materials && resProduct.materials.length > 0) ? resProduct.materials.join(', ') : 'Chất liệu cao cấp',
                size: resProduct.dimensions ? `${resProduct.dimensions.length}x${resProduct.dimensions.width}x${resProduct.dimensions.height || 0} cm` : 'Tiêu chuẩn',
                price: resProduct.salePrice || resProduct.price,
                originalPrice: resProduct.salePrice ? resProduct.price : undefined,
                rating: resProduct.averageRating || 5.0,
                reviews: resProduct.totalReviews || 0,
                articleNumber: resProduct.sku || 'LV-' + (resProduct.id || '').slice(-6),
                description: resProduct.description || '',
                // Toàn bộ hình ảnh sản phẩm được lấy trực tiếp từ Database
                images: imageList,
                colors: (resProduct.colors && resProduct.colors.length > 0)
                  ? resProduct.colors.map((c: string) => ({ name: c, image: primaryImage }))
                  : [{ name: 'Mặc định', image: primaryImage }],
                file3DUrl: resProduct.file3DUrl || null,
                has3DModel: !!resProduct.file3DUrl
              };
              this.initProductState();
              this.loadRelatedProducts();
            } else {
              this.product = null;
              this.relatedProductsList = [];
              this.cdr.detectChanges();
            }
          },
          error: () => {
            this.isLoading = false;
            this.product = null;
            this.relatedProductsList = [];
            this.cdr.detectChanges();
          }
        });
      } else {
        this.product = null;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  loadRelatedProducts() {
    if (!this.currentCategory || this.currentCategory === 'all') return;
    this.productService.getProducts({ category: this.currentCategory, pageSize: 5 }).subscribe({
      next: (prods) => {
        this.relatedProductsList = (prods || [])
          .filter(p => (p.id || p.slug) !== this.productId)
          .slice(0, 4)
          .map(p => ({
            id: p.id || p.slug,
            name: p.name,
            type: p.categoryName || 'Sản phẩm',
            price: p.salePrice || p.price,
            badge: p.badge || null,
            image: p.thumbnail || (p.images && p.images[0]) || '',
            room: this.currentRoom,
            category: this.currentCategory
          }));
        this.cdr.detectChanges();
      }
    });
  }

  private initProductState() {
    if (!this.product) return;
    this.mainImage = (this.product.images && this.product.images.length > 0) ? this.product.images[0] : '';
    this.selectedColor = (this.product.colors && this.product.colors.length > 0) ? this.product.colors[0].name : 'Mặc định';

    const sizes = this.getProductSizes();
    if (sizes.length > 0) {
      this.selectedSize = sizes[0].name;
    }
    this.cdr.detectChanges();
  }

  getProductSizes(): { name: string; premium: number }[] {
    if (!this.product) return [];
    return [
      { name: this.product.size || 'Tiêu chuẩn', premium: 0 }
    ];
  }

  get currentPrice(): number {
    return this.product?.price || 0;
  }

  changeMainImage(img: string) {
    this.mainImage = img;
  }

  selectColor(colorName: string) {
    this.selectedColor = colorName;
  }

  selectSize(sizeName: string) {
    this.selectedSize = sizeName;
  }

  toggleDetails() {
    this.isDetailsOpen = !this.isDetailsOpen;
  }

  toggleReviewModal() {
    this.isReviewModalOpen = !this.isReviewModalOpen;
    document.body.style.overflow = this.isReviewModalOpen ? 'hidden' : '';
  }

  setReviewTab(tab: string) {
    this.activeReviewTab = tab;
  }

  toggleSortMenu() {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  setSort(sortType: string) {
    this.currentSort = sortType;
    this.isSortMenuOpen = false;
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  openWriteReview() {
    this.isWriteReviewOpen = true;
  }

  closeWriteReview() {
    this.isWriteReviewOpen = false;
  }

  toggleWriteReview() {
    this.isWriteReviewOpen = !this.isWriteReviewOpen;
  }

  showToast: boolean = false;
  toastMessage: string = '';
  private toastTimeout: any;

  buyNow() {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  addToCart() {
    if (!this.product) return;
    this.cartService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: this.currentPrice,
      originalPrice: this.product.originalPrice,
      image: this.mainImage || this.product.images?.[0] || '',
      size: this.selectedSize,
      color: this.selectedColor,
      articleNumber: this.product.articleNumber,
      category: this.product.type
    });

    this.toastMessage = `Đã thêm "${this.product.name}" vào giỏ hàng!`;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  get ratingStars(): string[] {
    const rating = this.product?.rating || 5;
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('full');
      } else if (rating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  get processedReviews(): ProductReviewItem[] {
    let result = [...this.reviewsList];
    if (this.activeReviewTab !== 'All') {
      result = result.filter(r => r.country === this.activeReviewTab);
    }
    return result;
  }
}
