import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserOrderItem {
  productId: string;
  sku: string;
  productName: string;
  name: string;
  color: string;
  thumbnail: string;
  image: string;
  price: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  // cờ đánh dấu đã đánh giá sản phẩm này hay chưa
  hasReviewed?: boolean;
}

export interface UserOrder {
  id: string;
  _id: string;
  orderCode: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentMethod: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  totalAmount: number;
  items: UserOrderItem[];
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/orders`;

  /**
   * Lấy toàn bộ đơn hàng của khách hàng theo userId hoặc phone
   */
  getUserOrders(userId: string, phone?: string): Observable<UserOrder[]> {
    const params: any = { pageSize: 50 };
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;

    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((res) => (res?.data || []) as UserOrder[]));
  }
}

