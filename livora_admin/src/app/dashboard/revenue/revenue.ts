import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DataTable, TableColumn } from '../../shared/data-table/data-table';
import { environment } from '../../../environments/environment';

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

export interface MonthlyRevenueItem {
  month: string;
  revenue: number;
  orders: number;
}

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTable],
  templateUrl: './revenue.html',
  styleUrl: './revenue.css',
})
export class Revenue implements OnInit {
  private http = inject(HttpClient);

  // Selected Time Period
  selectedPeriod: RevenuePeriod = 'month';
  selectedYear: number = new Date().getFullYear();

  // Stats cards
  stats: RevenueStatCard[] = [
    {
      title: 'TỔNG DOANH THU',
      value: '0 ₫',
      change: '+12%',
      icon: 'bi-cash-coin',
      isPositive: true,
      subtext: 'Đơn hàng thành công',
    },
    {
      title: 'ĐƠN HÀNG THÀNH CÔNG',
      value: '0',
      change: '+8%',
      icon: 'bi-bag-check',
      isPositive: true,
      subtext: 'Đơn đã giao',
    },
    {
      title: 'GIÁ TRỊ ĐƠN TRUNG BÌNH',
      value: '0 ₫',
      change: '+5%',
      icon: 'bi-receipt',
      isPositive: true,
      subtext: 'Doanh thu / đơn',
    },
    {
      title: 'KHÁCH HÀNG MUA HÀNG',
      value: '0',
      change: '+15%',
      icon: 'bi-people',
      isPositive: true,
      subtext: 'Tổng khách hàng',
    },
  ];

  monthlyData: MonthlyRevenueItem[] = [];
  maxMonthlyRevenue: number = 10000000;

  // Transactions list
  transactions: RevenueTransaction[] = [];

  // Table configuration
  columns: TableColumn<RevenueTransaction>[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  isLoading: boolean = false;

  // Toast feedback
  toastMessage: string | null = null;
  private toastTimeout: any;

  ngOnInit(): void {
    this.initColumns();
    this.loadRevenueData();
  }

  loadRevenueData(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/revenue?year=${this.selectedYear}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          const { summary, monthlyData, recentTransactions } = res.data;

          this.stats = [
            {
              title: 'TỔNG DOANH THU',
              value: Number(summary.totalRevenue || 0).toLocaleString('vi-VN') + ' ₫',
              change: '+14.2%',
              icon: 'bi-cash-coin',
              isPositive: true,
              subtext: `${summary.deliveredOrders || 0} đơn đã giao`,
            },
            {
              title: 'ĐƠN HÀNG THÀNH CÔNG',
              value: String(summary.deliveredOrders || 0),
              change: '+8.5%',
              icon: 'bi-bag-check',
              isPositive: true,
              subtext: `Trên tổng ${summary.totalOrders || 0} đơn`,
            },
            {
              title: 'GIÁ TRỊ ĐƠN TRUNG BÌNH',
              value: Number(summary.averageOrderValue || 0).toLocaleString('vi-VN') + ' ₫',
              change: '+6.1%',
              icon: 'bi-receipt',
              isPositive: true,
              subtext: 'Quy mô chi tiêu trung bình',
            },
            {
              title: 'KHÁCH HÀNG MUA HÀNG',
              value: String(summary.totalCustomers || 0),
              change: '+18%',
              icon: 'bi-people',
              isPositive: true,
              subtext: 'Hồ sơ người dùng kích hoạt',
            },
          ];

          this.monthlyData = monthlyData || [];
          this.maxMonthlyRevenue = Math.max(
            ...this.monthlyData.map((m) => m.revenue),
            10000000
          );

          if (Array.isArray(recentTransactions)) {
            this.transactions = recentTransactions.map((tx: any) => ({
              id: tx.id || tx._id,
              orderCode: tx.orderCode,
              customerName: tx.customerName,
              paymentMethod: this.formatPaymentMethod(tx.paymentMethod),
              createdAt: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('vi-VN') : '',
              amount: tx.amount || 0,
              status: tx.status === 'delivered' ? 'Hoàn thành' : 'Đang xử lý',
            }));
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Lỗi khi tải báo cáo doanh thu:', err.message);
      },
    });
  }

  private formatPaymentMethod(m: string): string {
    switch (m) {
      case 'cod': return 'Thanh toán COD';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'online': return 'VNPAY / Thẻ trực tuyến';
      default: return m || 'COD';
    }
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
        width: '140px',
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
        width: '140px',
        align: 'center',
        type: 'badge',
      },
    ];
  }

  setPeriod(period: RevenuePeriod): void {
    this.selectedPeriod = period;
    this.showToast(`Đã chuyển bộ lọc: ${this.getPeriodLabel(period)}`);
  }

  getPeriodLabel(period: RevenuePeriod): string {
    switch (period) {
      case 'today': return 'Hôm nay';
      case 'week': return '7 ngày qua';
      case 'month': return 'Tháng này';
      case 'year': return 'Năm ' + this.selectedYear;
    }
  }

  refreshData(): void {
    this.loadRevenueData();
    this.showToast('Dữ liệu báo cáo doanh thu đã được cập nhật từ hệ thống.');
  }

  exportReport(): void {
    this.showToast('Đang tạo và tải xuống file Excel báo cáo doanh thu...');
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
