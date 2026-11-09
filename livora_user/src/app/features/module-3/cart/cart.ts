import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  public readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);

  // Recommendations loaded dynamically from backend database
  recommendedProducts: any[] = [];

  // For promo code modal or direct input
  promoInput = '';
  promoMessage = '';
  promoError = false;

  ngOnInit(): void {
    // Coming back from a "Mua ngay" checkout: show the saved cart again.
    this.cartService.cancelBuyNow();
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.productService.getProducts({ pageSize: 4 }).subscribe({
      next: (prods) => {
        this.recommendedProducts = (prods || []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.salePrice || p.price,
          originalPrice: p.price,
          image: p.thumbnail || (p.images && p.images[0]) || '',
          rating: p.averageRating || 5,
          reviews: p.totalReviews || 0,
          isBestSeller: p.badge === 'Bán chạy' || (p.soldQuantity || 0) > 10,
          roomName: (p.roomSlugs && p.roomSlugs[0]) || 'living-room',
          categoryName: p.categorySlug || 'furniture',
        }));
      },
      error: () => {
        this.recommendedProducts = [];
      },
    });
  }

  increaseQty(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQty(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  removeItem(id: string) {
    this.cartService.removeFromCart(id);
  }

  updateNote(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.cartService.orderNote.set(textarea.value);
  }

  applyPromo() {
    if (!this.promoInput.trim()) return;
    const success = this.cartService.applyDiscountCode(this.promoInput);
    if (success) {
      this.promoMessage = 'Mã sẽ được kiểm tra tại bước thanh toán.';
      this.promoError = false;
    } else {
      this.promoMessage = 'Vui lòng nhập mã giảm giá.';
      this.promoError = true;
    }
  }

  selectPresetPromo(code: string) {
    this.promoInput = code;
    this.applyPromo();
  }

  addRecommended(prod: any) {
    this.cartService.addToCart({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      originalPrice: prod.originalPrice,
      image: prod.image,
      productId: prod.id,
      roomName: prod.roomName,
      categoryName: prod.categoryName,
    });
  }

  toggleSelection(id: string) {
    this.cartService.toggleItemSelection(id);
  }

  toggleSelectAll(event: Event) {
    const input = event.target as HTMLInputElement;
    this.cartService.toggleSelectAll(input.checked);
  }

  removeSelected() {
    const count = this.cartService.selectedItemsCount();
    if (count === 0) return;
    if (confirm(`Bạn có chắc muốn xóa ${count} sản phẩm đã chọn khỏi giỏ hàng?`)) {
      this.cartService.removeSelectedItems();
    }
  }

  checkout() {
    if (this.cartService.selectedItems().length > 0) {
      this.router.navigate(['/payment']);
    }
  }
}
