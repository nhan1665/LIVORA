import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ProductDraft,
  ProductItem,
  ProductListQuery,
  ProductListResponse,
  ProductSummaryMetrics,
} from './product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly products$ = new BehaviorSubject<ProductItem[]>(this.generateInitialCatalog());

  /**
   * Retrieves all products.
   */
  getAllProducts(): Observable<ProductItem[]> {
    return this.products$.asObservable();
  }

  /**
   * Retrieves summary metrics across all products.
   */
  getSummaryMetrics(): Observable<ProductSummaryMetrics> {
    return this.products$.pipe(
      map((products) => this.calculateMetrics(products))
    );
  }

  /**
   * Queries products with searching, filtering, sorting, and pagination.
   */
  queryProducts(query: ProductListQuery): Observable<ProductListResponse> {
    return this.products$.pipe(
      map((products) => {
        let filtered = [...products];

        // Search filter (keyword against name, sku, description)
        if (query.search && query.search.trim()) {
          const term = query.search.trim().toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.sku.toLowerCase().includes(term) ||
              p.name.toLowerCase().includes(term) ||
              p.categoryName.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term)
          );
        }

        // Category filter
        if (query.categoryId && query.categoryId !== 'all') {
          filtered = filtered.filter((p) => p.categoryId === query.categoryId);
        }

        // Room filter
        if (query.roomId && query.roomId !== 'all') {
          filtered = filtered.filter((p) => p.roomIds.includes(query.roomId!));
        }

        // Status & Stock filter
        if (query.status && query.status !== 'all') {
          if (query.status === 'active') {
            filtered = filtered.filter((p) => p.status === 'Đang kinh doanh');
          } else if (query.status === 'inactive') {
            filtered = filtered.filter((p) => p.status === 'ngưng kinh doanh');
          } else if (query.status === 'in_stock') {
            filtered = filtered.filter((p) => p.stockStatus === 'in_stock');
          } else if (query.status === 'out_of_stock') {
            filtered = filtered.filter((p) => p.stockStatus === 'out_of_stock');
          }
        }

        // 3D Model filter
        if (query.has3D && query.has3D !== 'all') {
          if (query.has3D === 'has_3d') {
            filtered = filtered.filter((p) => p.has3DModel);
          } else if (query.has3D === 'no_3d') {
            filtered = filtered.filter((p) => !p.has3DModel);
          }
        }

        // Sorting
        if (query.sortBy === 'price_asc') {
          filtered.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        } else if (query.sortBy === 'price_desc') {
          filtered.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        } else if (query.sortBy === 'stock_asc') {
          filtered.sort((a, b) => a.stockQuantity - b.stockQuantity);
        } else if (query.sortBy === 'stock_desc') {
          filtered.sort((a, b) => b.stockQuantity - a.stockQuantity);
        } else {
          // 'newest' by default
          filtered.sort((a, b) => b.sku.localeCompare(a.sku));
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const currentPage = Math.min(Math.max(1, query.page), totalPages);

        const startIndex = (currentPage - 1) * query.pageSize;
        const items = filtered.slice(startIndex, startIndex + query.pageSize);

        return {
          items,
          page: currentPage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
          metrics: this.calculateMetrics(products),
        };
      })
    );
  }

  /**
   * Finds a product by its ID or SKU.
   */
  getProductById(idOrSku: string): Observable<ProductItem | null> {
    return this.products$.pipe(
      map((list) => list.find((p) => p.id === idOrSku || p.sku === idOrSku || p._id === idOrSku) || null)
    );
  }

  /**
   * Adds a new product.
   */
  createProduct(draft: ProductDraft): Observable<ProductItem> {
    const list = this.products$.getValue();
    const newId = `prod-${Date.now()}`;
    const categoryName = this.resolveCategoryName(draft.categoryId);
    const roomNames = draft.roomIds.map((r) => this.resolveRoomName(r));
    const stockStatus = draft.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    const has3DModel = Boolean(draft.file3DUrl && draft.file3DUrl.trim().length > 0);

    const newProduct: ProductItem = {
      _id: newId,
      id: newId,
      sku: draft.sku.trim().toUpperCase(),
      name: draft.name.trim(),
      slug: draft.slug ? draft.slug.trim().toLowerCase() : this.slugify(draft.name),
      categoryId: draft.categoryId,
      categoryName,
      roomIds: draft.roomIds,
      roomNames,
      price: draft.price,
      salePrice: draft.salePrice || null,
      stockQuantity: draft.stockQuantity,
      thumbnail: draft.thumbnail || '/images/categories/living-room/sofas.png',
      images: draft.images.length > 0 ? draft.images : [draft.thumbnail],
      description: draft.description.trim(),
      dimensions: draft.dimensions,
      materials: draft.materials,
      colors: draft.colors,
      averageRating: 5.0,
      totalReviews: 0,
      stockStatus,
      status: draft.status,
      isFeatured: draft.isFeatured,
      file3DUrl: draft.file3DUrl,
      has3DModel,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [newProduct, ...list];
    this.products$.next(nextList);
    return of(newProduct);
  }

  /**
   * Updates an existing product.
   */
  updateProduct(id: string, draft: Partial<ProductDraft>): Observable<ProductItem> {
    const list = this.products$.getValue();
    const index = list.findIndex((p) => p.id === id || p._id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found.`);
    }

    const current = list[index];
    const categoryId = draft.categoryId !== undefined ? draft.categoryId : current.categoryId;
    const roomIds = draft.roomIds !== undefined ? draft.roomIds : current.roomIds;
    const stockQuantity = draft.stockQuantity !== undefined ? draft.stockQuantity : current.stockQuantity;
    const stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    const file3DUrl = draft.file3DUrl !== undefined ? draft.file3DUrl : current.file3DUrl;
    const has3DModel = Boolean(file3DUrl && file3DUrl.trim().length > 0);

    const updated: ProductItem = {
      ...current,
      sku: draft.sku !== undefined ? draft.sku.trim().toUpperCase() : current.sku,
      name: draft.name !== undefined ? draft.name.trim() : current.name,
      slug: draft.slug !== undefined ? draft.slug.trim().toLowerCase() : current.slug,
      categoryId,
      categoryName: this.resolveCategoryName(categoryId),
      roomIds,
      roomNames: roomIds.map((r) => this.resolveRoomName(r)),
      price: draft.price !== undefined ? draft.price : current.price,
      salePrice: draft.salePrice !== undefined ? draft.salePrice : current.salePrice,
      stockQuantity,
      thumbnail: draft.thumbnail !== undefined ? draft.thumbnail : current.thumbnail,
      images: draft.images !== undefined ? draft.images : current.images,
      description: draft.description !== undefined ? draft.description.trim() : current.description,
      dimensions: draft.dimensions !== undefined ? draft.dimensions : current.dimensions,
      materials: draft.materials !== undefined ? draft.materials : current.materials,
      colors: draft.colors !== undefined ? draft.colors : current.colors,
      stockStatus,
      status: draft.status !== undefined ? draft.status : current.status,
      isFeatured: draft.isFeatured !== undefined ? draft.isFeatured : current.isFeatured,
      file3DUrl,
      has3DModel,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.products$.next(nextList);
    return of(updated);
  }

  /**
   * Toggles product operational status.
   */
  toggleStatus(id: string): Observable<ProductItem> {
    const list = this.products$.getValue();
    const index = list.findIndex((p) => p.id === id || p._id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found.`);
    }

    const current = list[index];
    const newStatus = current.status === 'Đang kinh doanh' ? 'ngưng kinh doanh' : 'Đang kinh doanh';
    const updated: ProductItem = {
      ...current,
      status: newStatus,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.products$.next(nextList);
    return of(updated);
  }

  /**
   * Deletes a product.
   */
  deleteProduct(id: string): Observable<boolean> {
    const list = this.products$.getValue();
    const filtered = list.filter((p) => p.id !== id && p._id !== id);
    this.products$.next(filtered);
    return of(true);
  }

  private calculateMetrics(products: ProductItem[]): ProductSummaryMetrics {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'Đang kinh doanh').length;
    const outOfStockProducts = products.filter((p) => p.stockStatus === 'out_of_stock' || p.stockQuantity === 0).length;
    const has3DCount = products.filter((p) => p.has3DModel).length;

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      has3DCount,
    };
  }

  private resolveCategoryName(catId: string): string {
    const map: Record<string, string> = {
      'cat-01': 'Sofa & Armchair',
      'cat-02': 'Bàn trà & Bàn ăn',
      'cat-03': 'Ghế thư giãn & Ghế ăn',
      'cat-04': 'Giường ngủ & Nệm',
      'cat-05': 'Tủ quần áo & Tủ lưu trữ',
      'cat-06': 'Đèn trang trí & Chiếu sáng',
      'cat-07': 'Thảm trải sàn',
      'cat-08': 'Gương & Phụ kiện trang trí',
      'cat-09': 'Bộ chăn ga gối',
      'cat-10': 'Tủ búp phê & Kệ TV',
      'cat-11': 'Phụ kiện phòng tắm & Khăn',
      'cat-12': 'Bàn ghế làm việc',
      'cat-13': 'Nội thất ban công ngoài trời',
      'cat-14': 'Tranh & Lọ hoa nghệ thuật',
    };
    return map[catId] || 'Nội thất gia đình';
  }

  private resolveRoomName(roomId: string): string {
    const map: Record<string, string> = {
      'living-room': 'Phòng khách',
      'bedroom': 'Phòng ngủ',
      'kitchen': 'Phòng bếp',
      'dining-room': 'Phòng ăn',
      'bathroom': 'Phòng tắm',
    };
    return map[roomId] || roomId;
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Generates initial catalog of 348 products matching metrics:
   * Total: 348 | Active: 312 | Out of stock: 24 | Has 3D: 86
   */
  private generateInitialCatalog(): ProductItem[] {
    const catalog: ProductItem[] = [
      {
        _id: 'prod-001',
        id: 'prod-001',
        sku: 'SOFA-NORDIC-01',
        name: 'Sofa Góc L Nordic Modern',
        slug: 'sofa-goc-l-nordic-modern',
        categoryId: 'cat-01',
        categoryName: 'Sofa & Armchair',
        roomIds: ['living-room'],
        roomNames: ['Phòng khách'],
        price: 18500000,
        salePrice: 16500000,
        stockQuantity: 15,
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1512212621149-107ffe572d2f?q=80&w=1760&auto=format&fit=crop',
        ],
        description: 'Sofa góc L bọc vải nỉ cao cấp phong cách Bắc Âu tối giản, khung gỗ sồi tự nhiên chống mối mọt.',
        dimensions: { length: 260, width: 160, height: 85, weight: 65 },
        materials: ['Vải nỉ cao cấp', 'Khung gỗ sồi', 'Đệm mút D40'],
        colors: ['Xám tro', 'Be nhạt', 'Xanh navy'],
        averageRating: 4.8,
        totalReviews: 42,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: true,
        file3DUrl: 'https://assets.livora.vn/models/3d/sofa-nordic-01.glb',
        has3DModel: true,
        createdAt: '10/09/2026',
      },
      {
        _id: 'prod-002',
        id: 'prod-002',
        sku: 'TB-ROUND-02',
        name: 'Bàn Trà Tròn Mặt Đá Cẩm Thạch',
        slug: 'ban-tra-tron-mat-da-cam-thach',
        categoryId: 'cat-02',
        categoryName: 'Bàn trà & Bàn ăn',
        roomIds: ['living-room'],
        roomNames: ['Phòng khách'],
        price: 6200000,
        salePrice: null,
        stockQuantity: 28,
        thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80'],
        description: 'Bàn trà đôi mặt đá Marble vân mây tự nhiên, viền inox mạ PVD vàng đồng sang trọng.',
        dimensions: { length: 80, width: 80, height: 45, weight: 22 },
        materials: ['Mặt đá Marble', 'Khung Inox mạ PVD'],
        colors: ['Trắng vân mây', 'Đen tia chớp'],
        averageRating: 4.7,
        totalReviews: 29,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: 'https://assets.livora.vn/models/3d/tb-round-02.glb',
        has3DModel: true,
        createdAt: '12/09/2026',
      },
      {
        _id: 'prod-003',
        id: 'prod-003',
        sku: 'CH-LOUNGE-03',
        name: 'Ghế Thư Giãn Bọc Da Cognac',
        slug: 'ghe-thu-gian-boc-da-cognac',
        categoryId: 'cat-03',
        categoryName: 'Ghế thư giãn & Ghế ăn',
        roomIds: ['living-room', 'bedroom'],
        roomNames: ['Phòng khách', 'Phòng ngủ'],
        price: 9800000,
        salePrice: null,
        stockQuantity: 0,
        thumbnail: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop'],
        description: 'Ghế bành đơn bọc da công nghiệp Microfiber màu Cognac ấm cúng, thiết kế công thái học nâng đỡ lưng.',
        dimensions: { length: 85, width: 80, height: 95, weight: 18 },
        materials: ['Da Microfiber', 'Chân kim loại sơn tĩnh điện'],
        colors: ['Nâu Cognac', 'Đen'],
        averageRating: 4.9,
        totalReviews: 35,
        stockStatus: 'out_of_stock',
        status: 'Đang kinh doanh',
        isFeatured: true,
        file3DUrl: undefined,
        has3DModel: false,
        createdAt: '15/09/2026',
      },
      {
        _id: 'prod-004',
        id: 'prod-004',
        sku: 'BD-OAK-04',
        name: 'Giường Ngủ Gỗ Sồi King Size',
        slug: 'giuong-ngu-go-soi-king-size',
        categoryId: 'cat-04',
        categoryName: 'Giường ngủ & Nệm',
        roomIds: ['bedroom'],
        roomNames: ['Phòng ngủ'],
        price: 24000000,
        salePrice: null,
        stockQuantity: 8,
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'],
        description: 'Giường ngủ kích thước 1m8 x 2m bằng chất liệu gỗ sồi Mỹ tự nhiên, vạt giường thanh gỗ chịu lực tới 500kg.',
        dimensions: { length: 215, width: 195, height: 110, weight: 75 },
        materials: ['Gỗ sồi tự nhiên'],
        colors: ['Màu gỗ sồi sáng', 'Màu nâu óc chó'],
        averageRating: 4.9,
        totalReviews: 51,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: 'https://assets.livora.vn/models/3d/bd-oak-04.glb',
        has3DModel: true,
        createdAt: '18/09/2026',
      },
      {
        _id: 'prod-005',
        id: 'prod-005',
        sku: 'LT-PENDANT-05',
        name: 'Đèn Thả Trần Đồng Thau Cổ Điển',
        slug: 'den-tha-tran-dong-thau-co-dien',
        categoryId: 'cat-06',
        categoryName: 'Đèn trang trí & Chiếu sáng',
        roomIds: ['dining-room', 'living-room'],
        roomNames: ['Phòng ăn', 'Phòng khách'],
        price: 3450000,
        salePrice: null,
        stockQuantity: 42,
        thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'],
        description: 'Đèn thả trần hình nón chất liệu đồng thau mờ sang trọng, đui E27 ánh sáng vàng ấm 3000K.',
        dimensions: { length: 35, width: 35, height: 40, weight: 3.5 },
        materials: ['Đồng thau nguyên khối', 'Dây cáp bọc dù'],
        colors: ['Đồng vàng xước', 'Đen mờ'],
        averageRating: 4.5,
        totalReviews: 18,
        stockStatus: 'in_stock',
        status: 'ngưng kinh doanh',
        isFeatured: false,
        file3DUrl: undefined,
        has3DModel: false,
        createdAt: '20/09/2026',
      },
      {
        _id: 'prod-006',
        id: 'prod-006',
        sku: 'WB-SLIDE-06',
        name: 'Tủ Quần Áo Cửa Lùa Gỗ Công Nghiệp',
        slug: 'tu-quan-ao-cua-lua-go-cong-nghiep',
        categoryId: 'cat-05',
        categoryName: 'Tủ quần áo & Tủ lưu trữ',
        roomIds: ['bedroom'],
        roomNames: ['Phòng ngủ'],
        price: 14200000,
        salePrice: 12900000,
        stockQuantity: 11,
        thumbnail: 'https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop'],
        description: 'Tủ áo 2 cánh lùa hiện đại tiết kiệm diện tích mở cửa, phủ Melamine chống trầy xước cao cấp.',
        dimensions: { length: 180, width: 60, height: 210, weight: 90 },
        materials: ['Gỗ MDF lõi xanh chống ẩm', 'Ray trượt giảm chấn Hafele'],
        colors: ['Vân gỗ sồi phối trắng', 'Xám xi măng'],
        averageRating: 4.6,
        totalReviews: 24,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: 'https://assets.livora.vn/models/3d/wb-slide-06.glb',
        has3DModel: true,
        createdAt: '22/09/2026',
      },
      {
        _id: 'prod-007',
        id: 'prod-007',
        sku: 'RG-WOOL-07',
        name: 'Thảm Trải Sàn Len Dệt Tự Nhiên Scandinavia',
        slug: 'tham-trai-san-len-det-tu-nhien-scandinavia',
        categoryId: 'cat-07',
        categoryName: 'Thảm trải sàn',
        roomIds: ['living-room', 'bedroom'],
        roomNames: ['Phòng khách', 'Phòng ngủ'],
        price: 4800000,
        salePrice: null,
        stockQuantity: 19,
        thumbnail: 'https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop'],
        description: 'Thảm dệt tay từ 100% sợi len cừu tự nhiên mềm mại, họa tiết hình học Bắc Âu thanh nhã.',
        dimensions: { length: 230, width: 160, height: 1.5, weight: 8.5 },
        materials: ['Sợi len tự nhiên', 'Đế dệt sợi đay'],
        colors: ['Trắng kem hoa văn xám', 'Be cát'],
        averageRating: 4.7,
        totalReviews: 31,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: undefined,
        has3DModel: false,
        createdAt: '23/09/2026',
      },
      {
        _id: 'prod-008',
        id: 'prod-008',
        sku: 'MR-ARCH-08',
        name: 'Gương Đứng Toàn Thân Vòm Gỗ Tự Nhiên',
        slug: 'guong-dung-toan-than-vom-go-tu-nhien',
        categoryId: 'cat-08',
        categoryName: 'Gương & Phụ kiện trang trí',
        roomIds: ['bedroom', 'living-room'],
        roomNames: ['Phòng ngủ', 'Phòng khách'],
        price: 2950000,
        salePrice: null,
        stockQuantity: 14,
        thumbnail: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80'],
        description: 'Gương toàn thân dáng vòm Arch cong mềm mại, viền gỗ sồi nguyên khối bo góc nghệ thuật.',
        dimensions: { length: 60, width: 4, height: 170, weight: 14 },
        materials: ['Kính tráng bạc Bỉ 5mm', 'Khung gỗ sồi'],
        colors: ['Gỗ tự nhiên', 'Sơn đen mờ'],
        averageRating: 4.8,
        totalReviews: 27,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: 'https://assets.livora.vn/models/3d/mr-arch-08.glb',
        has3DModel: true,
        createdAt: '25/09/2026',
      },
      {
        _id: 'prod-009',
        id: 'prod-009',
        sku: 'CB-OAK-09',
        name: 'Tủ Kệ Tivi Gỗ Sồi Bắc Âu 1m8',
        slug: 'tu-ke-tivi-go-soi-bac-au-1m8',
        categoryId: 'cat-10',
        categoryName: 'Tủ búp phê & Kệ TV',
        roomIds: ['living-room'],
        roomNames: ['Phòng khách'],
        price: 8900000,
        salePrice: null,
        stockQuantity: 7,
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
        description: 'Kệ TV tối giản với 3 ngăn kéo giấu ray mở êm ái, lỗ luồn dây cáp thông minh mặt sau.',
        dimensions: { length: 180, width: 42, height: 48, weight: 38 },
        materials: ['Gỗ sồi tự nhiên', 'Ray kéo giảm chấn'],
        colors: ['Gỗ sồi sáng'],
        averageRating: 4.6,
        totalReviews: 19,
        stockStatus: 'in_stock',
        status: 'Đang kinh doanh',
        isFeatured: false,
        file3DUrl: undefined,
        has3DModel: false,
        createdAt: '26/09/2026',
      },
      {
        _id: 'prod-010',
        id: 'prod-010',
        sku: 'TW-EGYPT-10',
        name: 'Bộ Khăn Tắm Cotton Cao Cấp 4 Món',
        slug: 'bo-khan-tam-cotton-cao-cap-4-mon',
        categoryId: 'cat-11',
        categoryName: 'Phụ kiện phòng tắm & Khăn',
        roomIds: ['bathroom'],
        roomNames: ['Phòng tắm'],
        price: 850000,
        salePrice: null,
        stockQuantity: 0,
        thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'],
        description: 'Bộ khăn dệt từ 100% sợi bông Cotton Ai Cập mật độ 650 GSM siêu dày mịn và thấm hút nước vượt trội.',
        dimensions: { length: 140, width: 70, height: 1, weight: 1.2 },
        materials: ['100% Cotton Ai Cập'],
        colors: ['Trắng tinh khiết', 'Xám xi măng'],
        averageRating: 4.4,
        totalReviews: 12,
        stockStatus: 'out_of_stock',
        status: 'ngưng kinh doanh',
        isFeatured: false,
        file3DUrl: undefined,
        has3DModel: false,
        createdAt: '27/09/2026',
      },
    ];

    // Seed additional items up to 348 to match exact reported metrics:
    // Target metrics:
    // Total = 348
    // Active (Đang kinh doanh) = 312
    // Inactive (ngưng kinh doanh) = 36
    // Out of stock = 24
    // Has 3D = 86
    const currentTotal = catalog.length; // 10
    const needed = 348 - currentTotal; // 338

    // Currently in first 10:
    // Active: 8
    // Inactive: 2
    // Out of stock: 2 (prod-003, prod-010)
    // Has 3D: 5 (prod-001, prod-002, prod-004, prod-006, prod-008)

    let neededActive = 312 - 8; // 304
    let neededInactive = 36 - 2; // 34
    let neededOutOfStock = 24 - 2; // 22
    let needed3D = 86 - 5; // 81

    const categoryKeys = [
      'cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05',
      'cat-06', 'cat-07', 'cat-08', 'cat-09', 'cat-10',
      'cat-11', 'cat-12', 'cat-13', 'cat-14',
    ];
    const roomKeys = ['living-room', 'bedroom', 'kitchen', 'dining-room', 'bathroom'];

    for (let i = 1; i <= needed; i++) {
      const idx = currentTotal + i;
      const sku = `LIV-PROD-${idx.toString().padStart(3, '0')}`;
      const catId = categoryKeys[(i - 1) % categoryKeys.length];
      const roomId = roomKeys[(i - 1) % roomKeys.length];

      const isActive = neededActive > 0 ? true : false;
      if (isActive) neededActive--;
      else neededInactive--;

      const isOutOfStock = neededOutOfStock > 0 && i % 15 === 0;
      if (isOutOfStock) neededOutOfStock--;

      const stockQuantity = isOutOfStock ? 0 : 5 + ((i * 7) % 45);
      const stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';

      const has3D = needed3D > 0 && (i % 4 === 0 || needed3D > needed - i);
      if (has3D) needed3D--;

      const price = 1500000 + ((i * 350000) % 25000000);
      const hasDiscount = i % 5 === 0;
      const salePrice = hasDiscount ? Math.round(price * 0.88 / 10000) * 10000 : null;

      catalog.push({
        _id: `prod-${idx.toString().padStart(3, '0')}`,
        id: `prod-${idx.toString().padStart(3, '0')}`,
        sku,
        name: `Sản phẩm Nội thất Maison ${sku}`,
        slug: `san-pham-noi-that-maison-${sku.toLowerCase()}`,
        categoryId: catId,
        categoryName: this.resolveCategoryName(catId),
        roomIds: [roomId],
        roomNames: [this.resolveRoomName(roomId)],
        price,
        salePrice,
        stockQuantity,
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
        description: `Mẫu nội thất cao cấp của bộ sưu tập Livora Maison Atelier, tối ưu cho ${this.resolveRoomName(roomId)}.`,
        dimensions: { length: 120, width: 60, height: 75, weight: 25 },
        materials: ['Gỗ tự nhiên', 'Kim loại mạ'],
        colors: ['Tự nhiên', 'Xám', 'Trắng'],
        averageRating: 4.5 + ((i % 5) * 0.1),
        totalReviews: 5 + (i % 50),
        stockStatus,
        status: isActive ? 'Đang kinh doanh' : 'ngưng kinh doanh',
        isFeatured: i % 12 === 0,
        file3DUrl: has3D ? `https://assets.livora.vn/models/3d/${sku.toLowerCase()}.glb` : undefined,
        has3DModel: has3D,
        createdAt: '01/10/2026',
      });
    }

    return catalog;
  }
}
