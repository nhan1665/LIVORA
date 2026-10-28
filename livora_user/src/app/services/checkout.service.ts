import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CheckoutItem { productId: string; quantity: number; }
export interface ShippingOption {
  id: string;
  shippingMethod: 'standard' | 'express';
  province: string;
  estimatedDeliveryTime: string;
  fee: number;
}
export interface CheckoutQuote {
  subtotal: number;
  discount: number;
  voucherCode: string | null;
  shipping: ShippingOption;
  shippingFee: number;
  total: number;
}
export interface CheckoutOrderResult {
  id: string;
  orderCode: string;
  finalAmount: number;
  discountAmount: number;
  shippingFee: number;
  shippingMethod: string;
  orderStatus: string;
  paymentStatus: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiBaseUrl}/checkout`;

  async regions(): Promise<string[]> {
    const response = await fetch(`${this.url}/regions`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Không thể tải khu vực giao hàng.');
    return result.data as string[];
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const token = this.auth.token;
    const response = await fetch(`${this.url}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Không thể kết nối với máy chủ.');
    return result.data as T;
  }

  shippingOptions(items: CheckoutItem[], province: string): Promise<{ subtotal: number; options: ShippingOption[] }> {
    return this.post('shipping-options', { items, province });
  }

  quote(items: CheckoutItem[], province: string, shippingId: string, voucherCode: string): Promise<CheckoutQuote> {
    return this.post('quote', { items, province, shippingId, voucherCode });
  }

  placeOrder(body: {
    items: CheckoutItem[];
    customerInfo: { fullName: string; phone: string; email: string; address: string; district: string; ward: string };
    province: string;
    shippingId: string;
    voucherCode: string;
    paymentMethod: 'cod' | 'bank_transfer';
    requestKey: string;
    note: string;
  }): Promise<CheckoutOrderResult> {
    return this.post('orders', body);
  }
}
