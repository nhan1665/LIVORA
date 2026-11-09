import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import type { CheckoutQuote } from './checkout.service';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  productId?: string;
  roomName?: string;
  categoryName?: string;
  size?: string;
  color?: string;
  articleNumber?: string;
  category?: string;
  selected?: boolean;
}

/** Pre-fix builds kept a single cart for every visitor of the browser; it leaked across accounts. */
const LEGACY_CART_KEY = 'livora_cart';
const CART_KEY_PREFIX = 'livora_cart:';
const BUY_NOW_KEY = 'livora_buy_now';

const EMPTY_SHIPPING_INFO = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  province: '',
  district: '',
  ward: ''
};

/**
 * Two separate baskets:
 *  - the persistent cart, stored per signed-in account (guests have none: adding to cart requires login);
 *  - a one-off "buy now" selection kept for the browser tab, so a guest can still check out a product directly.
 * `items` is whichever of the two the checkout is currently working on.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _cartItems = signal<CartItem[]>([]);
  private readonly _buyNowItems = signal<CartItem[] | null>(this.readBuyNow());
  private readonly _cartOwnerKey = signal<string | null>(null);

  readonly cartItems = this._cartItems.asReadonly();
  readonly isBuyNow = computed(() => this._buyNowItems() !== null);
  readonly items = computed(() => this._buyNowItems() ?? this._cartItems());
  readonly orderNote = signal<string>('');
  readonly discountCode = signal<string>('');
  readonly serverQuote = signal<CheckoutQuote | null>(null);
  readonly discountAmount = computed(() => this.serverQuote()?.discount || 0);
  readonly customShippingFee = signal<number>(0);
  readonly shippingMethod = signal<'nhanh' | 'hoa-toc'>('nhanh');
  readonly paymentMethod = signal<'cod' | 'bank'>('cod');

  // Customer shipping info
  readonly shippingInfo = signal({ ...EMPTY_SHIPPING_INFO });

  constructor() {
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      // ignore
    }

    // Swap baskets whenever the signed-in account changes (login, logout, switching accounts).
    effect(() => {
      const userId = this.authService.currentUser()?.id || null;
      untracked(() => this.switchOwner(userId));
    });

    effect(() => {
      const key = this._cartOwnerKey();
      const items = this._cartItems();
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        // ignore quota / privacy-mode errors
      }
    });

    effect(() => {
      const buyNow = this._buyNowItems();
      try {
        if (buyNow) sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(buyNow));
        else sessionStorage.removeItem(BUY_NOW_KEY);
      } catch {
        // ignore
      }
    });
  }

  private readBuyNow(): CartItem[] | null {
    try {
      const raw = sessionStorage.getItem(BUY_NOW_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch {
      return null;
    }
  }

  private switchOwner(userId: string | null): void {
    const key = userId ? `${CART_KEY_PREFIX}${userId}` : null;
    if (key === this._cartOwnerKey()) return;

    const previousKey = this._cartOwnerKey();
    let items: CartItem[] = [];
    if (key) {
      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : [];
        items = Array.isArray(parsed) ? parsed : [];
      } catch {
        items = [];
      }
    }
    this._cartOwnerKey.set(key);
    this._cartItems.set(items);

    // Never carry one account's checkout state (address, voucher, buy-now pick) into another session.
    if (previousKey !== null) {
      this.resetCheckoutState();
      this._buyNowItems.set(null);
    }
  }

  readonly itemsCount = computed(() => {
    return this._cartItems().reduce((count, item) => count + item.quantity, 0);
  });

  readonly selectedItems = computed(() => {
    const buyNow = this._buyNowItems();
    if (buyNow !== null) return buyNow;
    return this._cartItems().filter(item => item.selected !== false);
  });

  readonly selectedItemsCount = computed(() => {
    return this.selectedItems().reduce((count, item) => count + item.quantity, 0);
  });

  readonly isAllSelected = computed(() => {
    const items = this._cartItems();
    return items.length > 0 && items.every(item => item.selected !== false);
  });

  readonly subtotal = computed(() => {
    return this.selectedItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  readonly shippingFee = computed(() => {
    if (this.serverQuote()) {
      return this.serverQuote()!.shippingFee;
    }
    return this.customShippingFee();
  });

  readonly total = computed(() => {
    if (this.serverQuote()) return this.serverQuote()!.total;
    const sub = this.subtotal();
    const discount = this.discountAmount();
    const ship = this.shippingFee();
    const result = sub - discount + ship;
    return result > 0 ? result : 0;
  });

  /**
   * Adds a product to the signed-in customer's cart.
   * Guests are sent to the login page (and brought back afterwards); returns false in that case.
   */
  addToCart(product: Omit<CartItem, 'quantity'>, quantity = 1): boolean {
    if (!this.authService.isLoggedIn) {
      this.redirectToLogin();
      return false;
    }
    this.serverQuote.set(null);
    const current = this._cartItems();
    const existing = current.find(item => item.id === product.id);
    if (existing) {
      this._cartItems.set(current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity, selected: true } : item));
    } else {
      this._cartItems.set([...current, { ...product, quantity, selected: true }]);
    }
    return true;
  }

  /** Adds several products at once (e.g. a saved room design). Returns false if the visitor must log in first. */
  addManyToCart(products: Omit<CartItem, 'quantity'>[]): boolean {
    if (!this.authService.isLoggedIn) {
      this.redirectToLogin();
      return false;
    }
    products.forEach(p => this.addToCart(p));
    return true;
  }

  /**
   * Starts a checkout for just these products, without touching the saved cart, and opens the payment page.
   * Works for guests too (they fill in their details at checkout or log in from there).
   */
  buyNow(products: Omit<CartItem, 'quantity'>[] | Omit<CartItem, 'quantity'>, quantity = 1): void {
    const list = Array.isArray(products) ? products : [products];
    const merged = new Map<string, CartItem>();
    for (const p of list) {
      const existing = merged.get(p.id);
      merged.set(p.id, existing ? { ...existing, quantity: existing.quantity + quantity } : { ...p, quantity });
    }
    if (merged.size === 0) return;
    this.serverQuote.set(null);
    this._buyNowItems.set(Array.from(merged.values()));
    this.router.navigate(['/payment']);
  }

  /** Leaves a "buy now" checkout and goes back to working on the saved cart. */
  cancelBuyNow(): void {
    if (this._buyNowItems() === null) return;
    this._buyNowItems.set(null);
    this.serverQuote.set(null);
  }

  redirectToLogin(reason: 'cart' = 'cart'): void {
    const returnUrl = this.router.url || '/home';
    this.router.navigate(['/login'], { queryParams: { returnUrl, reason } });
  }

  removeFromCart(id: string) {
    this.serverQuote.set(null);
    this._cartItems.set(this._cartItems().filter(item => item.id !== id));
  }

  updateQuantity(id: string, quantity: number) {
    this.serverQuote.set(null);
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    this._cartItems.set(
      this._cartItems().map(item => item.id === id ? { ...item, quantity } : item)
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

  toggleItemSelection(id: string, selected?: boolean): void {
    this.serverQuote.set(null);
    this._cartItems.set(
      this._cartItems().map(item => {
        if (item.id === id) {
          const nextVal = selected !== undefined ? selected : item.selected === false;
          return { ...item, selected: nextVal };
        }
        return item;
      })
    );
  }

  toggleSelectAll(selected: boolean): void {
    this.serverQuote.set(null);
    this._cartItems.set(
      this._cartItems().map(item => ({ ...item, selected }))
    );
  }

  removeSelectedItems(): void {
    this.serverQuote.set(null);
    this._cartItems.set(
      this._cartItems().filter(item => item.selected === false)
    );
  }

  private resetCheckoutState() {
    this.orderNote.set('');
    this.clearDiscount();
    this.serverQuote.set(null);
    this.customShippingFee.set(0);
    this.shippingMethod.set('nhanh');
    this.paymentMethod.set('cod');
    this.shippingInfo.set({ ...EMPTY_SHIPPING_INFO });
  }

  /** Called after an order is placed: empties whichever basket was just checked out. */
  clearCart() {
    if (this._buyNowItems() !== null) {
      this._buyNowItems.set(null);
    } else {
      // Chỉ xóa những sản phẩm vừa được đặt mua, giữ lại các sản phẩm chưa tick trong giỏ hàng
      this._cartItems.set(this._cartItems().filter(item => item.selected === false));
    }
    this.resetCheckoutState();
  }
}
