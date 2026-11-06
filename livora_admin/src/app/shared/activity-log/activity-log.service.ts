import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLogItem {
  _id?: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  action: string;
  performedBy: string;
  role: 'system' | 'admin' | 'staff' | 'customer';
  details?: string;
  createdAt: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/activity-logs`;

  getLogs(entityType: string, entityId: string, entityCode?: string): Observable<ActivityLogItem[]> {
    if (!entityType || (!entityId && !entityCode)) {
      return of([]);
    }

    let url = `${this.apiUrl}?entityType=${encodeURIComponent(entityType)}`;
    if (entityId) url += `&entityId=${encodeURIComponent(entityId)}`;
    if (entityCode) url += `&entityCode=${encodeURIComponent(entityCode)}`;

    return this.http.get<{ success: boolean; data: ActivityLogItem[] }>(url).pipe(
      map((res) => res?.data || []),
      catchError((err) => {
        console.warn('Could not fetch activity logs from server:', err);
        return of([]);
      })
    );
  }

  addLog(log: Partial<ActivityLogItem>): Observable<ActivityLogItem | null> {
    return this.http.post<{ success: boolean; data: ActivityLogItem }>(this.apiUrl, log).pipe(
      map((res) => res?.data || null),
      catchError((err) => {
        console.error('Failed to create activity log:', err);
        return of(null);
      })
    );
  }
}

