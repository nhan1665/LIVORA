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

  banners: HomeBannerItem[] = [
    {
      title: 'Từ Cảm Hứng Đến Hiện Thực',
      subtitle: 'Ngôi nhà trở nên ấm cúng nhờ những món đồ được chọn lựa có chủ đích. LIVORA kiến tạo những không gian kết nối.',
      imageUrl: 'intro.1.jpg',
      linkUrl: '/rooms'
    },
    {
      title: 'Bộ Sưu Tập Đương Đại 2026',
      subtitle: 'Khám phá không gian sống tinh giản phong cách Bắc Âu kết hợp thủ công Ý.',
      imageUrl: 'intro.2.png',
      linkUrl: '/inspiration'
    },
    {
      title: 'Không Gian Phòng Khách',
      subtitle: 'Nội thất sang trọng, ấm cúng và đầy cảm hứng cho gia đình bạn.',
      imageUrl: 'images/rooms/living-room.png',
      linkUrl: '/rooms'
    },
    {
      title: 'Phòng Ngủ Tĩnh Lặng',
      subtitle: 'Giao thoa giữa nét tối giản và sự ấm cúng, đem lại giấc ngủ an lành.',
      imageUrl: 'images/rooms/bedroom.png',
      linkUrl: '/rooms'
    }
  ];
  
  activeBannerIndex = 0;
  private hoverInterval: any = null;

  get currentBanner(): HomeBannerItem | undefined {
    return this.banners[this.activeBannerIndex] || this.banners[0];
  }

  // Brand Story state
  brandStory: BrandStoryItem = {
    name: 'Một từ mới cho cuộc sống hiện đại',
    origin: '',
    description:
      'Livora — ra đời từ living, sự ấm áp thường nhật của gia đình, kết hợp với hậu tố sang trọng -ora, gợi lên ánh hoàng hôn vàng rực. Cùng nhau tạo nên: một cái tên dành cho những không gian vừa mang đậm dấu ấn cá nhân vừa tinh tế nhẹ nhàng.',
  };

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
            title: b.title || 'Từ Cảm Hứng Đến Hiện Thực',
            subtitle: b.subtitle || 'Ngôi nhà trở nên ấm cúng nhờ những món đồ được chọn lựa có chủ đích. LIVORA kiến tạo những không gian kết nối.',
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl || '/rooms',
            order: b.order
          }));
        if (active.length > 0) {
          this.banners = active;
          if (this.activeBannerIndex >= this.banners.length) {
            this.activeBannerIndex = 0;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.log('Using default banners:', err);
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
            name: active.name || 'Một từ mới cho cuộc sống hiện đại',
            origin: '',
            description: active.description || '',
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.log('Using default brand story:', err);
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
          // Fallback cards if empty
          this.inspirations = [
            {
              id: 'ins-1',
              code: 'INS-01',
              title: 'Phòng Ăn Luxury Gỗ Óc Chó Sang Trọng & Ấm Cúng',
              slug: 'phong-an-luxury-go-oc-cho',
              roomName: 'Phòng ăn',
              style: 'Modern Luxury',
              thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
              content: 'Bàn ăn 6 ghế gỗ óc chó Bắc Mỹ nguyên khối kết hợp ánh đèn vàng dịu tôn vinh không gian ẩm thực gia đình.',
              taggedProducts: [],
              viewsCount: 1890,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'ins-2',
              code: 'INS-02',
              title: 'Phòng Ngủ Japandi Tĩnh Lặng & Tái Tạo Năng Lượng',
              slug: 'phong-ngu-japandi-tinh-lang',
              roomName: 'Phòng ngủ',
              style: 'Japandi Zen',
              thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
              content: 'Giao thoa giữa nét tối giản Nhật Bản và sự ấm cúng Bắc Âu, đem lại giấc ngủ sâu an lành.',
              taggedProducts: [],
              viewsCount: 1180,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'ins-3',
              code: 'INS-03',
              title: 'Phòng Khách Scandinavian Tối Giản & Tràn Ngập Ánh Sáng',
              slug: 'phong-khach-scandinavian-toi-gian',
              roomName: 'Phòng khách',
              style: 'Bắc Âu (Scandinavian)',
              thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
              content: 'Không gian mở kết hợp chất liệu gỗ sồi tự nhiên và nỉ xám tro trang nhã đón trọn ánh sáng tự nhiên.',
              taggedProducts: [],
              viewsCount: 1520,
              createdAt: new Date().toISOString(),
            },
          ];
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
          this.bestSellers = this.getFallbackBestSellers();
        }
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Cannot load best sellers from backend, using fallbacks:', err);
        this.bestSellers = this.getFallbackBestSellers();
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      },
    });
  }

  getFallbackBestSellers(): UserProduct[] {
    return [
      {
        id: '2',
        sku: 'SKU-MALM-01',
        name: 'Giường Ngủ Cao Cấp MALM',
        slug: 'giuong-ngu-cao-cap-malm',
        categoryName: 'Giường',
        categorySlug: 'beds',
        roomNames: ['Phòng ngủ'],
        roomSlugs: ['bedroom'],
        price: 8900000,
        salePrice: 7990000,
        stockQuantity: 45,
        soldQuantity: 128,
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'],
        description: 'Khung giường gỗ sồi tự nhiên với thiết kế tinh gọn, mang lại cảm giác thư thái tuyệt đối cho phòng ngủ.',
        averageRating: 4.9,
        totalReviews: 86,
        stockStatus: 'in_stock',
        badge: 'Bán chạy #1',
      },
      {
        id: '19',
        sku: 'SKU-KIVIK-02',
        name: 'Sofa Vải Đương Đại KIVIK',
        slug: 'sofa-vai-duong-dai-kivik',
        categoryName: 'Sofa',
        categorySlug: 'sofas',
        roomNames: ['Phòng khách'],
        roomSlugs: ['living-room'],
        price: 14500000,
        salePrice: 12900000,
        stockQuantity: 28,
        soldQuantity: 114,
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
        description: 'Sofa 3 chỗ ngồi đệm mút cao cấp bọc vải dệt tự nhiên, tựa tay thấp êm ái cho không gian sum vầy.',
        averageRating: 4.8,
        totalReviews: 72,
        stockStatus: 'in_stock',
        badge: 'Bán chạy #2',
      },
      {
        id: '37',
        sku: 'SKU-EKEDALEN-03',
        name: 'Bàn Ăn Mở Rộng EKEDALEN',
        slug: 'ban-an-mo-rong-ekedalen',
        categoryName: 'Bàn ăn',
        categorySlug: 'dining-tables',
        roomNames: ['Phòng ăn'],
        roomSlugs: ['dining-room'],
        price: 9800000,
        salePrice: null,
        stockQuantity: 19,
        soldQuantity: 95,
        thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'],
        description: 'Bàn ăn thông minh kéo dài từ 4 đến 8 chỗ, mặt gỗ tần bì nguyên khối hoàn thiện chống thấm nước.',
        averageRating: 4.9,
        totalReviews: 54,
        stockStatus: 'in_stock',
        badge: 'Bán chạy #3',
      },
      {
        id: '22',
        sku: 'SKU-POANG-04',
        name: 'Ghế Thư Giãn Uốn Cong POÄNG',
        slug: 'ghe-thu-gian-uon-cong-poang',
        categoryName: 'Ghế bành',
        categorySlug: 'armchairs',
        roomNames: ['Phòng khách'],
        roomSlugs: ['living-room'],
        price: 3600000,
        salePrice: 2990000,
        stockQuantity: 52,
        soldQuantity: 88,
        thumbnail: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80'],
        description: 'Khung gỗ uốn đàn hồi tự nhiên nâng đỡ hoàn hảo cột sống, tạo điểm nhấn nghệ thuật thanh lịch.',
        averageRating: 4.7,
        totalReviews: 61,
        stockStatus: 'in_stock',
        badge: 'Bán chạy',
      },
    ];
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
