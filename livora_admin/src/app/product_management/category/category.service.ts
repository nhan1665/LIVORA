import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CategoryDraft,
  CategoryListQuery,
  CategoryListResponse,
  ProductCategory,
} from './category.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/categories`;

  /**
   * Retrieves all categories as an Observable.
   */
  getAllCategories(): Observable<ProductCategory[]> {
    return this.http.get<any>(this.apiUrl, { params: { all: 'true' } }).pipe(
      map((res) => (res.data || res) as ProductCategory[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Lỗi khi tải danh mục.')))
    );
  }

  /**
   * Queries categories with searching, filtering, and pagination.
   */
  queryCategories(query: CategoryListQuery): Observable<CategoryListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const totalItems = res.pagination.totalItems;
        const totalPages = res.pagination.totalPages;
        const activeCount = res.activeCount || 0;
        const inactiveCount = Math.max(0, totalItems - activeCount);

        return {
          items: res.data as ProductCategory[],
          page: res.pagination.page,
          pageSize: res.pagination.pageSize,
          totalItems,
          totalPages,
          activeCount,
          inactiveCount,
        };
      }),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách loại sản phẩm.')))
    );
  }

  /**
   * Finds a category by its ID or code.
   */
  getCategoryById(idOrCode: string): Observable<ProductCategory | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrCode}`).pipe(
      map((res) => res.data as ProductCategory),
      catchError(() => throwError(() => new Error('Không tìm thấy loại sản phẩm.')))
    );
  }

  /**
   * Adds a new category.
   */
  createCategory(draft: CategoryDraft): Observable<ProductCategory> {
    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => res.data as ProductCategory),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo loại sản phẩm.')))
    );
  }

  /**
   * Updates an existing category.
   */
  updateCategory(id: string, draft: Partial<CategoryDraft>): Observable<ProductCategory> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as ProductCategory),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật loại sản phẩm.')))
    );
  }

  /**
   * Toggles the active status of a category.
   */
  toggleCategoryStatus(id: string): Observable<ProductCategory> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map((res) => res.data as ProductCategory),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái.')))
    );
  }

  /** Alias for component compatibility */
  toggleStatus(id: string): Observable<ProductCategory> {
    return this.toggleCategoryStatus(id);
  }

  /**
   * Deletes a category.
   */
  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa loại sản phẩm.')))
    );
  }

  /**
   * Utility: Converts a name to URL-friendly slug.
   */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
