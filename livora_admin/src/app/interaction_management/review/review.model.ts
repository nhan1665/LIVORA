/**
 * Domain contracts for the LIVORA Admin Interaction Management module — Review screen.
 * Aligned with REPORT.docx section 3.2.2.8, BPMN 3.3.2.10, and Table 26 (Reviews collection).
 */

/**
 * Moderation status from Table 26. Reviews are auto-visible after submission
 * (no pre-approval step); administration can only hide an inappropriate review
 * ("Ẩn đánh giá"), and a hidden review is retained for lookup.
 */
export type ReviewStatus = 'visible' | 'hidden';

export type ReviewStatusFilter = 'all' | ReviewStatus;

export type ReviewRatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  /** Provisional human-readable identifier shown in the UI (e.g. "DG-9021"); Table 26 defines only `_id`. */
  code: string;
  customerName: string;
  /** Optional reviewer context line from the design reference (e.g. "Biệt thự Ciputra, Hà Nội"). */
  customerContext?: string;
  /**
   * Provisional moderation hint shown by the design reference for suspicious
   * accounts (e.g. "Tài khoản nghi vấn / spam"); not part of Table 26.
   */
  customerFlag?: string;
  productId: string;
  productName: string;
  productSku: string;
  productThumbnail: string;
  /** Reference to the purchased order (Table 26 `orderId`). */
  orderId?: string;
  /** Overall score from 1 to 5 (Table 26 `rating`). */
  rating: number;
  comment: string;
  images: string[];
  status: ReviewStatus;
  /** Reason recorded when staff hides the review (Table 26 `hiddenReason`). */
  hiddenReason?: string;
  /** Staff member who hid the review (Table 26 `moderatedBy`). */
  moderatedBy?: string;
  /** ISO datetime of moderation (Table 26 `moderatedAt`). */
  moderatedAt?: string;
  /** ISO datetime the customer submitted the review (Table 26 `createdAt`). */
  createdAt: string;
}

export interface ReviewListQuery {
  search: string;
  rating: ReviewRatingFilter;
  status: ReviewStatusFilter;
  page: number;
  pageSize: number;
}

export interface ReviewListResponse {
  items: Review[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  /** Total reviews hidden by moderation across the whole registry. */
  hiddenCount: number;
}
