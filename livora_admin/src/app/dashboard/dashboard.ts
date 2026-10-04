import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  stats = [
    { title: 'Tổng Doanh Thu', value: '0 ₫', change: '0%', icon: 'bi-cash-coin', isPositive: true },
    { title: 'Đơn Hàng Mới', value: '0', change: '0%', icon: 'bi-bag-check', isPositive: true },
    { title: 'Khách Hàng', value: '0', change: '0%', icon: 'bi-people', isPositive: true },
    { title: 'Sản Phẩm Đang Bán', value: '0', change: '0%', icon: 'bi-box-seam', isPositive: true },
  ];

  recentOrders: any[] = [];
}
