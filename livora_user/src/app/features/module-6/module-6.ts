import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-module6',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './module-6.html',
  styleUrl: './module-6.css',
})
export class Module6 {
  phoneNumber: string = '';
  hasSearched: boolean = false;
  orderFound: boolean = false;
  
  // Mock data for order
  orderInfo: any = null;

  searchOrder() {
    this.hasSearched = true;
    const phone = this.phoneNumber.trim();
    
    // Check if phone matches 0901234567 or any 10-digit number
    if (phone === '0901234567' || /^[0-9]{10}$/.test(phone)) {
      this.orderFound = true;
      this.orderInfo = {
        code: 'ORD-1234',
        status: 'Delivering', // Pending, Shipping, Delivering, Delivered
        date: 'Oct 24, 2025',
        customer: {
          name: phone === '0901234567' ? 'Nguyen Van A' : 'Khách hàng thân thiết',
          phone: phone,
          address: '123 Nguyen Hue, District 1, Ho Chi Minh City'
        },
        items: [
          {
            name: 'Premium minimalist 4-leg bed frame with headboard guard (stainless steel)',
            image: 'item.png',
            color: 'White - Black',
            quantity: 1,
            price: 899
          },
          {
            name: 'Modern bedside table with drawer',
            image: 'item.png', // Fallback to item.png
            color: 'Oak Wood',
            quantity: 2,
            price: 150
          }
        ],
        subtotal: 1199,
        shipping: 20,
        total: 1219
      };
    } else {
      this.orderFound = false;
      this.orderInfo = null;
    }
  }
}
