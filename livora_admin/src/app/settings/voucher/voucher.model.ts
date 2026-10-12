/**
 * Domain contracts for the LIVORA Admin Settings module — Voucher screen.
 * Aligned with REPORT.docx section 3.2.2.2, BPMN 3.3.2.11, and Table 27 (Vouchers collection).
 */

/** Discount modes supported by the workflow: "percentage" (%) or "fixed_amount" (VND). */
export type VoucherDiscountType = 'percentage' | 'fixed_amount';

export type VoucherDiscountTypeFilter = 'all' | VoucherDiscountType;

/** Status filter derived from Table 27 `isActive`. */
export type VoucherStatusFilter = 'all' | 'active' | 'off';

/** Applicability window filter derived from `startDate` / `endDate`. */
export type VoucherTimeFilter = 'all' | 'upcoming' | 'running' | 'expired';

export interface Voucher {
  id: string;
  /** Unique uppercase promotion code (Table 27 `code`, e.g. "LIVORA-VIP10"). */
  code: string;
  /** Display name of the promotion program (Table 27 `title`). */
  title: string;
  discountType: VoucherDiscountType;
  /** 15 for 15%, or 50000 for a 50.000đ fixed discount (Table 27 `discountValue`). */
  discountValue: number;
  /** Maximum discount amount for percentage vouchers (Table 27 `maxDiscountAmount`); 0 = no cap. */
  maxDiscountAmount: number;
  /** Minimum order value required to apply the voucher (Table 27 `minOrderValue`). */
  minOrderValue: number;
  /** Total issued quantity (Table 27 `quantity`). */
  quantity: number;
  /** Successful usage count (Table 27 `usedCount`). */
  usedCount: number;
  /**
   * Provisional UI-only field from the design reference ("Giới hạn lượt dùng / Mỗi khách hàng").
   * Table 27 has no per-customer limit column; pending backend contract approval.
   */
  perCustomerLimit?: number;
  /** ISO datetime when the program becomes valid (Table 27 `startDate`). */
  startDate: string;
  /** ISO datetime when the program stops being valid (Table 27 `endDate`). */
  endDate: string;
  /** Admin on/off switch (Table 27 `isActive`). */
  isActive: boolean;
}

export interface VoucherDraft {
  code: string;
  title: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  quantity: number;
  perCustomerLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface VoucherListQuery {
  search: string;
  discountType: VoucherDiscountTypeFilter;
  status: VoucherStatusFilter;
  time: VoucherTimeFilter;
  page: number;
  pageSize: number;
}

export interface VoucherListResponse {
  items: Voucher[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  /** Total vouchers currently switched on across the whole registry. */
  activeCount: number;
}
