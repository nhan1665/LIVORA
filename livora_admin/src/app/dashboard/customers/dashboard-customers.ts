import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface RFMSegmentItem {
  segment: string;
  count: number;
  percentage: number;
  action: string;
  badgeClass: string;
}

export interface GeographicSalesItem {
  province: string;
  ordersCount: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-customers.html',
  styleUrl: './dashboard-customers.css',
})
export class DashboardCustomers implements OnInit {
  private http = inject(HttpClient);

  isLoading = true;
  summary = {
    totalCustomers: 0,
    vipCustomerCount: 0,
    repeatCustomerRate: '0%',
    averageCustomerLtv: 0,
    avgSatisfactionRating: '5.0 / 5.0',
    refundRate: '0%',
  };

  rfmSegments: RFMSegmentItem[] = [];
  geographicSales: GeographicSalesItem[] = [];

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    const apiUrl = `${environment.apiBaseUrl}/dashboard/customers`;

    this.http.get<{ success: boolean; data: any }>(apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary = res.data.summary || this.summary;
          this.rfmSegments = res.data.rfmSegments || [];
          this.geographicSales = res.data.geographicSales || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu phân tích khách hàng:', err);
        this.isLoading = false;
      },
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  }

  refresh(): void {
    this.fetchData();
  }

  exportReport(): void {
    alert('Tính năng xuất báo cáo Phân khúc & Vòng đời khách hàng đang được xử lý sang file Excel.');
  }
}
