import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Contact,
  ContactListQuery,
  ContactListResponse,
} from './contact.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/contacts`;

  /** Queries contacts with keyword, status, relative-time filtering and pagination. */
  listContacts(query: ContactListQuery): Observable<ContactListResponse> {
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
      map((res) => ({
        items: res.data as Contact[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
        pendingCount: res.newCount || 0,
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách liên hệ.')))
    );
  }

  getContactById(idOrCode: string): Observable<Contact | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrCode}`).pipe(
      map((res) => res.data as Contact),
      catchError(() => throwError(() => new Error('Không tìm thấy thông tin liên hệ.')))
    );
  }

  /** Moves a contact from "new" to "resolved" (BPMN 3.3.2.9 "Duyệt xử lý"). */
  resolveContact(id: string, respondedBy = 'CSKH — Trần Mai Phương'): Observable<Contact> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/resolve`, { respondedBy }).pipe(
      map((res) => res.data as Contact),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xử lý liên hệ.')))
    );
  }
}
