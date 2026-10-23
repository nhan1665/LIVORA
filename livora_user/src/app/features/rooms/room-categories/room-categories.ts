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
  imports: [CommonModule, RouterLink],
  templateUrl: './room-categories.html',
  styleUrl: './room-categories.css'
})
export class RoomCategories implements OnInit {
  defaultRooms: RoomCategoryItem[] = [
    { id: 1, name: 'Phòng ngủ', slug: 'bedroom', image: '/images/rooms/bedroom.png' },
    { id: 2, name: 'Phòng bếp', slug: 'kitchen', image: '/images/rooms/kitchen.png' },
    { id: 3, name: 'Phòng khách', slug: 'living-room', image: '/images/rooms/living-room.png' },
    { id: 4, name: 'Phòng ăn', slug: 'dining-room', image: '/images/rooms/dining-room.png' },
    { id: 5, name: 'Phòng tắm', slug: 'bathroom', image: '/images/rooms/bathroom.jpg' },
  ];

  rooms: RoomCategoryItem[] = [...this.defaultRooms];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getRooms().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const defaultImageMap: Record<string, string> = {
            'bedroom': '/images/rooms/bedroom.png',
            'kitchen': '/images/rooms/kitchen.png',
            'living-room': '/images/rooms/living-room.png',
            'dining-room': '/images/rooms/dining-room.png',
            'bathroom': '/images/rooms/bathroom.jpg'
          };
          this.rooms = data
            .filter((r: any) => r.isActive !== false)
            .map((r: any) => ({
              id: r.id || r._id,
              name: r.name,
              slug: r.slug,
              image: r.thumbnail || defaultImageMap[r.slug] || '/images/rooms/bedroom.png'
            }));
        }
      },
      error: (err) => {
        console.warn('Could not load dynamic rooms, using default list:', err);
      }
    });
  }
}
