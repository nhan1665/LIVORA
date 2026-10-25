import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-module6',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    
    // Check localStorage user orders first
    try {
      const storedOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
      const matched = storedOrders.find((o: any) => o.customerInfo?.phone === phone || o.phone === phone);
      if (matched) {
        this.orderFound = true;
        this.orderInfo = {
          code: matched.orderCode || 'ORD-NEW',
          status: matched.orderStatus === 'pending' ? 'Pending' : (matched.orderStatus === 'shipping' ? 'Shipping' : 'Delivered'),
          statusDisplay: matched.orderStatus === 'pending' ? 'Chờ xử lý' : (matched.orderStatus === 'shipping' ? 'Đang giao' : 'Đã giao'),
          date: new Date(matched.createdAt || Date.now()).toLocaleDateString('vi-VN'),
          customer: {
            name: matched.customerInfo?.name || 'Khách hàng',
            phone: phone,
            address: matched.customerInfo?.address || matched.shippingAddress || 'Địa chỉ giao hàng',
          },
          items: (matched.items || []).map((it: any) => ({
            name: it.name || it.productName || 'Sản phẩm nội thất',
            image: it.thumbnail || 'item.png',
            color: it.color || 'Tiêu chuẩn',
            quantity: it.quantity || 1,
            price: it.price || 0,
          })),
          subtotal: matched.subtotalAmount || (matched.finalAmount - (matched.shippingFee || 0)),
          shipping: matched.shippingFee || 0,
          total: matched.finalAmount || 0,
        };
        return;
      }
    } catch (_) {}

    // Check if phone matches 0901234567 or any 10-digit number
    if (phone === '0901234567' || /^[0-9]{10}$/.test(phone)) {
      this.orderFound = true;
      this.orderInfo = {
        code: 'ORD-1234',
        status: 'Delivering', // Pending, Shipping, Delivering, Delivered
        statusDisplay: 'Đang vận chuyển',
        date: '24/10/2025',
        customer: {
          name: phone === '0901234567' ? 'Nguyễn Văn A' : 'Khách hàng thân thiết',
          phone: phone,
          address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh'
        },
        items: [
          {
            name: 'Khung giường 4 chân cao cấp tối giản kèm thanh chắn (thép không gỉ)',
            image: 'item.png',
            color: 'Trắng - Đen',
            quantity: 1,
            price: 899
          },
          {
            name: 'Bàn đầu giường hiện đại có ngăn kéo',
            image: 'item.png', // Fallback to item.png
            color: 'Gỗ sồi tự nhiên',
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
