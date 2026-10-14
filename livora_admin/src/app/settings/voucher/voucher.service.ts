import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Voucher,
  VoucherDraft,
  VoucherListQuery,
  VoucherListResponse,
} from './voucher.model';
import { environment } from '../../../environments/environment';

/**
 * Voucher service connecting to LIVORA Backend REST API.
 *
 * Replaces the previous session-only mock service. All data operations
 * now go through HTTP calls to the backend and are persisted in MongoDB.
 */
@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/vouchers`;

  /** Queries vouchers with keyword, type, status, time-window filtering and pagination. */
  listVouchers(query: VoucherListQuery): Observable<VoucherListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.discountType !== 'all') {
      params = params.set('discountType', query.discountType);
    }
    if (query.status !== 'all') {
      params = params.set('status', query.status);
    }
    if (query.time !== 'all') {
      params = params.set('time', query.time);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        items: res.data as Voucher[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
        activeCount: res.activeCount ?? 0,
      })),
      catchError((err) => {
        const message = err.error?.message || 'Không thể tải danh sách voucher.';
        return throwError(() => new Error(message));
      })
    );
  }

  /** Gets a single voucher by ID. */
  getVoucherById(id: string): Observable<Voucher | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data as Voucher),
      catchError(() => throwError(() => new Error('Không tìm thấy voucher.')))
    );
  }

  /** Creates a new voucher in the database. */
  createVoucher(draft: VoucherDraft): Observable<Voucher> {
    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => res.data as Voucher),
      catchError((err) => {
        const message = err.error?.message || 'Không thể tạo voucher.';
        return throwError(() => new Error(message));
      })
    );
  }

  /** Updates an existing voucher. */
  updateVoucher(id: string, draft: VoucherDraft): Observable<Voucher> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as Voucher),
      catchError((err) => {
        const message = err.error?.message || 'Không thể cập nhật voucher.';
        return throwError(() => new Error(message));
      })
    );
  }

  /** Switches a voucher on/off. */
  toggleVoucher(id: string): Observable<Voucher> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map((res) => res.data as Voucher),
      catchError((err) => {
        const message = err.error?.message || 'Không thể thay đổi trạng thái voucher.';
        return throwError(() => new Error(message));
      })
    );
  }
}
