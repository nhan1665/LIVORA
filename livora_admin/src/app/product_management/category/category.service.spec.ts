import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from './category.service';
import { CategoryDraft, CategoryListQuery } from './category.model';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryService],
    });
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return initial 14 categories matching Figma list', async () => {
    const list = await firstValueFrom(service.getAllCategories());
    expect(list.length).toBe(14);
    expect(list[0].code).toBe('CAT-SOFA');
    expect(list[0].name).toBe('Sofa & Armchair');
    expect(list[0].slug).toBe('sofas');
  });

  it('should query categories with pagination', async () => {
    const query: CategoryListQuery = {
      search: '',
      status: 'all',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryCategories(query));
    expect(res.totalItems).toBe(14);
    expect(res.totalPages).toBe(2);
    expect(res.items.length).toBe(10);
    expect(res.activeCount).toBe(12);
    expect(res.inactiveCount).toBe(2);
  });

  it('should filter categories by search keyword', async () => {
    const query: CategoryListQuery = {
      search: 'sofa',
      status: 'all',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryCategories(query));
    expect(res.totalItems).toBe(1);
    expect(res.items[0].code).toBe('CAT-SOFA');
  });

  it('should filter categories by active status', async () => {
    const query: CategoryListQuery = {
      search: '',
      status: 'inactive',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryCategories(query));
    expect(res.totalItems).toBe(2);
    expect(res.items.every((c) => !c.isActive)).toBe(true);
  });

  it('should slugify Vietnamese text properly', () => {
    const slug = service.slugify('Bàn trà & Kệ TV Đẹp');
    expect(slug).toBe('ban-tra-ke-tv-dep');
  });

  it('should create a new category', async () => {
    const draft: CategoryDraft = {
      code: 'CAT-TEST',
      name: 'Nội thất phòng thử nghiệm',
      slug: 'noi-that-test',
      displayOrder: 15,
      isActive: true,
      description: 'Mô tả thử nghiệm',
    };
    const created = await firstValueFrom(service.createCategory(draft));
    expect(created.code).toBe('CAT-TEST');
    expect(created.productCount).toBe(0);

    const list = await firstValueFrom(service.getAllCategories());
    expect(list.length).toBe(15);
  });

  it('should update an existing category', async () => {
    const updated = await firstValueFrom(
      service.updateCategory('cat-01', { name: 'Sofa & Sofa Giường Cao Cấp' })
    );
    expect(updated.name).toBe('Sofa & Sofa Giường Cao Cấp');

    const found = await firstValueFrom(service.getCategoryById('cat-01'));
    expect(found?.name).toBe('Sofa & Sofa Giường Cao Cấp');
  });

  it('should toggle active status of category', async () => {
    const foundBefore = await firstValueFrom(service.getCategoryById('cat-01'));
    expect(foundBefore?.isActive).toBe(true);

    const toggled = await firstValueFrom(service.toggleStatus('cat-01'));
    expect(toggled.isActive).toBe(false);

    const foundAfter = await firstValueFrom(service.getCategoryById('cat-01'));
    expect(foundAfter?.isActive).toBe(false);
  });

  it('should delete a category', async () => {
    await firstValueFrom(service.deleteCategory('cat-01'));
    const list = await firstValueFrom(service.getAllCategories());
    expect(list.length).toBe(13);
    const deleted = await firstValueFrom(service.getCategoryById('cat-01'));
    expect(deleted).toBeNull();
  });
});
