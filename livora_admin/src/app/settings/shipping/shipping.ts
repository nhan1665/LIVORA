import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../shared/form-modal/form-modal';
import {
  ShippingConfig as ShippingRecord,
  ShippingDraft,
  ShippingListQuery,
  ShippingMethod,
  ShippingMethodFilter,
  ShippingStatusFilter,
} from './shipping.model';
import { ShippingService } from './shipping.service';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [FormsModule, FormModal],
  templateUrl: './shipping.html',
  // Note: shipping styles live in settings.css and are imported globally via styles.css
  // to stay below the 8 kB angular component style budget (team convention).
})
export class Shipping implements OnInit {
  private readonly shippingService = inject(ShippingService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 6;

  readonly configs = signal<ShippingRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly activeCount = signal(0);

  searchDraft = '';
  methodDraft: ShippingMethodFilter = 'all';
  statusDraft: ShippingStatusFilter = 'all';

  activeSearch = '';
  activeMethod: ShippingMethodFilter = 'all';
  activeStatus: ShippingStatusFilter = 'all';

  readonly provinces = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Bình Dương',
    'Đồng Nai',
    'Khánh Hoà',
    'Quảng Ninh',
    'Huế',
    'Lâm Đồng',
    'Nghệ An',
    'Bắc Ninh',
    'Thanh Hoá',
    'Long An',
    'Bà Rịa - Vũng Tàu',
    'Quảng Nam',
    'Vĩnh Phúc',
    'Hải Dương',
    'Thái Nguyên',
    'Bình Định',
    'Phú Yên',
    'Quảng Ngãi',
    'Ninh Bình',
    'Nam Định',
    'Thừa Thiên Huế',
    'Đắk Lắk',
  ];

  readonly timeSlots = [
    'Theo lịch hẹn gia chủ (Bespoke Slot)',
    'Khung giờ hành chính (9:00 - 18:00)',
    'Khung giờ ưu tiên',
    'Linh hoạt theo yêu cầu',
  ];

  readonly selectedConfig = signal<ShippingRecord | null>(null);
  readonly isFormModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingConfigId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');

  formDraft: ShippingDraft = this.emptyDraft();

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading.set(true);
    this.loadError.set('');

    const query: ShippingListQuery = {
      search: this.activeSearch,
      method: this.activeMethod,
      status: this.activeStatus,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.shippingService.listConfigs(query).subscribe({
      next: (res) => {
        this.configs.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.activeCount.set(res.activeCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError.set('Không thể tải cấu hình vận chuyển. Vui lòng thử lại.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.activeSearch = this.searchDraft;
    this.activeMethod = this.methodDraft;
    this.activeStatus = this.statusDraft;
    this.currentPage.set(1);
    this.loadConfigs();
  }

  resetFilter(): void {
    this.searchDraft = '';
    this.methodDraft = 'all';
    this.statusDraft = 'all';
    this.activeSearch = '';
    this.activeMethod = 'all';
    this.activeStatus = 'all';
    this.currentPage.set(1);
    this.loadConfigs();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadConfigs();
  }

  getPaginationPages(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingConfigId.set(null);
    this.formError.set('');
    this.formDraft = this.emptyDraft();
    this.isFormModalOpen.set(true);
  }

  openEditModal(config: ShippingRecord): void {
    this.isEditMode.set(true);
    this.editingConfigId.set(config.id);
    this.formError.set('');
    this.formDraft = {
      shippingMethod: config.shippingMethod,
      province: config.province,
      hub: config.hub || '',
      fee: config.fee,
      estimatedDeliveryTime: config.estimatedDeliveryTime,
      freeShipEnabled: config.freeShipEnabled ?? false,
      freeShipThreshold: config.freeShipThreshold ?? 0,
      timeSlot: config.timeSlot || this.timeSlots[0],
      whiteGloveIncluded: config.whiteGloveIncluded ?? true,
      isActive: config.isActive,
    };
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.formError.set('');
  }

  saveConfig(): void {
    this.isSubmitting.set(true);
    this.formError.set('');
    this.formDraft.hub = this.formDraft.hub?.trim() || this.defaultHub(this.formDraft.province);

    const request$ =
      this.isEditMode() && this.editingConfigId()
        ? this.shippingService.updateConfig(this.editingConfigId()!, this.formDraft)
        : this.shippingService.createConfig(this.formDraft);

    request$.subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        this.isFormModalOpen.set(false);
        this.showToast(
          this.isEditMode()
            ? `Đã cập nhật cấu hình vận chuyển ${saved.province}.`
            : `Đã thêm cấu hình vận chuyển cho ${saved.province}.`,
          'success'
        );
        this.loadConfigs();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.formError.set(err.message || 'Không thể lưu cấu hình vận chuyển.');
      },
    });
  }

  toggleConfig(config: ShippingRecord): void {
    this.shippingService.toggleConfig(config.id).subscribe({
      next: (updated) => {
        const action = updated.isActive ? 'áp dụng' : 'ngừng áp dụng';
        this.showToast(`Đã ${action} cấu hình vận chuyển ${updated.province}.`, 'success');
        this.loadConfigs();
      },
      error: () => {
        this.showToast('Không thể thay đổi trạng thái cấu hình vận chuyển.', 'error');
      },
    });
  }

  methodLabel(method: ShippingMethod): string {
    return method === 'standard' ? 'Giao tiêu chuẩn' : 'Giao nhanh';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return iso;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private emptyDraft(): ShippingDraft {
    return {
      shippingMethod: 'standard',
      province: 'TP. Hồ Chí Minh',
      hub: '',
      fee: 30000,
      estimatedDeliveryTime: '2 - 4 ngày',
      freeShipEnabled: false,
      freeShipThreshold: 5000000,
      timeSlot: 'Theo lịch hẹn gia chủ (Bespoke Slot)',
      whiteGloveIncluded: true,
      isActive: true,
    };
  }

  private defaultHub(province: string): string {
    return `Trung tâm ${province}`;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.cdr.markForCheck();
    }, 3500);
    this.cdr.markForCheck();
  }
}
