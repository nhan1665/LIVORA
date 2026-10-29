import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-module6',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './module-6.html',
  styleUrl: './module-6.css',
})
export class Module6 {
  private cdr = inject(ChangeDetectorRef);
  phoneNumber: string = '';
  hasSearched: boolean = false;
  orderFound: boolean = false;
  searching: boolean = false;

  // Order data
  orderInfo: any = null;

  async searchOrder() {
    this.hasSearched = true;
    const term = this.phoneNumber.trim();
    if (!term) {
      this.orderFound = false;
      this.orderInfo = null;
      return;
    }

    // 1. Check localStorage user orders first
    try {
      const storedOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
      const matched = storedOrders.find((o: any) =>
        (o.customerInfo?.phone && o.customerInfo.phone.includes(term)) ||
        (o.phone && o.phone.includes(term)) ||
        (o.orderCode && o.orderCode.toLowerCase().includes(term.toLowerCase()))
      );

      if (matched) {
        this.orderFound = true;
        this.orderInfo = {
          code: matched.orderCode || 'ORD-NEW',
          status: matched.orderStatus === 'pending' ? 'Pending' : (matched.orderStatus === 'shipping' ? 'Shipping' : 'Delivered'),
          statusDisplay: matched.orderStatus === 'pending' ? 'Chờ xử lý' : (matched.orderStatus === 'shipping' ? 'Đang giao' : 'Đã giao'),
          date: new Date(matched.createdAt || Date.now()).toLocaleDateString('vi-VN'),
          customer: {
            name: matched.customerInfo?.fullName || matched.customerInfo?.name || 'Khách hàng',
            phone: matched.customerInfo?.phone || term,
            address: matched.customerInfo?.address || matched.shippingAddress || 'Địa chỉ giao hàng',
          },
          items: (matched.items || []).map((it: any) => ({
            name: it.name || it.productName || 'Sản phẩm nội thất LIVORA',
            image: it.thumbnail || 'item.png',
            color: it.color || it.selectedColor || 'Tiêu chuẩn',
            quantity: it.quantity || 1,
            price: it.price || it.unitPrice || 0,
          })),
          subtotal: matched.subtotalAmount || (matched.finalAmount - (matched.shippingFee || 0)),
          shipping: matched.shippingFee || 0,
          total: matched.finalAmount || matched.totalAmount || 0,
        };
        return;
      }
    } catch (_) {}

    // 2. Query Backend MongoDB API
    this.searching = true;
    try {
      const res = await fetch(`http://localhost:5000/api/orders?search=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && data.data?.orders?.length > 0) {
        const o = data.data.orders[0];
        this.orderFound = true;
        this.orderInfo = {
          code: o.orderCode,
          status: o.orderStatus === 'pending' ? 'Pending' : (o.orderStatus === 'shipping' ? 'Shipping' : 'Delivered'),
          statusDisplay: o.orderStatus === 'pending' ? 'Chờ xử lý' : (o.orderStatus === 'shipping' ? 'Đang giao' : (o.orderStatus === 'delivered' ? 'Đã giao' : 'Đang xử lý')),
          date: new Date(o.createdAt || Date.now()).toLocaleDateString('vi-VN'),
          customer: {
            name: o.customerInfo?.fullName || o.customerInfo?.name || 'Khách hàng',
            phone: o.customerInfo?.phone || term,
            address: o.customerInfo?.address || 'Địa chỉ giao hàng',
          },
          items: (o.items || []).map((it: any) => ({
            name: it.productName || it.name || 'Sản phẩm nội thất',
            image: it.thumbnail || 'item.png',
            color: it.selectedColor || it.color || 'Tiêu chuẩn',
            quantity: it.quantity || 1,
            price: it.unitPrice || it.price || 0,
          })),
          subtotal: o.subtotalAmount || 0,
          shipping: o.shippingFee || 0,
          total: o.finalAmount || o.totalAmount || 0,
        };
        this.cdr.detectChanges();
        return;
      }
    } catch (e) {
      console.warn('[Module 6] Backend search failed:', e);
    } finally {
      this.searching = false;
      this.cdr.detectChanges();
    }

    // 3. Fallback for demo mock phone numbers
    if (term === '0901234567' || /^[0-9]{10}$/.test(term)) {
      this.orderFound = true;
      this.orderInfo = {
        code: 'ORD-1234',
        status: 'Delivering',
        statusDisplay: 'Đang vận chuyển',
        date: '24/10/2025',
        customer: {
          name: term === '0901234567' ? 'Nguyễn Văn A' : 'Khách hàng thân thiết',
          phone: term,
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
            image: 'item.png',
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
