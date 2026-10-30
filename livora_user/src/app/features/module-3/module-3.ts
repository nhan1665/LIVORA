import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { InspirationService } from '../../services/inspiration.service';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
}

export interface Hotspot {
  top: number; // percentage coordinate
  left: number; // percentage coordinate
  product: Product;
}

export interface Room {
  id: string;
  name: string;
  category: string;
  image: string;
  hotspots: Hotspot[];
  style?: string;
  content?: string;
}

@Component({
  selector: 'app-module-3',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-3.html',
  styleUrl: './module-3.css',
})
export class Module3 implements OnInit, OnDestroy {
  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  private readonly cartService = inject(CartService);
  private readonly inspirationService = inject(InspirationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Active filter category
  selectedCategory: string = 'Tất cả';

  // Filter options
  categories: string[] = ['Tất cả'];

  rooms: Room[] = [];

  // Active room for full screen modal view
  selectedRoom: Room | null = null;

  showToast: boolean = false;
  toastMessage: string = '';
  toastTimeout: any;

  ngOnInit(): void {
    this.loadInspirations();
  }

  loadInspirations(): void {
    this.inspirationService.getInspirations({ status: 'published', all: true }).subscribe({
      next: (items) => {
        if (Array.isArray(items) && items.length > 0) {
          this.rooms = items.map((item) => ({
            id: item.id || item.code || item.slug,
            name: item.title,
            category: item.roomName || 'Không gian chung',
            image: item.thumbnail,
            style: item.style,
            content: item.content,
            hotspots: (item.taggedProducts || []).map((tp, idx) => ({
              top: typeof tp.yPercent === 'number' ? tp.yPercent : 50,
              left: typeof tp.xPercent === 'number' ? tp.xPercent : 50,
              product: {
                id: tp.productId ? String(tp.productId) : `prod-${idx}`,
                name: tp.name || tp.sku || 'Sản phẩm nội thất',
                category: item.roomName || 'Nội thất',
                price: tp.price || 0,
                description: tp.sku ? `Mã SKU: ${tp.sku}` : (item.style ? `Phong cách ${item.style}` : (item.content || 'Sản phẩm cao cấp LIVORA')),
                image: tp.thumbnail || item.thumbnail
              }
            }))
          }));

          const distinctCategories = Array.from(
            new Set(this.rooms.map((r) => r.category).filter(Boolean))
          );
          this.categories = ['Tất cả', ...distinctCategories];
        } else {
          this.rooms = [];
          this.categories = ['Tất cả'];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.rooms = [];
        this.categories = ['Tất cả'];
        this.cdr.detectChanges();
        console.warn('Lỗi khi nạp cảm hứng từ server:', err);
      }
    });
  }

  showToastNotification(message: string) {
    this.toastMessage = message;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  filterCategory(category: string) {
    this.selectedCategory = category;
  }

  get filteredRooms(): Room[] {
    if (this.selectedCategory === 'Tất cả') {
      return this.rooms;
    }
    return this.rooms.filter(room => room.category === this.selectedCategory);
  }

  openRoomModal(room: Room) {
    this.selectedRoom = room;
    document.body.style.overflow = 'hidden';
  }

  closeRoomModal() {
    this.selectedRoom = null;
    document.body.style.overflow = '';
  }

  redirectToProduct(prodId: string, event: Event) {
    event.stopPropagation();
    this.closeRoomModal();

    let roomName = 'bedroom';
    let categoryName = 'beds';
    let productId = prodId;

    const catLower = (this.selectedRoom?.category || '').toLowerCase();
    if (catLower.includes('khách') || catLower.includes('living')) roomName = 'living-room';
    else if (catLower.includes('bếp') || catLower.includes('kitchen')) roomName = 'kitchen';
    else if (catLower.includes('tắm') || catLower.includes('bathroom')) roomName = 'bathroom';
    else if (catLower.includes('ăn') || catLower.includes('dining')) roomName = 'dining-room';
    else roomName = 'bedroom';

    this.router.navigate(['/rooms', roomName, categoryName, productId]);
  }

  addToCart(prod: Product, event: Event) {
    event.stopPropagation();

    this.cartService.addToCart({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      image: prod.image
    });

    this.showToastNotification(`Đã thêm ${prod.name} vào giỏ hàng!`);
  }
}
