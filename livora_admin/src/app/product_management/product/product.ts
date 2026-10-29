import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Product3DFilter,
  ProductDraft,
  ProductItem,
  ProductListQuery,
  ProductListResponse,
  ProductSortOption,
  ProductStatusFilter,
  ProductSummaryMetrics,
} from './product.model';
import { ProductService } from './product.service';
import { CategoryService } from '../category/category.service';
import { RoomService } from '../../room_management/room/room.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.html',
  // Note: product.css is imported globally in styles.css to stay well below the 8kB angular component style budget
})
export class Product implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly roomService = inject(RoomService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 10;

  // State Signals
  readonly products = signal<ProductItem[]>([]);
  readonly loading = signal(true);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);

  readonly metrics = signal<ProductSummaryMetrics>({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    has3DCount: 0,
  });

  // Selected row IDs
  readonly selectedIds = signal<Set<string>>(new Set<string>());

  // Filters Drafts
  searchDraft = '';
  categoryDraft = 'all';
  statusDraft: ProductStatusFilter = 'all';
  has3DDraft: Product3DFilter = 'all';
  sortDraft: ProductSortOption = 'newest';

  // Active filters applied to query
  activeSearch = '';
  activeCategory = 'all';
  activeStatus: ProductStatusFilter = 'all';
  active3D: Product3DFilter = 'all';
  activeSort: ProductSortOption = 'newest';

  // Modal State
  readonly isModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingProductId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly activeModalTab = signal<'general' | 'dimensions' | 'media'>('general');

  // Input helpers for array values
  materialsInput = '';
  colorsInput = '';
  imagesInput = '';

  // Form Model
  formDraft: ProductDraft = {
    sku: '',
    name: '',
    slug: '',
    categoryId: '',
    roomIds: [],
    price: 0,
    salePrice: null,
    stockQuantity: 10,
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    images: [],
    description: '',
    dimensions: { length: 200, width: 90, height: 85, weight: 45 },
    materials: ['Vải nỉ cao cấp', 'Khung gỗ sồi'],
    colors: ['Xám tro', 'Be nhạt'],
    status: 'Đang kinh doanh',
    isFeatured: false,
    file3DUrl: '',
  };

  // Dynamic options loaded from MongoDB Atlas (Categories & Rooms collections)
  availableCategories: { id: string; code?: string; name: string; slug?: string }[] = [];
  availableRooms: { id: string; name: string; slug?: string }[] = [];

  // Helper chuyển đổi tiếng Việt có dấu sang không dấu
  removeVietnameseTones(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  // Lấy tiền tố mã loại sản phẩm (ví dụ "Giường ngủ" -> "GIUONG", "Sofa" -> "SOFA")
  getCategoryPrefix(cat: { id?: string; code?: string; name: string; slug?: string } | undefined): string {
    if (!cat) return 'SP';

    // 1. Nếu có mã riêng không phải tiền tố chung CAT-
    if (cat.code && !cat.code.toUpperCase().startsWith('CAT-')) {
      const cleaned = cat.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned) return cleaned;
    }

    // 2. Tách từ đầu tiên trong tên danh mục tiếng Việt (VD: "Giường ngủ" -> "GIUONG", "Bàn ăn" -> "BAN")
    if (cat.name) {
      const unsigned = this.removeVietnameseTones(cat.name).toUpperCase().trim();
      const firstWord = unsigned.split(/[\s,&-]+/)[0].replace(/[^A-Z0-9]/g, '');
      if (firstWord && firstWord.length >= 2) return firstWord;
    }

    // 3. Nếu mã có dạng CAT-SOFA -> lấy SOFA
    if (cat.code) {
      const stripped = cat.code.toUpperCase().replace(/^CAT[-_]/, '').replace(/[^A-Z0-9]/g, '');
      if (stripped) return stripped;
    }

    // 4. Lấy từ slug
    if (cat.slug) {
      return cat.slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    return 'SP';
  }

  // Tính toán số thứ tự tiếp theo XXX theo định dạng 3 chữ số (001, 002, ...)
  calculateNextSkuNumber(prefix: string): string {
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}-SP-?(\\d+)`, 'i');

    for (const p of this.products()) {
      if (p.sku) {
        const match = p.sku.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    return String(maxNum + 1).padStart(3, '0');
  }

  // Tự động sinh mã sản phẩm theo công thức [mã loại sản phẩm]-SP-XXX (ví dụ: GIUONG-SP001)
  generateSkuForSelectedCategory(): void {
    const selectedCat = this.availableCategories.find((c) => c.id === this.formDraft.categoryId);
    const prefix = this.getCategoryPrefix(selectedCat);
    const nextNum = this.calculateNextSkuNumber(prefix);
    this.formDraft.sku = `${prefix}-SP${nextNum}`;
  }

  onCategoryChange(): void {
    if (!this.isEditMode()) {
      this.generateSkuForSelectedCategory();
    }
  }

  regenerateSku(): void {
    this.generateSkuForSelectedCategory();
  }

  loadCategories(callback?: () => void): void {
    this.categoryService.getAllCategories().subscribe({
      next: (cats) => {
        if (Array.isArray(cats)) {
          this.availableCategories = cats.map((c) => ({
            id: c.id || (c as any)._id,
            code: c.code || (c.slug ? `CAT-${c.slug.toUpperCase()}` : 'CAT'),
            name: c.name,
            slug: c.slug,
          }));
          if (this.availableCategories.length > 0 && !this.formDraft.categoryId) {
            this.formDraft.categoryId = this.availableCategories[0].id;
          }
          this.cdr.markForCheck();
        }
        if (callback) callback();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh mục từ categories collection:', err);
        if (callback) callback();
      },
    });
  }

  loadRooms(callback?: () => void): void {
    this.roomService.getAllRooms().subscribe({
      next: (rooms) => {
        if (Array.isArray(rooms)) {
          this.availableRooms = rooms.map((r) => ({
            id: r.id || (r as any)._id,
            name: r.name,
            slug: r.slug,
          }));
          if (this.availableRooms.length > 0 && this.formDraft.roomIds.length === 0) {
            this.formDraft.roomIds = [this.availableRooms[0].id];
          }
          this.cdr.markForCheck();
        }
        if (callback) callback();
      },
      error: (err) => {
        console.error('Lỗi khi tải phòng từ rooms collection:', err);
        if (callback) callback();
      },
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadRooms();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const query: ProductListQuery = {
      search: this.activeSearch,
      categoryId: this.activeCategory,
      status: this.activeStatus,
      has3D: this.active3D,
      sortBy: this.activeSort,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.productService.queryProducts(query).subscribe({
      next: (res: ProductListResponse) => {
        this.products.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.metrics.set(res.metrics);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Filter actions
  onSearchChange(): void {
    this.activeSearch = this.searchDraft;
    this.currentPage.set(1);
    this.loadData();
  }

  clearSearch(): void {
    this.searchDraft = '';
    this.onSearchChange();
  }

  onFilterChange(): void {
    this.activeCategory = this.categoryDraft;
    this.activeStatus = this.statusDraft;
    this.active3D = this.has3DDraft;
    this.activeSort = this.sortDraft;
    this.currentPage.set(1);
    this.loadData();
  }

  resetFilters(): void {
    this.searchDraft = '';
    this.categoryDraft = 'all';
    this.statusDraft = 'all';
    this.has3DDraft = 'all';
    this.sortDraft = 'newest';

    this.activeSearch = '';
    this.activeCategory = 'all';
    this.activeStatus = 'all';
    this.active3D = 'all';
    this.activeSort = 'newest';

    this.currentPage.set(1);
    this.loadData();
  }

  isFiltering(): boolean {
    return (
      !!this.activeSearch ||
      this.activeCategory !== 'all' ||
      this.activeStatus !== 'all' ||
      this.active3D !== 'all' ||
      this.activeSort !== 'newest'
    );
  }

  // Pagination
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  visiblePageNumbers(): number[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    const maxVisible = 5;

    let start = Math.max(1, cur - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  paginationStartIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  paginationEndIndex(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  }

  // Row Selection
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  isAllSelected(): boolean {
    const list = this.products();
    if (list.length === 0) return false;
    return list.every((p) => this.selectedIds().has(p.id));
  }

  toggleSelectAll(): void {
    const list = this.products();
    const next = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      for (const p of list) {
        next.delete(p.id);
      }
    } else {
      for (const p of list) {
        next.add(p.id);
      }
    }
    this.selectedIds.set(next);
  }

  // Status Toggle
  toggleStatus(item: ProductItem): void {
    this.productService.toggleStatus(item.id).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  // Currency Formatter
  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val);
  }

  // Modal Handlers
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingProductId.set(null);
    this.errorMessage.set('');
    this.activeModalTab.set('general');

    this.formDraft = {
      sku: '',
      name: '',
      slug: '',
      categoryId: this.availableCategories[0]?.id || '',
      roomIds: this.availableRooms[0]?.id ? [this.availableRooms[0].id] : [],
      price: 0,
      salePrice: null,
      stockQuantity: 10,
      thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      images: [],
      description: '',
      dimensions: { length: 200, width: 90, height: 85, weight: 45 },
      materials: ['Vải nỉ cao cấp', 'Khung gỗ sồi'],
      colors: ['Xám tro', 'Be nhạt'],
      status: 'Đang kinh doanh',
      isFeatured: false,
      file3DUrl: '',
    };
    this.materialsInput = this.formDraft.materials.join(', ');
    this.colorsInput = this.formDraft.colors.join(', ');
    this.imagesInput = this.formDraft.images.join(', ');

    // Always fetch latest categories from MongoDB Categories collection when opening the modal
    this.loadCategories(() => {
      if (!this.formDraft.categoryId && this.availableCategories.length > 0) {
        this.formDraft.categoryId = this.availableCategories[0].id;
      }
      this.generateSkuForSelectedCategory();
      this.cdr.markForCheck();
    });
    this.loadRooms(() => {
      if (this.formDraft.roomIds.length === 0 && this.availableRooms.length > 0) {
        this.formDraft.roomIds = [this.availableRooms[0].id];
      }
      this.cdr.markForCheck();
    });

    if (this.availableCategories.length > 0) {
      this.generateSkuForSelectedCategory();
    }

    this.isModalOpen.set(true);
  }

  openEditModal(item: ProductItem): void {
    this.isEditMode.set(true);
    this.editingProductId.set(item.id);
    this.errorMessage.set('');
    this.activeModalTab.set('general');

    this.loadCategories();
    this.loadRooms();

    this.formDraft = {
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      categoryId: item.categoryId,
      roomIds: [...item.roomIds],
      price: item.price,
      salePrice: item.salePrice,
      stockQuantity: item.stockQuantity,
      thumbnail: item.thumbnail,
      images: [...item.images],
      description: item.description,
      dimensions: { ...item.dimensions },
      materials: [...item.materials],
      colors: [...item.colors],
      status: item.status,
      isFeatured: item.isFeatured,
      file3DUrl: item.file3DUrl || '',
    };
    this.materialsInput = this.formDraft.materials.join(', ');
    this.colorsInput = this.formDraft.colors.join(', ');
    this.imagesInput = this.formDraft.images.join(', ');

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set('');
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  setModalTab(tab: 'general' | 'dimensions' | 'media'): void {
    this.activeModalTab.set(tab);
  }

  isRoomSelected(roomId: string): boolean {
    return this.formDraft.roomIds.includes(roomId);
  }

  toggleRoom(roomId: string): void {
    const list = this.formDraft.roomIds;
    if (list.includes(roomId)) {
      if (list.length > 1) {
        this.formDraft.roomIds = list.filter((r) => r !== roomId);
      }
    } else {
      this.formDraft.roomIds = [...list, roomId];
    }
  }

  saveProduct(): void {
    if (!this.formDraft.sku.trim()) {
      this.activeModalTab.set('general');
      this.errorMessage.set('Vui lòng nhập hoặc sinh mã sản phẩm (SKU).');
      return;
    }
    if (!this.formDraft.name.trim()) {
      this.activeModalTab.set('general');
      this.errorMessage.set('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!this.formDraft.categoryId) {
      this.activeModalTab.set('general');
      this.errorMessage.set('Vui lòng chọn loại sản phẩm từ danh mục.');
      return;
    }
    if (this.formDraft.price <= 0) {
      this.activeModalTab.set('general');
      this.errorMessage.set('Giá bán sản phẩm phải lớn hơn 0.');
      return;
    }

    // Process array inputs
    this.formDraft.materials = this.materialsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    this.formDraft.colors = this.colorsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedImages = this.imagesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    this.formDraft.images = parsedImages.length > 0 ? parsedImages : [this.formDraft.thumbnail];

    if (!this.formDraft.slug) {
      this.formDraft.slug = this.categoryService.slugify(this.formDraft.name);
    }
    const selectedCat = this.availableCategories.find(
      (c) => c.id === this.formDraft.categoryId || c.slug === this.formDraft.categoryId
    );
    if (selectedCat && selectedCat.slug) {
      (this.formDraft as any).categorySlug = selectedCat.slug;
    }
    const selectedRooms = this.availableRooms.filter(
      (r) => this.formDraft.roomIds.includes(r.id) || this.formDraft.roomIds.includes(r.slug || '')
    );
    if (selectedRooms.length > 0) {
      (this.formDraft as any).roomSlugs = selectedRooms.map((r) => r.slug || r.id);
    }

    // File 3D GLB hoàn toàn tùy chọn, không bắt buộc
    this.formDraft.file3DUrl = (this.formDraft.file3DUrl || '').trim();

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    if (this.isEditMode() && this.editingProductId()) {
      this.productService.updateProduct(this.editingProductId()!, this.formDraft).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Có lỗi xảy ra khi cập nhật sản phẩm.');
        },
      });
    } else {
      this.productService.createProduct(this.formDraft).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Có lỗi xảy ra khi thêm mới sản phẩm.');
        },
      });
    }
  }

  confirmDelete(item: ProductItem): void {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${item.name}" (${item.sku}) không?`);
    if (ok) {
      this.productService.deleteProduct(item.id).subscribe({
        next: () => {
          this.loadData();
        },
      });
    }
  }
}
