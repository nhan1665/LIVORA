import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InspirationService, InspirationItem } from '../../services/inspiration.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly inspirationService = inject(InspirationService);

  banners = [
    'intro.1.jpg',
    'intro.2.png',
    'images/rooms/living-room.png',
    'images/rooms/bedroom.png'
  ];
  
  activeBannerIndex = 0;

  // Inspirations data (top 3 newest)
  inspirations: InspirationItem[] = [];
  isLoadingInspirations = true;

  ngOnInit(): void {
    this.loadInspirations();
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

  selectBanner(index: number) {
    this.activeBannerIndex = index;
  }
}

