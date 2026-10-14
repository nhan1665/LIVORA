import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../shared/form-modal/form-modal';
import {
  Voucher as VoucherRecord,
  VoucherDiscountType,
  VoucherDiscountTypeFilter,
  VoucherDraft,
  VoucherListQuery,
  VoucherStatusFilter,
  VoucherTimeFilter,
} from './voucher.model';
import { VoucherService } from './voucher.service';

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [FormsModule, FormModal],
  templateUrl: './voucher.html',
  // Note: voucher styles live in settings.css and are imported globally via styles.css
  // to stay below the 8 kB angular component style budget (team convention).
})
export class Voucher implements OnInit {
  private readonly voucherService = inject(VoucherService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 5;

  readonly vouchers = signal<VoucherRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly activeCount = signal(0);

  searchDraft = '';
  discountTypeDraft: VoucherDiscountTypeFilter = 'all';
  statusDraft: VoucherStatusFilter = 'all';
  timeDraft: VoucherTimeFilter = 'all';

  activeSearch = '';
  activeDiscountType: VoucherDiscountTypeFilter = 'all';
  activeStatus: VoucherStatusFilter = 'all';
  activeTime: VoucherTimeFilter = 'all';

  readonly selectedVoucher = signal<VoucherRecord | null>(null);
  readonly isFormModalOpen = signal(false);
  readonly isDetailModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingVoucherId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');

  formStart = '';
  formEnd = '';

  formDraft: VoucherDraft = this.emptyDraft();

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.loading.set(true);
    this.loadError.set('');

    const query: VoucherListQuery = {
      search: this.activeSearch,
      discountType: this.activeDiscountType,
      status: this.activeStatus,
      time: this.activeTime,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.voucherService.listVouchers(query).subscribe({
      next: (res) => {
        this.vouchers.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.activeCount.set(res.activeCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError.set('Không thể tải danh sách voucher. Vui lòng thử lại.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.activeSearch = this.searchDraft;
    this.activeDiscountType = this.discountTypeDraft;
    this.activeStatus = this.statusDraft;
    this.activeTime = this.timeDraft;
    this.currentPage.set(1);
    this.loadVouchers();
  }

  resetFilter(): void {
    this.searchDraft = '';
    this.discountTypeDraft = 'all';
    this.statusDraft = 'all';
    this.timeDraft = 'all';
    this.activeSearch = '';
    this.activeDiscountType = 'all';
    this.activeStatus = 'all';
    this.activeTime = 'all';
    this.currentPage.set(1);
    this.loadVouchers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadVouchers();
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
    this.editingVoucherId.set(null);
    this.formError.set('');
    this.formDraft = this.emptyDraft();
    // Default: start now, end 30 days later
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.formStart = this.toLocalInput(now.toISOString());
    this.formEnd = this.toLocalInput(end.toISOString());
    this.isFormModalOpen.set(true);
  }

  openEditModal(voucher: VoucherRecord): void {
    this.isEditMode.set(true);
    this.editingVoucherId.set(voucher.id);
    this.formError.set('');
    this.formDraft = {
      code: voucher.code,
      title: voucher.title,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minOrderValue: voucher.minOrderValue,
      quantity: voucher.quantity,
      perCustomerLimit: voucher.perCustomerLimit ?? 1,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      isActive: voucher.isActive,
    };
    this.formStart = this.toLocalInput(voucher.startDate);
    this.formEnd = this.toLocalInput(voucher.endDate);
    this.isFormModalOpen.set(true);
  }

  openDetailModal(voucher: VoucherRecord): void {
    this.selectedVoucher.set(voucher);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedVoucher.set(null);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.formError.set('');
  }

  saveVoucher(): void {
    this.isSubmitting.set(true);
    this.formError.set('');

    const draft: VoucherDraft = {
      ...this.formDraft,
      startDate: this.formStart ? new Date(this.formStart).toISOString() : '',
      endDate: this.formEnd ? new Date(this.formEnd).toISOString() : '',
    };

    const request$ =
      this.isEditMode() && this.editingVoucherId()
        ? this.voucherService.updateVoucher(this.editingVoucherId()!, draft)
        : this.voucherService.createVoucher(draft);

    request$.subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        this.isFormModalOpen.set(false);
        this.showToast(
          this.isEditMode()
            ? `Đã cập nhật voucher ${saved.code}.`
            : `Đã tạo voucher ${saved.code} với ${saved.quantity} lượt phát hành.`,
          'success'
        );
        this.loadVouchers();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.formError.set(err.message || 'Không thể lưu voucher. Vui lòng kiểm tra lại thông tin.');
      },
    });
  }

  toggleVoucher(voucher: VoucherRecord): void {
    this.voucherService.toggleVoucher(voucher.id).subscribe({
      next: (updated) => {
        const action = updated.isActive ? 'kích hoạt' : 'tạm tắt';
        this.showToast(`Đã ${action} voucher ${updated.code}.`, 'success');
        this.loadVouchers();
      },
      error: () => {
        this.showToast('Không thể thay đổi trạng thái voucher.', 'error');
      },
    });
  }

  discountTypeLabel(type: VoucherDiscountType): string {
    return type === 'percentage' ? 'Giảm theo %' : 'Giảm cố định';
  }

  formatDiscount(voucher: VoucherRecord): string {
    return voucher.discountType === 'percentage'
      ? `${voucher.discountValue}%`
      : this.formatCurrency(voucher.discountValue);
  }

  usagePercent(voucher: VoucherRecord): number {
    if (voucher.quantity <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((voucher.usedCount / voucher.quantity) * 100));
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

  private emptyDraft(): VoucherDraft {
    return {
      code: '',
      title: '',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscountAmount: 25000000,
      minOrderValue: 50000000,
      quantity: 100,
      perCustomerLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
    };
  }

  private toLocalInput(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
