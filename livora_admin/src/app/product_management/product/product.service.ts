import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ProductDraft,
  ProductItem,
  ProductListQuery,
  ProductListResponse,
  ProductSummaryMetrics,
} from './product.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  /**
   * Retrieves all products.
   */
  getAllProducts(): Observable<ProductItem[]> {
    return this.http.get<any>(this.apiUrl, { params: { pageSize: '100' } }).pipe(
      map((res) => (res.data || []) as ProductItem[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải sản phẩm.')))
    );
  }

  /**
   * Retrieves summary metrics across all products.
   */
  getSummaryMetrics(): Observable<ProductSummaryMetrics> {
    return this.http.get<any>(this.apiUrl, { params: { pageSize: '1' } }).pipe(
      map((res) => ({
        totalProducts: res.pagination?.totalItems || 0,
        activeProducts: res.activeCount || 0,
        outOfStockProducts: res.outOfStockCount || 0,
        has3DCount: res.with3DCount || 0,
      })),
      catchError(() => throwError(() => new Error('Không thể tải chỉ số sản phẩm.')))
    );
  }

  /**
   * Queries products with searching, filtering, sorting, and pagination.
   */
  queryProducts(query: ProductListQuery): Observable<ProductListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      params = params.set('category', query.categoryId);
    }
    if (query.roomId && query.roomId !== 'all') {
      params = params.set('room', query.roomId);
    }
    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status === 'active' ? 'Đang kinh doanh' : 'ngưng kinh doanh');
    }
    if ((query as any).stockStatus && (query as any).stockStatus !== 'all') {
      params = params.set('stockStatus', (query as any).stockStatus);
    }
    if (query.has3D && query.has3D !== 'all') {
      params = params.set('has3D', query.has3D === 'has_3d' ? 'yes' : 'no');
    }
    if (query.sortBy) {
      const sortMap: Record<string, string> = {
        price_asc: 'price-asc',
        price_desc: 'price-desc',
        stock_asc: 'stock-asc',
        stock_desc: 'stock-desc',
        newest: 'newest',
      };
      params = params.set('sort', sortMap[query.sortBy] || 'newest');
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        items: res.data as ProductItem[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
        metrics: {
          totalProducts: res.pagination.totalItems,
          activeProducts: res.activeCount || 0,
          outOfStockProducts: res.outOfStockCount || 0,
          has3DCount: res.with3DCount || 0,
        },
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách sản phẩm.')))
    );
  }

  /**
   * Finds a product by its ID or SKU.
   */
  getProductById(idOrSku: string): Observable<ProductItem | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrSku}`).pipe(
      map((res) => res.data as ProductItem),
      catchError(() => throwError(() => new Error('Không tìm thấy sản phẩm.')))
    );
  }

  /**
   * Adds a new product.
   */
  createProduct(draft: ProductDraft): Observable<ProductItem> {
    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => res.data as ProductItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo sản phẩm.')))
    );
  }

  /**
   * Updates an existing product.
   */
  updateProduct(id: string, draft: Partial<ProductDraft>): Observable<ProductItem> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as ProductItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật sản phẩm.')))
    );
  }

  /**
   * Toggles the operational status of a product.
   */
  toggleProductStatus(id: string): Observable<ProductItem> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map((res) => res.data as ProductItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái sản phẩm.')))
    );
  }

  /** Alias for component compatibility */
  toggleStatus(id: string): Observable<ProductItem> {
    return this.toggleProductStatus(id);
  }

  /**
   * Deletes a product.
   */
  deleteProduct(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa sản phẩm.')))
    );
  }
}
