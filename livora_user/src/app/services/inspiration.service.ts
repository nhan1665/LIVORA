import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TaggedProductInfo {
  productId: string;
  name: string;
  sku: string;
  price: number;
  thumbnail: string;
  xPercent: number;
  yPercent: number;
}

export interface InspirationItem {
  id: string;
  code: string;
  title: string;
  slug: string;
  roomId?: string;
  roomName: string;
  style: string;
  thumbnail: string;
  content: string;
  taggedProducts: TaggedProductInfo[];
  viewsCount: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class InspirationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/inspirations`;

  /**
   * Lấy danh sách cảm hứng mới nhất từ backend
   */
  getLatestInspirations(limit = 3): Observable<InspirationItem[]> {
    return this.http
      .get<any>(this.apiUrl, {
        params: {
          pageSize: limit.toString(),
          status: 'published',
        },
      })
      .pipe(
        map((res) => {
          if (res && res.data && Array.isArray(res.data)) {
            return res.data as InspirationItem[];
          }
          return [];
        }),
        catchError((err) => {
          console.warn('Lỗi khi tải cảm hứng từ backend:', err);
          return of([]);
        })
      );
  }

  /**
   * Lấy chi tiết cảm hứng theo slug hoặc id
   */
  getInspirationBySlug(slugOrId: string): Observable<InspirationItem | null> {
    return this.http.get<any>(`${this.apiUrl}/${slugOrId}`).pipe(
      map((res) => (res.success && res.data ? res.data : null)),
      catchError(() => of(null))
    );
  }
}
