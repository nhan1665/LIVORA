import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserReviewItem {
  id: string;
  code: string;
  productId: string;
  productName: string;
  productSku: string;
  productThumbnail: string;
  customerId?: string | null;
  customerName: string;
  customerContext?: string;
  orderId?: string | null;
  rating: number;
  comment: string;
  images: string[];
  videos?: string[];
  status: 'visible' | 'hidden';
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/reviews`;

  /**
   * Lấy danh sách đánh giá đang hiển thị của một sản phẩm (Chỉ lấy status 'visible')
   */
  getProductReviews(productId: string): Observable<{ items: UserReviewItem[]; total: number; avgRating: number }> {
    return this.http
      .get<any>(this.apiUrl, {
        params: {
          productId,
          status: 'visible',
          pageSize: 100,
        },
      })
      .pipe(
        map((res) => {
          const items: UserReviewItem[] = res?.data || [];
          const total = items.length;
          const sum = items.reduce((acc, r) => acc + (r.rating || 5), 0);
          const avgRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 5.0;
          return { items, total, avgRating };
        })
      );
  }

  /**
   * Lấy danh sách đánh giá của khách hàng (dùng trong trang cá nhân)
   * Lấy tất cả đánh giá của khách (status: 'all' bao gồm cả visible và hidden do Admin ẩn)
   */
  getCustomerReviews(customerId?: string, customerPhone?: string): Observable<UserReviewItem[]> {
    const params: any = {
      status: 'all',
      pageSize: 100,
    };
    if (customerId) params.customerId = customerId;
    if (customerPhone) params.customerPhone = customerPhone;

    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((res) => (res?.data || []) as UserReviewItem[]));
  }

  /**
   * Khách hàng gửi đánh giá mới (kèm ảnh và video nếu có)
   */
  submitReview(payload: {
    productId: string;
    productName?: string;
    productThumbnail?: string;
    productSku?: string;
    orderId?: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    rating: number;
    comment: string;
    images?: string[];
    videos?: string[];
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload).pipe(map((res) => res?.data));
  }
}
