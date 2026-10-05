import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  public readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // Recommendations seed data
  readonly recommendedProducts = [
    {
      id: '1',
      name: 'NEIDEN',
      description: 'Khung giường gỗ thông tự nhiên, Giường đôi tiêu chuẩn',
      price: 89,
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      reviews: 120,
      isBestSeller: true,
      roomName: 'bedroom',
      categoryName: 'beds'
    },
    {
      id: '40',
      name: 'ODGER',
      description: 'Ghế ăn công thái học composite, lòng ghế uốn cong',
      price: 45,
      image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80',
      rating: 4.5,
      reviews: 142,
      isBestSeller: false,
      roomName: 'dining-room',
      categoryName: 'chairs'
    },
    {
      id: '16',
      name: 'FADO',
      description: 'Đèn bàn chao thủy tinh mờ lan tỏa ánh sáng dịu nhẹ',
      price: 19,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      reviews: 733,
      isBestSeller: false,
      roomName: 'bedroom',
      categoryName: 'lighting'
    }
  ];

  // For promo code modal or direct input
  promoInput = '';
  promoMessage = '';
  promoError = false;

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
      this.promoMessage = 'Áp dụng mã giảm giá thành công!';
      this.promoError = false;
    } else {
      this.promoMessage = 'Mã giảm giá không hợp lệ. Thử: LIVORA10 hoặc GIAM20';
      this.promoError = true;
    }
  }

  selectPresetPromo(code: string) {
    this.promoInput = code;
    this.applyPromo();
  }

  addRecommended(prod: typeof this.recommendedProducts[0]) {
    this.cartService.addToCart({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      image: prod.image,
      productId: prod.id,
      roomName: prod.roomName,
      categoryName: prod.categoryName
    });
  }

  checkout() {
    if (this.cartService.items().length > 0) {
      this.router.navigate(['/payment']);
    }
  }
}
