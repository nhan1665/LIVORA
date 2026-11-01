import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Review, ReviewListQuery, ReviewListResponse } from './review.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/reviews`;

  /** Queries reviews with keyword, rating, status filtering and pagination. */
  listReviews(query: ReviewListQuery): Observable<ReviewListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.rating && query.rating !== 'all') {
      params = params.set('rating', query.rating.toString());
    }
    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        items: res.data as Review[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
        hiddenCount: res.hiddenCount || 0,
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách đánh giá.')))
    );
  }

  getReviewById(idOrCode: string): Observable<Review | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrCode}`).pipe(
      map((res) => res.data as Review),
      catchError(() => throwError(() => new Error('Không tìm thấy đánh giá.')))
    );
  }

  /**
   * Cập nhật trạng thái hiển thị của đánh giá: 'visible' hoặc 'hidden'
   */
  updateReviewStatus(
    id: string,
    status: 'visible' | 'hidden',
    hiddenReason = '',
    moderatedBy = 'Quản trị viên'
  ): Observable<Review> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status, hiddenReason, moderatedBy }).pipe(
      map((res) => res.data as Review),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật trạng thái đánh giá.')))
    );
  }

  /**
   * Hides an inappropriate review
   */
  hideReview(
    id: string,
    hiddenReason = '',
    moderatedBy = 'Quản trị viên'
  ): Observable<Review> {
    return this.updateReviewStatus(id, 'hidden', hiddenReason, moderatedBy);
  }

  /**
   * Shows a hidden review back on the website
   */
  showReview(
    id: string,
    moderatedBy = 'Quản trị viên'
  ): Observable<Review> {
    return this.updateReviewStatus(id, 'visible', '', moderatedBy);
  }
}
