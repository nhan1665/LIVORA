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
import { ExcelService } from '../../shared/services/excel.service';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityLogComponent],
  templateUrl: './product.html',
  // Note: product.css is imported globally in styles.css to stay well below the 8kB angular component style budget
})
export class Product implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly roomService = inject(RoomService);
  private readonly excelService = inject(ExcelService);
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
  private hasAutoSeeded = false;

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
  readonly activeModalTab = signal<'general' | 'dimensions' | 'media' | 'history'>('general');

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
    stockQuantity: 0,
    thumbnail: '',
    images: [],
    description: '',
    dimensions: { length: 0, width: 0, height: 0, weight: 0 },
    materials: [],
    colors: [],
    status: 'Đang kinh doanh',
    isFeatured: false,
    file3DUrl: '',
  };

  // Trạng thái nhập Excel
  readonly isImportingExcel = signal(false);

  // Dynamic options loaded from MongoDB Atlas (Categories & Rooms collections)
  availableCategories: { id: string; code?: string; name: string; slug?: string }[] = [];
  availableRooms: { id: string; code?: string; name: string; slug?: string }[] = [];

  // Helper chuyển đổi tiếng Việt có dấu sang không dấu
  removeVietnameseTones(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  matchCategory(cat: { id?: string; code?: string; name?: string; slug?: string }, input: string): boolean {
    if (!cat || !input) return false;
    const target = String(input).trim().toLowerCase();
    const cleanTarget = target.replace(/^cat[-_]/, '').trim();
    const unsignedTarget = this.removeVietnameseTones(target).trim();
    const slugTarget = unsignedTarget.replace(/[\s_]+/g, '-');

    const idStr = (cat.id || '').toString().toLowerCase();
    const codeStr = (cat.code || '').toLowerCase();
    const cleanCode = codeStr.replace(/^cat[-_]/, '');
    const slugStr = (cat.slug || '').toLowerCase();
    const nameStr = (cat.name || '').toLowerCase();
    const unsignedName = this.removeVietnameseTones(nameStr);

    return (
      target === idStr ||
      target === codeStr ||
      cleanTarget === cleanCode ||
      target === slugStr ||
      cleanTarget === slugStr ||
      slugTarget === slugStr ||
      target === nameStr ||
      unsignedTarget === unsignedName ||
      slugTarget === cleanCode
    );
  }

  matchRoom(room: { id?: string; code?: string; name?: string; slug?: string }, input: string): boolean {
    if (!room || !input) return false;
    const target = String(input).trim().toLowerCase();
    const cleanTarget = target.replace(/^rm[-_]/, '').trim();
    const unsignedTarget = this.removeVietnameseTones(target).trim();
    const slugTarget = unsignedTarget.replace(/[\s_]+/g, '-');

    const idStr = (room.id || '').toString().toLowerCase();
    const codeStr = (room.code || '').toLowerCase();
    const cleanCode = codeStr.replace(/^rm[-_]/, '');
    const slugStr = (room.slug || '').toLowerCase();
    const nameStr = (room.name || '').toLowerCase();
    const unsignedName = this.removeVietnameseTones(nameStr);

    return (
      target === idStr ||
      target === codeStr ||
      cleanTarget === cleanCode ||
      target === slugStr ||
      cleanTarget === slugStr ||
      slugTarget === slugStr ||
      target === nameStr ||
      unsignedTarget === unsignedName ||
      slugTarget === cleanCode
    );
  }

  // Lấy tiền tố mã loại sản phẩm (ví dụ "Giường ngủ" -> "GIUONG", "Sofa" -> "SOFA")
  getCategoryPrefix(cat: { id?: string; code?: string; name: string; slug?: string } | undefined): string {
    if (!cat) return 'SP';

    if (cat.code && !cat.code.toUpperCase().startsWith('CAT-')) {
      const cleaned = cat.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned) return cleaned;
    }

    if (cat.name) {
      const unsigned = this.removeVietnameseTones(cat.name).toUpperCase().trim();
      const firstWord = unsigned.split(/[\s,&-]+/)[0].replace(/[^A-Z0-9]/g, '');
      if (firstWord && firstWord.length >= 2) return firstWord;
    }

    if (cat.code) {
      const stripped = cat.code.toUpperCase().replace(/^CAT[-_]/, '').replace(/[^A-Z0-9]/g, '');
      if (stripped) return stripped;
    }

    if (cat.slug) {
      return cat.slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    return 'SP';
  }

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
          this.availableRooms = rooms.map((r: any) => ({
            id: r.id || r._id,
            code: r.code || (r.slug ? `RM-${r.slug.toUpperCase()}` : 'RM-SPACE'),
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
        if (res.totalItems < 50 && !this.activeSearch && this.activeCategory === 'all' && !this.hasAutoSeeded) {
          this.hasAutoSeeded = true;
          this.productService.seedMockProducts().subscribe({
            next: () => this.loadData(),
            error: () => {}
          });
          return;
        }
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

  toggleStatus(item: ProductItem): void {
    this.productService.toggleStatus(item.id).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  formatCurrency(val: number): string {
    if (!val && val !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingProductId.set(null);
    this.errorMessage.set('');
    this.activeModalTab.set('general');

    this.formDraft = {
      sku: '',
      name: '',
      slug: '',
      categoryId: '',
      roomIds: [],
      price: null as any,
      salePrice: null,
      stockQuantity: null as any,
      thumbnail: '',
      images: [],
      description: '',
      dimensions: { length: null as any, width: null as any, height: null as any, weight: null as any },
      materials: [],
      colors: [],
      status: 'Đang kinh doanh',
      isFeatured: false,
      file3DUrl: '',
    };
    this.materialsInput = '';
    this.colorsInput = '';
    this.imagesInput = '';

    this.loadCategories(() => {
      this.cdr.markForCheck();
    });
    this.loadRooms(() => {
      this.cdr.markForCheck();
    });

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

    const urlImages = this.formDraft.images.filter((img) => !img.startsWith('data:'));
    this.imagesInput = urlImages.join(', ');

    this.isModalOpen.set(true);
  }

  onThumbnailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formDraft.thumbnail = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail(): void {
    this.formDraft.thumbnail = '';
  }

  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result && !this.formDraft.images.includes(result)) {
            this.formDraft.images.push(result);
            this.cdr.markForCheck();
          }
        };
        reader.readAsDataURL(file);
      });
    }
    input.value = '';
  }

  removeGalleryImage(index: number): void {
    if (index >= 0 && index < this.formDraft.images.length) {
      this.formDraft.images.splice(index, 1);
    }
  }

  // ==============================================================
  // EXCEL IMPORT & EXPORT CHO SẢN PHẨM (KÈM DÒNG CODE HEADER)
  // ==============================================================

  /** Tải file template Excel (.xlsx) chuẩn gồm Template, Tab tra cứu Danh mục, Tab tra cứu Phòng */
  async downloadExcelTemplate(): Promise<void> {
    try {
      // 1. Dòng 1: Mã code kỹ thuật chuẩn (code headers)
      const codeHeaders = [
        'sku',
        'product_name',
        'category_code',
        'room_code',
        'price',
        'sale_price',
        'stock_quantity',
        'description',
        'length',
        'width',
        'height',
        'weight',
        'materials',
        'colors',
        'thumbnail',
      ];

      // 2. Dòng 2: Tiêu đề tiếng Việt hướng dẫn chi tiết
      const labelHeaders = [
        'Mã SKU (Tự sinh nếu trống)',
        'Tên sản phẩm (* Bắt buộc)',
        'Mã danh mục (* Bắt buộc tra cứu tab Danh_Muc)',
        'Mã phòng (* Bắt buộc tra cứu tab Danh_Sach_Phong, nhiều mã cách nhau bằng ;)',
        'Giá bán VNĐ (* Bắt buộc)',
        'Giá khuyến mãi VNĐ',
        'Số lượng tồn kho',
        'Mô tả sản phẩm',
        'Chiều dài (cm)',
        'Chiều rộng (cm)',
        'Chiều cao (cm)',
        'Trọng lượng (kg)',
        'Chất liệu (cách nhau bởi dấu chấm phẩy ;)',
        'Màu sắc (cách nhau bởi dấu chấm phẩy ;)',
        'Link ảnh đại diện (URL)',
      ];

      // Dữ liệu mẫu lấy từ danh mục và phòng thực tế nếu có
      const defaultCatCode = this.availableCategories[0]?.code || (this.availableCategories[0]?.slug ? `CAT-${this.availableCategories[0].slug.toUpperCase()}` : 'CAT-SOFA');
      const secondCatCode = this.availableCategories[1]?.code || (this.availableCategories[1]?.slug ? `CAT-${this.availableCategories[1].slug.toUpperCase()}` : 'CAT-BAN');
      const defaultRoomCode = this.availableRooms[0]?.code || (this.availableRooms[0]?.slug ? `RM-${this.availableRooms[0].slug.toUpperCase()}` : 'RM-PHONG-KHACH');
      const secondRoomCode = this.availableRooms[1]?.code || (this.availableRooms[1]?.slug ? `RM-${this.availableRooms[1].slug.toUpperCase()}` : 'RM-PHONG-AN');

      const sampleRow1 = [
        'SOFA-SP001',
        'Sofa Góc Da Hiện Đại Bắc Âu',
        defaultCatCode,
        defaultRoomCode,
        12500000,
        10500000,
        15,
        'Sofa da bò cao cấp êm ái, bền đẹp phong cách Bắc Âu hiện đại',
        220,
        95,
        85,
        55,
        'Da bò cao cấp; Khung gỗ sồi',
        'Đen; Nâu da bò',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      ];

      const sampleRow2 = [
        'BAN-SP001',
        'Bàn Ăn 6 Ghế Gỗ Sồi Tự Nhiên',
        secondCatCode,
        secondRoomCode,
        8900000,
        '',
        20,
        'Bàn ăn phong cách tối giản gỗ sồi tự nhiên chắc chắn và sang trọng',
        160,
        80,
        75,
        40,
        'Gỗ sồi Nga tự nhiên',
        'Màu gỗ tự nhiên; Nâu óc chó',
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
      ];

      // Tab 2: Danh sách Mã danh mục chuẩn có sẵn trên hệ thống LIVORA
      const categorySheet: any[][] = [
        ['category_code (Điền mã này vào cột C của Tab 1)', 'category_name (Tên loại sản phẩm)', 'slug'],
        ['MÃ DANH MỤC (* Bắt buộc điền đúng mã này)', 'TÊN DANH MỤC', 'SLUG ĐƯỜNG DẪN'],
      ];
      for (const cat of this.availableCategories) {
        const catCode = cat.code || (cat.slug ? `CAT-${cat.slug.toUpperCase()}` : cat.id);
        categorySheet.push([catCode, cat.name, cat.slug || '']);
      }

      // Tab 3: Danh sách Mã không gian phòng chuẩn có sẵn trên hệ thống LIVORA
      const roomSheet: any[][] = [
        ['room_code (Điền mã này vào cột D của Tab 1)', 'room_name (Tên không gian phòng)', 'slug'],
        ['MÃ PHÒNG (* Bắt buộc điền đúng mã này)', 'TÊN KHÔNG GIAN PHÒNG', 'SLUG ĐƯỜNG DẪN'],
      ];
      for (const room of this.availableRooms) {
        const roomCode = room.code || (room.slug ? `RM-${room.slug.toUpperCase()}` : room.id);
        roomSheet.push([roomCode, room.name, room.slug || '']);
      }

      // Tab 4: Hướng dẫn chi tiết
      const guideData = [
        ['HƯỚNG DẪN QUY ĐỊNH NHẬP SẢN PHẨM QUA FILE EXCEL LIVORA'],
        [''],
        ['Mã cột (Code Header)', 'Tên tiếng Việt', 'Bắt buộc', 'Quy định kiểm tra tính hợp lệ'],
        ['sku', 'Mã SKU', 'Tùy chọn', 'Nếu để trống hệ thống sẽ tự sinh mã [LOẠI]-SPXXX'],
        ['product_name', 'Tên sản phẩm', 'Bắt buộc', 'Tên đầy đủ của sản phẩm'],
        ['category_code', 'Mã danh mục', 'Bắt buộc', 'PHẢI điền đúng mã danh mục có trong tab "Danh_Muc", nếu sai hệ thống sẽ từ chối tải lên'],
        ['room_code', 'Mã phòng', 'Bắt buộc', 'PHẢI điền đúng mã phòng có trong tab "Danh_Sach_Phong" (có thể điền nhiều phòng cách nhau bởi dấu ;)'],
        ['price', 'Giá bán VNĐ', 'Bắt buộc', 'Số nguyên > 0 (VD: 12500000)'],
        ['sale_price', 'Giá khuyến mãi', 'Tùy chọn', 'Số nguyên < Giá bán'],
        ['stock_quantity', 'Tồn kho', 'Tùy chọn', 'Số nguyên (Mặc định 10 nếu để trống)'],
        ['description', 'Mô tả', 'Tùy chọn', 'Mô tả chi tiết nội thất'],
        ['length, width, height', 'Kích thước cm', 'Tùy chọn', 'Dài, Rộng, Cao tính bằng cm'],
        ['weight', 'Trọng lượng kg', 'Tùy chọn', 'Cân nặng đóng gói kiện hàng'],
        ['materials', 'Chất liệu', 'Tùy chọn', 'Nhiều chất liệu cách nhau bởi dấu chấm phẩy (;)'],
        ['colors', 'Màu sắc', 'Tùy chọn', 'Nhiều màu cách nhau bởi dấu chấm phẩy (;)'],
        ['thumbnail', 'Ảnh đại diện', 'Tùy chọn', 'Đường dẫn ảnh trực tiếp URL (https://...)'],
      ];

      await this.excelService.exportMultiSheet(
        [
          { name: 'Template_SanPham', data: [codeHeaders, labelHeaders, sampleRow1, sampleRow2] },
          { name: 'Danh_Muc', data: categorySheet },
          { name: 'Danh_Sach_Phong', data: roomSheet },
          { name: 'Huong_Dan_Nhap', data: guideData },
        ],
        'Mau_Nhap_San_Pham_Livora.xlsx'
      );
    } catch (err: any) {
      alert('Lỗi tải template Excel: ' + (err?.message || err));
    }
  }

  triggerExcelInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  /** Xử lý tải lên file Excel (.xlsx / .xls / .csv) bằng SheetJS và kiểm tra Danh mục, Phòng */
  async onExcelFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    try {
      this.isImportingExcel.set(true);

      const sheets = await this.excelService.readWorkbook(file);
      const sheetNames = Object.keys(sheets);
      if (sheetNames.length === 0) {
        throw new Error('File rỗng hoặc không chứa dữ liệu hợp lệ.');
      }

      // Ưu tiên sheet có tên Template_SanPham hoặc chứa 'sanpham'/'product', nếu không lấy sheet 0
      const targetSheetName =
        sheetNames.find((s) => s.toLowerCase().includes('sanpham') || s.toLowerCase().includes('product')) ||
        sheetNames[0];

      const rows = sheets[targetSheetName];
      if (!rows || rows.length < 2) {
        throw new Error(`Sheet "${targetSheetName}" không có dữ liệu hàng nào (ngoài tiêu đề).`);
      }

      // 1. Phân tích header: tìm dòng header chứa code (sku, product_name, price...)
      let headerRowIndex = 0;
      let skuIdx = -1;
      let nameIdx = -1;
      let catIdx = -1;
      let roomIdx = -1;
      let priceIdx = -1;
      let salePriceIdx = -1;
      let stockIdx = -1;
      let descIdx = -1;
      let lenIdx = -1;
      let widIdx = -1;
      let heiIdx = -1;
      let weiIdx = -1;
      let matIdx = -1;
      let colIdx = -1;
      let thumbIdx = -1;

      // Duyệt qua tối đa 3 hàng đầu để tìm đúng hàng header
      for (let r = 0; r < Math.min(3, rows.length); r++) {
        const headerRow = (rows[r] || []).map((c: any) =>
          this.removeVietnameseTones(String(c || '')).toLowerCase().trim()
        );

        const findCol = (...keywords: string[]): number => {
          return headerRow.findIndex((h) => keywords.some((kw) => h === kw || h.includes(kw)));
        };

        const tryName = findCol('product_name', 'productname', 'name', 'ten san pham', 'ten');
        const tryPrice = findCol('price', 'gia ban', 'gia goc', 'don gia', 'gia');

        if (tryName !== -1 || tryPrice !== -1) {
          headerRowIndex = r;
          nameIdx = tryName;
          priceIdx = tryPrice;
          skuIdx = findCol('sku', 'ma san pham', 'ma sku');
          catIdx = findCol('category_code', 'category', 'danh muc', 'loai', 'mã danh mục');
          roomIdx = findCol('room_code', 'room', 'phong', 'mã phòng', 'không gian');
          salePriceIdx = findCol('sale_price', 'saleprice', 'khuyen mai', 'gia sale');
          stockIdx = findCol('stock_quantity', 'stock', 'qty', 'ton kho', 'so luong');
          descIdx = findCol('description', 'desc', 'mo ta', 'thong tin');
          lenIdx = findCol('length', 'chieu dai', 'dai');
          widIdx = findCol('width', 'chieu rong', 'rong');
          heiIdx = findCol('height', 'chieu cao', 'cao');
          weiIdx = findCol('weight', 'trong luong', 'nang');
          matIdx = findCol('materials', 'material', 'chat lieu');
          colIdx = findCol('colors', 'color', 'mau sac', 'mau');
          thumbIdx = findCol('thumbnail', 'thumb', 'anh dai dien', 'link anh', 'hinh anh');
          break;
        }
      }

      // Fallback theo vị trí mặc định nếu không khớp
      if (nameIdx === -1) nameIdx = 1;
      if (priceIdx === -1) priceIdx = 4;
      if (skuIdx === -1) skuIdx = 0;
      if (catIdx === -1) catIdx = 2;
      if (roomIdx === -1) roomIdx = 3;
      if (salePriceIdx === -1) salePriceIdx = 5;
      if (stockIdx === -1) stockIdx = 6;
      if (descIdx === -1) descIdx = 7;

      const clientValidationErrors: string[] = [];
      const productsToImport: any[] = [];

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0 || row.every((c: any) => c === '' || c === null || c === undefined)) {
          continue; // Bỏ qua dòng trống
        }

        const rawFirst = String(row[0] || '').trim().toLowerCase();
        const rawName = String(row[nameIdx] || '').trim();

        // Bỏ qua nếu dòng này là dòng header tiếng Việt hoặc lặp lại code header
        if (
          rawFirst.includes('sku') ||
          rawFirst.includes('mã') ||
          rawFirst === 'product_name' ||
          rawName.toLowerCase().includes('tên sản phẩm') ||
          rawName.toLowerCase() === 'product_name'
        ) {
          continue;
        }

        const rowNum = r + 1;

        if (!rawName) {
          clientValidationErrors.push(`Dòng ${rowNum}: Tên sản phẩm không được để trống.`);
          continue;
        }

        const rawCatInput = catIdx !== -1 ? String(row[catIdx] || '').trim() : '';
        const rawRoomInput = roomIdx !== -1 ? String(row[roomIdx] || '').trim() : '';

        // 1. Kiểm tra Danh mục: Phải có mã/tên trong hệ thống
        if (!rawCatInput) {
          clientValidationErrors.push(`Dòng ${rowNum} (${rawName}): Chưa điền mã danh mục. Vui lòng tra cứu tab "Danh_Muc".`);
          continue;
        }
        const foundCat = this.availableCategories.find((c) => this.matchCategory(c, rawCatInput));
        if (!foundCat) {
          clientValidationErrors.push(
            `Dòng ${rowNum} (${rawName}): Mã danh mục "${rawCatInput}" KHÔNG TỒN TẠI trên hệ thống. Vui lòng đối chiếu mã chuẩn tại tab "Danh_Muc".`
          );
          continue;
        }

        // 2. Kiểm tra Phòng: Phải có mã/tên trong hệ thống
        if (!rawRoomInput) {
          clientValidationErrors.push(`Dòng ${rowNum} (${rawName}): Chưa điền mã phòng. Vui lòng tra cứu tab "Danh_Sach_Phong".`);
          continue;
        }
        const roomSplits = rawRoomInput.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
        const matchedRoomCodes: string[] = [];
        let hasInvalidRoom = false;
        let invalidRoomToken = '';

        for (const rs of roomSplits) {
          const foundR = this.availableRooms.find((r) => this.matchRoom(r, rs));
          if (!foundR) {
            hasInvalidRoom = true;
            invalidRoomToken = rs;
            break;
          }
          matchedRoomCodes.push(foundR.code || (foundR.slug ? `RM-${foundR.slug.toUpperCase()}` : foundR.id));
        }
        if (hasInvalidRoom) {
          clientValidationErrors.push(
            `Dòng ${rowNum} (${rawName}): Mã phòng "${invalidRoomToken || rawRoomInput}" KHÔNG TỒN TẠI trên hệ thống. Vui lòng đối chiếu mã chuẩn tại tab "Danh_Sach_Phong".`
          );
          continue;
        }

        const rawPriceStr = String(row[priceIdx] ?? '').replace(/[^0-9]/g, '');
        const priceVal = Number(rawPriceStr) || 0;
        if (priceVal <= 0) {
          clientValidationErrors.push(`Dòng ${rowNum} (${rawName}): Giá bán "${row[priceIdx]}" không hợp lệ.`);
          continue;
        }

        const rawSaleStr = salePriceIdx !== -1 && row[salePriceIdx] ? String(row[salePriceIdx]).replace(/[^0-9]/g, '') : '';
        const saleVal = rawSaleStr ? Number(rawSaleStr) : null;

        const rawStockStr = stockIdx !== -1 && row[stockIdx] ? String(row[stockIdx]).replace(/[^0-9]/g, '') : '';
        const stockVal = rawStockStr ? Number(rawStockStr) : 10;

        productsToImport.push({
          sku: skuIdx !== -1 ? String(row[skuIdx] || '').trim() : '',
          name: rawName,
          category: foundCat.code || (foundCat.slug ? `CAT-${foundCat.slug.toUpperCase()}` : rawCatInput),
          room: matchedRoomCodes.join(';'),
          price: priceVal,
          salePrice: saleVal,
          stockQuantity: stockVal,
          description: descIdx !== -1 ? String(row[descIdx] || '').trim() : '',
          dimensions: {
            length: lenIdx !== -1 ? Number(row[lenIdx]) || 0 : 0,
            width: widIdx !== -1 ? Number(row[widIdx]) || 0 : 0,
            height: heiIdx !== -1 ? Number(row[heiIdx]) || 0 : 0,
            weight: weiIdx !== -1 ? Number(row[weiIdx]) || 0 : 0,
          },
          materials:
            matIdx !== -1 && row[matIdx]
              ? String(row[matIdx])
                  .split(/[,;|]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
          colors:
            colIdx !== -1 && row[colIdx]
              ? String(row[colIdx])
                  .split(/[,;|]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
          thumbnail: thumbIdx !== -1 ? String(row[thumbIdx] || '').trim() : '',
        });
      }

      if (productsToImport.length === 0) {
        this.isImportingExcel.set(false);
        const errMsg = clientValidationErrors.length > 0
          ? `Không thể tải sản phẩm lên do có lỗi dữ liệu:\n` + clientValidationErrors.slice(0, 5).join('\n')
          : 'Không tìm thấy dòng dữ liệu sản phẩm hợp lệ trong file Excel.';
        alert(errMsg);
        return;
      }

      // Gửi mảng sản phẩm hợp lệ lên Backend
      this.productService.importExcelProducts(productsToImport).subscribe({
        next: (res) => {
          this.isImportingExcel.set(false);
          const importedCount = res?.importedCount || productsToImport.length;
          const allErrors = [...clientValidationErrors, ...(res?.errors || [])];
          let msg = `Nhập thành công ${importedCount} sản phẩm vào hệ thống!`;
          if (allErrors.length > 0) {
            msg += `\nLưu ý có ${allErrors.length} dòng không hợp lệ bị bỏ qua:\n` + allErrors.slice(0, 5).join('\n');
          }
          alert(msg);
          this.loadData();
        },
        error: (err) => {
          this.isImportingExcel.set(false);
          alert(err.message || 'Lỗi khi nhập sản phẩm từ Excel.');
        },
      });
    } catch (err: any) {
      this.isImportingExcel.set(false);
      alert('Lỗi xử lý file Excel: ' + (err?.message || err));
    } finally {
      input.value = '';
    }
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

  setModalTab(tab: 'general' | 'dimensions' | 'media' | 'history'): void {
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
    const uploadedImages = (this.formDraft.images || []).filter((img) => img && img.startsWith('data:'));
    const allImages = Array.from(new Set([...uploadedImages, ...parsedImages]));
    if (allImages.length === 0 && this.formDraft.thumbnail) {
      allImages.push(this.formDraft.thumbnail);
    }
    this.formDraft.images = allImages;

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
