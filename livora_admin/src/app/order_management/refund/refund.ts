import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Refund,
  RefundStatus,
  REFUND_STATUS_LABELS,
} from '../models/refund.model';
import { RefundService } from '../services/refund.service';
import { DataTable, TableColumn, TableActionEvent, BadgeInfo } from '../../shared/data-table/data-table';
import { FilterBar, FilterSelectOption } from '../../shared/filter-bar/filter-bar';
import { FormModal } from '../../shared/form-modal/form-modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTable,
    FilterBar,
    FormModal,
    ConfirmDialog,
    ActivityLogComponent,
  ],
  templateUrl: './refund.html',
})
export class RefundComponent implements OnInit {
  refunds: Refund[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  loading: boolean = false;
  activeModalTab: 'detail' | 'history' = 'detail';

  keyword: string = '';
  statusFilter: string = 'all';

  statusOptions: FilterSelectOption[] = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã hoàn tất', value: 'completed' },
    { label: 'Từ chối', value: 'rejected' },
  ];

  stats = {
    total: 0,
    pending: 0,
    completed: 0,
    totalRefundedAmount: 0,
  };

  columns: TableColumn<Refund>[] = [
    {
      key: 'refundCode',
      label: 'MÃ HOÀN TIỀN',
      minWidth: '140px',
      formatter: (val: string) => val,
    },
    {
      key: 'orderCode',
      label: 'MÃ ĐƠN HÀNG',
      minWidth: '140px',
      formatter: (val: string) => val,
    },
    {
      key: 'customerName',
      label: 'KHÁCH HÀNG',
      minWidth: '160px',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'contactPhone',
      label: 'SỐ ĐIỆN THOẠI',
      minWidth: '120px',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'refundAmount',
      label: 'TIỀN HOÀN',
      minWidth: '130px',
      type: 'currency',
      formatter: (val: number) => `${val?.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'refundType',
      label: 'LOẠI HOÀN',
      minWidth: '110px',
      formatter: (val: string) => (val === 'full' ? 'Toàn phần' : 'Một phần'),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      minWidth: '140px',
      type: 'badge',
      badgeResolver: (val: RefundStatus): BadgeInfo => {
        switch (val) {
          case 'pending':
            return { label: 'Chờ duyệt', variant: 'pending' };
          case 'completed':
            return { label: 'Đã hoàn tất', variant: 'completed' };
          case 'rejected':
            return { label: 'Từ chối', variant: 'danger' };
          default:
            return { label: val, variant: 'default' };
        }
      },
    },
    {
      key: 'createdAt',
      label: 'NGÀY YÊU CẦU',
      minWidth: '130px',
      formatter: (val: string) => {
        if (!val) return '';
        const d = new Date(val);
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      },
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      type: 'actions',
      minWidth: '110px',
      actions: [
        {
          id: 'process',
          label: 'Xem & Xử lý',
          variant: 'view',
        },
      ],
    },
  ];

  notice: { message: string; type: 'success' | 'error' } | null = null;

  // Modal Detail & Process
  isModalOpen: boolean = false;
  selectedRefund: Refund | null = null;
  rejectReasonInput: string = '';
  isRejectMode: boolean = false;

  // Confirmation dialogs
  isApproveConfirmOpen: boolean = false;

  // Modal File Chính Sách Hoàn Tiền
  showPolicyModal: boolean = false;
  currentPolicy: any = null;
  policyFile: File | null = null;
  policyFileName: string = '';
  policyFileSize: string = '';
  policyFileData: string = '';
  readingPolicyFile: boolean = false;
  savingPolicy: boolean = false;
  policySuccessMsg: string = '';
  policyErrorMsg: string = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(private refundService: RefundService) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  async loadRefunds(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await this.refundService.listRefunds({
        keyword: this.keyword,
        status: this.statusFilter,
        page: this.currentPage,
        pageSize: this.pageSize,
      });
      this.refunds = res.refunds;
      this.totalItems = res.total;
      this.stats = res.stats;
    } catch (err) {
      this.refunds = [];
      this.totalItems = 0;
      this.showNotice(err instanceof Error ? err.message : 'Không thể tải danh sách hoàn tiền.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onFilter(event: { search: string; status: string }): void {
    this.keyword = event.search;
    this.statusFilter = event.status;
    this.currentPage = 1;
    this.loadRefunds();
  }

  onResetFilter(): void {
    this.keyword = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadRefunds();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRefunds();
  }

  onRowClick(event: { row: Refund; index: number }): void {
    if (event?.row) {
      this.openProcessModal(event.row);
    }
  }

  onTableAction(event: TableActionEvent<Refund>): void {
    if (event.action === 'process') {
      this.openProcessModal(event.row);
    }
  }

  openProcessModal(refund: Refund): void {
    this.selectedRefund = this.refundService.getRefundById(refund._id) || refund;
    this.activeModalTab = 'detail';
    this.rejectReasonInput = '';
    this.isRejectMode = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRefund = null;
    this.isRejectMode = false;
    this.rejectReasonInput = '';
  }

  promptApprove(): void {
    this.isApproveConfirmOpen = true;
  }

  async confirmApprove(): Promise<void> {
    if (!this.selectedRefund) return;
    const res = await this.refundService.processRefund({
      refundId: this.selectedRefund._id,
      approved: true,
      staffName: 'Admin Kế toán',
    });

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.selectedRefund = res.refund || null;
      await this.loadRefunds();
    } else {
      this.showNotice(res.message, 'error');
    }

    this.isApproveConfirmOpen = false;
    this.cdr.detectChanges();
  }

  cancelApproveConfirm(): void {
    this.isApproveConfirmOpen = false;
  }

  toggleRejectMode(): void {
    this.isRejectMode = !this.isRejectMode;
  }

  async submitReject(): Promise<void> {
    if (!this.selectedRefund) return;
    if (!this.rejectReasonInput.trim()) {
      this.showNotice('Vui lòng nhập lý do từ chối yêu cầu hoàn tiền.', 'error');
      return;
    }

    const res = await this.refundService.processRefund({
      refundId: this.selectedRefund._id,
      approved: false,
      rejectReason: this.rejectReasonInput.trim(),
      staffName: 'Admin Kế toán',
    });

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.selectedRefund = res.refund || null;
      this.isRejectMode = false;
      await this.loadRefunds();
    } else {
      this.showNotice(res.message, 'error');
    }
    this.cdr.detectChanges();
  }

  // ====== QUẢN LÝ CHÍNH SÁCH HOÀN TIỀN ======
  async openPolicyModal(): Promise<void> {
    this.policySuccessMsg = '';
    this.policyErrorMsg = '';
    this.policyFile = null;
    this.policyFileName = '';
    this.policyFileSize = '';
    this.policyFileData = '';
    this.showPolicyModal = true;

    try {
      this.currentPolicy = await this.refundService.getPolicy();
    } catch (_) {
      this.currentPolicy = null;
    }
    this.cdr.detectChanges();
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
    this.policySuccessMsg = '';
    this.policyErrorMsg = '';
    this.policyFile = null;
    this.policyFileName = '';
  }

  onPolicyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 20 * 1024 * 1024) {
        this.policyErrorMsg = 'Kích thước file không được vượt quá 20MB.';
        input.value = '';
        return;
      }

      this.policyFile = file;
      this.policyFileName = file.name;
      this.policyFileSize = this.formatBytes(file.size);
      this.readingPolicyFile = true;
      this.policyErrorMsg = '';
      this.policySuccessMsg = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.policyFileData = e.target.result;
        this.readingPolicyFile = false;
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.readingPolicyFile = false;
        this.policyErrorMsg = 'Không thể đọc file. Vui lòng thử lại!';
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removePolicyFile(): void {
    this.policyFile = null;
    this.policyFileName = '';
    this.policyFileSize = '';
    this.policyFileData = '';
  }

  async savePolicyFile(): Promise<void> {
    if (!this.policyFileData && !this.policyFile) {
      this.policyErrorMsg = 'Vui lòng chọn một file chính sách để tải lên.';
      return;
    }

    if (this.readingPolicyFile) {
      this.policyErrorMsg = 'Đang nạp file, vui lòng đợi trong giây lát!';
      return;
    }

    this.savingPolicy = true;
    this.policyErrorMsg = '';
    this.policySuccessMsg = '';

    try {
      const res = await this.refundService.updatePolicy({
        fileName: this.policyFileName,
        fileSize: this.policyFileSize,
        fileData: this.policyFileData,
        updatedBy: 'Admin Kế toán'
      });

      this.currentPolicy = res;
      this.policyFile = null;
      this.policyFileName = '';
      this.policyFileSize = '';
      this.policyFileData = '';
      this.policySuccessMsg = 'Đã lưu file chính sách mua hàng thành công!';
      setTimeout(() => this.policySuccessMsg = '', 4000);
    } catch (e: any) {
      this.policyErrorMsg = 'Lỗi khi lưu file chính sách: ' + (e.message || 'Thử lại sau.');
    } finally {
      this.savingPolicy = false;
      this.cdr.detectChanges();
    }
  }

  openCurrentPolicyFile(): void {
    if (!this.currentPolicy) return;
    const url = this.currentPolicy.fileUrl
      ? (this.currentPolicy.fileUrl.startsWith('http') ? this.currentPolicy.fileUrl : `http://localhost:5000${this.currentPolicy.fileUrl}`)
      : this.currentPolicy.fileData;
    if (!url) return;

    if (url.startsWith('http')) {
      window.open(url, '_blank');
      return;
    }

    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (e) {
        console.error('Lỗi mở data url:', e);
      }
    }
  }

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  showNotice(message: string, type: 'success' | 'error'): void {
    this.notice = { message, type };
    setTimeout(() => {
      if (this.notice && this.notice.message === message) {
        this.notice = null;
      }
    }, 4500);
  }

  dismissNotice(): void {
    this.notice = null;
  }

  getStatusLabel(status: RefundStatus): string {
    return REFUND_STATUS_LABELS[status] || status;
  }
}

export { RefundComponent as Refund };
