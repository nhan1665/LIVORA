export type RefundStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected';

export type RefundType = 'full' | 'partial';

export interface Refund {
  _id: string;
  refundCode: string;
  orderId: string;
  orderCode: string;
  customerId?: string | null;
  customerName: string;
  contactPhone: string;
  refundType: RefundType;
  refundAmount: number;
  orderTotalAmount: number;
  reason: string;
  refundMethod: string;
  status: RefundStatus;
  rejectReason?: string;
  processedBy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ProcessRefundRequest {
  refundId: string;
  approved: boolean;
  rejectReason?: string;
  note?: string;
  staffName?: string;
}

export interface RefundFilterParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã phê duyệt',
  processing: 'Đang xử lý',
  completed: 'Đã hoàn tất',
  failed: 'Thất bại',
  rejected: 'Từ chối',
};
