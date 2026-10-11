/**
 * Domain contracts and view models for the LIVORA Admin Product Management module.
 * Aligned with REPORT.docx (Table 19 Products, Table 17 Categories, Table 18 Rooms) and Figma design references.
 */

export interface ProductDimensions {
  length: number; // Chiều dài (cm)
  width: number;  // Chiều rộng (cm)
  height: number; // Chiều cao (cm)
  weight?: number;// Trọng lượng (kg)
}

export type ProductOperationalStatus = 'Đang kinh doanh' | 'ngưng kinh doanh';
export type ProductStockStatus = 'in_stock' | 'out_of_stock';

export interface ProductItem {
  /** Canonical MongoDB identifier in REPORT.docx Table 19 */
  _id: string;
  /** UI ID alias */
  id: string;
  /** Unique stock keeping unit (e.g. "LIV-SOFA-01", "SOFA-NORDIC-01") */
  sku: string;
  /** Product display name */
  name: string;
  /** SEO slug for product detail url */
  slug: string;
  /** Reference to Categories._id */
  categoryId: string;
  /** Denormalized category name for instant table display */
  categoryName: string;
  /** Reference to Rooms._id (array, 1 product can belong to multiple rooms) */
  roomIds: string[];
  /** Denormalized room display names */
  roomNames?: string[];
  /** Base retail price in VNĐ */
  price: number;
  /** Discounted sale price in VNĐ (null if no discount) */
  salePrice?: number | null;
  /** Available physical inventory count */
  stockQuantity: number;
  /** Main image URL / path */
  thumbnail: string;
  /** Gallery images */
  images: string[];
  /** Detailed HTML / text description */
  description: string;
  /** Physical dimensions */
  dimensions: ProductDimensions;
  /** Materials list (e.g. ["Vải nỉ cao cấp", "Khung gỗ sồi"]) */
  materials: string[];
  /** Color variations (e.g. ["Xám", "Be", "Nâu bò"]) */
  colors: string[];
  /** Average star rating (1.0 to 5.0) */
  averageRating: number;
  /** Total user reviews count */
  totalReviews: number;
  /** Stock status: "in_stock" (còn hàng) or "out_of_stock" (hết hàng) */
  stockStatus: ProductStockStatus;
  /** Operational business status: "Đang kinh doanh" or "ngưng kinh doanh" */
  status: ProductOperationalStatus;
  /** Featured homepage badge */
  isFeatured: boolean;
  /** 3D AR Model URL (.glb) - reported anomaly extension */
  file3DUrl?: string;
  /** Helper flag indicating whether product has 3D AR asset */
  has3DModel: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt?: string;
}

export interface ProductDraft {
  sku: string;
  name: string;
  slug?: string;
  categoryId: string;
  roomIds: string[];
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  thumbnail: string;
  images: string[];
  description: string;
  dimensions: ProductDimensions;
  materials: string[];
  colors: string[];
  status: ProductOperationalStatus;
  isFeatured: boolean;
  file3DUrl?: string;
}

export interface ProductSummaryMetrics {
  totalProducts: number;    // e.g. 348
  activeProducts: number;   // e.g. 312 ("Đang kinh doanh")
  outOfStockProducts: number; // e.g. 24 ("Hết hàng")
  has3DCount: number;       // e.g. 86 ("Có file 3D")
}

export type ProductStatusFilter = 'all' | 'active' | 'inactive' | 'in_stock' | 'out_of_stock';
export type Product3DFilter = 'all' | 'has_3d' | 'no_3d';
export type ProductSortOption = 'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

export interface ProductListQuery {
  search: string;
  categoryId: string; // 'all' or specific categoryId
  roomId?: string;    // 'all' or specific roomId
  status: ProductStatusFilter;
  has3D: Product3DFilter;
  sortBy: ProductSortOption;
  page: number;
  pageSize: number;
}

export interface ProductListResponse {
  items: ProductItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  metrics: ProductSummaryMetrics;
}
