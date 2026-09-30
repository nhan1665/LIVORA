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
    { title: 'Tổng Doanh Thu', value: '1.450.800.000 ₫', change: '+12.5%', icon: 'bi-cash-coin', isPositive: true },
    { title: 'Đơn Hàng Mới', value: '382', change: '+8.2%', icon: 'bi-bag-check', isPositive: true },
    { title: 'Khách Hàng', value: '1.240', change: '+15.3%', icon: 'bi-people', isPositive: true },
    { title: 'Sản Phẩm Đang Bán', value: '86', change: '0%', icon: 'bi-box-seam', isPositive: true },
  ];

  recentOrders = [
    { id: 'DH-2026-081', customer: 'Nguyễn Văn An', product: 'Sofa Da Cao Cấp Livora Elegance', amount: '28.500.000 ₫', status: 'Hoàn thành' },
    { id: 'DH-2026-082', customer: 'Trần Thị Bích', product: 'Bàn Trà Mặt Đá Marble', amount: '12.200.000 ₫', status: 'Đang giao' },
    { id: 'DH-2026-083', customer: 'Lê Hoàng Nam', product: 'Ghế Armchair Thư Giãn Velvet', amount: '8.900.000 ₫', status: 'Chờ xử lý' },
    { id: 'DH-2026-084', customer: 'Phạm Minh Đức', product: 'Giường Ngủ Gỗ Sồi Bắc Âu', amount: '35.000.000 ₫', status: 'Hoàn thành' }
  ];
}
