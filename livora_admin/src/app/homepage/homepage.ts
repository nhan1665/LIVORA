import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTable, TableColumn, TableActionEvent } from '../shared/data-table/data-table';
import { FilterBar } from '../shared/filter-bar/filter-bar';
import { FormModal } from '../shared/form-modal/form-modal';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { HomepageService } from './homepage.service';

export interface MarqueeItem {
  id: string;
  code: string;
  title: string;
  iconType: 'truck' | 'sparkle' | 'user' | 'sofa' | 'discount' | 'bell';
  startDate: string;
  endDate: string;
  order: number;
  status: 'Đang hoạt động' | 'Đã ẩn';
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  startDate: string;
  endDate: string;
  order: number;
  status: 'Đang hiển thị' | 'Đã ẩn';
}

export interface BrandItem {
  id: string;
  name: string;
  origin: string;
  description: string;
  status: 'Đang hiển thị' | 'Đã ẩn';
}

export interface FooterConfigItem {
  id: string;
  key: 'facebook' | 'instagram' | 'zalo' | 'phone';
  name: string;
  subtitle: string;
  value: string;
  status: 'Hiển thị' | 'Ẩn';
  iconType: 'facebook' | 'instagram' | 'zalo' | 'phone';
}

@Component({
  selector: 'app-homepage',
  imports: [CommonModule, FormsModule, DataTable, FilterBar, FormModal, ConfirmDialog],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage implements OnInit, AfterViewInit {
  private readonly homepageService = inject(HomepageService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Current active tab - defaulted to 'banner'
  activeTab: 'marquee' | 'banner' | 'brand' | 'footer' = 'banner';

  // Template references for custom cell rendering
  @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
  @ViewChild('titleTemplate', { static: true }) titleTemplate!: TemplateRef<any>;
  @ViewChild('orderTemplate', { static: true }) orderTemplate!: TemplateRef<any>;

  // Columns definition for DataTable
  columns: TableColumn<MarqueeItem>[] = [];

  // Filter states
  filterKeyword: string = '';
  filterStatus: string = 'all';

  // Pagination states
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Modal states
  isModalOpen: boolean = false;
  modalMode: 'create' | 'edit' = 'create';
  editingItem: MarqueeItem | null = null;
  notificationForm: Partial<MarqueeItem> = {
    code: '',
    title: '',
    iconType: 'truck',
    startDate: '',
    endDate: '',
    order: undefined,
    status: 'Đang hoạt động',
  };

  // Toast / feedback message
  toastMessage: string | null = null;

  // Loading states
  isLoadingMarquees: boolean = false;
  isLoadingBanners: boolean = false;
  isLoadingBrands: boolean = false;
  isLoadingFooters: boolean = false;

  // ==========================================
  // BANNER MANAGEMENT STATES & DATA
  // ==========================================
  bannerFilterKeyword: string = '';
  bannerFilterStatus: string = 'all';
  bannerFilterStartDate: string = '';
  bannerFilterEndDate: string = '';
  bannerCurrentPage: number = 1;
  bannerItemsPerPage: number = 5;

  // Banner Modal States
  isBannerModalOpen: boolean = false;
  bannerModalMode: 'create' | 'edit' = 'create';
  editingBanner: BannerItem | null = null;
  uploadedFileName: string = '';
  uploadedFileSize: string = '';
  isDraggingOver: boolean = false;

  bannerForm: Partial<BannerItem> = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    order: undefined,
    status: 'Đang hiển thị',
  };

  // Datasets from MongoDB backend
  bannerList: BannerItem[] = [];

  // ==========================================
  // BRAND MANAGEMENT STATES & DATA
  // ==========================================
  brandFilterKeyword: string = '';
  brandFilterStatus: string = 'all';
  brandCurrentPage: number = 1;
  brandItemsPerPage: number = 5;

  isBrandModalOpen: boolean = false;
  brandModalMode: 'create' | 'edit' = 'create';
  editingBrand: BrandItem | null = null;
  brandForm: Partial<BrandItem> = {
    name: '',
    origin: '',
    description: '',
    status: 'Đang hiển thị',
  };

  brandList: BrandItem[] = [];

  // ==========================================
  // FOOTER CONFIG STATES & DATA
  // ==========================================
  footerConfig: FooterConfigItem[] = [];

  // ==========================================
  // MARQUEE STATES & DATA
  // ==========================================
  marqueeList: MarqueeItem[] = [];

  // Confirm dialog states
  isConfirmOpen: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmText: string = 'Đồng ý';
  confirmType: 'warning' | 'danger' | 'info' = 'warning';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.initColumns();
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Re-initialize columns to ensure template references are cleanly attached
    this.initColumns();
  }

  loadAllData(): void {
    this.loadMarquees();
    this.loadBanners();
    this.loadBrands();
    this.loadFooters();
  }

  loadMarquees(): void {
    this.isLoadingMarquees = true;
    this.homepageService.getMarquees().subscribe({
      next: (data) => {
        this.marqueeList = data;
        this.isLoadingMarquees = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải Marquees:', err);
        this.isLoadingMarquees = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadBanners(): void {
    this.isLoadingBanners = true;
    this.homepageService.getBanners().subscribe({
      next: (data) => {
        this.bannerList = data;
        this.isLoadingBanners = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải Banners:', err);
        this.isLoadingBanners = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadBrands(): void {
    this.isLoadingBrands = true;
    this.homepageService.getBrands().subscribe({
      next: (data) => {
        this.brandList = data;
        this.isLoadingBrands = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải Brands:', err);
        this.isLoadingBrands = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadFooters(): void {
    this.isLoadingFooters = true;
    this.homepageService.getFooters().subscribe({
      next: (data) => {
        this.footerConfig = data;
        this.isLoadingFooters = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải Footer:', err);
        this.isLoadingFooters = false;
        this.cdr.detectChanges();
      },
    });
  }

  private initColumns(): void {
    this.columns = [
      {
        key: 'code',
        label: 'MÃ',
        width: '110px',
        type: 'custom',
        cellTemplate: this.codeTemplate,
      },
      {
        key: 'title',
        label: 'THÔNG BÁO',
        type: 'custom',
        cellTemplate: this.titleTemplate,
      },
      {
        key: 'startDate',
        label: 'TỪ NGÀY',
        width: '130px',
        type: 'text',
      },
      {
        key: 'endDate',
        label: 'ĐẾN NGÀY',
        width: '130px',
        type: 'text',
      },
      {
        key: 'order',
        label: 'THỨ TỰ',
        width: '90px',
        align: 'center',
        type: 'custom',
        cellTemplate: this.orderTemplate,
      },
      {
        key: 'status',
        label: 'TRẠNG THÁI',
        width: '160px',
        align: 'center',
        type: 'badge',
      },
      {
        key: 'actions',
        label: 'THAO TÁC',
        width: '110px',
        align: 'center',
        type: 'actions',
        actions: [
          {
            id: 'edit',
            label: 'Chỉnh sửa',
            variant: 'edit',
          },
          {
            id: 'hide',
            label: 'Ẩn thông báo',
            variant: 'hide',
            show: (row: MarqueeItem) => row.status === 'Đang hoạt động',
          },
          {
            id: 'show',
            label: 'Hiện thông báo',
            variant: 'view',
            show: (row: MarqueeItem) => row.status === 'Đã ẩn',
          },
        ],
      },
    ];
  }

  // Active count & quota calculation
  get activeCount(): number {
    return this.marqueeList.filter((item) => item.status === 'Đang hoạt động').length;
  }

  get activeQuotaPercentage(): number {
    const maxQuota = 5;
    return Math.min(100, Math.round((this.activeCount / maxQuota) * 100));
  }

  // Filtered dataset
  get filteredData(): MarqueeItem[] {
    return this.marqueeList.filter((item) => {
      const matchKeyword =
        !this.filterKeyword ||
        item.title.toLowerCase().includes(this.filterKeyword.trim().toLowerCase()) ||
        item.code.toLowerCase().includes(this.filterKeyword.trim().toLowerCase());

      const matchStatus =
        this.filterStatus === 'all' || item.status === this.filterStatus;

      return matchKeyword && matchStatus;
    });
  }

  // Paginated dataset
  get paginatedData(): MarqueeItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  // Tab switching
  setTab(tab: 'marquee' | 'banner' | 'brand' | 'footer'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  // Filter handlers
  onFilter(): void {
    this.currentPage = 1;
  }

  onResetFilter(): void {
    this.filterKeyword = '';
    this.filterStatus = 'all';
    this.currentPage = 1;
  }

  // Pagination handler
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  get activeBannerCount(): number {
    return this.bannerList.filter((item) => item.status === 'Đang hiển thị').length;
  }

  get activeBannerPercentage(): number {
    return Math.min(100, Math.round((this.activeBannerCount / 3) * 100));
  }

  get filteredBannerList(): BannerItem[] {
    return this.bannerList.filter((item) => {
      // 1. Keyword search (title / subtitle / linkUrl)
      const keyword = (this.bannerFilterKeyword || '').trim().toLowerCase();
      const matchKeyword =
        !keyword ||
        (item.title && item.title.toLowerCase().includes(keyword)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(keyword)) ||
        (item.linkUrl && item.linkUrl.toLowerCase().includes(keyword));

      // 2. Status filter
      const matchStatus =
        this.bannerFilterStatus === 'all' || item.status === this.bannerFilterStatus;

      // 3. Date range filter
      let matchDate = true;
      if (this.bannerFilterStartDate || this.bannerFilterEndDate) {
        const itemStart = this.parseDateToTimestamp(item.startDate);
        const itemEnd = this.parseDateToTimestamp(item.endDate);

        if (this.bannerFilterStartDate) {
          const filterStart = this.parseDateToTimestamp(this.bannerFilterStartDate);
          if (filterStart > 0 && itemEnd > 0 && itemEnd < filterStart) {
            matchDate = false;
          }
        }
        if (this.bannerFilterEndDate) {
          const filterEnd = this.parseDateToTimestamp(this.bannerFilterEndDate);
          if (filterEnd > 0 && itemStart > 0 && itemStart > filterEnd) {
            matchDate = false;
          }
        }
      }

      return matchKeyword && matchStatus && matchDate;
    });
  }

  private parseDateToTimestamp(dateStr?: string): number {
    if (!dateStr) return 0;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  }

  get paginatedBannerList(): BannerItem[] {
    const list = this.filteredBannerList;
    const maxPages = Math.ceil(list.length / this.bannerItemsPerPage) || 1;
    const safePage = Math.min(Math.max(1, this.bannerCurrentPage), maxPages);
    const start = (safePage - 1) * this.bannerItemsPerPage;
    return list.slice(start, start + this.bannerItemsPerPage);
  }

  get bannerTotalPages(): number {
    return Math.ceil(this.filteredBannerList.length / this.bannerItemsPerPage) || 1;
  }

  get bannerPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.bannerTotalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get bannerStartIdx(): number {
    if (this.filteredBannerList.length === 0) return 0;
    return (this.bannerCurrentPage - 1) * this.bannerItemsPerPage + 1;
  }

  get bannerEndIdx(): number {
    return Math.min(
      this.bannerCurrentPage * this.bannerItemsPerPage,
      this.filteredBannerList.length
    );
  }

  // ==========================================
  // BANNER FILTER & PAGINATION
  // ==========================================
  onBannerFilter(): void {
    this.bannerCurrentPage = 1;
    this.cdr.detectChanges();
  }

  onBannerResetFilter(): void {
    this.bannerFilterKeyword = '';
    this.bannerFilterStatus = 'all';
    this.bannerFilterStartDate = '';
    this.bannerFilterEndDate = '';
    this.bannerCurrentPage = 1;
    this.cdr.detectChanges();
  }

  onBannerPageChange(page: number): void {
    if (page >= 1 && page <= this.bannerTotalPages) {
      this.bannerCurrentPage = page;
    }
  }

  // ==========================================
  // BANNER MODAL & CRUD
  // ==========================================
  openCreateBannerModal(): void {
    this.bannerModalMode = 'create';
    this.editingBanner = null;
    this.uploadedFileName = '';
    this.uploadedFileSize = '';
    this.bannerForm = {
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      startDate: '',
      endDate: '',
      order: undefined,
      status: 'Đang hiển thị',
    };
    this.isBannerModalOpen = true;
  }

  openEditBannerModal(banner: BannerItem): void {
    this.bannerModalMode = 'edit';
    this.editingBanner = banner;
    this.uploadedFileName = 'banner-image.webp';
    this.uploadedFileSize = '1.8 MB';
    this.bannerForm = { ...banner };
    this.isBannerModalOpen = true;
  }

  closeBannerModal(): void {
    this.isBannerModalOpen = false;
    this.editingBanner = null;
  }

  onBannerBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('bm-modal-backdrop')) {
      this.closeBannerModal();
    }
  }

  toggleBannerFormStatus(): void {
    this.bannerForm.status =
      this.bannerForm.status === 'Đang hiển thị' ? 'Đã ẩn' : 'Đang hiển thị';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedFileName = file.name;
      this.uploadedFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerForm.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      this.uploadedFileName = file.name;
      this.uploadedFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerForm.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveBanner(): void {
    if (!this.bannerForm.title?.trim()) {
      alert('Vui lòng nhập tiêu đề banner!');
      return;
    }
    if (!this.bannerForm.imageUrl?.trim()) {
      alert('Vui lòng cung cấp đường dẫn ảnh cho banner!');
      return;
    }

    const nextStatus = this.bannerForm.status || 'Đang hiển thị';
    if (this.editingBanner?.status === 'Đang hiển thị' && nextStatus === 'Đã ẩn' && this.activeBannerCount <= 3) {
      alert('Lỗi: Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể chuyển sang trạng thái ẩn.');
      return;
    }

    const payload: Partial<BannerItem> = {
      title: this.bannerForm.title.trim(),
      subtitle: this.bannerForm.subtitle?.trim() || '',
      imageUrl: this.bannerForm.imageUrl.trim(),
      linkUrl: this.bannerForm.linkUrl?.trim() || '',
      startDate: this.bannerForm.startDate?.trim() || '01/01/2026',
      endDate: this.bannerForm.endDate?.trim() || '31/12/2026',
      order: Number(this.bannerForm.order) || (this.bannerList.length + 1),
      status: nextStatus,
    };

    if (this.bannerModalMode === 'create') {
      this.homepageService.createBanner(payload).subscribe({
        next: (created) => {
          this.bannerList.unshift(created);
          this.showToast(`Đã thêm mới "${created.title}"`);
          this.closeBannerModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể tạo Banner.');
          this.cdr.detectChanges();
        },
      });
    } else if (this.editingBanner) {
      const id = this.editingBanner.id;
      this.homepageService.updateBanner(id, payload).subscribe({
        next: (updated) => {
          const index = this.bannerList.findIndex((b) => b.id === id);
          if (index !== -1) {
            this.bannerList[index] = { ...this.bannerList[index], ...updated };
          }
          this.showToast(`Đã cập nhật "${payload.title}"`);
          this.closeBannerModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể cập nhật Banner.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  // Toggle Hide / Show Banner
  promptToggleBanner(banner: BannerItem): void {
    if (banner.status === 'Đang hiển thị') {
      if (this.activeBannerCount <= 3) {
        alert('Lỗi: Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể ẩn banner này.');
        return;
      }
      this.confirmTitle = 'Ẩn banner trang chủ';
      this.confirmMessage = `Bạn có chắc muốn ẩn "${banner.title}" khỏi slider trang chủ không?`;
      this.confirmText = 'Đồng ý ẩn';
      this.confirmType = 'warning';
      this.pendingAction = () => {
        this.homepageService.toggleBanner(banner.id).subscribe({
          next: (res) => {
            banner.status = res.status;
            this.showToast(`Đã ẩn banner "${banner.title}"`);
            this.cdr.detectChanges();
          },
          error: (err) => {
            alert(err.message || 'Không thể thay đổi trạng thái Banner.');
            this.loadBanners();
            this.cdr.detectChanges();
          },
        });
      };
      this.isConfirmOpen = true;
    } else {
      this.homepageService.toggleBanner(banner.id).subscribe({
        next: (res) => {
          banner.status = res.status;
          this.showToast(`Đã kích hoạt hiển thị banner "${banner.title}"`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể thay đổi trạng thái Banner.');
          this.loadBanners();
          this.cdr.detectChanges();
        },
      });
    }
  }

  // Delete Banner
  promptDeleteBanner(banner: BannerItem): void {
    if (banner.status === 'Đang hiển thị' && this.activeBannerCount <= 3) {
      alert('Lỗi: Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể xóa banner đang hiển thị này.');
      return;
    }
    this.confirmTitle = 'Xác nhận xóa banner';
    this.confirmMessage = `Bạn có chắc muốn xóa vĩnh viễn "${banner.title}"? Thao tác này không thể hoàn tác.`;
    this.confirmText = 'Xóa banner';
    this.confirmType = 'danger';
    this.pendingAction = () => {
      this.homepageService.deleteBanner(banner.id).subscribe({
        next: () => {
          this.bannerList = this.bannerList.filter((b) => b.id !== banner.id);
          this.showToast(`Đã xóa banner "${banner.title}"`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể xóa banner.');
          this.loadBanners();
          this.cdr.detectChanges();
        },
      });
    };
    this.isConfirmOpen = true;
  }

  onBannerImgError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    imgEl.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80';
  }

  // ==========================================
  // BRAND COMPUTED / GETTERS
  // ==========================================
  get filteredBrandList(): BrandItem[] {
    return this.brandList.filter((item) => {
      const matchKeyword =
        !this.brandFilterKeyword ||
        item.name.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase()) ||
        item.origin.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase()) ||
        item.description.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase());
      const matchStatus =
        this.brandFilterStatus === 'all' || item.status === this.brandFilterStatus;
      return matchKeyword && matchStatus;
    });
  }

  get paginatedBrandList(): BrandItem[] {
    const start = (this.brandCurrentPage - 1) * this.brandItemsPerPage;
    return this.filteredBrandList.slice(start, start + this.brandItemsPerPage);
  }

  get brandTotalPages(): number {
    return Math.ceil(this.filteredBrandList.length / this.brandItemsPerPage) || 1;
  }

  get brandPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.brandTotalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get brandStartIdx(): number {
    if (this.filteredBrandList.length === 0) return 0;
    return (this.brandCurrentPage - 1) * this.brandItemsPerPage + 1;
  }

  get brandEndIdx(): number {
    return Math.min(
      this.brandCurrentPage * this.brandItemsPerPage,
      this.filteredBrandList.length
    );
  }

  // Brand Filter & Pagination handlers
  onBrandFilter(): void {
    this.brandCurrentPage = 1;
  }

  onBrandResetFilter(): void {
    this.brandFilterKeyword = '';
    this.brandFilterStatus = 'all';
    this.brandCurrentPage = 1;
  }

  onBrandPageChange(page: number): void {
    if (page >= 1 && page <= this.brandTotalPages) {
      this.brandCurrentPage = page;
    }
  }

  // Brand Modal & CRUD
  get brandWordCount(): number {
    const text = (this.brandForm.description || '').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }

  openCreateBrandModal(): void {
    this.brandModalMode = 'create';
    this.editingBrand = null;
    this.brandForm = {
      name: '',
      origin: '',
      description: '',
      status: 'Đang hiển thị',
    };
    this.isBrandModalOpen = true;
  }

  openEditBrandModal(brand: BrandItem): void {
    this.brandModalMode = 'edit';
    this.editingBrand = brand;
    this.brandForm = { ...brand };
    this.isBrandModalOpen = true;
  }

  closeBrandModal(): void {
    this.isBrandModalOpen = false;
    this.editingBrand = null;
  }

  onBrandBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('bm-modal-backdrop')) {
      this.closeBrandModal();
    }
  }

  saveBrand(): void {
    if (!this.brandForm.name?.trim()) {
      alert('Vui lòng nhập tiêu đề thương hiệu!');
      return;
    }
    if (!this.brandForm.description?.trim()) {
      alert('Vui lòng nhập nội dung giới thiệu thương hiệu!');
      return;
    }

    if (this.brandWordCount > 1000) {
      alert(`Nội dung giới thiệu thương hiệu đã vượt quá giới hạn 1000 từ (hiện tại có ${this.brandWordCount} từ). Vui lòng rút gọn trước khi lưu!`);
      return;
    }

    const payload: Partial<BrandItem> = {
      name: this.brandForm.name.trim(),
      origin: '',
      description: this.brandForm.description.trim(),
      status: this.brandForm.status || 'Đang hiển thị',
    };

    if (this.brandModalMode === 'create') {
      this.homepageService.createBrand(payload).subscribe({
        next: (created) => {
          if (created.status === 'Đang hiển thị') {
            this.brandList.forEach((b) => (b.status = 'Đã ẩn'));
          }
          this.brandList.unshift(created);
          this.showToast(
            created.status === 'Đang hiển thị'
              ? `Đã thêm mới và kích hoạt thương hiệu "${created.name}". Các thương hiệu khác đã tự động chuyển sang ẩn.`
              : `Đã thêm mới thương hiệu "${created.name}"`
          );
          this.closeBrandModal();
          this.loadBrands();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể tạo thương hiệu.');
          this.cdr.detectChanges();
        },
      });
    } else if (this.editingBrand) {
      const id = this.editingBrand.id;
      this.homepageService.updateBrand(id, payload).subscribe({
        next: (updated) => {
          if (updated.status === 'Đang hiển thị') {
            this.brandList.forEach((b) => {
              if (b.id !== id) b.status = 'Đã ẩn';
            });
          }
          const index = this.brandList.findIndex((b) => b.id === id);
          if (index !== -1) {
            this.brandList[index] = { ...this.brandList[index], ...updated };
          }
          this.showToast(
            updated.status === 'Đang hiển thị'
              ? `Đã kích hoạt hiển thị thương hiệu "${payload.name}". Các thương hiệu khác đã tự động chuyển sang ẩn.`
              : `Đã cập nhật thương hiệu "${payload.name}"`
          );
          this.closeBrandModal();
          this.loadBrands();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể cập nhật thương hiệu.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  promptToggleBrand(brand: BrandItem): void {
    if (brand.status === 'Đang hiển thị') {
      this.confirmTitle = 'Ẩn thương hiệu';
      this.confirmMessage = `Bạn có chắc muốn ẩn thương hiệu "${brand.name}" khỏi danh mục trang chủ không? (Nếu ẩn, web người dùng sẽ trở về thương hiệu mặc định)`;
      this.confirmText = 'Đồng ý ẩn';
      this.confirmType = 'warning';
      this.pendingAction = () => {
        this.homepageService.toggleBrand(brand.id).subscribe({
          next: (res) => {
            brand.status = res.status;
            this.showToast(`Đã ẩn thương hiệu "${brand.name}"`);
            this.loadBrands();
            this.cdr.detectChanges();
          },
          error: (err) => {
            alert(err.message || 'Không thể thay đổi trạng thái thương hiệu.');
            this.cdr.detectChanges();
          },
        });
      };
      this.isConfirmOpen = true;
    } else {
      this.homepageService.toggleBrand(brand.id).subscribe({
        next: (res) => {
          this.brandList.forEach((b) => {
            if (b.id !== brand.id) b.status = 'Đã ẩn';
          });
          brand.status = res.status;
          this.showToast(
            `Đã kích hoạt hiển thị thương hiệu "${brand.name}". Các thương hiệu khác đã tự động chuyển sang ẩn.`
          );
          this.loadBrands();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể thay đổi trạng thái thương hiệu.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  promptDeleteBrand(brand: BrandItem): void {
    this.confirmTitle = 'Xác nhận xóa thương hiệu';
    this.confirmMessage = `Bạn có chắc muốn xóa thương hiệu "${brand.name}"? Thao tác này không thể hoàn tác.`;
    this.confirmText = 'Xóa thương hiệu';
    this.confirmType = 'danger';
    this.pendingAction = () => {
      this.homepageService.deleteBrand(brand.id).subscribe({
        next: () => {
          this.brandList = this.brandList.filter((b) => b.id !== brand.id);
          this.showToast(`Đã xóa thương hiệu "${brand.name}"`);
          this.loadBrands();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể xóa thương hiệu.');
          this.cdr.detectChanges();
        },
      });
    };
    this.isConfirmOpen = true;
  }

  // ==========================================
  // FOOTER ACTIONS
  // ==========================================
  saveFooterConfig(): void {
    if (!this.footerConfig || this.footerConfig.length === 0) {
      this.showToast('Không có cấu hình footer để lưu.');
      return;
    }

    let savedCount = 0;
    this.footerConfig.forEach((item) => {
      if (item.id) {
        this.homepageService.updateFooter(item.id, item).subscribe({
          next: () => {
            savedCount++;
            if (savedCount === this.footerConfig.length) {
              this.showToast('Thay đổi cấu hình Footer đã được lưu thành công vào cơ sở dữ liệu!');
            }
          },
          error: (err) => console.error('Error updating footer item:', err),
        });
      }
    });
  }

  resetFooterConfig(): void {
    this.loadFooters();
    this.showToast('Đã tải lại cài đặt Footer từ hệ thống.');
  }

  // Row Action handler
  handleAction(event: TableActionEvent<MarqueeItem>): void {
    const item = event.row;
    if (event.action === 'edit') {
      this.openEditModal(item);
    } else if (event.action === 'hide') {
      this.promptHideItem(item);
    } else if (event.action === 'show') {
      if (this.activeCount >= 5) {
        alert('Lỗi: Hệ thống chỉ cho phép tối đa 5 thông báo Marquee hoạt động cùng lúc! Vui lòng tắt/ẩn bớt thông báo khác trước.');
        this.showToast('Hạn ngạch đã đạt tối đa 5 thông báo đang hoạt động!');
        return;
      }
      this.toggleStatus(item, 'Đang hoạt động');
    }
  }

  promptHideItem(item: MarqueeItem): void {
    this.confirmTitle = 'Xác nhận ẩn thông báo';
    this.confirmMessage = `Bạn có chắc chắn muốn ẩn thông báo "${item.code}" khỏi thanh chạy trang chủ không?`;
    this.confirmText = 'Đồng ý ẩn';
    this.confirmType = 'warning';
    this.pendingAction = () => this.toggleStatus(item, 'Đã ẩn');
    this.isConfirmOpen = true;
  }

  onConfirmAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.isConfirmOpen = false;
  }

  onCancelConfirm(): void {
    this.pendingAction = null;
    this.isConfirmOpen = false;
  }

  private toggleStatus(item: MarqueeItem, newStatus: 'Đang hoạt động' | 'Đã ẩn'): void {
    if (newStatus === 'Đang hoạt động' && this.activeCount >= 5) {
      alert('Lỗi: Hệ thống chỉ cho phép tối đa 5 thông báo Marquee hoạt động cùng lúc! Vui lòng tắt/ẩn bớt thông báo khác trước.');
      return;
    }

    this.homepageService.toggleMarquee(item.id).subscribe({
      next: (res) => {
        item.status = res.status;
        this.showToast(
          res.status === 'Đang hoạt động'
            ? `Đã kích hoạt thông báo ${item.code}`
            : `Đã ẩn thông báo ${item.code}`
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.message || 'Lỗi thay đổi trạng thái.');
        this.loadMarquees();
        this.cdr.detectChanges();
      },
    });
  }

  // Modal Open/Close
  openCreateModal(): void {
    if (this.activeCount >= 5) {
      this.showToast('Hạn ngạch đã đạt tối đa 5 thông báo! Vui lòng ẩn bớt thông báo cũ.');
    }
    this.modalMode = 'create';
    this.editingItem = null;
    const nextNum = this.marqueeList.length + 1;
    const code = `#MQ-0${nextNum < 100 ? (nextNum < 10 ? '0' + nextNum : nextNum) : nextNum}`;
    this.notificationForm = {
      code,
      title: '',
      iconType: 'truck',
      startDate: '',
      endDate: '',
      order: undefined,
      status: this.activeCount < 5 ? 'Đang hoạt động' : 'Đã ẩn',
    };
    this.isModalOpen = true;
  }

  openEditModal(item: MarqueeItem): void {
    this.modalMode = 'edit';
    this.editingItem = item;
    this.notificationForm = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingItem = null;
  }

  saveNotification(): void {
    if (!this.notificationForm.title?.trim()) {
      alert('Vui lòng nhập nội dung thông báo!');
      return;
    }

    const nextStatus = this.notificationForm.status || 'Đang hoạt động';
    if (nextStatus === 'Đang hoạt động') {
      if (this.modalMode === 'create' && this.activeCount >= 5) {
        alert('Lỗi: Hệ thống chỉ cho phép tối đa 5 thông báo Marquee hoạt động cùng lúc! Vui lòng chọn trạng thái "Đã ẩn" hoặc tắt bớt thông báo đang hoạt động khác.');
        return;
      }
      if (this.modalMode === 'edit' && this.editingItem?.status !== 'Đang hoạt động' && this.activeCount >= 5) {
        alert('Lỗi: Hệ thống chỉ cho phép tối đa 5 thông báo Marquee hoạt động cùng lúc! Vui lòng tắt bớt thông báo khác trước khi kích hoạt thông báo này.');
        return;
      }
    }

    const payload: Partial<MarqueeItem> = {
      code: this.notificationForm.code || `#MQ-${Math.floor(100 + Math.random() * 900)}`,
      title: this.notificationForm.title.trim(),
      iconType: this.notificationForm.iconType || 'truck',
      startDate: this.notificationForm.startDate || this.formatTodayDate(),
      endDate: this.notificationForm.endDate || '31/12/2026',
      order: Number(this.notificationForm.order) || 1,
      status: nextStatus,
    };

    if (this.modalMode === 'create') {
      this.homepageService.createMarquee(payload).subscribe({
        next: (created) => {
          this.marqueeList.unshift(created);
          this.showToast(`Đã thêm mới thông báo ${created.code}`);
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể tạo thông báo Marquee.');
          this.cdr.detectChanges();
        },
      });
    } else if (this.editingItem) {
      const id = this.editingItem.id;
      this.homepageService.updateMarquee(id, payload).subscribe({
        next: (updated) => {
          const index = this.marqueeList.findIndex((m) => m.id === id);
          if (index !== -1) {
            this.marqueeList[index] = { ...this.marqueeList[index], ...updated };
          }
          this.showToast(`Đã cập nhật thông báo ${payload.code || this.editingItem?.code}`);
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.message || 'Không thể cập nhật thông báo.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3500);
  }

  private formatTodayDate(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
