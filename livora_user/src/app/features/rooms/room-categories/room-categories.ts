import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';

export interface RoomCategoryItem {
  id: string | number;
  name: string;
  slug: string;
  image: string;
}

@Component({
  selector: 'app-room-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './room-categories.html',
  styleUrl: './room-categories.css'
})
export class RoomCategories implements OnInit {
  rooms: RoomCategoryItem[] = [];
  isLoading = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.productService.getRooms().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (Array.isArray(data)) {
          this.rooms = data
            .filter((r: any) => r.isActive !== false)
            .map((r: any) => ({
              id: r.id || r._id,
              name: r.name,
              slug: r.slug,
              // Sử dụng chính xác đường dẫn / URL hình ảnh được nhập và lưu trong Database
              image: r.thumbnail || ''
            }));
        } else {
          this.rooms = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.rooms = [];
        console.warn('Lỗi khi tải danh sách phòng từ database:', err);
      }
    });
  }
}
