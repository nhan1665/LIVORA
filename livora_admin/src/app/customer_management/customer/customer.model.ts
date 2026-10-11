/**
 * Domain contracts and view models for the LIVORA Admin Customer Management module.
 * Aligned with REPORT.docx (Table 15 Customers, Table 24 Orders) and Figma design references.
 */

export type CustomerType = 'registered' | 'guest';
export type CustomerStatus = 'active' | 'locked' | 'inactive';

export interface Customer {
  id: string;
  /** Canonical MongoDB identifier in REPORT.docx Table 16 */
  _id?: string;
  /** Provisional business identifier shown in UI reference (e.g. "270926-001") */
  code: string;
  fullName: string;
  initials: string; // e.g. "HN", "MC", "QB", "A+"
  phone: string; // Formatted or raw (e.g. "0918.421.xxx")
  email: string;
  /** Canonical password hash from DB Table 16 (null/empty for guest users) */
  passwordHash?: string;
  /** Canonical avatar URL from DB Table 16 */
  avatar?: string;
  customerType: CustomerType;
  /** Status: "active" (hoạt động) or "locked" (bị khóa / ngừng hoạt động) */
  status: CustomerStatus;
  createdAt: string; // e.g. "27/09/2026"
  /** Last update timestamp in DB Table 16 */
  updatedAt?: string;
  firstOrderNote?: string; // e.g. "(Đơn đặt hàng đầu tiên)"
  registeredAt?: string; // e.g. "30/09/2026"
  registerNote?: string; // e.g. "* Đăng ký trực tuyến trên Cổng thành viên Maison Atelier."
  birthDate?: string; // e.g. "14/08/1988"
  gender?: string; // e.g. "Nam" | "Nữ" | "Khác"
  tierSubtitle?: string; // e.g. "HỒ SƠ ĐỊNH DANH MAISON ATELIER VIP"
  addresses: CustomerAddress[];
  orders: CustomerOrder[];
  totalOrderValue: number;
  activeThisMonth: boolean;
}

export interface CustomerDraft {
  fullName: string;
  phone: string;
  email: string;
  birthDate?: string;
  gender?: string;
  status: CustomerStatus;
  customerType: CustomerType;
  tierSubtitle?: string;
}

export interface CustomerListSummary {
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  activeThisMonth: number;
}

export type CustomerTypeFilter = 'all' | 'registered' | 'guest';
export type CustomerStatusFilter = 'all' | 'active' | 'inactive';

export interface CustomerListQuery {
  search: string;
  customerType: CustomerTypeFilter;
  status: CustomerStatusFilter;
  page: number;
  pageSize: number;
}

export interface CustomerListResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: CustomerListSummary;
}

export interface CustomerAddress {
  addressId: string;
  label?: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
  note?: string;
  isDefault: boolean;
}

export interface CustomerOrder {
  orderId: string;
  orderCode: string;
  orderDate: string;
  productDetails: string;
  totalAmount: number;
  status: string;
}

