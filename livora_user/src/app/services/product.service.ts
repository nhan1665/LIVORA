import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryName?: string;
  categorySlug?: string;
  roomNames?: string[];
  roomSlugs?: string[];
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  thumbnail: string;
  images: string[];
  description: string;
  dimensions?: any;
  materials?: string[];
  colors?: string[];
  averageRating?: number;
  totalReviews?: number;
  stockStatus: string;
  badge?: string;
  soldQuantity?: number;
  file3DUrl?: string;
  has3DModel?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  /**
   * Lấy danh sách sản phẩm theo phòng hoặc danh mục
   */
  getProducts(params: {
    room?: string;
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<UserProduct[]> {
    let httpParams = new HttpParams();

    if (params.room && params.room !== 'all') {
      httpParams = httpParams.set('room', params.room);
    }
    if (params.category && params.category !== 'all') {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    httpParams = httpParams.set('page', (params.page || 1).toString());
    httpParams = httpParams.set('pageSize', (params.pageSize || 50).toString());

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map((res) => (res.data || []) as UserProduct[]),
      catchError((err) => {
        console.warn('Lỗi khi tải sản phẩm từ backend API:', err);
        return of([]);
      })
    );
  }

  /**
   * Lấy chi tiết sản phẩm theo ID hoặc Slug
   */
  getProductDetail(idOrSlug: string): Observable<UserProduct | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrSlug}`).pipe(
      map((res) => res.data as UserProduct),
      catchError((err) => {
        console.warn('Không tìm thấy sản phẩm:', err);
        return of(null);
      })
    );
  }

  /**
   * Lấy danh sách các danh mục sản phẩm
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiBaseUrl}/categories`, { params: { all: 'true' } }).pipe(
      map((res) => res.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Lấy danh sách không gian phòng
   */
  getRooms(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiBaseUrl}/rooms`, { params: { all: 'true' } }).pipe(
      map((res) => res.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Lấy danh sách sản phẩm bán chạy nhất
   */
  getBestSellers(limit = 4): Observable<UserProduct[]> {
    return this.getProducts({ sort: 'best-seller', pageSize: limit }).pipe(
      map((products) => products.slice(0, limit))
    );
  }
}
