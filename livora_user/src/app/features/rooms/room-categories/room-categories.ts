import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-room-categories',
  imports: [CommonModule, RouterLink],
  templateUrl: './room-categories.html',
  styleUrl: './room-categories.css'
})
export class RoomCategories {
  rooms = [
    { id: 1, name: 'Phòng ngủ', slug: 'bedroom', image: '/images/rooms/bedroom.png' },
    { id: 2, name: 'Phòng bếp', slug: 'kitchen', image: '/images/rooms/kitchen.png' },
    { id: 3, name: 'Phòng khách', slug: 'living-room', image: '/images/rooms/living-room.png' },
    { id: 4, name: 'Phòng ăn', slug: 'dining-room', image: '/images/rooms/dining-room.png' },
    { id: 5, name: 'Phòng tắm', slug: 'bathroom', image: '/images/rooms/bathroom.jpg' },
  ];
}
