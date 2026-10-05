import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  banners = [
    'intro.1.jpg',
    'intro.2.png',
    'images/rooms/living-room.png',
    'images/rooms/bedroom.png'
  ];
  
  activeBannerIndex = 0;

  selectBanner(index: number) {
    this.activeBannerIndex = index;
  }
}
