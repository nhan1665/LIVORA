import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InspirationService, InspirationItem } from '../../services/inspiration.service';
import { environment } from '../../../environments/environment';

export interface HomeBannerItem {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  order?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private readonly inspirationService = inject(InspirationService);
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

  // Inspirations data (top 3 newest)
  inspirations: InspirationItem[] = [];
  isLoadingInspirations = true;

  ngOnInit(): void {
    this.loadBanners();
    this.loadInspirations();
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
}
