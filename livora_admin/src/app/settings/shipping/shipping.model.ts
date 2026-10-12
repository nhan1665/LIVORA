/**
 * Domain contracts for the LIVORA Admin Settings module — Shipping configuration screen.
 * Aligned with REPORT.docx section 3.2.2.2 and Table 29 (Shipping collection).
 * No BPMN process is provided for shipping in the report; the screen follows the
 * use case "Thiết lập vận chuyển" only.
 */

/** Delivery method values from Table 29 (`shippingMethod`: standard, express). */
export type ShippingMethod = 'standard' | 'express';

export type ShippingMethodFilter = 'all' | ShippingMethod;

export type ShippingStatusFilter = 'all' | 'active' | 'off';

export interface ShippingConfig {
  id: string;
  shippingMethod: ShippingMethod;
  province: string;
  /**
   * Provisional area detail shown under the province in the design reference
   * (e.g. "Kho Nam Sài Gòn (Hub 1)"); Table 29 has no equivalent column.
   */
  hub?: string;
  /** Delivery fee in VND (Table 29 `fee`). */
  fee: number;
  /** Provisional short note under the fee (e.g. "Phí tiêu chuẩn"); Table 29 has no column. */
  feeNote?: string;
  /** Expected delivery time, e.g. "2-4 ngày" (Table 29 `estimatedDeliveryTime`). */
  estimatedDeliveryTime: string;
  /**
   * Provisional free-shipping policy fields from the create dialog design reference
   * ("Miễn phí cho đơn từ"). Table 29 has no equivalent columns.
   */
  freeShipEnabled?: boolean;
  freeShipThreshold?: number;
  /** Provisional committed time slot label from the create dialog ("Khung giờ cam kết"). */
  timeSlot?: string;
  /** Provisional White-Glove standard toggle from the create dialog ("Tiêu chuẩn White-Glove Atelier đi kèm"). */
  whiteGloveIncluded?: boolean;
  /** Whether this configuration currently applies (Table 29 `isActive`). */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingDraft {
  shippingMethod: ShippingMethod;
  province: string;
  hub?: string;
  fee: number;
  estimatedDeliveryTime: string;
  freeShipEnabled: boolean;
  freeShipThreshold: number;
  timeSlot: string;
  whiteGloveIncluded: boolean;
  isActive: boolean;
}

export interface ShippingListQuery {
  search: string;
  method: ShippingMethodFilter;
  status: ShippingStatusFilter;
  page: number;
  pageSize: number;
}

export interface ShippingListResponse {
  items: ShippingConfig[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  /** Total configurations currently applying across the registry. */
  activeCount: number;
}
