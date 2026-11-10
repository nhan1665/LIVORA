import { Component, signal, computed, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs';
import { Sidebar, ROLE_ALLOWED_ROUTES } from './sidebar/sidebar';
import { environment } from '../environments/environment';

export interface BreadcrumbInfo {
  module: string;
  moduleRoute?: string;
  page: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'refund' | 'contact' | 'order' | 'review' | 'system' | 'content';
  targetRoles: string[];
  link: string;
  entityId?: string;
  entityCode?: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private http = inject(HttpClient);
  protected readonly title = signal('livora_admin');
  isLoginPage = signal<boolean>(false);
  currentPageTitle = signal<string>('Báo cáo doanh thu');
  currentBreadcrumb = signal<BreadcrumbInfo>({ module: 'Dashboard', moduleRoute: '/dashboard', page: 'Báo cáo doanh thu' });
  currentUser = signal<any>(null);

  // Notification States
  notifications = signal<AdminNotification[]>([]);
  unreadNotifCount = signal<number>(0);
  isNotificationOpen = signal<boolean>(false);
  activeNotifTab = signal<'all' | 'unread'>('all');
  isLoadingNotifs = signal<boolean>(false);
  private notifTimer: any = null;

  filteredNotifications = computed(() => {
    const list = this.notifications();
    if (this.activeNotifTab() === 'unread') {
      return list.filter(n => !n.isRead);
    }
    return list;
  });

  homeRoute = computed(() => {
    const user = this.currentUser();
    return this.getDefaultRouteForRole(user?.role);
  });

  private readonly routeTitles: Record<string, string> = {
    '/dashboard': 'Báo cáo doanh thu',
    '/dashboard/revenue': 'Báo cáo doanh thu',
    '/dashboard/products': 'Hiệu suất sản phẩm',
    '/dashboard/spaces': 'Chuyển đổi không gian 3D',
    '/dashboard/customers': 'Chân dung khách hàng',
    '/home-management': 'Quản lý trang chủ',
    '/customers': 'Danh sách khách hàng',
    '/customers/list': 'Danh sách khách hàng',
    '/products': 'Danh sách sản phẩm',
    '/products/categories': 'Loại sản phẩm',
    '/products/list': 'Danh sách sản phẩm',
    '/rooms': 'Danh sách phòng',
    '/rooms/list': 'Danh sách phòng',
    '/rooms/inspirations': 'Danh sách cảm hứng',
    '/rooms/spaces': 'Quản lý không gian',
    '/interactions': 'Liên hệ khách hàng',
    '/interactions/contact': 'Liên hệ khách hàng',
    '/interactions/reviews': 'Đánh giá sản phẩm',
    '/orders': 'Danh sách đơn hàng',
    '/orders/list': 'Danh sách đơn hàng',
    '/orders/refunds': 'Yêu cầu hoàn tiền',
    '/settings': 'Voucher',
    '/settings/vouchers': 'Quản lý Voucher',
    '/settings/shipping': 'Thiết lập vận chuyển',
    '/settings/permissions': 'Phân quyền & Vai trò',
    '/settings/system-config': 'Cấu hình động hệ thống',
    '/profile': 'Thông tin cá nhân',
  };

  private readonly routeBreadcrumbs: Record<string, BreadcrumbInfo> = {
    '/profile': { module: 'Tài khoản', moduleRoute: '/profile', page: 'Thông tin cá nhân' },
    '/dashboard': { module: 'Dashboard', moduleRoute: '/dashboard', page: 'Báo cáo doanh thu' },
    '/dashboard/revenue': { module: 'Dashboard', moduleRoute: '/dashboard/revenue', page: 'Báo cáo doanh thu' },
    '/dashboard/products': { module: 'Dashboard', moduleRoute: '/dashboard/products', page: 'Hiệu suất sản phẩm' },
    '/dashboard/spaces': { module: 'Dashboard', moduleRoute: '/dashboard/spaces', page: 'Chuyển đổi không gian 3D' },
    '/dashboard/customers': { module: 'Dashboard', moduleRoute: '/dashboard/customers', page: 'Chân dung khách hàng' },
    '/home-management': { module: '', page: 'Quản lý trang chủ' },
    '/customers': { module: 'Quản lý khách hàng', moduleRoute: '/customers/list', page: 'Danh sách khách hàng' },
    '/customers/list': { module: 'Quản lý khách hàng', moduleRoute: '/customers/list', page: 'Danh sách khách hàng' },
    '/products': { module: 'Quản lý sản phẩm', moduleRoute: '/products/list', page: 'Danh sách sản phẩm' },
    '/products/categories': { module: 'Quản lý sản phẩm', moduleRoute: '/products/categories', page: 'Loại sản phẩm' },
    '/products/list': { module: 'Quản lý sản phẩm', moduleRoute: '/products/list', page: 'Danh sách sản phẩm' },
    '/rooms': { module: 'Quản lý phòng', moduleRoute: '/rooms/list', page: 'Danh sách phòng' },
    '/rooms/list': { module: 'Quản lý phòng', moduleRoute: '/rooms/list', page: 'Danh sách phòng' },
    '/rooms/inspirations': { module: 'Quản lý phòng', moduleRoute: '/rooms/inspirations', page: 'Danh sách cảm hứng' },
    '/rooms/spaces': { module: 'Quản lý phòng', moduleRoute: '/rooms/spaces', page: 'Quản lý không gian' },
    '/interactions': { module: 'Quản lý tương tác', moduleRoute: '/interactions/contact', page: 'Liên hệ' },
    '/interactions/contact': { module: 'Quản lý tương tác', moduleRoute: '/interactions/contact', page: 'Liên hệ' },
    '/interactions/reviews': { module: 'Quản lý tương tác', moduleRoute: '/interactions/reviews', page: 'Đánh giá' },
    '/orders': { module: 'Quản lý đơn hàng', moduleRoute: '/orders/list', page: 'Danh sách đơn hàng' },
    '/orders/list': { module: 'Quản lý đơn hàng', moduleRoute: '/orders/list', page: 'Danh sách đơn hàng' },
    '/orders/refunds': { module: 'Quản lý đơn hàng', moduleRoute: '/orders/refunds', page: 'Hoàn tiền' },
    '/settings': { module: 'Thiết lập', moduleRoute: '/settings/vouchers', page: 'Voucher' },
    '/settings/vouchers': { module: 'Thiết lập', moduleRoute: '/settings/vouchers', page: 'Voucher' },
    '/settings/shipping': { module: 'Thiết lập', moduleRoute: '/settings/shipping', page: 'Thiết lập vận chuyển' },
    '/settings/permissions': { module: 'Thiết lập', moduleRoute: '/settings/permissions', page: 'Phân quyền' },
    '/settings/system-config': { module: 'Thiết lập', moduleRoute: '/settings/system-config', page: 'Cấu hình động' },
  };

  constructor() {
    // Initial check
    this.updateRouteState(this.router.url);

    // Watch navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateRouteState(event.urlAfterRedirects);
      });
  }

  private updateRouteState(url: string): void {
    const isLogin = url.includes('/login') || url === '/' || url === '';
    this.isLoginPage.set(isLogin);

    const token = localStorage.getItem('livora_admin_token');
    const rawUser = localStorage.getItem('livora_admin_user');

    if (!isLogin && !token) {
      this.router.navigate(['/login']);
      return;
    }

    if (rawUser) {
      try {
        this.currentUser.set(JSON.parse(rawUser));
        if (!isLogin) {
          this.loadNotifications();
        }
      } catch {
        this.currentUser.set(null);
      }
    } else {
      this.currentUser.set(null);
    }

    const cleanUrl = url.split('?')[0].split('#')[0];

    // Kiểm tra phân quyền truy cập route
    if (!isLogin && cleanUrl) {
      const user = this.currentUser();
      const role = (user?.role || '').toUpperCase();
      const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN', 'QUAN_TRI_VIEN', ''].includes(role);

      // CHỈ CÓ SUPER ADMIN MỚI XEM ĐƯỢC MENU PHÂN QUYỀN
      if (cleanUrl.startsWith('/settings/permissions') && !isSuperAdmin) {
        const fallbackRoute = this.getDefaultRouteForRole(role);
        this.router.navigate([fallbackRoute]);
        return;
      }

      // Luôn cho phép truy cập trang thông tin cá nhân & đổi mật khẩu
      if (cleanUrl === '/profile') {
        // Cho phép
      } else if (!isSuperAdmin) {
        const allowed = user?.allowedRoutes && user.allowedRoutes.length > 0
          ? user.allowedRoutes
          : (ROLE_ALLOWED_ROUTES[role] || []);

        const isAllowed = allowed.some((r: string) => cleanUrl === r || cleanUrl.startsWith(r + '/'));
        if (!isAllowed) {
          const fallbackRoute = this.getDefaultRouteForRole(role);
          this.router.navigate([fallbackRoute]);
          return;
        }
      }
    }
    if (this.routeTitles[cleanUrl]) {
      this.currentPageTitle.set(this.routeTitles[cleanUrl]);
    }
    if (this.routeBreadcrumbs[cleanUrl]) {
      this.currentBreadcrumb.set(this.routeBreadcrumbs[cleanUrl]);
    } else {
      const matchedKey = Object.keys(this.routeBreadcrumbs).find(k => cleanUrl.startsWith(k) && k !== '/');
      if (matchedKey) {
        this.currentBreadcrumb.set(this.routeBreadcrumbs[matchedKey]);
      } else {
        this.currentBreadcrumb.set({ module: '', page: this.currentPageTitle() });
      }
    }
  }

  getDefaultRouteForRole(role: string): string {
    const r = (role || '').toUpperCase();
    if (r === 'KE_TOAN') return '/dashboard/revenue';
    if (r === 'NV_VAN_HANH') return '/orders/list';
    if (r === 'NV_NOI_DUNG') return '/home-management';
    if (r === 'CSKH') return '/interactions/contact';
    return '/dashboard/revenue';
  }

  ngOnInit(): void {
    if (!this.isLoginPage()) {
      this.loadNotifications();
    }
    // Định kỳ làm mới thông báo mỗi 20 giây
    this.notifTimer = setInterval(() => {
      if (!this.isLoginPage()) {
        this.loadNotifications();
      }
    }, 20000);
  }

  ngOnDestroy(): void {
    if (this.notifTimer) {
      clearInterval(this.notifTimer);
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isNotificationOpen()) {
      this.isNotificationOpen.set(false);
    }
  }

  loadNotifications(): void {
    const user = this.currentUser();
    if (!user || this.isLoginPage()) return;
    const role = user.role || 'SUPER_ADMIN';
    const userId = user.id || user.username || user.code;

    this.isLoadingNotifs.set(true);
    this.http.get<any>(`${environment.apiBaseUrl}/notifications?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(userId)}`)
      .subscribe({
        next: (res) => {
          this.isLoadingNotifs.set(false);
          if (res && res.success && res.data) {
            this.notifications.set(res.data.notifications || []);
            this.unreadNotifCount.set(res.data.unreadCount || 0);
          }
        },
        error: (err) => {
          this.isLoadingNotifs.set(false);
          console.warn('Lỗi khi tải thông báo:', err.message);
        }
      });
  }

  toggleNotification(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const nextState = !this.isNotificationOpen();
    this.isNotificationOpen.set(nextState);
    if (nextState) {
      this.loadNotifications();
    }
  }

  closeNotification(): void {
    this.isNotificationOpen.set(false);
  }

  onNotificationClick(notif: AdminNotification, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const user = this.currentUser();
    const userId = user?.id || user?.username || 'user';

    // Đánh dấu đã đọc
    if (!notif.isRead) {
      this.http.put(`${environment.apiBaseUrl}/notifications/${notif.id}/read`, { userId }).subscribe({
        next: () => {
          notif.isRead = true;
          this.unreadNotifCount.update(c => Math.max(0, c - 1));
          this.notifications.set([...this.notifications()]);
        }
      });
    }

    this.isNotificationOpen.set(false);

    // Chuyển hướng tới màn hình tương ứng
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  markAllAsRead(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const user = this.currentUser();
    const role = user?.role || 'SUPER_ADMIN';
    const userId = user?.id || user?.username || 'user';

    this.http.put(`${environment.apiBaseUrl}/notifications/read-all`, { role, userId }).subscribe({
      next: () => {
        const updated = this.notifications().map(n => ({ ...n, isRead: true }));
        this.notifications.set(updated);
        this.unreadNotifCount.set(0);
      }
    });
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  getRoleBadgeLabel(type: string): string {
    switch (type) {
      case 'refund': return 'Kế toán';
      case 'contact': return 'CSKH';
      case 'review': return 'CSKH';
      case 'order': return 'Vận hành';
      case 'content': return 'Nội dung';
      default: return 'Hệ thống';
    }
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    localStorage.removeItem('livora_admin_token');
    localStorage.removeItem('livora_admin_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
