import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CompanyPolicy {
  _id?: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  fileUrl?: string;
  fileData?: string;
  summary?: string;
  content?: string;
  version?: string;
  updatedBy?: string;
  isActive?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

const STORAGE_KEY = 'livora_admin_company_policy';

const DEFAULT_POLICY: CompanyPolicy = {
  title: 'Chính sách Bán hàng & Hoàn tiền LIVORA',
  summary: 'Quy định về bảo hành, đổi trả trong 7 ngày, kiểm tra trước khi nhận và chính sách hoàn tiền 100%.',
  fileName: 'Chinh_Sach_Ban_Hang_Va_Hoan_Tien_Livora.pdf',
  fileType: 'application/pdf',
  fileSize: '350 KB',
  version: '1.0',
  content: `1. CHÍNH SÁCH ĐỔI TRẢ & HOÀN TIỀN
- Khách hàng được quyền kiểm tra sản phẩm trước khi thanh toán.
- LIVORA hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc giao sai mẫu mã, hư hỏng trong quá trình vận chuyển.
- Hoàn tiền 100% trong vòng 3 - 5 ngày làm việc qua chuyển khoản ngân hàng nếu đáp ứng đủ điều kiện hoàn trả.

2. CHÍNH SÁCH BẢO HÀNH
- Sản phẩm nội thất đồ gỗ và sofa được bảo hành chính hãng từ 12 - 24 tháng theo từng danh mục.
- Miễn phí bảo trì định kỳ cho khách hàng thành viên.

3. ĐIỀU KHOẢN VẬN CHUYỂN & GIAO HÀNG
- Giao hàng tận nơi toàn quốc. LIVORA hỗ trợ lắp đặt tận nơi theo yêu cầu.
- Mọi thắc mắc và khiếu nại xin liên hệ hotline CSKH: 1900 8888 hoặc email support@livora.vn.`,
  isActive: true,
  updatedAt: new Date().toISOString()
};

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/policy`;

  getPolicy(): Observable<{ success: boolean; data: CompanyPolicy }> {
    return this.http.get<{ success: boolean; data: CompanyPolicy }>(this.apiUrl).pipe(
      tap((res) => {
        if (res && res.data) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          } catch (_) {}
        }
      }),
      catchError((err) => {
        console.warn('[POLICY SERVICE] Không thể kết nối tới Backend, đọc từ bộ nhớ cục bộ:', err.message);
        let cached: CompanyPolicy = DEFAULT_POLICY;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) cached = JSON.parse(raw);
        } catch (_) {}
        return of({ success: true, data: cached });
      })
    );
  }

  updatePolicy(policyData: Partial<CompanyPolicy>): Observable<{ success: boolean; message: string; data: CompanyPolicy }> {
    // Luôn lưu cache local trước để đảm bảo không mất dữ liệu của admin
    let currentCached: CompanyPolicy = DEFAULT_POLICY;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) currentCached = JSON.parse(raw);
    } catch (_) {}

    const merged: CompanyPolicy = {
      ...currentCached,
      ...policyData,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('[POLICY SERVICE] Không thể lưu cache localStorage:', e);
    }

    return this.http.post<{ success: boolean; message: string; data: CompanyPolicy }>(this.apiUrl, policyData).pipe(
      tap((res) => {
        if (res && res.data) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          } catch (_) {}
        }
      }),
      catchError((err) => {
        console.warn('[POLICY SERVICE] Backend gặp lỗi khi lưu, đã lưu dự phòng vào bộ nhớ máy:', err);
        return of({
          success: true,
          message: 'Đã lưu chính sách vào hệ thống thành công (bộ nhớ dự phòng). Vui lòng kiểm tra lại Backend để đồng bộ hoàn toàn vào cơ sở dữ liệu.',
          data: merged
        });
      })
    );
  }
}
