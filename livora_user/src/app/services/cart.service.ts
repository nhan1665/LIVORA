import { Injectable, signal, computed, effect } from '@angular/core';
import type { CheckoutQuote } from './checkout.service';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  productId?: string;
  roomName?: string;
  categoryName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly orderNote = signal<string>('');
  readonly discountCode = signal<string>('');
  readonly serverQuote = signal<CheckoutQuote | null>(null);
  readonly discountAmount = computed(() => this.serverQuote()?.discount || 0);
  readonly shippingMethod = signal<'nhanh' | 'hoa-toc'>('nhanh');
  readonly paymentMethod = signal<'cod' | 'bank'>('cod');

  // Customer shipping info
  readonly shippingInfo = signal({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    ward: ''
  });
  constructor() {
    const savedCart = localStorage.getItem('livora_cart');
    if (savedCart) {
      try {
        this._items.set(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error reading cart from LocalStorage', e);
      }
    }
    effect(() => {
      localStorage.setItem('livora_cart', JSON.stringify(this._items()));
    });
  }

  readonly itemsCount = computed(() => {
    return this._items().reduce((count, item) => count + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    return this._items().reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  readonly shippingFee = computed(() => this.serverQuote()?.shippingFee || 0);

  readonly total = computed(() => {
    if (this.serverQuote()) return this.serverQuote()!.total;
    const sub = this.subtotal();
    const discount = this.discountAmount();
    const ship = this.shippingFee();
    const result = sub - discount + ship;
    return result > 0 ? result : 0;
  });

  addToCart(product: Omit<CartItem, 'quantity'>) {
    this.serverQuote.set(null);
    const current = this._items();
    const existing = current.find(item => item.id === product.id);
    if (existing) {
      this.updateQuantity(product.id, existing.quantity + 1);
    } else {
      this._items.set([...current, { ...product, quantity: 1 }]);
    }
  }

  removeFromCart(id: string) {
    this.serverQuote.set(null);
    this._items.set(this._items().filter(item => item.id !== id));
  }

  updateQuantity(id: string, quantity: number) {
    this.serverQuote.set(null);
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    this._items.set(
      this._items().map(item => item.id === id ? { ...item, quantity } : item)
    );
  }

  applyDiscountCode(code: string): boolean {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      this.discountCode.set(trimmed);
      this.serverQuote.set(null);
      return true;
    }
    return false;
  }

  clearDiscount() {
    this.discountCode.set('');
    this.serverQuote.set(null);
  }

  clearCart() {
    this._items.set([]);
    this.orderNote.set('');
    this.clearDiscount();
    this.serverQuote.set(null);
    this.shippingMethod.set('nhanh');
    this.paymentMethod.set('cod');
    this.shippingInfo.set({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      province: '',
      district: '',
      ward: ''
    });
  }
}
