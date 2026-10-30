import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InspirationService, InspirationItem } from '../../services/inspiration.service';
import { ProductService, UserProduct } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface HomeBannerItem {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  order?: number;
}

export interface BrandStoryItem {
  id?: string;
  name: string;
  origin?: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private readonly inspirationService = inject(InspirationService);
  private readonly productService = inject(ProductService);
  public readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  banners: HomeBannerItem[] = [];
  activeBannerIndex = 0;
  private hoverInterval: any = null;

  get currentBanner(): HomeBannerItem | undefined {
    return this.banners[this.activeBannerIndex] || this.banners[0];
  }

  // Brand Story state - lấy động từ Database
  brandStory: BrandStoryItem | null = null;

  // Inspirations data (top 3 newest)
  inspirations: InspirationItem[] = [];
  isLoadingInspirations = true;

  // Best Sellers data
  bestSellers: UserProduct[] = [];
  isLoadingBestSellers = true;

  // Contact Form state
  contactForm = {
    fullName: '',
    phone: '',
    email: '',
    subject: 'Tư vấn không gian & sản phẩm',
    message: '',
  };
  contactSubmitting = false;
  contactSuccessMessage = '';
  contactErrorMessage = '';

  ngOnInit(): void {
    this.loadBanners();
    this.loadBrandStory();
    this.loadInspirations();
    this.loadBestSellers();

    const user = this.authService.currentUser();
    if (user) {
      if (user.fullName) this.contactForm.fullName = user.fullName;
      if (user.phone) this.contactForm.phone = user.phone;
      if (user.email) this.contactForm.email = user.email;
    }
  }

  ngOnDestroy(): void {
    if (this.hoverInterval) {
      clearInterval(this.hoverInterval);
      this.hoverInterval = null;
    }
  }

  loadBanners(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/homepage/banners?activeOnly=true`).subscribe({
      next: (res) => {
        const rawList = res.data || [];
        const active: HomeBannerItem[] = rawList
          .filter((b: any) => (b.status === 'Đang hiển thị' || b.status === 'active') && b.imageUrl)
          .sort((a: any, b: any) => (Number(a.order) || 1) - (Number(b.order) || 1))
          .map((b: any) => ({
            id: b.id,
            title: b.title || '',
            subtitle: b.subtitle || '',
            // Đường dẫn hình ảnh banner lưu trực tiếp trong Database
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl || '/rooms',
            order: b.order
          }));
        this.banners = active;
        if (this.activeBannerIndex >= this.banners.length) {
          this.activeBannerIndex = 0;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.banners = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadBrandStory(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/homepage/brands?activeOnly=true`).subscribe({
      next: (res) => {
        const rawList = res.data || [];
        const active = rawList.find(
          (b: any) => b.status === 'Đang hiển thị' || b.status === 'active'
        );
        if (active) {
          this.brandStory = {
            id: active.id,
            name: active.name || '',
            origin: '',
            description: active.description || '',
          };
        } else {
          this.brandStory = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.brandStory = null;
        this.cdr.detectChanges();
      },
    });
  }



  onHeroMouseEnter(): void {
    if (this.banners.length > 1) {
      // Chuyển sang ảnh tiếp theo ngay khi rê chuột vào
      this.nextBanner();
      // Tiếp tục tự động chuyển ảnh mỗi 2.5 giây khi vẫn đang giữ chuột trên banner
      clearInterval(this.hoverInterval);
      this.hoverInterval = setInterval(() => {
        this.nextBanner();
      }, 2500);
    }
  }

  onHeroMouseLeave(): void {
    if (this.hoverInterval) {
      clearInterval(this.hoverInterval);
      this.hoverInterval = null;
    }
  }

  prevBanner(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.banners.length <= 1) return;
    this.activeBannerIndex = (this.activeBannerIndex - 1 + this.banners.length) % this.banners.length;
    this.cdr.detectChanges();
  }

  nextBanner(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.banners.length <= 1) return;
    this.activeBannerIndex = (this.activeBannerIndex + 1) % this.banners.length;
    this.cdr.detectChanges();
  }

  selectBanner(index: number): void {
    this.activeBannerIndex = index;
    this.cdr.detectChanges();
  }

  loadInspirations(): void {
    this.isLoadingInspirations = true;
    this.inspirationService.getLatestInspirations(3).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.inspirations = data.slice(0, 3);
        } else {
          this.inspirations = [];
        }
        this.isLoadingInspirations = false;
      },
      error: () => {
        this.isLoadingInspirations = false;
      },
    });
  }

  loadBestSellers(): void {
    this.isLoadingBestSellers = true;
    this.productService.getBestSellers(4).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.bestSellers = data;
        } else {
          this.bestSellers = [];
        }
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Cannot load best sellers from backend, using fallbacks:', err);
        this.bestSellers = [];
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatPrice(price?: number | null): string {
    if (price === undefined || price === null) return '';
    return price.toLocaleString('vi-VN') + ' ₫';
  }

  getProductRouterLink(product: UserProduct): string[] {
    const room = (product.roomSlugs && product.roomSlugs.length > 0) ? product.roomSlugs[0] : 'bedroom';
    const cat = product.categorySlug || 'beds';
    const id = product.id || product.slug || '2';
    return ['/rooms', room, cat, id];
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    }
  }

  submitContact(event?: Event): void {
    if (event) event.preventDefault();
    if (this.contactSubmitting) return;

    const { fullName, phone, email, subject, message } = this.contactForm;
    const cleanName = (fullName || '').trim();
    const cleanPhone = (phone || '').replace(/[\s.-]/g, '').replace(/^\+84/, '0');
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMsg = (message || '').trim();

    if (!cleanName) {
      this.contactErrorMessage = 'Vui lòng nhập họ và tên của bạn.';
      return;
    }
    if (!cleanPhone || !/^0\d{9,10}$/.test(cleanPhone)) {
      this.contactErrorMessage = 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0) để chúng tôi liên hệ qua Zalo / Hotline.';
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      this.contactErrorMessage = 'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.';
      return;
    }
    if (!cleanMsg) {
      this.contactErrorMessage = 'Vui lòng nhập nội dung hoặc nhu cầu tư vấn của bạn.';
      return;
    }

    this.contactSubmitting = true;
    this.contactErrorMessage = '';
    this.contactSuccessMessage = '';

    const payload = {
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      subject: (subject || '').trim() || 'Tư vấn không gian & sản phẩm',
      message: cleanMsg,
      customerContext: 'Khách hàng liên hệ qua Trang chủ',
    };

    this.http.post<any>(`${environment.apiBaseUrl}/contacts`, payload).subscribe({
      next: (res) => {
        this.contactSubmitting = false;
        this.contactSuccessMessage = res.message || 'Gửi thông tin thành công! Đội ngũ tư vấn LIVORA sẽ chủ động liên hệ trực tiếp với bạn qua Zalo hoặc Hotline trong thời gian sớm nhất.';
        this.contactForm.message = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.contactSubmitting = false;
        this.contactErrorMessage = err.error?.message || err.message || 'Không thể gửi thông tin lúc này. Vui lòng thử lại.';
        this.cdr.markForCheck();
      },
    });
  }
}
