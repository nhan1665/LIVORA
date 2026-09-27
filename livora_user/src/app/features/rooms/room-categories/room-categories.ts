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
    { id: 1, name: 'Bedroom', slug: 'bedroom', image: '/images/rooms/bedroom.png' },
    { id: 2, name: 'Kitchens', slug: 'kitchen', image: '/images/rooms/kitchen.png' },
    { id: 3, name: 'Living room', slug: 'living-room', image: '/images/rooms/living-room.png' },
    { id: 4, name: 'Dining room', slug: 'dining-room', image: '/images/rooms/dining-room.png' },
    { id: 5, name: 'Bathroom', slug: 'bathroom', image: '/images/rooms/bathroom.jpg' },
  ];
}
