import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CategoryDraft,
  CategoryListQuery,
  CategoryListResponse,
  CategoryStatusFilter,
  ProductCategory,
} from './category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly categories$ = new BehaviorSubject<ProductCategory[]>(this.getInitialCategories());

  /**
   * Retrieves all categories as an Observable.
   */
  getAllCategories(): Observable<ProductCategory[]> {
    return this.categories$.asObservable();
  }

  /**
   * Queries categories with searching, filtering, and pagination.
   */
  queryCategories(query: CategoryListQuery): Observable<CategoryListResponse> {
    return this.categories$.pipe(
      map((categories) => {
        let filtered = [...categories];

        // Search filter (keyword against code, name, slug)
        if (query.search && query.search.trim()) {
          const term = query.search.trim().toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.code.toLowerCase().includes(term) ||
              c.name.toLowerCase().includes(term) ||
              c.slug.toLowerCase().includes(term) ||
              c.description.toLowerCase().includes(term)
          );
        }

        // Status filter
        if (query.status && query.status !== 'all') {
          const wantActive = query.status === 'active';
          filtered = filtered.filter((c) => c.isActive === wantActive);
        }

        // Sort by display order
        filtered.sort((a, b) => a.displayOrder - b.displayOrder);

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const currentPage = Math.min(Math.max(1, query.page), totalPages);

        const startIndex = (currentPage - 1) * query.pageSize;
        const items = filtered.slice(startIndex, startIndex + query.pageSize);

        const activeCount = categories.filter((c) => c.isActive).length;
        const inactiveCount = categories.filter((c) => !c.isActive).length;

        return {
          items,
          page: currentPage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
          activeCount,
          inactiveCount,
        };
      })
    );
  }

  /**
   * Finds a category by its ID or code.
   */
  getCategoryById(idOrCode: string): Observable<ProductCategory | null> {
    return this.categories$.pipe(
      map((list) => list.find((c) => c.id === idOrCode || c.code === idOrCode || c._id === idOrCode) || null)
    );
  }

  /**
   * Adds a new category.
   */
  createCategory(draft: CategoryDraft): Observable<ProductCategory> {
    const list = this.categories$.getValue();
    const newId = `cat-${Date.now()}`;
    const newCategory: ProductCategory = {
      _id: newId,
      id: newId,
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      slug: draft.slug ? draft.slug.trim().toLowerCase() : this.slugify(draft.name),
      parentId: draft.parentId || null,
      description: draft.description ? draft.description.trim() : '',
      thumbnail: draft.thumbnail || '/images/categories/living-room/sofas.png',
      displayOrder: draft.displayOrder || list.length + 1,
      isActive: draft.isActive,
      productCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [newCategory, ...list];
    this.categories$.next(nextList);
    return of(newCategory);
  }

  /**
   * Updates an existing category.
   */
  updateCategory(id: string, draft: Partial<CategoryDraft>): Observable<ProductCategory> {
    const list = this.categories$.getValue();
    const index = list.findIndex((c) => c.id === id || c._id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found.`);
    }

    const current = list[index];
    const updated: ProductCategory = {
      ...current,
      code: draft.code !== undefined ? draft.code.trim().toUpperCase() : current.code,
      name: draft.name !== undefined ? draft.name.trim() : current.name,
      slug: draft.slug !== undefined ? draft.slug.trim().toLowerCase() : current.slug,
      parentId: draft.parentId !== undefined ? draft.parentId : current.parentId,
      description: draft.description !== undefined ? draft.description.trim() : current.description,
      thumbnail: draft.thumbnail !== undefined ? draft.thumbnail : current.thumbnail,
      displayOrder: draft.displayOrder !== undefined ? draft.displayOrder : current.displayOrder,
      isActive: draft.isActive !== undefined ? draft.isActive : current.isActive,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.categories$.next(nextList);
    return of(updated);
  }

  /**
   * Toggles category active status.
   */
  toggleStatus(id: string): Observable<ProductCategory> {
    const list = this.categories$.getValue();
    const index = list.findIndex((c) => c.id === id || c._id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found.`);
    }

    const current = list[index];
    const updated: ProductCategory = {
      ...current,
      isActive: !current.isActive,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.categories$.next(nextList);
    return of(updated);
  }

  /**
   * Deletes a category.
   */
  deleteCategory(id: string): Observable<boolean> {
    const list = this.categories$.getValue();
    const filtered = list.filter((c) => c.id !== id && c._id !== id);
    this.categories$.next(filtered);
    return of(true);
  }

  /**
   * Helper to generate a slug from a Vietnamese name.
   */
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
   * Fixtures matching Figma table (14 categories).
   */
  private getInitialCategories(): ProductCategory[] {
    return [
      {
        _id: 'cat-01',
        id: 'cat-01',
        code: 'CAT-SOFA',
        name: 'Sofa & Armchair',
        slug: 'sofas',
        description: 'Tạo điểm nhấn ấm cúng và thoải mái cho phòng khách với các mẫu sofa cao cấp từ phong cách Bắc Âu tối giản đến hiện đại.',
        thumbnail: '/images/categories/living-room/sofas.png',
        displayOrder: 1,
        isActive: true,
        productCount: 48,
        createdAt: '12/08/2026',
      },
      {
        _id: 'cat-02',
        id: 'cat-02',
        code: 'CAT-TABLE',
        name: 'Bàn trà & Bàn ăn',
        slug: 'coffee-tables',
        description: 'Bàn trà sang trọng, gọn gàng và bàn ăn gia đình bền đẹp, hoàn thiện nét thẩm mỹ tinh tế cho không gian sống.',
        thumbnail: '/images/categories/living-room/coffee-tables.png',
        displayOrder: 2,
        isActive: true,
        productCount: 36,
        createdAt: '12/08/2026',
      },
      {
        _id: 'cat-03',
        id: 'cat-03',
        code: 'CAT-CHAIR',
        name: 'Ghế thư giãn & Ghế ăn',
        slug: 'chairs',
        description: 'Ghế bành thư giãn thiết kế công thái học và ghế ăn thanh lịch, tối ưu trải nghiệm ngồi và thẩm mỹ.',
        thumbnail: '/images/categories/living-room/armchairs.png',
        displayOrder: 3,
        isActive: true,
        productCount: 52,
        createdAt: '12/08/2026',
      },
      {
        _id: 'cat-04',
        id: 'cat-04',
        code: 'CAT-BED',
        name: 'Giường ngủ & Nệm',
        slug: 'beds',
        description: 'Khung giường gỗ tinh tế và nệm lò xo túi êm ái, nâng niu giấc ngủ ngon cho mọi gia đình.',
        thumbnail: '/images/categories/bedroom/beds.png',
        displayOrder: 4,
        isActive: true,
        productCount: 24,
        createdAt: '14/08/2026',
      },
      {
        _id: 'cat-05',
        id: 'cat-05',
        code: 'CAT-WARDROBE',
        name: 'Tủ quần áo & Tủ lưu trữ',
        slug: 'wardrobes',
        description: 'Giải pháp lưu trữ thông minh với các mẫu tủ áo cửa trượt hiện đại và ngăn kéo đa năng.',
        thumbnail: '/images/categories/bedroom/wardrobes.png',
        displayOrder: 5,
        isActive: true,
        productCount: 18,
        createdAt: '14/08/2026',
      },
      {
        _id: 'cat-06',
        id: 'cat-06',
        code: 'CAT-LIGHT',
        name: 'Đèn trang trí & Chiếu sáng',
        slug: 'lighting',
        description: 'Hệ thống đèn trần, đèn bàn và đèn cây với ánh sáng dịu nhẹ, tạo bầu không khí ấm áp.',
        thumbnail: '/images/categories/bedroom/lighting.png',
        displayOrder: 6,
        isActive: true,
        productCount: 42,
        createdAt: '15/08/2026',
      },
      {
        _id: 'cat-07',
        id: 'cat-07',
        code: 'CAT-RUG',
        name: 'Thảm trải sàn',
        slug: 'rugs',
        description: 'Thảm dệt sợi len tự nhiên cao cấp, tạo cảm giác êm chân và tiêu âm hiệu quả.',
        thumbnail: '/images/categories/living-room/rugs.png',
        displayOrder: 7,
        isActive: true,
        productCount: 16,
        createdAt: '18/08/2026',
      },
      {
        _id: 'cat-08',
        id: 'cat-08',
        code: 'CAT-MIRROR',
        name: 'Gương & Phụ kiện trang trí',
        slug: 'mirrors',
        description: 'Gương viền gỗ nghệ thuật và phụ kiện decor sang trọng, khuếch tán ánh sáng tự nhiên.',
        thumbnail: '/images/categories/bathroom/mirrors.png',
        displayOrder: 8,
        isActive: true,
        productCount: 22,
        createdAt: '20/08/2026',
      },
      {
        _id: 'cat-09',
        id: 'cat-09',
        code: 'CAT-BEDDING',
        name: 'Bộ chăn ga gối',
        slug: 'bedding',
        description: 'Chất liệu vải cotton satin 100% thoáng khí mềm mượt, mang lại giấc ngủ trọn vẹn.',
        thumbnail: '/images/categories/bedroom/bedding.png',
        displayOrder: 9,
        isActive: true,
        productCount: 28,
        createdAt: '21/08/2026',
      },
      {
        _id: 'cat-10',
        id: 'cat-10',
        code: 'CAT-CABINET',
        name: 'Tủ búp phê & Kệ TV',
        slug: 'sideboards',
        description: 'Kệ tivi phòng khách và tủ búp phê phòng ăn tinh tế, hoàn hảo cho việc lưu trữ và trưng bày.',
        thumbnail: '/images/categories/dining-room/sideboards.png',
        displayOrder: 10,
        isActive: true,
        productCount: 19,
        createdAt: '22/08/2026',
      },
      {
        _id: 'cat-11',
        id: 'cat-11',
        code: 'CAT-BATH',
        name: 'Phụ kiện phòng tắm & Khăn',
        slug: 'towels',
        description: 'Khăn bông cotton Ai Cập và phụ kiện phòng tắm cao cấp phong cách spa thư giãn.',
        thumbnail: '/images/categories/bathroom/towels.png',
        displayOrder: 11,
        isActive: false,
        productCount: 14,
        createdAt: '25/08/2026',
      },
      {
        _id: 'cat-12',
        id: 'cat-12',
        code: 'CAT-OFFICE',
        name: 'Bàn ghế làm việc',
        slug: 'office',
        description: 'Bàn làm việc thông minh và ghế công thái học chuẩn Ergonomic cho không gian làm việc tại nhà.',
        thumbnail: '/images/categories/kitchen/chairs.png',
        displayOrder: 12,
        isActive: true,
        productCount: 12,
        createdAt: '28/08/2026',
      },
      {
        _id: 'cat-13',
        id: 'cat-13',
        code: 'CAT-OUTDOOR',
        name: 'Nội thất ban công ngoài trời',
        slug: 'outdoor',
        description: 'Bàn ghế ban công chịu thời tiết bền bỉ, kết hợp cây cảnh decor cho góc chill xanh mát.',
        thumbnail: '/images/categories/kitchen/dining-tables.png',
        displayOrder: 13,
        isActive: false,
        productCount: 9,
        createdAt: '01/09/2026',
      },
      {
        _id: 'cat-14',
        id: 'cat-14',
        code: 'CAT-DECOR',
        name: 'Tranh & Lọ hoa nghệ thuật',
        slug: 'decor',
        description: 'Bộ sưu tập tranh nghệ thuật tối giản và bình gốm thủ công tạo nét chấm phá duy mỹ.',
        thumbnail: '/images/categories/bedroom/blankets.png',
        displayOrder: 14,
        isActive: true,
        productCount: 8,
        createdAt: '05/09/2026',
      },
    ];
  }
}
