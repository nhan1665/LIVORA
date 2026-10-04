import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTable, TableColumn } from '../../shared/data-table/data-table';

export type RevenuePeriod = 'today' | 'week' | 'month' | 'year';

export interface RevenueStatCard {
  title: string;
  value: string;
  change: string;
  icon: string;
  isPositive: boolean;
  subtext: string;
}

export interface RevenueTransaction {
  id: string;
  orderCode: string;
  customerName: string;
  paymentMethod: string;
  createdAt: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTable],
  templateUrl: './revenue.html',
  styleUrl: './revenue.css',
})
export class Revenue implements OnInit {
  // Selected Time Period
  selectedPeriod: RevenuePeriod = 'month';

  // Stats cards (Tất cả hiển thị 0 vì hệ thống chưa có dữ liệu)
  stats: RevenueStatCard[] = [
    {
      title: 'TỔNG DOANH THU',
      value: '0 ₫',
      change: '0%',
      icon: 'bi-cash-coin',
      isPositive: true,
      subtext: 'Chưa có phát sinh',
    },
    {
      title: 'ĐƠN HÀNG THÀNH CÔNG',
      value: '0',
      change: '0%',
      icon: 'bi-bag-check',
      isPositive: true,
      subtext: '0 đơn hoàn tất',
    },
    {
      title: 'GIÁ TRỊ ĐƠN TRUNG BÌNH',
      value: '0 ₫',
      change: '0%',
      icon: 'bi-receipt',
      isPositive: true,
      subtext: '0 ₫ / đơn hàng',
    },
    {
      title: 'KHÁCH HÀNG MUA HÀNG',
      value: '0',
      change: '0%',
      icon: 'bi-people',
      isPositive: true,
      subtext: '0 khách hàng mới',
    },
  ];

  // Transactions list (Hệ thống chưa có dữ liệu giao dịch)
  transactions: RevenueTransaction[] = [];

  // Table configuration
  columns: TableColumn<RevenueTransaction>[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Toast feedback
  toastMessage: string | null = null;
  private toastTimeout: any;

  ngOnInit(): void {
    this.initColumns();
  }

  private initColumns(): void {
    this.columns = [
      {
        key: 'orderCode',
        label: 'MÃ ĐƠN HÀNG',
        width: '150px',
        type: 'text',
      },
      {
        key: 'customerName',
        label: 'KHÁCH HÀNG',
        type: 'text',
      },
      {
        key: 'createdAt',
        label: 'THỜI GIAN',
        width: '160px',
        type: 'text',
      },
      {
        key: 'paymentMethod',
        label: 'PHƯƠNG THỨC',
        width: '180px',
        type: 'text',
      },
      {
        key: 'amount',
        label: 'DOANH THU',
        width: '160px',
        type: 'currency',
        align: 'right',
      },
      {
        key: 'status',
        label: 'TRẠNG THÁI',
        width: '160px',
        align: 'center',
        type: 'badge',
      },
    ];
  }

  setPeriod(period: RevenuePeriod): void {
    this.selectedPeriod = period;
    this.showToast(`Đã chuyển bộ lọc: ${this.getPeriodLabel(period)} (0 phát sinh)`);
  }

  getPeriodLabel(period: RevenuePeriod): string {
    switch (period) {
      case 'today':
        return 'Hôm nay';
      case 'week':
        return '7 ngày qua';
      case 'month':
        return 'Tháng này';
      case 'year':
        return 'Năm nay';
    }
  }

  refreshData(): void {
    this.showToast('Dữ liệu báo cáo đã được làm mới. Hiện chưa có giao dịch mới.');
  }

  exportReport(): void {
    this.showToast('Hiện tại chưa có dữ liệu giao dịch để xuất báo cáo.');
  }

  showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3200);
  }
}
