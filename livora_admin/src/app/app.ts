import { Component, signal, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('livora_admin');
  isLoginPage = signal<boolean>(false);
  currentPageTitle = signal<string>('Báo cáo doanh thu');
  currentUser = signal<any>(null);

  private readonly routeTitles: Record<string, string> = {
    '/dashboard': 'Báo cáo doanh thu',
    '/dashboard/revenue': 'Báo cáo doanh thu',
    '/home-management': 'Quản lý trang chủ',
    '/customers/list': 'Danh sách khách hàng',
    '/products/categories': 'Loại sản phẩm',
    '/products/list': 'Danh sách sản phẩm',
    '/rooms/list': 'Danh sách phòng',
    '/rooms/inspirations': 'Danh sách cảm hứng',
    '/rooms/spaces': 'Quản lý không gian',
    '/interactions/contact': 'Liên hệ khách hàng',
    '/interactions/reviews': 'Đánh giá sản phẩm',
    '/orders/list': 'Danh sách đơn hàng',
    '/orders/refunds': 'Yêu cầu hoàn tiền',
    '/settings/vouchers': 'Quản lý Voucher',
    '/settings/shipping': 'Thiết lập vận chuyển',
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
      } catch {
        this.currentUser.set(null);
      }
    } else {
      this.currentUser.set(null);
    }

    const cleanUrl = url.split('?')[0].split('#')[0];
    if (this.routeTitles[cleanUrl]) {
      this.currentPageTitle.set(this.routeTitles[cleanUrl]);
    }
  }

  logout(): void {
    localStorage.removeItem('livora_admin_token');
    localStorage.removeItem('livora_admin_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
