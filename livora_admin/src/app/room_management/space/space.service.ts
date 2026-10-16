import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CatalogPage, DesignRecord, SpaceDraft, SpaceRecord } from './space.model';

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/room-designs`;

  list(search: string, roomId: string, status: 'all' | 'active' | 'inactive', page: number, pageSize: number): Observable<CatalogPage<SpaceRecord>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('isTemplate', 'true');

    if (search) params = params.set('search', search);
    if (roomId) params = params.set('roomId', roomId);
    if (status !== 'all') params = params.set('isActive', status === 'active' ? 'true' : 'false');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const rawItems = res.data || [];
        const items: SpaceRecord[] = rawItems.map((item: any) => ({
          id: item._id || item.id,
          code: item.code || `KG-${(item._id || item.id).toString().slice(-4).toUpperCase()}`,
          name: item.name,
          roomId: typeof item.roomId === 'object' && item.roomId ? (item.roomId._id || item.roomId.id) : (item.roomId || ''),
          description: item.description || '',
          lengthM: item.lengthM || 5,
          widthM: item.widthM || 4,
          heightM: item.heightM || 2.8,
          modelFile: item.file3DUrl ? { name: item.file3DUrl.split('/').pop() || 'model.glb', size: 10 * 1024 * 1024 } : null,
          isActive: item.isActive !== false,
          version: '1.0',
        }));

        return {
          items,
          total: res.pagination?.totalItems || items.length,
          pages: res.pagination?.totalPages || 1,
          page: res.pagination?.page || page,
        };
      }),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách không gian từ máy chủ.')))
    );
  }

  save(draft: SpaceDraft, id?: string): Observable<SpaceRecord> {
    const payload = {
      name: draft.name,
      code: draft.code,
      roomId: draft.roomId,
      description: draft.description,
      lengthM: draft.lengthM,
      widthM: draft.widthM,
      heightM: draft.heightM,
      isTemplate: true,
      isActive: draft.isActive,
      file3DUrl: draft.modelFile?.name || '',
    };

    if (id) {
      return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
        map((res) => ({
          ...res.data,
          id: res.data._id || res.data.id,
          version: '1.0',
        })),
        catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật không gian.')))
      );
    }

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((res) => ({
        ...res.data,
        id: res.data._id || res.data.id,
        version: '1.0',
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo không gian mới.')))
    );
  }

  setActive(id: string, active: boolean): Observable<SpaceRecord> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { isActive: active }).pipe(
      map((res) => ({
        ...res.data,
        id: res.data._id || res.data.id,
        isActive: active,
        version: '1.0',
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái không gian.')))
    );
  }

  get(id: string): Observable<SpaceRecord> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => ({
        ...res.data,
        id: res.data._id || res.data.id,
        version: '1.0',
      })),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không tìm thấy không gian.')))
    );
  }
}

@Injectable({ providedIn: 'root' })
export class DesignService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/room-designs`;

  list(search: string, spaceId: string, customerCode: string, page: number, pageSize: number): Observable<CatalogPage<DesignRecord>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('isTemplate', 'false');

    if (search) params = params.set('search', search);
    if (spaceId) params = params.set('roomId', spaceId);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const rawItems = res.data || [];
        const items: DesignRecord[] = rawItems.map((item: any) => ({
          id: item._id || item.id,
          code: item.code || `TK-${(item._id || item.id).toString().slice(-4).toUpperCase()}`,
          customerCode: item.customerId?.code || 'KH-USER',
          customerName: item.customerId?.fullName || 'Khách hàng',
          name: item.name,
          spaceId: item.spaceId || '',
          roomId: typeof item.roomId === 'object' && item.roomId ? (item.roomId._id || item.roomId.id) : (item.roomId || ''),
          productCodes: (item.suggestedProducts || []).map((p: any) => p.sku || p.name),
          createdAt: item.createdAt || new Date().toISOString(),
        }));

        return {
          items,
          total: res.pagination?.totalItems || items.length,
          pages: res.pagination?.totalPages || 1,
          page: res.pagination?.page || page,
        };
      }),
      catchError(() => throwError(() => new Error('Không thể tải danh sách thiết kế khách hàng.')))
    );
  }

  customers(): { code: string; name: string }[] {
    return [];
  }
}
