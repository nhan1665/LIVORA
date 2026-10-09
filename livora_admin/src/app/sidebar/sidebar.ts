import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

export interface SubMenuItem {
  title: string;
  route: string;
}

export interface MenuItem {
  id: string;
  title: string;
  iconType: string;
  route?: string;
  isOpen?: boolean;
  children?: SubMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      iconType: 'dashboard',
      isOpen: true,
      children: [
        { title: 'Báo cáo doanh thu', route: '/dashboard/revenue' }
      ]
    },
    {
      id: 'home',
      title: 'Quản lý trang chủ',
      iconType: 'home-manage',
      route: '/home-management'
    },
    {
      id: 'customers',
      title: 'Quản lý khách hàng',
      iconType: 'customers',
      isOpen: true,
      children: [
        { title: 'Danh sách khách hàng', route: '/customers/list' }
      ]
    },
    {
      id: 'products',
      title: 'Quản lý sản phẩm',
      iconType: 'products',
      isOpen: true,
      children: [
        { title: 'Loại sản phẩm', route: '/products/categories' },
        { title: 'Danh sách sản phẩm', route: '/products/list' }
      ]
    },
    {
      id: 'rooms',
      title: 'Quản lý phòng',
      iconType: 'rooms',
      isOpen: true,
      children: [
        { title: 'Danh sách phòng', route: '/rooms/list' },
        { title: 'Danh sách cảm hứng', route: '/rooms/inspirations' },
        { title: 'Quản lý không gian', route: '/rooms/spaces' }
      ]
    },
    {
      id: 'interactions',
      title: 'Quản lý tương tác',
      iconType: 'interactions',
      isOpen: true,
      children: [
        { title: 'Liên hệ', route: '/interactions/contact' },
        { title: 'Đánh giá', route: '/interactions/reviews' }
      ]
    },
    {
      id: 'orders',
      title: 'Quản lý đơn hàng',
      iconType: 'orders',
      isOpen: true,
      children: [
        { title: 'Đơn hàng', route: '/orders/list' },
        { title: 'Hoàn tiền', route: '/orders/refunds' }
      ]
    },
    {
      id: 'settings',
      title: 'Thiết lập',
      iconType: 'settings',
      isOpen: true,
      children: [
        { title: 'Voucher', route: '/settings/vouchers' },
        { title: 'Thiết lập vận chuyển', route: '/settings/shipping' }
      ]
    }
  ];

  toggleMenu(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      item.isOpen = !item.isOpen;
    }
  }

  navigate(route: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigateByUrl(route);
  }
}
