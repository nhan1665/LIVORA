import { Component, OnInit } from '@angular/core';
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
  ],
  templateUrl: './refund.html',
})
export class RefundComponent implements OnInit {
  refunds: Refund[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  loading: boolean = false;

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
      minWidth: '180px',
      formatter: (val: string, row: Refund) => `${val}\n${row.contactPhone}`,
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

  constructor(private refundService: RefundService) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds(): void {
    this.loading = true;
    const res = this.refundService.listRefunds({
      keyword: this.keyword,
      status: this.statusFilter,
      page: this.currentPage,
      pageSize: this.pageSize,
    });
    this.refunds = res.refunds;
    this.totalItems = res.total;
    this.stats = this.refundService.getStats();
    this.loading = false;
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

  confirmApprove(): void {
    if (!this.selectedRefund) return;
    const res = this.refundService.processRefund({
      refundId: this.selectedRefund._id,
      approved: true,
      staffName: 'Admin Kế toán',
    });

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.loadRefunds();
      this.selectedRefund = res.refund || null;
    } else {
      this.showNotice(res.message, 'error');
    }

    this.isApproveConfirmOpen = false;
  }

  cancelApproveConfirm(): void {
    this.isApproveConfirmOpen = false;
  }

  toggleRejectMode(): void {
    this.isRejectMode = !this.isRejectMode;
  }

  submitReject(): void {
    if (!this.selectedRefund) return;
    if (!this.rejectReasonInput.trim()) {
      this.showNotice('Vui lòng nhập lý do từ chối yêu cầu hoàn tiền.', 'error');
      return;
    }

    const res = this.refundService.processRefund({
      refundId: this.selectedRefund._id,
      approved: false,
      rejectReason: this.rejectReasonInput.trim(),
      staffName: 'Admin Kế toán',
    });

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.loadRefunds();
      this.selectedRefund = res.refund || null;
      this.isRejectMode = false;
    } else {
      this.showNotice(res.message, 'error');
    }
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
