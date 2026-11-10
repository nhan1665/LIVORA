import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TopProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryName: string;
  price: number;
  stock: number;
  sold: number;
  revenueGenerated: number;
  thumbnail: string;
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  thumbnail: string;
}

export interface CategoryPerfItem {
  name: string;
  productCount: number;
  totalStock: number;
  totalSold: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-products.html',
  styleUrl: './dashboard-products.css',
})
export class DashboardProducts implements OnInit {
  private http = inject(HttpClient);

  isLoading = true;
  summary = {
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    slowMovingCount: 0,
    inventoryTurnoverRate: '3.4x',
  };

  topSelling: TopProductItem[] = [];
  lowStockWarnings: LowStockItem[] = [];
  categoryPerformance: CategoryPerfItem[] = [];
  bcgMatrix = {
    stars: [] as TopProductItem[],
    cashCows: [] as TopProductItem[],
    questionMarks: [] as TopProductItem[],
    dogs: [] as TopProductItem[],
  };

  toastMessage: string | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/products`).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          this.summary = res.data.summary || this.summary;
          this.topSelling = res.data.topSelling || [];
          this.lowStockWarnings = res.data.lowStockWarnings || [];
          this.categoryPerformance = res.data.categoryPerformance || [];
          this.bcgMatrix = res.data.bcgMatrix || this.bcgMatrix;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Lỗi tải báo cáo sản phẩm:', err.message);
      },
    });
  }

  formatCurrency(val: number): string {
    return Number(val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  getCategoryPercentage(revenue: number): number {
    const total = this.categoryPerformance.reduce((sum, c) => sum + c.revenue, 0) || 1;
    return Math.round((revenue / total) * 100);
  }

  refresh(): void {
    this.loadData();
    this.showToast('Đã làm mới dữ liệu tồn kho & sản phẩm.');
  }

  exportReport(): void {
    this.showToast('Đang xuất báo cáo phân tích tồn kho...');
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}

