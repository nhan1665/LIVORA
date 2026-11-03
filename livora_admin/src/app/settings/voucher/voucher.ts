import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormModal } from '../../shared/form-modal/form-modal';
import {
  Voucher as VoucherRecord,
  VoucherDiscountType,
  VoucherDiscountTypeFilter,
  VoucherDraft,
  VoucherListQuery,
  VoucherStatusFilter,
  VoucherTargetType,
  VoucherTimeFilter,
} from './voucher.model';
import { VoucherService } from './voucher.service';
import { ExcelService } from '../../shared/services/excel.service';
import { environment } from '../../../environments/environment';

export interface CustomerPickerItem {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  accumulatedSpent: number;
  createdAt: string;
}

export interface ImportReportData {
  open: boolean;
  title: string;
  successCount: number;
  updatedCount: number;
  insertedCount: number;
  total: number;
  errors: string[];
}

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
  private readonly excelService = inject(ExcelService);
  private readonly http = inject(HttpClient);
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

  // === Khách hàng chỉ định & Bộ lọc thông minh ===
  readonly allCustomers = signal<CustomerPickerItem[]>([]);
  readonly loadingCustomers = signal(false);
  selectedCustomerIds = new Set<string>();

  customerSearchText = '';
  customerOrderFilter: 'all' | 'no_orders' | 'has_orders' | 'loyal' | 'vip' = 'all';
  customerDateFilter: 'all' | '7days' | '30days' | '90days' = 'all';

  // === Excel Import & Export ===
  readonly isImporting = signal(false);
  readonly importReport = signal<ImportReportData>({
    open: false,
    title: '',
    successCount: 0,
    updatedCount: 0,
    insertedCount: 0,
    total: 0,
    errors: [],
  });

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadVouchers();
    this.loadAllCustomers();
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

  loadAllCustomers(): void {
    if (this.allCustomers().length > 0) return;
    this.loadingCustomers.set(true);

    this.http.get<any>(`${environment.apiBaseUrl}/customers?all=true`).subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped: CustomerPickerItem[] = list.map((c: any) => ({
          id: c.id || c._id?.toString() || '',
          code: c.code || `#KH-${(c.id || c._id || '').slice(-4).toUpperCase()}`,
          fullName: c.fullName || 'Khách hàng',
          email: c.email || '',
          phone: c.phone || '',
          totalOrders: Number(c.totalOrders) || 0,
          accumulatedSpent: Number(c.accumulatedSpent) || 0,
          createdAt: c.createdAt || new Date().toISOString(),
        }));
        this.allCustomers.set(mapped);
        this.loadingCustomers.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCustomers.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  get filteredCustomers(): CustomerPickerItem[] {
    const term = this.customerSearchText.trim().toLowerCase();
    const orderFilter = this.customerOrderFilter;
    const dateFilter = this.customerDateFilter;

    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return this.allCustomers().filter((c) => {
      if (term) {
        const matchName = (c.fullName || '').toLowerCase().includes(term);
        const matchPhone = (c.phone || '').toLowerCase().includes(term);
        const matchEmail = (c.email || '').toLowerCase().includes(term);
        const matchCode = (c.code || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchEmail && !matchCode) {
          return false;
        }
      }

      if (orderFilter === 'no_orders' && c.totalOrders > 0) {
        return false;
      }
      if (orderFilter === 'has_orders' && c.totalOrders < 1) {
        return false;
      }
      if (orderFilter === 'loyal' && c.totalOrders < 3) {
        return false;
      }
      if (orderFilter === 'vip' && c.accumulatedSpent < 10000000 && c.totalOrders < 5) {
        return false;
      }

      if (dateFilter !== 'all' && c.createdAt) {
        const createdTime = new Date(c.createdAt).getTime();
        if (!isNaN(createdTime)) {
          const diffDays = (now - createdTime) / dayMs;
          if (dateFilter === '7days' && diffDays > 7) return false;
          if (dateFilter === '30days' && diffDays > 30) return false;
          if (dateFilter === '90days' && diffDays > 90) return false;
        }
      }

      return true;
    });
  }

  isCustomerSelected(id: string): boolean {
    return this.selectedCustomerIds.has(id);
  }

  toggleCustomer(id: string): void {
    if (this.selectedCustomerIds.has(id)) {
      this.selectedCustomerIds.delete(id);
    } else {
      this.selectedCustomerIds.add(id);
    }
  }

  selectAllFiltered(): void {
    const filtered = this.filteredCustomers;
    for (const c of filtered) {
      this.selectedCustomerIds.add(c.id);
    }
  }

  selectAllTotal(): void {
    for (const c of this.allCustomers()) {
      this.selectedCustomerIds.add(c.id);
    }
  }

  deselectAllFiltered(): void {
    const filtered = this.filteredCustomers;
    for (const c of filtered) {
      this.selectedCustomerIds.delete(c.id);
    }
  }

  clearAllSelected(): void {
    this.selectedCustomerIds.clear();
  }

  removeSelected(id: string): void {
    this.selectedCustomerIds.delete(id);
  }

  getSelectedCustomerItems(): CustomerPickerItem[] {
    const ids = this.selectedCustomerIds;
    return this.allCustomers().filter((c) => ids.has(c.id));
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
    this.selectedCustomerIds.clear();
    this.customerSearchText = '';
    this.customerOrderFilter = 'all';
    this.customerDateFilter = 'all';

    this.formStart = '';
    this.formEnd = '';
    this.loadAllCustomers();
    this.isFormModalOpen.set(true);
  }

  openEditModal(voucher: VoucherRecord): void {
    this.isEditMode.set(true);
    this.editingVoucherId.set(voucher.id);
    this.formError.set('');
    this.selectedCustomerIds = new Set(voucher.applicableCustomerIds || []);
    this.customerSearchText = '';
    this.customerOrderFilter = 'all';
    this.customerDateFilter = 'all';

    this.formDraft = {
      code: voucher.code,
      title: voucher.title,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minOrderValue: voucher.minOrderValue,
      quantity: voucher.quantity,
      perCustomerLimit: voucher.perCustomerLimit,
      targetType: voucher.targetType || 'all',
      applicableCustomerIds: voucher.applicableCustomerIds || [],
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      isActive: voucher.isActive,
    };
    this.formStart = this.toLocalInput(voucher.startDate);
    this.formEnd = this.toLocalInput(voucher.endDate);
    this.loadAllCustomers();
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
    this.formError.set('');

    if (this.formDraft.targetType === 'specific' && this.selectedCustomerIds.size === 0) {
      this.formError.set('Vui lòng chọn ít nhất một khách hàng cho voucher chỉ định.');
      return;
    }

    this.isSubmitting.set(true);

    const draft: VoucherDraft = {
      ...this.formDraft,
      targetType: this.formDraft.targetType || 'all',
      applicableCustomerIds:
        this.formDraft.targetType === 'specific' ? Array.from(this.selectedCustomerIds) : [],
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

  // ==============================================================
  // EXCEL IMPORT & EXPORT CHO VOUCHER (KÈM DÒNG CODE HEADER)
  // ==============================================================

  /** Tải file Excel mẫu gồm Code Header dòng 1, Nhãn tiếng Việt dòng 2 và dữ liệu mẫu */
  async downloadExcelTemplate(): Promise<void> {
    try {
      // Dòng 1: Mã code kỹ thuật chuẩn (code headers) để code nhận diện 100%
      const codeHeaders = [
        'voucher_code',
        'title',
        'discount_type',
        'discount_value',
        'max_discount_amount',
        'min_order_value',
        'quantity',
        'per_customer_limit',
        'start_date',
        'end_date',
        'is_active',
      ];

      // Dòng 2: Nhãn tiếng Việt có hướng dẫn
      const labelHeaders = [
        'Mã voucher (* Bắt buộc)',
        'Tên chương trình ưu đãi (* Bắt buộc)',
        'Loại giảm giá (*: percentage / fixed_amount)',
        'Giá trị giảm (* Bắt buộc)',
        'Giảm tối đa VNĐ (Để trống nếu không giới hạn)',
        'Đơn tối thiểu VNĐ',
        'Số lượng phát hành (* Bắt buộc)',
        'Lượt dùng / Mỗi khách hàng',
        'Ngày bắt đầu (*: YYYY-MM-DD)',
        'Ngày kết thúc (*: YYYY-MM-DD)',
        'Trạng thái (Hoạt động / Tắt)',
      ];

      const sampleRow1 = [
        'LIVORA10',
        'Giảm 10% đơn hàng nội thất phòng khách',
        'percentage',
        10,
        200000,
        1000000,
        100,
        1,
        '2026-11-01',
        '2026-12-31',
        'Hoạt động',
      ];

      const sampleRow2 = [
        'GIAM100K',
        'Giảm 100.000đ cho đơn hàng bàn trà cao cấp',
        'fixed_amount',
        100000,
        '',
        500000,
        50,
        1,
        '2026-11-05',
        '2026-11-30',
        'Hoạt động',
      ];

      const guideData = [
        ['HƯỚNG DẪN NHẬP DỮ LIỆU VOUCHER QUA FILE EXCEL'],
        [''],
        ['Mã cột (Code Header)', 'Tên cột hiển thị', 'Bắt buộc', 'Định dạng / Giá trị hợp lệ', 'Ghi chú giải thích'],
        ['voucher_code', 'Mã voucher', 'Bắt buộc', 'Chữ hoặc số, viết liền (VD: LIVORA10, HE2026)', 'Mã duy nhất, nếu trùng hệ thống sẽ tự cập nhật'],
        ['title', 'Tên chương trình', 'Bắt buộc', 'Văn bản (VD: Giảm 10% cho khách mới)', 'Hiển thị cho khách hàng'],
        ['discount_type', 'Loại giảm giá', 'Bắt buộc', 'percentage (Phần trăm) HOẶC fixed_amount (Số tiền)', 'Điền đúng 1 trong 2 giá trị này'],
        ['discount_value', 'Giá trị giảm', 'Bắt buộc', 'Số (VD: 10 nếu là %, hoặc 50000 nếu là tiền)', 'Không điền ký hiệu % hoặc đ'],
        ['max_discount_amount', 'Giảm tối đa VNĐ', 'Tùy chọn', 'Số nguyên VNĐ (VD: 200000)', 'Chỉ áp dụng khi loại giảm là percentage, để trống nếu không hạn mức'],
        ['min_order_value', 'Đơn tối thiểu VNĐ', 'Tùy chọn', 'Số nguyên VNĐ (VD: 500000)', 'Mặc định 0đ nếu để trống'],
        ['quantity', 'Số lượng phát hành', 'Bắt buộc', 'Số nguyên > 0 (VD: 100)', 'Tổng lượt mã có thể sử dụng'],
        ['per_customer_limit', 'Lượt dùng/khách', 'Tùy chọn', 'Số nguyên (VD: 1)', 'Mặc định 1 nếu để trống'],
        ['start_date', 'Ngày bắt đầu', 'Bắt buộc', 'Định dạng YYYY-MM-DD (VD: 2026-11-01)', 'Ngày giờ bắt đầu có hiệu lực'],
        ['end_date', 'Ngày kết thúc', 'Bắt buộc', 'Định dạng YYYY-MM-DD (VD: 2026-12-31)', 'Ngày giờ hết hiệu lực'],
        ['is_active', 'Trạng thái', 'Tùy chọn', 'Hoạt động / Tắt (mặc định Hoạt động)', 'Cho phép áp dụng ngay hay không'],
      ];

      await this.excelService.exportMultiSheet(
        [
          { name: 'Template_Voucher', data: [codeHeaders, labelHeaders, sampleRow1, sampleRow2] },
          { name: 'Huong_Dan', data: guideData },
        ],
        'Mau_Nhap_Voucher_Livora.xlsx'
      );
      this.showToast('Đã tải xuống file template Voucher thành công.', 'success');
    } catch (err: any) {
      this.showToast(err.message || 'Lỗi khi tải file template.', 'error');
    }
  }

  /** Xử lý tải lên file Excel để nhập voucher hàng loạt */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    this.isImporting.set(true);

    try {
      const sheets = await this.excelService.readWorkbook(file);
      const sheetNames = Object.keys(sheets);
      if (sheetNames.length === 0) {
        throw new Error('File Excel rỗng, không chứa dữ liệu.');
      }

      const targetSheetName =
        sheetNames.find((s) => s.toLowerCase().includes('voucher') || s.toLowerCase().includes('template')) ||
        sheetNames[0];

      const rows = sheets[targetSheetName];
      if (!rows || rows.length < 2) {
        throw new Error(`Sheet "${targetSheetName}" không có dữ liệu hàng nào (ngoài tiêu đề).`);
      }

      // 1. Phân tích Header: tìm chỉ số các cột dựa theo code header hoặc tiếng Việt
      let headerRowIndex = 0;
      let codeIdx = -1;
      let titleIdx = -1;
      let typeIdx = -1;
      let valIdx = -1;
      let maxIdx = -1;
      let minIdx = -1;
      let qtyIdx = -1;
      let limitIdx = -1;
      let startIdx = -1;
      let endIdx = -1;
      let statusIdx = -1;

      for (let r = 0; r < Math.min(3, rows.length); r++) {
        const headerRow = (rows[r] || []).map((c: any) =>
          String(c || '').toLowerCase().trim()
        );

        const findCol = (...keywords: string[]): number => {
          return headerRow.findIndex((h) => keywords.some((kw) => h === kw || h.includes(kw)));
        };

        const tryCode = findCol('voucher_code', 'vouchercode', 'code', 'mã voucher', 'ma voucher');
        const tryTitle = findCol('title', 'tên chương trình', 'ten chuong trinh', 'tên ưu đãi');

        if (tryCode !== -1 || tryTitle !== -1) {
          headerRowIndex = r;
          codeIdx = tryCode;
          titleIdx = tryTitle;
          typeIdx = findCol('discount_type', 'discounttype', 'loại giảm', 'loai giam');
          valIdx = findCol('discount_value', 'discountvalue', 'giá trị giảm', 'gia tri giam');
          maxIdx = findCol('max_discount_amount', 'maxdiscountamount', 'giảm tối đa', 'giam toi da');
          minIdx = findCol('min_order_value', 'minordervalue', 'đơn tối thiểu', 'don toi thieu');
          qtyIdx = findCol('quantity', 'số lượng', 'so luong', 'qty');
          limitIdx = findCol('per_customer_limit', 'percustomerlimit', 'lượt dùng', 'luot dung');
          startIdx = findCol('start_date', 'startdate', 'ngày bắt đầu', 'ngay bat dau');
          endIdx = findCol('end_date', 'enddate', 'ngày kết thúc', 'ngay ket thuc');
          statusIdx = findCol('is_active', 'isactive', 'trạng thái', 'trang thai', 'status');
          break;
        }
      }

      // Fallback theo vị trí cột mặc định
      if (codeIdx === -1) codeIdx = 0;
      if (titleIdx === -1) titleIdx = 1;
      if (typeIdx === -1) typeIdx = 2;
      if (valIdx === -1) valIdx = 3;
      if (maxIdx === -1) maxIdx = 4;
      if (minIdx === -1) minIdx = 5;
      if (qtyIdx === -1) qtyIdx = 6;
      if (limitIdx === -1) limitIdx = 7;
      if (startIdx === -1) startIdx = 8;
      if (endIdx === -1) endIdx = 9;
      if (statusIdx === -1) statusIdx = 10;

      const clientErrors: string[] = [];
      const vouchersToUpload: any[] = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every((c: any) => c === '' || c === null || c === undefined)) {
          continue;
        }

        const rawCode = String(row[codeIdx] || '').trim().toUpperCase();
        const rawTitle = String(row[titleIdx] || '').trim();

        // Bỏ qua dòng header nếu có dòng header tiếng Việt phụ
        if (
          rawCode === 'VOUCHER_CODE' ||
          rawCode === 'CODE' ||
          rawCode.includes('MÃ VOUCHER') ||
          rawTitle.toLowerCase().includes('tên chương trình')
        ) {
          continue;
        }

        const rowIdx = i + 1;
        const typeRaw = String(row[typeIdx] || '').trim().toLowerCase();
        const discountValue = Number(row[valIdx]);
        const maxDiscountAmount = row[maxIdx] !== '' && row[maxIdx] !== null && row[maxIdx] !== undefined ? Number(row[maxIdx]) : null;
        const minOrderValue = row[minIdx] !== '' && row[minIdx] !== null && row[minIdx] !== undefined ? Number(row[minIdx]) : 0;
        const quantity = Number(row[qtyIdx]);
        const perCustomerLimit = row[limitIdx] !== '' && row[limitIdx] !== null && row[limitIdx] !== undefined ? Number(row[limitIdx]) : 1;
        const startDateRaw = row[startIdx];
        const endDateRaw = row[endIdx];
        const statusRaw = String(row[statusIdx] || '').trim().toLowerCase();

        // Validation chi tiết từng trường theo yêu cầu
        if (!rawCode) {
          clientErrors.push(`Dòng ${rowIdx}: [Mã voucher] Không được để trống.`);
          continue;
        }

        if (!/^[A-Z0-9-]+$/.test(rawCode)) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Mã voucher] Mã chỉ được gồm chữ cái in hoa, chữ số và dấu gạch ngang.`);
          continue;
        }

        if (!rawTitle) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Tên chương trình ưu đãi] Không được để trống.`);
          continue;
        }

        const discountType = (typeRaw.includes('fixed') || typeRaw.includes('cố định') || typeRaw.includes('tiền'))
          ? 'fixed_amount'
          : 'percentage';

        if (isNaN(discountValue) || discountValue <= 0) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Giá trị giảm] Phải là số dương lớn hơn 0.`);
          continue;
        }

        if (discountType === 'percentage' && discountValue > 100) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Giá trị giảm] Mức chiết khấu theo % không được vượt quá 100%.`);
          continue;
        }

        if (isNaN(quantity) || quantity <= 0) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Số lượng phát hành] Phải là số nguyên lớn hơn 0.`);
          continue;
        }

        let startDate = '';
        if (startDateRaw) {
          const d = new Date(startDateRaw);
          startDate = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
        } else {
          startDate = new Date().toISOString();
        }

        let endDate = '';
        if (endDateRaw) {
          const d = new Date(endDateRaw);
          endDate = !isNaN(d.getTime()) ? d.toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
        } else {
          endDate = new Date(Date.now() + 30 * 86400000).toISOString();
        }

        if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
          clientErrors.push(`Dòng ${rowIdx} (${rawCode}): [Thời gian hiệu lực] Ngày kết thúc phải sau ngày bắt đầu.`);
          continue;
        }

        const isActive = statusRaw === '' || statusRaw.includes('hoạt') || statusRaw === 'active' || statusRaw === 'true' || statusRaw === '1';

        vouchersToUpload.push({
          code: rawCode,
          title: rawTitle,
          discountType,
          discountValue,
          maxDiscountAmount: maxDiscountAmount || 0,
          minOrderValue: minOrderValue || 0,
          quantity,
          perCustomerLimit,
          startDate,
          endDate,
          isActive,
          targetType: 'all',
          applicableCustomerIds: [],
        });
      }

      if (vouchersToUpload.length === 0) {
        this.isImporting.set(false);
        this.importReport.set({
          open: true,
          title: 'Kết quả kiểm tra file Excel Voucher',
          successCount: 0,
          updatedCount: 0,
          insertedCount: 0,
          total: rows.length - 1,
          errors: clientErrors.length > 0 ? clientErrors : ['Không tìm thấy dòng voucher hợp lệ nào trong file.'],
        });
        return;
      }

      // Đã đọc thành công các voucher hợp lệ -> Chuyển sang bước Thiết lập Người nhận Voucher
      this.isImporting.set(false);
      this.pendingExcelVouchers = vouchersToUpload;
      this.excelValidationErrors = clientErrors;
      this.excelTargetType = 'all';
      this.excelSelectedCustomerIds.clear();
      this.excelCustomerSearchText = '';
      this.excelCustomerOrderFilter = 'all';
      this.excelCustomerDateFilter = 'all';
      this.excelModalError.set('');
      this.loadAllCustomers();
      this.isExcelCustomerModalOpen.set(true);
    } catch (err: any) {
      this.isImporting.set(false);
      this.showToast(err.message || 'Không thể xử lý file Excel đã chọn.', 'error');
    }
  }

  // === Xử lý Modal Chọn khách hàng cho Đợt Upload Excel ===
  readonly isExcelCustomerModalOpen = signal(false);
  readonly isConfirmingExcel = signal(false);
  readonly excelModalError = signal('');
  pendingExcelVouchers: any[] = [];
  excelValidationErrors: string[] = [];

  excelTargetType: 'all' | 'specific' = 'all';
  excelSelectedCustomerIds = new Set<string>();
  excelCustomerSearchText = '';
  excelCustomerOrderFilter: 'all' | 'no_orders' | 'has_orders' | 'loyal' | 'vip' = 'all';
  excelCustomerDateFilter: 'all' | '7days' | '30days' | '90days' = 'all';

  get pendingExcelVouchersSummary(): string {
    const codes = this.pendingExcelVouchers.map((v) => v.code);
    if (codes.length <= 5) return codes.join(', ');
    return `${codes.slice(0, 5).join(', ')} ... (+${codes.length - 5} mã khác)`;
  }

  get filteredExcelCustomers(): CustomerPickerItem[] {
    const term = this.excelCustomerSearchText.trim().toLowerCase();
    const orderFilter = this.excelCustomerOrderFilter;
    const dateFilter = this.excelCustomerDateFilter;

    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return this.allCustomers().filter((c) => {
      if (term) {
        const matchName = (c.fullName || '').toLowerCase().includes(term);
        const matchPhone = (c.phone || '').toLowerCase().includes(term);
        const matchEmail = (c.email || '').toLowerCase().includes(term);
        const matchCode = (c.code || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchEmail && !matchCode) {
          return false;
        }
      }

      if (orderFilter === 'no_orders' && c.totalOrders > 0) return false;
      if (orderFilter === 'has_orders' && c.totalOrders < 1) return false;
      if (orderFilter === 'loyal' && c.totalOrders < 3) return false;
      if (orderFilter === 'vip' && c.accumulatedSpent < 10000000 && c.totalOrders < 5) return false;

      if (dateFilter !== 'all' && c.createdAt) {
        const createdTime = new Date(c.createdAt).getTime();
        if (!isNaN(createdTime)) {
          const diffDays = (now - createdTime) / dayMs;
          if (dateFilter === '7days' && diffDays > 7) return false;
          if (dateFilter === '30days' && diffDays > 30) return false;
          if (dateFilter === '90days' && diffDays > 90) return false;
        }
      }

      return true;
    });
  }

  isExcelCustomerSelected(id: string): boolean {
    return this.excelSelectedCustomerIds.has(id);
  }

  toggleExcelCustomer(id: string): void {
    if (this.excelSelectedCustomerIds.has(id)) {
      this.excelSelectedCustomerIds.delete(id);
    } else {
      this.excelSelectedCustomerIds.add(id);
    }
  }

  selectAllExcelFiltered(): void {
    for (const c of this.filteredExcelCustomers) {
      this.excelSelectedCustomerIds.add(c.id);
    }
  }

  // CHO PHÉP CLICK TẤT CẢ KHÁCH HÀNG
  selectAllExcelTotal(): void {
    for (const c of this.allCustomers()) {
      this.excelSelectedCustomerIds.add(c.id);
    }
  }

  deselectAllExcelFiltered(): void {
    for (const c of this.filteredExcelCustomers) {
      this.excelSelectedCustomerIds.delete(c.id);
    }
  }

  clearAllExcelSelected(): void {
    this.excelSelectedCustomerIds.clear();
  }

  removeExcelSelected(id: string): void {
    this.excelSelectedCustomerIds.delete(id);
  }

  getSelectedExcelCustomerItems(): CustomerPickerItem[] {
    const ids = this.excelSelectedCustomerIds;
    return this.allCustomers().filter((c) => ids.has(c.id));
  }

  cancelExcelImport(): void {
    this.isExcelCustomerModalOpen.set(false);
    this.pendingExcelVouchers = [];
    this.excelValidationErrors = [];
    this.excelModalError.set('');
  }

  confirmExcelImport(): void {
    this.excelModalError.set('');
    if (this.excelTargetType === 'specific' && this.excelSelectedCustomerIds.size === 0) {
      this.excelModalError.set('Vui lòng chọn ít nhất một khách hàng hoặc chuyển sang tùy chọn "Tất cả khách hàng".');
      return;
    }

    this.isConfirmingExcel.set(true);

    const targetType = this.excelTargetType;
    const customerIds = targetType === 'specific' ? Array.from(this.excelSelectedCustomerIds) : [];

    const finalVouchers = this.pendingExcelVouchers.map((v) => ({
      ...v,
      targetType,
      applicableCustomerIds: customerIds,
    }));

    this.voucherService.createVouchersBulk(finalVouchers).subscribe({
      next: (res) => {
        this.isConfirmingExcel.set(false);
        this.isExcelCustomerModalOpen.set(false);
        const allErrors = [...this.excelValidationErrors, ...(res?.errors || [])];
        this.importReport.set({
          open: true,
          title: 'Kết quả nhập dữ liệu Voucher từ Excel',
          successCount: res?.successCount || res?.insertedCount || 0,
          updatedCount: res?.updatedCount || 0,
          insertedCount: res?.insertedCount || 0,
          total: finalVouchers.length + this.excelValidationErrors.length,
          errors: allErrors,
        });
        this.showToast(`Đã nhập thành công ${res?.successCount || res?.insertedCount || 0} voucher.`, 'success');
        this.pendingExcelVouchers = [];
        this.excelValidationErrors = [];
        this.loadVouchers();
      },
      error: (err: Error) => {
        this.isConfirmingExcel.set(false);
        this.excelModalError.set(err.message || 'Lỗi hệ thống khi nhập danh sách voucher.');
      },
    });
  }

  closeImportReport(): void {
    this.importReport.set({
      ...this.importReport(),
      open: false,
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
    if (!value && value !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }

  formatDate(iso: string): string {
    if (!iso) return '-';
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
      discountValue: null as any,
      maxDiscountAmount: null as any,
      minOrderValue: null as any,
      quantity: null as any,
      perCustomerLimit: null as any,
      targetType: 'all',
      applicableCustomerIds: [],
      startDate: '',
      endDate: '',
      isActive: true,
    };
  }

  private toLocalInput(iso: string): string {
    if (!iso) return '';
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
