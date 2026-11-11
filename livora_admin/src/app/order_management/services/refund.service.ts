import { Injectable } from '@angular/core';
import { Refund, RefundFilterParams, ProcessRefundRequest } from '../models/refund.model';
import { environment } from '../../../environments/environment';

/** Old builds cached hardcoded demo refunds here; they pointed at orders that never existed. */
const LEGACY_REFUND_STORAGE_KEY = 'livora_admin_refunds';

export interface RefundStats {
  total: number;
  pending: number;
  completed: number;
  totalRefundedAmount: number;
}

export interface RefundListResult {
  refunds: Refund[];
  total: number;
  page: number;
  pageSize: number;
  stats: RefundStats;
}

/**
 * Refund requests live only in the backend (`/api/refunds`). Every list and every
 * approve/reject goes through the API so the admin never acts on stale or mock data.
 */
@Injectable({
  providedIn: 'root',
})
export class RefundService {
  private readonly apiUrl = `${environment.apiBaseUrl}/refunds`;
  private cache = new Map<string, Refund>();

  constructor() {
    try {
      localStorage.removeItem(LEGACY_REFUND_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private authHeaders(json = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('livora_admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request(url: string, init: RequestInit = {}): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.');
    }
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON body
    }
    if (!res.ok || !body?.success) {
      throw new Error(body?.message || `Yêu cầu thất bại (${res.status}).`);
    }
    return body;
  }

  private mapRefund(r: any): Refund {
    return {
      _id: r.id || r._id,
      refundCode: r.orderCode ? `REF-${r.orderCode}` : `REF-${String(r.id || r._id).slice(-6)}`,
      orderId: r.orderId,
      orderCode: r.orderCode,
      customerId: r.userId || 'guest',
      customerName: r.customerName || 'Khách hàng',
      contactPhone: r.customerPhone || '',
      refundType: r.refundType || 'full',
      refundAmount: r.amount || 0,
      orderTotalAmount: r.orderTotalAmount ?? r.amount ?? 0,
      reason: r.reason || '',
      refundMethod: 'Banking',
      bankName: r.bankName || '',
      bankAccountNumber: r.bankAccountNumber || '',
      bankAccountOwner: r.bankAccountOwner || '',
      evidenceImages: r.evidenceImages || [],
      status: r.status || 'pending',
      processedBy: r.processedBy || '',
      rejectReason: r.rejectReason || '',
      createdAt: r.createdAt,
      completedAt: r.status === 'completed' ? r.updatedAt : undefined,
    };
  }

  async listRefunds(params: RefundFilterParams = {}): Promise<RefundListResult> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status: params.status || 'all',
      search: (params.keyword || '').trim(),
    });

    const body = await this.request(`${this.apiUrl}?${query}`, { headers: this.authHeaders(), cache: 'no-store' });
    const refunds: Refund[] = (body.data || []).map((r: any) => this.mapRefund(r));
    refunds.forEach(r => this.cache.set(r._id, r));

    const total = body.pagination?.totalItems ?? refunds.length;
    return {
      refunds,
      total,
      page: body.pagination?.page ?? page,
      pageSize: body.pagination?.pageSize ?? pageSize,
      stats: {
        total,
        pending: body.stats?.pending ?? 0,
        completed: body.stats?.completed ?? 0,
        totalRefundedAmount: body.stats?.totalRefundedAmount ?? 0,
      },
    };
  }

  getRefundById(id: string): Refund | undefined {
    return this.cache.get(id);
  }

  async processRefund(request: ProcessRefundRequest): Promise<{ success: boolean; message: string; refund?: Refund }> {
    const refund = this.getRefundById(request.refundId);
    if (!refund) {
      return { success: false, message: 'Không tìm thấy hồ sơ hoàn tiền cần xử lý.' };
    }
    if (refund.status !== 'pending') {
      return { success: false, message: 'Hồ sơ này đã được xử lý, không thể xử lý lại.' };
    }
    if (!request.approved && !request.rejectReason?.trim()) {
      return { success: false, message: 'Vui lòng cung cấp lý do từ chối yêu cầu hoàn tiền.' };
    }

    const staffName = request.staffName || 'Admin Kế toán';
    try {
      const body = await this.request(`${this.apiUrl}/${refund._id}/status`, {
        method: 'PATCH',
        headers: this.authHeaders(true),
        body: JSON.stringify(
          request.approved
            ? { status: 'completed', processedBy: staffName }
            : { status: 'rejected', rejectReason: request.rejectReason!.trim(), processedBy: staffName }
        ),
      });

      const updated: Refund = {
        ...refund,
        status: body.data?.status || (request.approved ? 'completed' : 'rejected'),
        rejectReason: body.data?.rejectReason || refund.rejectReason,
        processedBy: body.data?.processedBy || staffName,
        completedAt: request.approved ? body.data?.updatedAt || new Date().toISOString() : refund.completedAt,
      };
      this.cache.set(updated._id, updated);

      return {
        success: true,
        message: request.approved
          ? `Phê duyệt và hoàn tiền ${updated.refundAmount.toLocaleString()}đ thành công. Đơn hàng đã chuyển sang "Đã hoàn tiền".`
          : 'Đã từ chối yêu cầu hoàn tiền thành công.',
        refund: updated,
      };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Không thể xử lý yêu cầu hoàn tiền.' };
    }
  }

  // ====== QUẢN LÝ FILE CHÍNH SÁCH MUA HÀNG ======
  async getPolicy(): Promise<any> {
    try {
      const res = await fetch(`${this.apiUrl}/policy`);
      const data = await res.json();
      if (data && data.success) {
        if (data.data) {
          localStorage.setItem('livora_refund_policy', JSON.stringify(data.data));
          return data.data;
        } else {
          localStorage.removeItem('livora_refund_policy');
          return null;
        }
      }
    } catch (_) {}

    try {
      const cached = localStorage.getItem('livora_refund_policy');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  }

  async updatePolicy(payload: { fileName: string; fileSize?: string; fileData?: string; updatedBy?: string }): Promise<any> {
    const data = await this.request(`${this.apiUrl}/policy`, {
      method: 'POST',
      headers: this.authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (data.data) {
      localStorage.setItem('livora_refund_policy', JSON.stringify(data.data));
      return data.data;
    }
    throw new Error(data?.message || 'Lỗi lưu chính sách.');
  }
}
