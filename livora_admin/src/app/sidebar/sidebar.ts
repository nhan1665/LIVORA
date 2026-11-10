import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

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

export const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN: [
    '/profile',
    '/dashboard',
    '/dashboard/revenue',
    '/dashboard/products',
    '/dashboard/spaces',
    '/dashboard/customers',
    '/home-management',
    '/customers',
    '/customers/list',
    '/products',
    '/products/categories',
    '/products/list',
    '/rooms',
    '/rooms/list',
    '/rooms/inspirations',
    '/rooms/spaces',
    '/interactions',
    '/interactions/contact',
    '/interactions/reviews',
    '/orders',
    '/orders/list',
    '/orders/refunds',
    '/settings',
    '/settings/vouchers',
    '/settings/shipping',
    '/settings/permissions',
    '/settings/system-config',
  ],
  KE_TOAN: [
    '/profile',
    '/dashboard',
    '/dashboard/revenue',
    '/orders',
    '/orders/refunds',
  ],
  NV_VAN_HANH: [
    '/profile',
    '/dashboard',
    '/dashboard/products',
    '/dashboard/customers',
    '/customers',
    '/customers/list',
    '/orders',
    '/orders/list',
    '/settings',
    '/settings/vouchers',
    '/settings/shipping',
  ],
  NV_NOI_DUNG: [
    '/profile',
    '/dashboard',
    '/dashboard/spaces',
    '/home-management',
    '/products',
    '/products/categories',
    '/products/list',
    '/rooms',
    '/rooms/list',
    '/rooms/inspirations',
    '/rooms/spaces',
  ],
  CSKH: [
    '/profile',
    '/dashboard',
    '/dashboard/customers',
    '/interactions',
    '/interactions/contact',
    '/interactions/reviews',
  ],
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private router = inject(Router);

  private readonly masterMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      iconType: 'dashboard',
      isOpen: true,
      children: [
        { title: 'Báo cáo doanh thu', route: '/dashboard/revenue' },
        { title: 'Hiệu suất sản phẩm', route: '/dashboard/products' },
        { title: 'Chuyển đổi không gian 3D', route: '/dashboard/spaces' },
        { title: 'Chân dung khách hàng', route: '/dashboard/customers' }
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
        { title: 'Thiết lập vận chuyển', route: '/settings/shipping' },
        { title: 'Phân quyền', route: '/settings/permissions' },
        { title: 'Cấu hình động', route: '/settings/system-config' }
      ]
    }
  ];

  menuItems: MenuItem[] = [];

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshMenu();
      });
  }

  ngOnInit(): void {
    this.refreshMenu();
  }

  get currentUser(): any {
    try {
      const raw = localStorage.getItem('livora_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  get currentRoleCode(): string {
    const user = this.currentUser;
    if (!user) return 'SUPER_ADMIN';
    const role = (user.role || '').toUpperCase();
    if (['ADMIN', 'QUAN_TRI_VIEN', 'QUANTRIVIEN', 'QUẢN TRỊ VIÊN', ''].includes(role)) {
      return 'SUPER_ADMIN';
    }
    return role;
  }

  refreshMenu(): void {
    const role = this.currentRoleCode;
    const isSuperAdmin = role === 'SUPER_ADMIN';

    // Lấy danh sách routes được phép từ user hoặc mapping chuẩn của 5 vai trò
    const allowed = this.currentUser?.allowedRoutes && this.currentUser.allowedRoutes.length > 0
      ? this.currentUser.allowedRoutes
      : (ROLE_ALLOWED_ROUTES[role] || ROLE_ALLOWED_ROUTES['SUPER_ADMIN']);

    const isRouteAllowed = (route: string): boolean => {
      if (isSuperAdmin) return true;
      // CHỈ CÓ SUPER ADMIN MỚI XEM ĐƯỢC MENU PHÂN QUYỀN
      if (route.startsWith('/settings/permissions')) return false;
      return allowed.some((r: string) => route === r || route.startsWith(r + '/'));
    };

    // Lọc các menu items
    const filtered: MenuItem[] = [];

    for (const item of this.masterMenuItems) {
      if (item.children && item.children.length > 0) {
        const allowedChildren = item.children.filter(child => isRouteAllowed(child.route));
        if (allowedChildren.length > 0) {
          filtered.push({
            ...item,
            isOpen: true,
            children: allowedChildren,
          });
        }
      } else if (item.route) {
        if (isRouteAllowed(item.route)) {
          filtered.push({ ...item });
        }
      }
    }

    this.menuItems = filtered;
  }

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
