/**
 * Domain contracts for the LIVORA Admin Interaction Management module — Contact screen.
 * Aligned with REPORT.docx section 3.2.2.8, BPMN 3.3.2.9, and Table 28 (Contacts collection).
 */

/**
 * Processing status implemented by BPMN 3.3.2.9: a new request starts at
 * "new" ("Chưa xử lý") and is moved to "resolved" ("Đã xử lý") only through
 * the explicit "Duyệt xử lý" action.
 *
 * Note: Table 28 also declares a "processing" value. The approved workflow and
 * the design reference only expose the two states below; the extra DB status
 * is recorded as an open contract question in the module documentation.
 */
export type ContactStatus = 'new' | 'resolved';

export type ContactStatusFilter = 'all' | ContactStatus;

/** Preset time windows offered by the list filter bar. */
export type ContactTimeFilter = 'all' | 'last7days' | 'last30days';

export interface Contact {
  id: string;
  /** Provisional human-readable identifier shown in the UI (e.g. "LH-2610-089"); Table 28 defines only `_id`. */
  code: string;
  fullName: string;
  email: string;
  phone: string;
  /** Short request topic displayed in the list, e.g. "Cần tư vấn thiết kế". */
  subject: string;
  /** Full message content shown in the detail dialog. */
  message: string;
  /** Optional requester headline from the design reference (e.g. "KTS - VIP Resident"). */
  customerContext?: string;
  status: ContactStatus;
  /** ISO datetime of submission (Table 28 `createdAt`). */
  createdAt: string;
  /** ISO datetime when staff completed the request (Table 28 `resolvedAt`). */
  resolvedAt?: string;
  /** Staff member who completed the request (Table 28 `respondedBy`). */
  respondedBy?: string;
}

export interface ContactListQuery {
  search: string;
  status: ContactStatusFilter;
  time: ContactTimeFilter;
  page: number;
  pageSize: number;
}

export interface ContactListResponse {
  items: Contact[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  /** Total requests still waiting for processing across the whole registry. */
  pendingCount: number;
}
