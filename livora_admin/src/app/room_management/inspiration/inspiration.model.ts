export interface Hotspot {
  productId: string;
  xPercent: number;
  yPercent: number;
  note: string;
}

export interface InspirationRecord {
  id: string;
  /** Provisional Admin identifier; REPORT Table 21 defines slug, not code. */
  code: string;
  title: string;
  roomId: string;
  style: string;
  content: string;
  thumbnail: string;
  taggedProducts: Hotspot[];
  status: 'published' | 'hidden';
  /** Visual-only version, pending an API contract. */
  version: string;
}

export type InspirationDraft = Omit<InspirationRecord, 'id' | 'version'>;
export type InspirationStatusFilter = 'all' | 'published' | 'hidden';
export interface InspirationQuery {
  search: string;
  roomId: string;
  status: InspirationStatusFilter;
  page: number;
  pageSize: number;
}
export interface InspirationPage {
  items: InspirationRecord[];
  total: number;
  page: number;
  pages: number;
}
