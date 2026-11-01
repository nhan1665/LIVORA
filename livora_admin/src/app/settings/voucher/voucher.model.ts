/**
 * Domain contracts for the LIVORA Admin Settings module — Voucher screen.
 * Aligned with REPORT.docx section 3.2.2.2, BPMN 3.3.2.11, and Table 27 (Vouchers collection).
 */

/** Discount modes supported by the workflow: "percentage" (%) or "fixed_amount" (VND). */
export type VoucherDiscountType = 'percentage' | 'fixed_amount';

export type VoucherDiscountTypeFilter = 'all' | VoucherDiscountType;

/** Target audience: all customers or specific chosen customers */
export type VoucherTargetType = 'all' | 'specific';

/** Status filter derived from Table 27 `isActive`. */
export type VoucherStatusFilter = 'all' | 'active' | 'off';

/** Applicability window filter derived from `startDate` / `endDate`. */
export type VoucherTimeFilter = 'all' | 'upcoming' | 'running' | 'expired';

export interface ApplicableCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  code?: string;
}

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
   * Limit usage per customer account.
   */
  perCustomerLimit?: number;
  /** Target audience: 'all' or 'specific' */
  targetType?: VoucherTargetType;
  /** List of customer IDs granted this voucher if targetType === 'specific' */
  applicableCustomerIds?: string[];
  applicableCount?: number;
  applicableCustomers?: ApplicableCustomerSummary[];
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
  targetType: VoucherTargetType;
  applicableCustomerIds: string[];
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
