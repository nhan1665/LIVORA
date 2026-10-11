import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from './product';
import { ProductService } from './product.service';

describe('Product Component', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;
  let productService: ProductService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [ProductService],
    }).compileComponents();

    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    fixture.detectChanges();
  });

  it('should create the product component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with products and summary metrics', () => {
    expect(component.products().length).toBe(10);
    expect(component.totalItems()).toBe(348);
    expect(component.metrics().totalProducts).toBe(348);
    expect(component.metrics().activeProducts).toBe(312);
    expect(component.metrics().outOfStockProducts).toBe(24);
    expect(component.metrics().has3DCount).toBe(86);
  });

  it('should filter products when searching by SKU or name', () => {
    component.searchDraft = 'SOFA-NORDIC-01';
    component.onSearchChange();
    fixture.detectChanges();

    expect(component.products().length).toBe(1);
    expect(component.products()[0].sku).toBe('SOFA-NORDIC-01');
  });

  it('should filter products by 3D AR presence', () => {
    component.has3DDraft = 'has_3d';
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.products().every((p) => p.has3DModel)).toBe(true);
  });

  it('should filter products by status', () => {
    component.statusDraft = 'out_of_stock';
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.products().every((p) => p.stockQuantity === 0)).toBe(true);
  });

  it('should reset filters properly', () => {
    component.searchDraft = 'SOFA';
    component.statusDraft = 'out_of_stock';
    component.has3DDraft = 'has_3d';
    component.onFilterChange();
    expect(component.isFiltering()).toBe(true);

    component.resetFilters();
    fixture.detectChanges();

    expect(component.searchDraft).toBe('');
    expect(component.statusDraft).toBe('all');
    expect(component.has3DDraft).toBe('all');
    expect(component.isFiltering()).toBe(false);
    expect(component.products().length).toBe(10);
  });

  it('should open create modal with default values and allow tab switching', () => {
    expect(component.isModalOpen()).toBe(false);

    component.openCreateModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.activeModalTab()).toBe('general');

    component.setModalTab('dimensions');
    expect(component.activeModalTab()).toBe('dimensions');

    component.setModalTab('media');
    expect(component.activeModalTab()).toBe('media');

    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });

  it('should open edit modal with selected product details', () => {
    const item = component.products()[0];
    component.openEditModal(item);

    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    expect(component.formDraft.sku).toBe(item.sku);
    expect(component.formDraft.name).toBe(item.name);
  });

  it('should validate required fields when saving product', () => {
    component.openCreateModal();
    component.formDraft.sku = '';
    component.formDraft.name = '';

    component.saveProduct();
    expect(component.errorMessage()).toContain('mã sản phẩm (SKU)');

    component.formDraft.sku = 'NEW-SKU-01';
    component.saveProduct();
    expect(component.errorMessage()).toContain('tên sản phẩm');

    component.formDraft.name = 'Bàn ăn cao cấp';
    component.formDraft.price = 0;
    component.saveProduct();
    expect(component.errorMessage()).toContain('Giá bán');
  });

  it('should toggle selection of product items and select all', () => {
    const firstId = component.products()[0].id;
    expect(component.isSelected(firstId)).toBe(false);

    component.toggleSelect(firstId);
    expect(component.isSelected(firstId)).toBe(true);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(false);
  });
});
