import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProductService } from './product.service';
import { ProductDraft, ProductListQuery } from './product.model';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService],
    });
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate initial catalog with 348 products and accurate metrics', async () => {
    const list = await firstValueFrom(service.getAllProducts());
    expect(list.length).toBe(348);

    const metrics = await firstValueFrom(service.getSummaryMetrics());
    expect(metrics.totalProducts).toBe(348);
    expect(metrics.activeProducts).toBe(312);
    expect(metrics.outOfStockProducts).toBe(24);
    expect(metrics.has3DCount).toBe(86);
  });

  it('should query products with pagination', async () => {
    const query: ProductListQuery = {
      search: '',
      categoryId: 'all',
      status: 'all',
      has3D: 'all',
      sortBy: 'newest',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryProducts(query));
    expect(res.totalItems).toBe(348);
    expect(res.totalPages).toBe(35);
    expect(res.items.length).toBe(10);
  });

  it('should filter products by search term', async () => {
    const query: ProductListQuery = {
      search: 'SOFA-NORDIC-01',
      categoryId: 'all',
      status: 'all',
      has3D: 'all',
      sortBy: 'newest',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryProducts(query));
    expect(res.totalItems).toBe(1);
    expect(res.items[0].sku).toBe('SOFA-NORDIC-01');
    expect(res.items[0].name).toBe('Sofa Góc L Nordic Modern');
  });

  it('should filter products by 3D AR presence', async () => {
    const query: ProductListQuery = {
      search: '',
      categoryId: 'all',
      status: 'all',
      has3D: 'has_3d',
      sortBy: 'newest',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryProducts(query));
    expect(res.totalItems).toBe(86);
    expect(res.items.every((p) => p.has3DModel)).toBe(true);
  });

  it('should filter products by out of stock status', async () => {
    const query: ProductListQuery = {
      search: '',
      categoryId: 'all',
      status: 'out_of_stock',
      has3D: 'all',
      sortBy: 'newest',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryProducts(query));
    expect(res.totalItems).toBe(24);
    expect(res.items.every((p) => p.stockQuantity === 0)).toBe(true);
  });

  it('should sort products by price ascending', async () => {
    const query: ProductListQuery = {
      search: '',
      categoryId: 'all',
      status: 'all',
      has3D: 'all',
      sortBy: 'price_asc',
      page: 1,
      pageSize: 10,
    };
    const res = await firstValueFrom(service.queryProducts(query));
    for (let i = 1; i < res.items.length; i++) {
      const prevPrice = res.items[i - 1].salePrice ?? res.items[i - 1].price;
      const curPrice = res.items[i].salePrice ?? res.items[i].price;
      expect(curPrice).toBeGreaterThanOrEqual(prevPrice);
    }
  });

  it('should create a new product', async () => {
    const draft: ProductDraft = {
      sku: 'TEST-SKU-99',
      name: 'Bàn Trà Kiểm Thử Cao Cấp',
      categoryId: 'cat-02',
      roomIds: ['living-room'],
      price: 5000000,
      salePrice: 4500000,
      stockQuantity: 20,
      thumbnail: 'https://images.unsplash.com/test.jpg',
      images: ['https://images.unsplash.com/test.jpg'],
      description: 'Mô tả bàn trà kiểm thử',
      dimensions: { length: 100, width: 60, height: 45, weight: 15 },
      materials: ['Gỗ tần bì'],
      colors: ['Tự nhiên'],
      status: 'Đang kinh doanh',
      isFeatured: true,
      file3DUrl: 'https://assets.livora.vn/models/3d/test.glb',
    };

    const created = await firstValueFrom(service.createProduct(draft));
    expect(created.sku).toBe('TEST-SKU-99');
    expect(created.has3DModel).toBe(true);
    expect(created.stockStatus).toBe('in_stock');

    const total = await firstValueFrom(service.getAllProducts());
    expect(total.length).toBe(349);
  });

  it('should update an existing product', async () => {
    const updated = await firstValueFrom(
      service.updateProduct('prod-001', {
        name: 'Sofa Góc L Nordic Modern Luxury',
        price: 20000000,
      })
    );
    expect(updated.name).toBe('Sofa Góc L Nordic Modern Luxury');
    expect(updated.price).toBe(20000000);

    const found = await firstValueFrom(service.getProductById('prod-001'));
    expect(found?.name).toBe('Sofa Góc L Nordic Modern Luxury');
  });

  it('should toggle operational status', async () => {
    const initial = await firstValueFrom(service.getProductById('prod-001'));
    expect(initial?.status).toBe('Đang kinh doanh');

    const toggled = await firstValueFrom(service.toggleStatus('prod-001'));
    expect(toggled.status).toBe('ngưng kinh doanh');

    const reToggled = await firstValueFrom(service.toggleStatus('prod-001'));
    expect(reToggled.status).toBe('Đang kinh doanh');
  });

  it('should delete a product', async () => {
    await firstValueFrom(service.deleteProduct('prod-002'));
    const found = await firstValueFrom(service.getProductById('prod-002'));
    expect(found).toBeNull();
  });
});
