/**
 * Domain contracts and view models for the LIVORA Admin Category Management module.
 * Aligned with REPORT.docx (Table 17 Categories) and Figma design references.
 */

export interface ProductCategory {
  /** Canonical MongoDB identifier in REPORT.docx Table 17 */
  _id: string;
  /** UI ID alias */
  id: string;
  /** Business code displayed in Figma table (e.g. "CAT-SOFA", "CAT-TABLE") */
  code: string;
  /** Category name */
  name: string;
  /** SEO slug, synchronized with livora_user (e.g. "sofas", "coffee-tables") */
  slug: string;
  /** Parent category reference for hierarchy (null if top-level) */
  parentId?: string | null;
  /** Description text */
  description: string;
  /** Thumbnail image path / URL */
  thumbnail: string;
  /** Display order index on website navigation */
  displayOrder: number;
  /** Operational status: true = Đang hoạt động, false = Tạm dừng */
  isActive: boolean;
  /** Aggregated product count in this category */
  productCount: number;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

export interface CategoryDraft {
  code: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  description: string;
  thumbnail?: string;
  parentId?: string | null;
}

export type CategoryStatusFilter = 'all' | 'active' | 'inactive';

export interface CategoryListQuery {
  search: string;
  status: CategoryStatusFilter;
  page: number;
  pageSize: number;
}

export interface CategoryListResponse {
  items: ProductCategory[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  activeCount: number;
  inactiveCount: number;
}
