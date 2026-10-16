import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Room,
  RoomDraft,
  RoomListQuery,
  RoomListResponse,
} from './room.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/rooms`;

  listRooms(query: RoomListQuery): Observable<RoomListResponse> {
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
        items: res.data as Room[],
        page: res.pagination.page,
        pageSize: res.pagination.pageSize,
        totalItems: res.pagination.totalItems,
        totalPages: res.pagination.totalPages,
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách phòng.')))
    );
  }

  getRoom(id: string): Observable<Room> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data as Room),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không tìm thấy phòng.')))
    );
  }

  createRoom(draft: RoomDraft): Observable<Room> {
    return this.http.post<any>(this.apiUrl, draft).pipe(
      map((res) => res.data as Room),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo phòng.')))
    );
  }

  updateRoom(id: string, draft: RoomDraft): Observable<Room> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as Room),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật phòng.')))
    );
  }

  setRoomActive(id: string, isActive: boolean): Observable<Room> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { isActive }).pipe(
      map((res) => res.data as Room),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái phòng.')))
    );
  }
}
