import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserSpaceItem {
  id: string;
  code: string;
  name: string;
  roomName: string;
  roomId?: string;
  file3DUrl?: string;
  previewImage?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  description?: string;
  area?: string;
}

export interface CustomerDesignPayload {
  name: string;
  roomId?: string;
  customerId?: string;
  file3DUrl?: string;
  previewImage?: string;
  dimensions?: { length: number; width: number; height: number };
  description?: string;
  layoutData?: any;
  suggestedProducts?: string[];
  isTemplate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/room-designs`;

  /**
   * Lấy danh sách không gian mẫu từ Admin
   */
  getSpaceTemplates(): Observable<UserSpaceItem[]> {
    return this.http.get<any>(this.apiUrl, { params: { isTemplate: 'true', all: 'true' } }).pipe(
      map((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          return res.data.map((item: any) => ({
            id: item.id || item._id,
            code: item.code,
            name: item.name,
            roomName: item.roomName || 'Không gian mẫu',
            roomId: item.roomId,
            file3DUrl: item.file3DUrl,
            previewImage: item.previewImage || '/images/rooms/living-room.png',
            dimensions: item.dimensions || {
              length: item.lengthM || 6,
              width: item.widthM || 4,
              height: item.heightM || 2.8,
            },
            lengthM: item.lengthM || item.dimensions?.length || 6,
            widthM: item.widthM || item.dimensions?.width || 4,
            heightM: item.heightM || item.dimensions?.height || 2.8,
            description: item.description || '',
            area: `${((item.lengthM || item.dimensions?.length || 6) * (item.widthM || item.dimensions?.width || 4)).toFixed(0)} m²`
          }));
        }
        return [];
      }),
      catchError((err) => {
        console.warn('Lỗi khi nạp không gian mẫu từ backend:', err);
        return of([]);
      })
    );
  }

  /**
   * Lưu thiết kế của người dùng
   */
  saveDesign(payload: CustomerDesignPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      ...payload,
      isTemplate: false,
    });
  }

  /**
   * Lấy danh sách thiết kế đã lưu của khách hàng
   */
  getCustomerDesigns(customerId?: string): Observable<any[]> {
    let params: any = { isTemplate: 'false', all: 'true' };
    if (customerId) params.customerId = customerId;

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => res.data || []),
      catchError(() => of([]))
    );
  }
}
