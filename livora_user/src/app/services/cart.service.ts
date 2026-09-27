import { Injectable, signal, computed, effect } from '@angular/core';

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
  readonly discountAmount = computed(() => {
    const code = this.discountCode().trim().toUpperCase();
    if (code === 'LIVORA10') {
      return Math.round(this.subtotal() * 0.1);
    } else if (code === 'GIAM20') {
      return 20;
    }
    return 0;
  });
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

  readonly shippingFee = computed(() => {
    if (this._items().length === 0) return 0;
    return this.shippingMethod() === 'hoa-toc' ? 15 : 0; // Free for standard, $15 for express
  });

  readonly total = computed(() => {
    const sub = this.subtotal();
    const discount = this.discountAmount();
    const ship = this.shippingFee();
    const result = sub - discount + ship;
    return result > 0 ? result : 0;
  });

  addToCart(product: Omit<CartItem, 'quantity'>) {
    const current = this._items();
    const existing = current.find(item => item.id === product.id);
    if (existing) {
      this.updateQuantity(product.id, existing.quantity + 1);
    } else {
      this._items.set([...current, { ...product, quantity: 1 }]);
    }
  }

  removeFromCart(id: string) {
    this._items.set(this._items().filter(item => item.id !== id));
  }

  updateQuantity(id: string, quantity: number) {
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
    if (trimmed === 'LIVORA10' || trimmed === 'GIAM20') {
      this.discountCode.set(trimmed);
      return true;
    }
    return false;
  }

  clearDiscount() {
    this.discountCode.set('');
  }

  clearCart() {
    this._items.set([]);
    this.orderNote.set('');
    this.clearDiscount();
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
