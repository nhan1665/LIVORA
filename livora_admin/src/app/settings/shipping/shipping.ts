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
import { ExcelService, PROVINCE_DICTIONARY } from '../../shared/services/excel.service';

export interface ShippingImportReportData {
  open: boolean;
  title: string;
  successCount: number;
  updatedCount: number;
  insertedCount: number;
  total: number;
  errors: string[];
}

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
  private readonly excelService = inject(ExcelService);
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

  readonly provinces = PROVINCE_DICTIONARY.map((p) => p.name);

  readonly selectedConfig = signal<ShippingRecord | null>(null);
  readonly isFormModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingConfigId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');

  formDraft: ShippingDraft = this.emptyDraft();

  // === Excel Import & Export ===
  readonly isImporting = signal(false);
  readonly importReport = signal<ShippingImportReportData>({
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
      timeSlot: config.timeSlot || 'Giờ hành chính (8h00 - 18h00)',
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
    this.formDraft.hub = this.formDraft.hub?.trim() || (this.formDraft.province ? this.defaultHub(this.formDraft.province) : '');

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

  deleteConfig(config: ShippingRecord): void {
    if (!confirm(`Bạn có chắc muốn xóa cấu hình vận chuyển [${this.methodLabel(config.shippingMethod)}] cho ${config.province}?`)) {
      return;
    }
    this.shippingService.deleteConfig(config.id).subscribe({
      next: () => {
        this.showToast(`Đã xóa cấu hình vận chuyển ${config.province}.`, 'success');
        this.loadConfigs();
      },
      error: (err: Error) => {
        this.showToast(err.message || 'Không thể xóa cấu hình vận chuyển.', 'error');
      },
    });
  }

  // ==============================================================
  // EXCEL IMPORT & EXPORT CHO VẬN CHUYỂN (KÈM DÒNG CODE HEADER)
  // ==============================================================

  /**
   * Tải template vận chuyển gồm đúng 2 tab:
   * Tab 1: Template_VanChuyen (template nhập liệu với dòng Code Header và Nhãn tiếng Việt)
   * Tab 2: Danh_Sach_Ma_Tinh (danh mục mã chuẩn của toàn bộ 63 tỉnh thành)
   */
  async downloadExcelTemplate(): Promise<void> {
    try {
      // Dòng 1: Code headers kỹ thuật chuẩn
      const codeHeaders = [
        'province_code',
        'shipping_method',
        'fee',
        'estimated_delivery_time',
        'free_ship_threshold',
        'time_slot',
        'white_glove_included',
        'hub',
        'fee_note',
        'is_active',
      ];

      // Dòng 2: Nhãn tiếng Việt hiển thị
      const labelHeaders = [
        'Mã tỉnh (* Tra cứu ở Tab 2)',
        'Phương thức (*: standard / express)',
        'Cước phí VNĐ (* Bắt buộc)',
        'Thời gian giao hàng (* Bắt buộc)',
        'Đơn tối thiểu miễn phí ship (VNĐ)',
        'Khung giờ giao hàng',
        'Dịch vụ White Glove (Có / Không)',
        'Trung tâm điều phối / Hub',
        'Ghi chú cước phí',
        'Trạng thái (Hoạt động / Tắt)',
      ];

      const sampleRow1 = [
        'HCM',
        'standard',
        30000,
        '1 - 2 ngày',
        500000,
        'Giờ hành chính (8h00 - 18h00)',
        'Có',
        'Hub Tổng Miền Nam',
        'Áp dụng toàn bộ nội thành TP.HCM',
        'Hoạt động',
      ];

      const sampleRow2 = [
        'HN',
        'standard',
        35000,
        '2 - 3 ngày',
        700000,
        'Giờ hành chính (8h00 - 18h00)',
        'Có',
        'Hub Miền Bắc',
        'Áp dụng khu vực Hà Nội',
        'Hoạt động',
      ];

      const sampleRow3 = [
        'DN',
        'express',
        60000,
        '24 giờ',
        1000000,
        'Hỏa tốc theo yêu cầu',
        'Không',
        'Hub Miền Trung',
        'Chuyển phát nhanh đường hàng không',
        'Hoạt động',
      ];

      const sampleRow4 = [
        'TQ',
        'standard',
        50000,
        '3 - 5 ngày',
        1500000,
        'Giờ hành chính (8h00 - 18h00)',
        'Không',
        'Trung tâm điều phối toàn quốc',
        'Cấu hình tiêu chuẩn cho các tỉnh còn lại',
        'Hoạt động',
      ];

      // Tab 2: Danh sách Mã tỉnh chuẩn
      const provinceCodeHeaders = ['province_code', 'province_name', 'region'];
      const provinceLabelHeaders = ['MÃ TỈNH (Điền chính xác mã này vào cột province_code của Tab 1)', 'TÊN TỈNH / THÀNH PHỐ', 'KHU VỰC / VÙNG MIỀN'];
      const provinceListSheet: any[][] = [provinceCodeHeaders, provinceLabelHeaders];

      for (const p of PROVINCE_DICTIONARY) {
        provinceListSheet.push([p.code, p.name, p.region]);
      }

      await this.excelService.exportMultiSheet(
        [
          { name: 'Template_VanChuyen', data: [codeHeaders, labelHeaders, sampleRow1, sampleRow2, sampleRow3, sampleRow4] },
          { name: 'Danh_Sach_Ma_Tinh', data: provinceListSheet },
        ],
        'Mau_Nhap_Van_Chuyen_Livora.xlsx'
      );

      this.showToast('Đã tải xuống file template Vận chuyển gồm 2 Tab thành công.', 'success');
    } catch (err: any) {
      this.showToast(err.message || 'Lỗi khi tải file template Vận chuyển.', 'error');
    }
  }

  /**
   * Upload file Excel vận chuyển:
   * - Nhận diện cột theo Code Headers hoặc nhãn tiếng Việt.
   * - Bắt buộc kiểm tra mã tỉnh với danh mục mã tỉnh chuẩn ở Tab 2.
   * - Nếu mã sai hoặc không tìm thấy -> Báo lỗi chi tiết không nhận diện được.
   */
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
        sheetNames.find((s) => s.toLowerCase().includes('vanchuyen') || s.toLowerCase().includes('van_chuyen') || s.toLowerCase().includes('template')) ||
        sheetNames[0];

      const rows = sheets[targetSheetName];
      if (!rows || rows.length < 2) {
        throw new Error(`Sheet "${targetSheetName}" không có dữ liệu hàng nào (ngoài tiêu đề).`);
      }

      // 1. Phân tích header: tìm chỉ số các cột dựa theo code header hoặc tiếng Việt
      let headerRowIndex = 0;
      let provinceCodeIdx = -1;
      let methodIdx = -1;
      let feeIdx = -1;
      let estTimeIdx = -1;
      let thresholdIdx = -1;
      let timeSlotIdx = -1;
      let whiteGloveIdx = -1;
      let hubIdx = -1;
      let noteIdx = -1;
      let statusIdx = -1;

      for (let r = 0; r < Math.min(3, rows.length); r++) {
        const headerRow = (rows[r] || []).map((c: any) =>
          String(c || '').toLowerCase().trim()
        );

        const findCol = (...keywords: string[]): number => {
          return headerRow.findIndex((h) => keywords.some((kw) => h === kw || h.includes(kw)));
        };

        const tryCode = findCol('province_code', 'provincecode', 'mã tỉnh', 'ma tinh', 'code');
        const tryFee = findCol('fee', 'cước phí', 'cuoc phi', 'phí vận chuyển', 'phi van chuyen');

        if (tryCode !== -1 || tryFee !== -1) {
          headerRowIndex = r;
          provinceCodeIdx = tryCode;
          feeIdx = tryFee;
          methodIdx = findCol('shipping_method', 'shippingmethod', 'phương thức', 'phuong thuc', 'method');
          estTimeIdx = findCol('estimated_delivery_time', 'thời gian giao', 'thoi gian', 'time');
          thresholdIdx = findCol('free_ship_threshold', 'freeship', 'miễn phí ship', 'mien phi ship');
          timeSlotIdx = findCol('time_slot', 'khung giờ', 'khung gio', 'timeslot');
          whiteGloveIdx = findCol('white_glove_included', 'white_glove', 'white glove', 'whiteglove');
          hubIdx = findCol('hub', 'trung tâm', 'trung tam', 'kho');
          noteIdx = findCol('fee_note', 'ghi chú', 'ghi chu', 'note');
          statusIdx = findCol('is_active', 'isactive', 'trạng thái', 'trang thai', 'status');
          break;
        }
      }

      // Fallback vị trí mặc định nếu không khớp
      if (provinceCodeIdx === -1) provinceCodeIdx = 0;
      if (methodIdx === -1) methodIdx = 1;
      if (feeIdx === -1) feeIdx = 2;
      if (estTimeIdx === -1) estTimeIdx = 3;
      if (thresholdIdx === -1) thresholdIdx = 4;
      if (timeSlotIdx === -1) timeSlotIdx = 5;
      if (whiteGloveIdx === -1) whiteGloveIdx = 6;
      if (hubIdx === -1) hubIdx = 7;
      if (noteIdx === -1) noteIdx = 8;
      if (statusIdx === -1) statusIdx = 9;

      const clientErrors: string[] = [];
      const configsToUpload: any[] = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every((c: any) => c === '' || c === null || c === undefined)) {
          continue;
        }

        const rawCodeInput = String(row[provinceCodeIdx] || '').trim();

        // Bỏ qua dòng header phụ tiếng Việt nếu có
        if (
          rawCodeInput.toLowerCase() === 'province_code' ||
          rawCodeInput.toLowerCase() === 'code' ||
          rawCodeInput.toLowerCase().includes('mã tỉnh') ||
          rawCodeInput.toLowerCase().includes('tên tỉnh')
        ) {
          continue;
        }

        const rowIdx = i + 1;
        const methodRaw = String(row[methodIdx] || '').trim().toLowerCase();
        const feeRaw = Number(row[feeIdx]);
        const estimatedDeliveryTime = String(row[estTimeIdx] || '').trim();
        const freeShipThreshold = row[thresholdIdx] !== '' && row[thresholdIdx] !== null && row[thresholdIdx] !== undefined ? Number(row[thresholdIdx]) : 0;
        const timeSlot = String(row[timeSlotIdx] || 'Giờ hành chính (8h00 - 18h00)').trim();
        const whiteGloveRaw = String(row[whiteGloveIdx] || '').trim().toLowerCase();
        const hub = String(row[hubIdx] || '').trim();
        const feeNote = String(row[noteIdx] || '').trim();
        const statusRaw = String(row[statusIdx] || '').trim().toLowerCase();

        // 1. Kiểm tra mã tỉnh (BẮT BUỘC TRA CỨU ĐÚNG MÃ TỈNH Ở TAB 2)
        if (!rawCodeInput) {
          clientErrors.push(`Dòng ${rowIdx}: Cột Mã tỉnh đang để trống. Vui lòng điền mã tỉnh từ tab Danh_Sach_Ma_Tinh.`);
          continue;
        }

        const resolved = this.excelService.resolveProvinceByCode(rawCodeInput);
        if (!resolved.valid) {
          clientErrors.push(
            `Dòng ${rowIdx}: Mã tỉnh "${rawCodeInput}" KHÔNG HỢP LỆ! Hệ thống không nhận diện được. Vui lòng đối chiếu mã chuẩn tại tab "Danh_Sach_Ma_Tinh".`
          );
          continue;
        }

        const province = resolved.provinceName;

        // 2. Phương thức vận chuyển
        const shippingMethod = (methodRaw.includes('express') || methodRaw.includes('nhanh') || methodRaw.includes('hỏa tốc'))
          ? 'express'
          : 'standard';

        // 3. Cước phí
        if (isNaN(feeRaw) || feeRaw < 0) {
          clientErrors.push(`Dòng ${rowIdx} (${province}): Cước phí "${row[feeIdx]}" không hợp lệ (phải là số nguyên VND >= 0).`);
          continue;
        }

        // 4. Thời gian giao
        const finalEstTime = estimatedDeliveryTime || (shippingMethod === 'express' ? '24 giờ' : '2 - 4 ngày');

        // 5. White glove
        const whiteGloveIncluded = whiteGloveRaw.includes('có') || whiteGloveRaw === 'true' || whiteGloveRaw === '1' || whiteGloveRaw.includes('yes');

        // 6. Trạng thái
        const isActive = statusRaw === '' || statusRaw.includes('hoạt') || statusRaw === 'active' || statusRaw === 'true' || statusRaw === '1';

        configsToUpload.push({
          province,
          shippingMethod,
          fee: feeRaw,
          estimatedDeliveryTime: finalEstTime,
          freeShipThreshold,
          freeShipEnabled: freeShipThreshold > 0,
          timeSlot,
          whiteGloveIncluded,
          hub: hub || `Trung tâm ${province}`,
          feeNote,
          isActive,
        });
      }

      if (configsToUpload.length === 0) {
        this.isImporting.set(false);
        this.importReport.set({
          open: true,
          title: 'Kết quả kiểm tra file Excel Vận chuyển',
          successCount: 0,
          updatedCount: 0,
          insertedCount: 0,
          total: rows.length - 1,
          errors: clientErrors.length > 0 ? clientErrors : ['Không tìm thấy dữ liệu vận chuyển hợp lệ nào trong file.'],
        });
        return;
      }

      this.shippingService.createShippingConfigsBulk(configsToUpload).subscribe({
        next: (res) => {
          this.isImporting.set(false);
          const allErrors = [...clientErrors, ...(res.errors || [])];
          this.importReport.set({
            open: true,
            title: 'Kết quả nhập dữ liệu Cấu hình Vận chuyển từ Excel',
            successCount: res.successCount || 0,
            updatedCount: res.updatedCount || 0,
            insertedCount: res.insertedCount || 0,
            total: configsToUpload.length + clientErrors.length,
            errors: allErrors,
          });
          this.showToast(`Đã xử lý nhập thành công ${res.successCount} cấu hình vận chuyển.`, 'success');
          this.loadConfigs();
        },
        error: (err: Error) => {
          this.isImporting.set(false);
          this.showToast(err.message || 'Lỗi hệ thống khi tải dữ liệu vận chuyển lên.', 'error');
        },
      });
    } catch (err: any) {
      this.isImporting.set(false);
      this.showToast(err.message || 'Không thể xử lý file Excel vận chuyển đã chọn.', 'error');
    }
  }

  closeImportReport(): void {
    this.importReport.set({
      ...this.importReport(),
      open: false,
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
      province: '',
      hub: '',
      fee: null as any,
      estimatedDeliveryTime: '',
      freeShipEnabled: false,
      freeShipThreshold: null as any,
      timeSlot: '',
      whiteGloveIncluded: false,
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
