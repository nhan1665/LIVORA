import { Injectable } from '@angular/core';
import { Refund, RefundFilterParams, ProcessRefundRequest } from '../models/refund.model';
import { OrderService } from './order.service';

const REFUND_STORAGE_KEY = 'livora_admin_refunds';

@Injectable({
  providedIn: 'root',
})
export class RefundService {
  private initialRefunds: Refund[] = [
    {
      _id: 'ref-001',
      refundCode: 'REF-260301-01',
      orderId: 'ord-004',
      orderCode: 'LIV-260303-771',
      customerId: 'cust-004',
      customerName: 'Đỗ Phạm Minh Tân',
      contactPhone: '0903112233',
      refundType: 'full',
      refundAmount: 4960000,
      orderTotalAmount: 4960000,
      reason: 'Khách hàng đổi ý muốn chọn mẫu tủ khác có kích thước lớn hơn, hủy đơn trước khi giao.',
      refundMethod: 'Banking',
      status: 'completed',
      processedBy: 'Admin Kế toán',
      createdAt: '2026-10-07T08:30:00Z',
      completedAt: '2026-10-07T09:00:00Z',
    },
    {
      _id: 'ref-002',
      refundCode: 'REF-260302-02',
      orderId: 'ord-001',
      orderCode: 'LIV-260301-889',
      customerId: 'cust-001',
      customerName: 'Dương Trọng Nhân',
      contactPhone: '0562173125',
      refundType: 'partial',
      refundAmount: 500000,
      orderTotalAmount: 1850000,
      reason: 'Sản phẩm trầy xước nhẹ góc chân giường trong quá trình bốc dỡ, thỏa thuận đền bù hỗ trợ.',
      refundMethod: 'Banking',
      status: 'pending',
      createdAt: '2026-10-09T09:30:00Z',
    },
  ];

  private refunds: Refund[] = [];

  constructor(private orderService: OrderService) {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(REFUND_STORAGE_KEY);
      if (stored) {
        this.refunds = JSON.parse(stored);
      } else {
        this.refunds = [...this.initialRefunds];
        this.saveRefunds();
      }
    } catch {
      this.refunds = [...this.initialRefunds];
    }
  }

  private saveRefunds(): void {
    try {
      localStorage.setItem(REFUND_STORAGE_KEY, JSON.stringify(this.refunds));
    } catch {
      // ignore
    }
  }

  listRefunds(params: RefundFilterParams = {}): {
    refunds: Refund[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let result = [...this.refunds];

    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim().toLowerCase();
      result = result.filter(
        r =>
          r.refundCode.toLowerCase().includes(kw) ||
          r.orderCode.toLowerCase().includes(kw) ||
          r.customerName.toLowerCase().includes(kw) ||
          r.contactPhone.toLowerCase().includes(kw)
      );
    }

    if (params.status && params.status !== 'all') {
      result = result.filter(r => r.status === params.status);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = result.length;
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = result.slice(startIndex, startIndex + pageSize);

    return {
      refunds: paginated,
      total,
      page,
      pageSize,
    };
  }

  getRefundById(id: string): Refund | undefined {
    return this.refunds.find(r => r._id === id);
  }

  processRefund(request: ProcessRefundRequest): { success: boolean; message: string; refund?: Refund } {
    const refund = this.getRefundById(request.refundId);
    if (!refund) {
      return { success: false, message: 'Không tìm thấy hồ sơ hoàn tiền cần xử lý.' };
    }

    if (refund.status === 'completed' || refund.status === 'rejected') {
      return { success: false, message: `Hồ sơ này đã ở trạng thái "${refund.status}", không thể xử lý lại.` };
    }

    if (request.approved) {
      // Verify order exists
      const linkedOrder = this.orderService.getOrderById(refund.orderId);
      if (!linkedOrder) {
        return { success: false, message: 'Đơn hàng liên kết không tồn tại trong hệ thống.' };
      }

      if (refund.refundAmount > linkedOrder.totalAmount) {
        return {
          success: false,
          message: `Số tiền hoàn (${refund.refundAmount.toLocaleString()}đ) không được vượt quá giá trị đơn hàng (${linkedOrder.totalAmount.toLocaleString()}đ).`,
        };
      }

      refund.status = 'completed';
      refund.completedAt = new Date().toISOString();
      refund.processedBy = request.staffName || 'Admin Kế toán';

      // Synchronize linked order paymentStatus
      this.orderService.updatePaymentStatus(refund.orderId, 'refunded');

      this.saveRefunds();
      return {
        success: true,
        message: `Phê duyệt và thực hiện hoàn tiền ${refund.refundAmount.toLocaleString()}đ thành công. Đơn hàng đã được cập nhật sang trạng thái "Đã hoàn tiền".`,
        refund,
      };
    } else {
      if (!request.rejectReason || !request.rejectReason.trim()) {
        return { success: false, message: 'Vui lòng cung cấp lý do từ chối yêu cầu hoàn tiền.' };
      }

      refund.status = 'rejected';
      refund.rejectReason = request.rejectReason.trim();
      refund.processedBy = request.staffName || 'Admin Kế toán';

      this.saveRefunds();
      return {
        success: true,
        message: 'Đã từ chối yêu cầu hoàn tiền thành công.',
        refund,
      };
    }
  }

  getStats(): { total: number; pending: number; completed: number; totalRefundedAmount: number } {
    let pending = 0;
    let completed = 0;
    let totalRefundedAmount = 0;

    for (const r of this.refunds) {
      if (r.status === 'pending') pending++;
      if (r.status === 'completed') {
        completed++;
        totalRefundedAmount += r.refundAmount;
      }
    }

    return {
      total: this.refunds.length,
      pending,
      completed,
      totalRefundedAmount,
    };
  }
}
