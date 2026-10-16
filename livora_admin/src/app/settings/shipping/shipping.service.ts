import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ShippingConfig,
  ShippingDraft,
  ShippingListQuery,
  ShippingListResponse,
} from './shipping.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/shipping`;

  /** Queries shipping configurations with keyword, method, status filtering and pagination. */
  listConfigs(query: ShippingListQuery): Observable<ShippingListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.method && query.method !== 'all') {
      params = params.set('method', query.method);
    }
    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        items: res.data as ShippingConfig[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
        activeCount: res.activeCount || 0,
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải cấu hình vận chuyển.')))
    );
  }

  /** Gets a single shipping config by ID. */
  getConfigById(id: string): Observable<ShippingConfig | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data as ShippingConfig),
      catchError(() => throwError(() => new Error('Không tìm thấy cấu hình vận chuyển.')))
    );
  }

  /** Creates a new shipping configuration. */
  createConfig(draft: ShippingDraft): Observable<ShippingConfig> {
    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => res.data as ShippingConfig),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo cấu hình vận chuyển.')))
    );
  }

  /** Updates an existing shipping configuration. */
  updateConfig(id: string, draft: ShippingDraft): Observable<ShippingConfig> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as ShippingConfig),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật cấu hình vận chuyển.')))
    );
  }

  /** Switches a shipping config on/off. */
  toggleConfig(id: string): Observable<ShippingConfig> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map((res) => res.data as ShippingConfig),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái cấu hình.')))
    );
  }
}
