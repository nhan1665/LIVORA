import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TopSpaceItem {
  id: string;
  name: string;
  roomType: string;
  style: string;
  thumbnail: string;
  hotspotsCount: number;
  viewCount: number;
  estimatedOrders: number;
  estimatedRevenue: number;
}

export interface StylePopularityItem {
  name: string;
  percentage: number;
  count: number;
}

export interface RoomDistributionItem {
  room: string;
  count: number;
  share: number;
}

@Component({
  selector: 'app-dashboard-spaces',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-spaces.html',
  styleUrl: './dashboard-spaces.css',
})
export class DashboardSpaces implements OnInit {
  private http = inject(HttpClient);

  isLoading = true;
  summary = {
    totalSpaces: 0,
    totalHotspots: 0,
    avgHotspotsPerSpace: '0',
    comboCrossSellRate: '0%',
    totalInteractions: 0,
  };

  topSpaces: TopSpaceItem[] = [];
  stylePopularity: StylePopularityItem[] = [];
  roomDistribution: RoomDistributionItem[] = [];

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    const apiUrl = `${environment.apiBaseUrl}/dashboard/spaces`;

    this.http.get<{ success: boolean; data: any }>(apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary = res.data.summary || this.summary;
          this.topSpaces = res.data.topSpaces || [];
          this.stylePopularity = res.data.stylePopularity || [];
          this.roomDistribution = res.data.roomDistribution || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu không gian 3D:', err);
        this.isLoading = false;
      },
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  }

  refresh(): void {
    this.fetchData();
  }

  exportReport(): void {
    alert('Tính năng xuất báo cáo Chuyển đổi Không gian 3D đang được xử lý sang file Excel.');
  }
}
