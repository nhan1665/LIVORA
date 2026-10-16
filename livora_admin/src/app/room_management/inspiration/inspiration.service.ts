import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { InspirationDraft, InspirationPage, InspirationQuery, InspirationRecord } from './inspiration.model';

@Injectable({ providedIn: 'root' })
export class InspirationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/inspirations`;

  list(query: InspirationQuery): Observable<InspirationPage> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) params = params.set('search', query.search);
    if (query.roomId) params = params.set('roomId', query.roomId);
    if (query.status && query.status !== 'all') params = params.set('status', query.status);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const rawItems = res.data || [];
        const items: InspirationRecord[] = rawItems.map((item: any) => ({
          id: item._id || item.id,
          code: item.code || `INS-${(item._id || item.id).toString().slice(-4).toUpperCase()}`,
          title: item.title,
          roomId: typeof item.roomId === 'object' && item.roomId ? (item.roomId._id || item.roomId.id) : (item.roomId || ''),
          style: item.style || 'Scandinavian',
          content: item.content || '',
          thumbnail: item.thumbnail || '',
          taggedProducts: item.taggedProducts || [],
          status: item.status === 'hidden' ? 'hidden' : 'published',
          version: '1.0',
        }));

        return {
          items,
          total: res.pagination?.totalItems || items.length,
          page: res.pagination?.page || query.page,
          pages: res.pagination?.totalPages || 1,
        };
      }),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách cảm hứng từ máy chủ.')))
    );
  }

  save(draft: InspirationDraft, id?: string): Observable<InspirationRecord> {
    if (id) {
      return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
        map((res) => ({
          ...res.data,
          id: res.data._id || res.data.id,
          version: '1.0',
        })),
        catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật cảm hứng.')))
      );
    }

    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => ({
        ...res.data,
        id: res.data._id || res.data.id,
        version: '1.0',
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo cảm hứng mới.')))
    );
  }

  setStatus(id: string, status: InspirationRecord['status']): Observable<InspirationRecord> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { status }).pipe(
      map((res) => ({
        ...res.data,
        id: res.data._id || res.data.id,
        status,
        version: '1.0',
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái cảm hứng.')))
    );
  }
}
