import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MarqueeItem, BannerItem, BrandItem, FooterConfigItem } from './homepage';

@Injectable({
  providedIn: 'root',
})
export class HomepageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/homepage`;

  // ==========================================
  // 1. MARQUEE APIS
  // ==========================================
  getMarquees(): Observable<MarqueeItem[]> {
    return this.http.get<any>(`${this.apiUrl}/marquees`).pipe(
      map((res) => (res.data || []) as MarqueeItem[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải thông báo Marquee.')))
    );
  }

  createMarquee(item: Partial<MarqueeItem>): Observable<MarqueeItem> {
    return this.http.post<any>(`${this.apiUrl}/marquees`, item).pipe(
      map((res) => res.data as MarqueeItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo thông báo Marquee.')))
    );
  }

  updateMarquee(id: string, item: Partial<MarqueeItem>): Observable<MarqueeItem> {
    return this.http.put<any>(`${this.apiUrl}/marquees/${id}`, item).pipe(
      map((res) => res.data as MarqueeItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật thông báo Marquee.')))
    );
  }

  toggleMarquee(id: string): Observable<{ id: string; status: 'Đang hoạt động' | 'Đã ẩn' }> {
    return this.http.patch<any>(`${this.apiUrl}/marquees/${id}/toggle`, {}).pipe(
      map((res) => res.data),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái Marquee.')))
    );
  }

  deleteMarquee(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/marquees/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa thông báo Marquee.')))
    );
  }

  // ==========================================
  // 2. BANNER APIS
  // ==========================================
  getBanners(): Observable<BannerItem[]> {
    return this.http.get<any>(`${this.apiUrl}/banners`).pipe(
      map((res) => (res.data || []) as BannerItem[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách Banner.')))
    );
  }

  createBanner(item: Partial<BannerItem>): Observable<BannerItem> {
    return this.http.post<any>(`${this.apiUrl}/banners`, item).pipe(
      map((res) => res.data as BannerItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo Banner mới.')))
    );
  }

  updateBanner(id: string, item: Partial<BannerItem>): Observable<BannerItem> {
    return this.http.put<any>(`${this.apiUrl}/banners/${id}`, item).pipe(
      map((res) => res.data as BannerItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật Banner.')))
    );
  }

  toggleBanner(id: string): Observable<{ id: string; status: 'Đang hiển thị' | 'Đã ẩn' }> {
    return this.http.patch<any>(`${this.apiUrl}/banners/${id}/toggle`, {}).pipe(
      map((res) => res.data),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái Banner.')))
    );
  }

  deleteBanner(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/banners/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa Banner.')))
    );
  }

  // ==========================================
  // 3. BRAND APIS
  // ==========================================
  getBrands(): Observable<BrandItem[]> {
    return this.http.get<any>(`${this.apiUrl}/brands`).pipe(
      map((res) => (res.data || []) as BrandItem[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách thương hiệu.')))
    );
  }

  createBrand(item: Partial<BrandItem>): Observable<BrandItem> {
    return this.http.post<any>(`${this.apiUrl}/brands`, item).pipe(
      map((res) => res.data as BrandItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo thương hiệu.')))
    );
  }

  updateBrand(id: string, item: Partial<BrandItem>): Observable<BrandItem> {
    return this.http.put<any>(`${this.apiUrl}/brands/${id}`, item).pipe(
      map((res) => res.data as BrandItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật thương hiệu.')))
    );
  }

  toggleBrand(id: string): Observable<{ id: string; status: 'Đang hiển thị' | 'Đã ẩn' }> {
    return this.http.patch<any>(`${this.apiUrl}/brands/${id}/toggle`, {}).pipe(
      map((res) => res.data),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái thương hiệu.')))
    );
  }

  deleteBrand(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/brands/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa thương hiệu.')))
    );
  }

  // ==========================================
  // 4. FOOTER APIS
  // ==========================================
  getFooters(): Observable<FooterConfigItem[]> {
    return this.http.get<any>(`${this.apiUrl}/footers`).pipe(
      map((res) => (res.data || []) as FooterConfigItem[]),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải cấu hình Footer.')))
    );
  }

  createFooter(item: Partial<FooterConfigItem>): Observable<FooterConfigItem> {
    return this.http.post<any>(`${this.apiUrl}/footers`, item).pipe(
      map((res) => res.data as FooterConfigItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tạo cấu hình Footer.')))
    );
  }

  updateFooter(id: string, item: Partial<FooterConfigItem>): Observable<FooterConfigItem> {
    return this.http.put<any>(`${this.apiUrl}/footers/${id}`, item).pipe(
      map((res) => res.data as FooterConfigItem),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật Footer.')))
    );
  }

  toggleFooter(id: string): Observable<{ id: string; status: 'Hiển thị' | 'Ẩn' }> {
    return this.http.patch<any>(`${this.apiUrl}/footers/${id}/toggle`, {}).pipe(
      map((res) => res.data),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái Footer.')))
    );
  }

  deleteFooter(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/footers/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể xóa cấu hình Footer.')))
    );
  }
}
