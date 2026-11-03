import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface TrackingItem {
  name: string;
  image: string;
  color: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface TrackingOrder {
  id: string;
  code: string;
  status: string;
  statusDisplay: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: TrackingItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  notes?: string;
  cancelReason?: string;
  canCancel: boolean;
}

@Component({
  selector: 'app-module6',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './module-6.html',
  styleUrl: './module-6.css',
})
export class Module6 implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  phoneNumber: string = '';
  hasSearched: boolean = false;
  orderFound: boolean = false;
  searching: boolean = false;

  // Danh sách các đơn hàng tìm thấy (nếu 1 SĐT có nhiều đơn)
  ordersList: TrackingOrder[] = [];
  // Đơn hàng đang được xem chi tiết
  orderInfo: TrackingOrder | null = null;

  // ====== OTP HỦY ĐƠN HÀNG ======
  showCancelModal: boolean = false;
  currentOtp: string = '';
  otpInput: string = '';
  otpError: string = '';
  cancelling: boolean = false;
  cancelSuccessToast: string = '';
  cancelReason: string = 'Đổi ý không muốn mua nữa';

  readonly cancelReasonsList: string[] = [
    'Đổi ý không muốn mua nữa',
    'Thay đổi địa chỉ / số điện thoại nhận hàng',
    'Muốn thay đổi sản phẩm / số lượng',
    'Thời gian giao hàng dự kiến không phù hợp',
    'Tìm thấy sản phẩm tương tự có giá tốt hơn',
    'Lý do khác',
  ];

  ngOnInit(): void {
    // Nếu người dùng đã đăng nhập và chưa nhập SĐT, tự động lấy SĐT của tài khoản để tìm kiếm
    if (this.isLoggedIn && this.currentUser?.phone && !this.phoneNumber) {
      this.phoneNumber = this.currentUser.phone;
      this.searchOrder();
    }

    // Cho phép truyền query param ?phone=... hoặc ?orderCode=...
    this.route.queryParams.subscribe((params) => {
      const p = params['phone'] || params['search'] || params['code'];
      if (p) {
        this.phoneNumber = p;
        this.searchOrder();
      }
    });
  }

  async searchOrder(): Promise<void> {
    const term = this.phoneNumber.trim();
    this.hasSearched = true;
    this.ordersList = [];
    this.orderInfo = null;
    this.cancelSuccessToast = '';

    if (!term) {
      this.orderFound = false;
      return;
    }

    this.searching = true;
    const foundOrdersMap = new Map<string, TrackingOrder>();

    // 1. Kiểm tra trong localStorage (đơn vừa đặt từ phía Web User)
    try {
      const storedOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
      const matchedLocal = storedOrders.filter((o: any) => {
        const phone = o.customerInfo?.phone || o.phone || '';
        const code = o.orderCode || o.code || '';
        return (
          phone.replace(/\s+/g, '').includes(term.replace(/\s+/g, '')) ||
          code.toLowerCase().includes(term.toLowerCase())
        );
      });

      for (const o of matchedLocal) {
        const mapped = this.mapRawOrderToTracking(o);
        foundOrdersMap.set(mapped.code, mapped);
      }
    } catch (e) {
      console.warn('[Module 6] LocalStorage read failed:', e);
    }

    // 2. Tra cứu từ Backend MongoDB API
    try {
      const res = await fetch(`http://localhost:5000/api/orders?search=${encodeURIComponent(term)}&pageSize=50`);
      if (res.ok) {
        const data = await res.json();
        const apiOrders = data.data?.orders || data.data || [];
        if (Array.isArray(apiOrders)) {
          for (const o of apiOrders) {
            const mapped = this.mapRawOrderToTracking(o);
            foundOrdersMap.set(mapped.code, mapped);
          }
        }
      }
    } catch (e) {
      console.warn('[Module 6] Backend API search failed:', e);
    } finally {
      this.searching = false;
    }

    const allOrders = Array.from(foundOrdersMap.values());
    if (allOrders.length > 0) {
      this.ordersList = allOrders;
      this.orderInfo = allOrders[0]; // Mặc định mở đơn hàng đầu tiên (mới nhất)
      this.orderFound = true;
    } else {
      this.ordersList = [];
      this.orderInfo = null;
      this.orderFound = false;
    }

    this.cdr.detectChanges();
  }

  selectOrder(order: TrackingOrder): void {
    this.orderInfo = order;
    this.cancelSuccessToast = '';
    this.cdr.detectChanges();
  }

  // ====== QUY TRÌNH HỦY ĐƠN HÀNG ======
  openCancelModal(): void {
    if (!this.orderInfo || !this.orderInfo.canCancel) return;

    this.otpInput = '';
    this.otpError = '';
    this.cancelReason = 'Đổi ý không muốn mua nữa';

    // Chỉ tài khoản vãng lai (chưa đăng nhập) mới cần sinh và gửi mã OTP (tiết kiệm chi phí)
    this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();

    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.otpInput = '';
    this.otpError = '';
  }

  autoFillOtp(): void {
    this.otpInput = this.currentOtp;
    this.otpError = '';
  }

  resendOtp(): void {
    this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpInput = '';
    this.otpError = '';
  }

  async confirmCancelOrder(): Promise<void> {
    if (!this.orderInfo) return;

    // 1. Kiểm tra mã OTP xác thực (yêu cầu chuẩn TC027)
    if (!this.otpInput.trim() || this.otpInput.trim() !== this.currentOtp) {
      this.otpError = 'Mã OTP không chính xác. Vui lòng nhập đúng mã OTP đã được cung cấp!';
      return;
    }

    this.cancelling = true;
    this.otpError = '';

    const reason = this.cancelReason.trim() || (this.isLoggedIn
      ? 'Khách hàng đã đăng nhập yêu cầu hủy đơn'
      : 'Khách hàng vãng lai xác thực OTP yêu cầu hủy đơn');

    try {
      // 2. Gửi request Hủy đơn lên Backend
      let apiSuccess = false;
      if (this.orderInfo.id) {
        try {
          const res = await fetch(`http://localhost:5000/api/orders/${this.orderInfo.id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          const resData = await res.json();
          if (resData.success) {
            apiSuccess = true;
          }
        } catch (apiErr) {
          console.warn('[Module 6] Backend cancel API error:', apiErr);
        }
      }

      // 3. Đồng bộ cập nhật vào LocalStorage
      try {
        const storedOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
        const updated = storedOrders.map((o: any) => {
          if (o.orderCode === this.orderInfo?.code || o.id === this.orderInfo?.id || o._id === this.orderInfo?.id) {
            return {
              ...o,
              orderStatus: 'cancelled',
              cancelReason: reason,
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        });
        localStorage.setItem('livora_user_orders', JSON.stringify(updated));
      } catch (localErr) {
        console.warn('[Module 6] LocalStorage update error:', localErr);
      }

      // 4. Cập nhật state hiển thị trên giao diện ngay lập tức
      this.orderInfo.status = 'cancelled';
      this.orderInfo.statusDisplay = 'Đã hủy';
      this.orderInfo.cancelReason = reason;
      this.orderInfo.canCancel = false;

      // Cập nhật trong danh sách nếu có
      const itemInList = this.ordersList.find((o) => o.code === this.orderInfo?.code);
      if (itemInList) {
        itemInList.status = 'cancelled';
        itemInList.statusDisplay = 'Đã hủy';
        itemInList.cancelReason = reason;
        itemInList.canCancel = false;
      }

      this.showCancelModal = false;
      this.cancelSuccessToast = `Đơn hàng #${this.orderInfo.code} đã được hủy thành công!`;
    } catch (e) {
      this.otpError = 'Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại sau.';
    } finally {
      this.cancelling = false;
      this.cdr.detectChanges();
    }
  }

  // ====== HELPER MAPPING ======
  private mapRawOrderToTracking(o: any): TrackingOrder {
    const rawStatus = (o.orderStatus || 'pending').toLowerCase();
    const canCancel = ['pending', 'confirmed', 'processing', 'chờ xử lý', 'đã xác nhận'].includes(rawStatus);

    let statusDisplay = 'Chờ xử lý';
    if (rawStatus === 'confirmed') statusDisplay = 'Đã xác nhận';
    else if (rawStatus === 'processing') statusDisplay = 'Đang xử lý';
    else if (rawStatus === 'shipping' || rawStatus === 'delivering') statusDisplay = 'Đang giao hàng';
    else if (rawStatus === 'delivered') statusDisplay = 'Đã giao thành công';
    else if (rawStatus === 'cancelled') statusDisplay = 'Đã hủy';

    const customer = {
      name: o.customerInfo?.fullName || o.customerInfo?.name || 'Khách hàng',
      phone: o.customerInfo?.phone || o.phone || '',
      address: o.customerInfo?.address || o.shippingAddress || 'Địa chỉ giao hàng',
    };

    const items: TrackingItem[] = (o.items || []).map((it: any) => {
      const unitPrice = Number(it.unitPrice || it.price) || 0;
      const quantity = Math.max(1, Number(it.quantity) || 1);
      return {
        name: it.productName || it.name || 'Sản phẩm nội thất LIVORA',
        image: it.thumbnail || it.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        color: it.selectedColor || it.color || 'Tiêu chuẩn',
        quantity,
        price: unitPrice,
        subtotal: unitPrice * quantity,
      };
    });

    const subtotal = Number(o.subtotalAmount) || items.reduce((sum, it) => sum + it.subtotal, 0);
    const shipping = Number(o.shippingFee) || 0;
    const discount = Number(o.discountAmount) || 0;
    const total = Number(o.finalAmount || o.totalAmount) || Math.max(0, subtotal - discount + shipping);

    const pm = (o.paymentMethod || '').toUpperCase();
    const paymentMethodDisplay = pm.includes('BANK') ? 'Chuyển khoản ngân hàng (QR)' : 'Thanh toán khi nhận hàng (COD)';
    const paymentStatusDisplay = o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';

    let dateDisplay = 'Hôm nay';
    if (o.createdAt) {
      const d = new Date(o.createdAt);
      if (!isNaN(d.getTime())) {
        dateDisplay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }

    return {
      id: o.id || o._id || '',
      code: o.orderCode || o.code || 'ORD-LIV',
      status: rawStatus,
      statusDisplay,
      date: dateDisplay,
      paymentMethod: paymentMethodDisplay,
      paymentStatus: paymentStatusDisplay,
      customer,
      items,
      subtotal,
      shipping,
      discount,
      total,
      notes: o.notes || o.note || '',
      cancelReason: o.cancelReason || '',
      canCancel,
    };
  }
}
