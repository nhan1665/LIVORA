import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Customer as CustomerRecord,
  CustomerAddress,
  CustomerDraft,
  CustomerListQuery,
  CustomerListSummary,
  CustomerStatusFilter,
  CustomerTypeFilter,
} from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer.html',
})
export class Customer implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 10;

  // State signals
  readonly customers = signal<CustomerRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(125);
  readonly totalPages = signal(13);
  readonly currentPage = signal(1);

  readonly summary = signal<CustomerListSummary>({
    totalCustomers: 125,
    registeredCustomers: 94,
    guestCustomers: 31,
    activeThisMonth: 118,
  });

  // Filter drafts and active filters
  searchDraft = '';
  customerTypeDraft: CustomerTypeFilter = 'all';
  statusDraft: CustomerStatusFilter = 'all';

  activeSearch = '';
  activeCustomerType: CustomerTypeFilter = 'all';
  activeStatus: CustomerStatusFilter = 'all';

  // Detail Modal state
  readonly isDetailModalOpen = signal(false);
  readonly selectedCustomer = signal<CustomerRecord | null>(null);
  readonly activeModalTab = signal<'detail' | 'orders'>('detail');
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);

  // Edit form model
  editForm: CustomerDraft = {
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'Nam',
    status: 'active',
    customerType: 'registered',
    tierSubtitle: '',
  };

  // Add address modal state
  readonly isAddAddressModalOpen = signal(false);
  newAddressForm = {
    label: '',
    recipientName: '',
    recipientPhone: '',
    street: '',
    ward: '',
    district: '',
    province: 'TP. Hồ Chí Minh',
    note: '',
    isDefault: false,
  };

  // Toast feedback
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.loadError.set('');

    const query: CustomerListQuery = {
      search: this.activeSearch,
      customerType: this.activeCustomerType,
      status: this.activeStatus,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.customerService.listCustomers(query).subscribe({
      next: (res) => {
        this.customers.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.summary.set(res.summary);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError.set('Không thể tải danh sách khách hàng. Vui lòng thử lại.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.activeSearch = this.searchDraft;
    this.activeCustomerType = this.customerTypeDraft;
    this.activeStatus = this.statusDraft;
    this.currentPage.set(1);
    this.loadCustomers();
  }

  resetFilter(): void {
    this.searchDraft = '';
    this.customerTypeDraft = 'all';
    this.statusDraft = 'all';
    this.activeSearch = '';
    this.activeCustomerType = 'all';
    this.activeStatus = 'all';
    this.currentPage.set(1);
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadCustomers();
  }

  openDetailModal(customer: CustomerRecord, tab: 'detail' | 'orders' = 'detail'): void {
    this.selectedCustomer.set(customer);
    this.activeModalTab.set(tab);
    this.isEditMode.set(false);
    this.initEditForm(customer);
    this.isDetailModalOpen.set(true);
  }

  openEditModal(customer: CustomerRecord): void {
    this.openDetailModal(customer, 'detail');
    this.isEditMode.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.isEditMode.set(false);
    this.selectedCustomer.set(null);
  }

  switchModalTab(tab: 'detail' | 'orders'): void {
    this.activeModalTab.set(tab);
  }

  toggleEditMode(): void {
    const nextMode = !this.isEditMode();
    this.isEditMode.set(nextMode);
    if (nextMode && this.selectedCustomer()) {
      this.initEditForm(this.selectedCustomer()!);
    }
  }

  private initEditForm(customer: CustomerRecord): void {
    this.editForm = {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      birthDate: customer.birthDate || '',
      gender: customer.gender || 'Nam',
      status: customer.status,
      customerType: customer.customerType,
      tierSubtitle: customer.tierSubtitle || '',
    };
  }

  saveEdit(): void {
    const current = this.selectedCustomer();
    if (!current) return;

    if (!this.editForm.fullName.trim()) {
      this.showToast('Vui lòng nhập họ và tên khách hàng.', 'error');
      return;
    }

    if (!this.editForm.phone.trim()) {
      this.showToast('Vui lòng nhập số điện thoại.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.customerService.updateCustomer(current.id, this.editForm).subscribe({
      next: (updated) => {
        this.selectedCustomer.set(updated);
        this.isEditMode.set(false);
        this.isSubmitting.set(false);
        this.showToast('Cập nhật thông tin khách hàng thành công.', 'success');
        this.loadCustomers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.showToast('Lỗi khi cập nhật khách hàng.', 'error');
      },
    });
  }

  toggleCustomerStatus(customer: CustomerRecord, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.customerService.toggleStatus(customer.id).subscribe({
      next: (updated) => {
        if (this.selectedCustomer()?.id === updated.id) {
          this.selectedCustomer.set(updated);
        }
        const actionLabel = updated.status === 'active' ? 'Kích hoạt' : 'Ngừng hoạt động';
        this.showToast(`${actionLabel} khách hàng ${updated.fullName} thành công.`, 'success');
        this.loadCustomers();
      },
      error: () => {
        this.showToast('Không thể thay đổi trạng thái khách hàng.', 'error');
      },
    });
  }

  setDefaultAddress(addressId: string): void {
    const current = this.selectedCustomer();
    if (!current) return;

    this.customerService.setDefaultAddress(current.id, addressId).subscribe({
      next: (updated) => {
        this.selectedCustomer.set(updated);
        this.showToast('Đã đặt làm địa chỉ mặc định.', 'success');
        this.loadCustomers();
      },
      error: () => {
        this.showToast('Không thể cập nhật địa chỉ mặc định.', 'error');
      },
    });
  }

  openAddAddressModal(): void {
    const current = this.selectedCustomer();
    this.newAddressForm = {
      label: `Địa chỉ ${(current?.addresses.length || 0) + 1}`,
      recipientName: current?.fullName || '',
      recipientPhone: current?.phone || '',
      street: '',
      ward: '',
      district: '',
      province: 'TP. Hồ Chí Minh',
      note: '',
      isDefault: (current?.addresses.length || 0) === 0,
    };
    this.isAddAddressModalOpen.set(true);
  }

  closeAddAddressModal(): void {
    this.isAddAddressModalOpen.set(false);
  }

  saveNewAddress(): void {
    const current = this.selectedCustomer();
    if (!current) return;

    if (!this.newAddressForm.street.trim()) {
      this.showToast('Vui lòng nhập địa chỉ đường/số nhà.', 'error');
      return;
    }

    const fullAddr = [
      this.newAddressForm.street,
      this.newAddressForm.ward,
      this.newAddressForm.district,
      this.newAddressForm.province,
    ]
      .filter((s) => s.trim().length > 0)
      .join(', ');

    const newAddr: Omit<CustomerAddress, 'addressId'> = {
      label: this.newAddressForm.label || 'Địa chỉ nhận hàng',
      recipientName: this.newAddressForm.recipientName || current.fullName,
      recipientPhone: this.newAddressForm.recipientPhone || current.phone,
      street: this.newAddressForm.street,
      ward: this.newAddressForm.ward,
      district: this.newAddressForm.district,
      province: this.newAddressForm.province,
      fullAddress: fullAddr,
      note: this.newAddressForm.note,
      isDefault: this.newAddressForm.isDefault,
    };

    this.customerService.addAddress(current.id, newAddr).subscribe({
      next: (updated) => {
        this.selectedCustomer.set(updated);
        this.isAddAddressModalOpen.set(false);
        this.showToast('Đã thêm địa chỉ mới.', 'success');
        this.loadCustomers();
      },
      error: () => {
        this.showToast('Không thể thêm địa chỉ mới.', 'error');
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
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
