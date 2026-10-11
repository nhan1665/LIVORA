import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Category } from './category';
import { CategoryService } from './category.service';
import { of } from 'rxjs';

describe('Category Component', () => {
  let component: Category;
  let fixture: ComponentFixture<Category>;
  let categoryService: CategoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Category],
      providers: [CategoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(Category);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService);
    fixture.detectChanges();
  });

  it('should create the category component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with categories from service', () => {
    expect(component.categories().length).toBeGreaterThan(0);
    expect(component.totalItems()).toBe(14);
  });

  it('should filter categories when search draft changes', () => {
    component.searchDraft = 'CAT-SOFA';
    component.onSearchChange();
    fixture.detectChanges();

    expect(component.categories().length).toBe(1);
    expect(component.categories()[0].code).toBe('CAT-SOFA');
  });

  it('should filter categories by status', () => {
    component.statusDraft = 'inactive';
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.categories().length).toBe(2);
    expect(component.categories().every((c) => !c.isActive)).toBe(true);
  });

  it('should reset filters properly', () => {
    component.searchDraft = 'CAT-SOFA';
    component.statusDraft = 'inactive';
    component.onFilterChange();
    expect(component.isFiltering()).toBe(true);

    component.resetFilters();
    fixture.detectChanges();

    expect(component.searchDraft).toBe('');
    expect(component.statusDraft).toBe('all');
    expect(component.isFiltering()).toBe(false);
    expect(component.categories().length).toBe(10);
  });

  it('should open and close create modal', () => {
    expect(component.isModalOpen()).toBe(false);

    component.openCreateModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.formDraft.code).toBe('');

    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });

  it('should open edit modal with prefilled data', () => {
    const target = component.categories()[0];
    component.openEditModal(target);

    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    expect(component.formDraft.code).toBe(target.code);
    expect(component.formDraft.name).toBe(target.name);
    expect(component.formDraft.slug).toBe(target.slug);
  });

  it('should validate required fields when saving category', () => {
    component.openCreateModal();
    component.formDraft.code = '';
    component.formDraft.name = '';

    component.saveCategory();
    expect(component.errorMessage()).toContain('mã loại sản phẩm');

    component.formDraft.code = 'CAT-NEW';
    component.saveCategory();
    expect(component.errorMessage()).toContain('tên loại sản phẩm');
  });

  it('should toggle selection of items', () => {
    const firstId = component.categories()[0].id;
    expect(component.isSelected(firstId)).toBe(false);

    component.toggleSelect(firstId);
    expect(component.isSelected(firstId)).toBe(true);

    component.toggleSelect(firstId);
    expect(component.isSelected(firstId)).toBe(false);
  });

  it('should toggle select all items', () => {
    expect(component.isAllSelected()).toBe(false);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(false);
  });
});
