import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
  customerId?: string;
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

  /**
   * Chuẩn hóa chuỗi số điện thoại chỉ gồm các chữ số (loại bỏ khoảng trắng, dấu, mã +84 -> 0)
   */
  private normalizePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length === 11) {
      return '0' + digits.slice(2);
    }
    return digits;
  }

  /**
   * Kiểm tra đơn hàng đang xem có thuộc về chính tài khoản đang đăng nhập hay không:
   * ĐIỀU KIỆN TIÊN QUYẾT ĐỂ ĐƯỢC MIỄN OTP:
   * 1. Người dùng PHẢI đang đăng nhập (isLoggedIn).
   * 2. Tài khoản đang đăng nhập PHẢI có số điện thoại (currentUser.phone).
   * 3. Số điện thoại của tài khoản đang đăng nhập PHẢI TRÙNG KHỚP với số điện thoại đặt đơn hàng:
   *    (userPhone === orderPhone).
   * 4. Nếu người dùng nhập số điện thoại khác vào ô tìm kiếm thì BẮT BUỘC OTP.
   * 5. Nếu đơn hàng có customerId thì customerId đó không được khác với tài khoản đang đăng nhập.
   *
   * => Nếu tìm kiếm số điện thoại khác với số của tài khoản đang đăng nhập,
   *    hoặc đơn hàng có SĐT khác, hệ thống BẮT BUỘC YÊU CẦU MÃ OTP!
   */
  get isOrderOwnedByCurrentUser(): boolean {
    if (!this.isLoggedIn || !this.currentUser || !this.orderInfo) {
      return false;
    }

    const userPhone = this.normalizePhone(this.currentUser.phone);
    const orderPhone = this.normalizePhone(this.orderInfo.customer?.phone);

    // BẮT BUỘC: Phải có SĐT tài khoản và SĐT tài khoản phải TRÙNG KHỚP với SĐT của đơn hàng
    if (!userPhone || !orderPhone || userPhone !== orderPhone) {
      return false;
    }

    // Nếu người dùng nhập SĐT tìm kiếm khác với SĐT tài khoản -> Yêu cầu OTP
    const searchedPhone = this.normalizePhone(this.phoneNumber);
    if (searchedPhone && searchedPhone.length >= 9 && searchedPhone !== userPhone) {
      return false;
    }

    // Nếu đơn hàng đã gắn customerId thì phải trùng khớp với tài khoản hiện tại
    const currentUserId = String(this.currentUser.id || '').trim();
    const orderCustomerId = String(this.orderInfo.customerId || '').trim();
    if (orderCustomerId && currentUserId && orderCustomerId !== currentUserId) {
      return false;
    }

    return true;
  }

  /**
   * Đơn hàng này có yêu cầu mã OTP để hủy hay không:
   * CHỈ MIỄN OTP khi người dùng đã đăng nhập VÀ đơn hàng thuộc chính tài khoản đó.
   * Nếu chưa đăng nhập HOẶC đơn hàng của tài khoản khác / số điện thoại khác -> BẮT BUỘC OTP!
   */
  get requiresOtpForCancel(): boolean {
    return !this.isOrderOwnedByCurrentUser;
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
      const res = await fetch(`${environment.apiBaseUrl}/orders?search=${encodeURIComponent(term)}&pageSize=50`);
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
  async openCancelModal(): Promise<void> {
    if (!this.orderInfo || !this.orderInfo.canCancel) return;

    this.otpInput = '';
    this.otpError = '';
    this.cancelReason = 'Đổi ý không muốn mua nữa';
    this.showCancelModal = true;

    // Chỉ cần OTP khi đơn hàng không thuộc về chính tài khoản đang đăng nhập
    if (this.requiresOtpForCancel) {
      await this.fetchCancelOtp();
    } else {
      this.currentOtp = '';
    }
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.otpInput = '';
    this.otpError = '';
  }

  async resendOtp(): Promise<void> {
    this.otpInput = '';
    this.otpError = '';
    await this.fetchCancelOtp();
  }

  private async fetchCancelOtp(): Promise<void> {
    if (!this.orderInfo) return;
    try {
      const orderRef = this.orderInfo.id || this.orderInfo.code;
      const res = await fetch(`${environment.apiBaseUrl}/orders/${encodeURIComponent(orderRef)}/request-cancel-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data?.otp) {
        this.currentOtp = String(data.data.otp);
      } else {
        this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
      }
    } catch {
      this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Xuất mã OTP ra console trên localhost (F12 Developer Tools)
    console.log(
      `%c[LIVORA LOCALHOST OTP]%c Đơn hàng #${this.orderInfo?.code} (SĐT: ${this.orderInfo?.customer?.phone}) -> Mã OTP: %c${this.currentOtp}`,
      'background: #704b4a; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
      'color: #334155; font-weight: bold; padding-left: 6px;',
      'background: #fef08a; color: #854d0e; font-weight: bold; font-size: 15px; padding: 2px 6px; border-radius: 4px;'
    );
  }

  async confirmCancelOrder(): Promise<void> {
    if (!this.orderInfo) return;

    // 1. Kiểm tra mã OTP: Bắt buộc khi tài khoản chưa đăng nhập hoặc đơn hàng thuộc tài khoản khác
    if (this.requiresOtpForCancel) {
      if (!this.otpInput.trim() || this.otpInput.trim() !== this.currentOtp) {
        this.otpError = 'Mã OTP không chính xác. Vui lòng kiểm tra mã được xuất tại Localhost terminal/console!';
        return;
      }
    }

    this.cancelling = true;
    this.otpError = '';

    const reason = this.cancelReason.trim() || (this.isOrderOwnedByCurrentUser
      ? 'Chủ tài khoản đã đăng nhập yêu cầu hủy đơn'
      : 'Khách hàng xác thực OTP yêu cầu hủy đơn');

    try {
      // 2. Gửi request Hủy đơn lên Backend.
      // Chỉ gửi kèm Token tài khoản nếu đơn hàng thực sự thuộc sở hữu của tài khoản đó.
      const orderRef = this.orderInfo.id || this.orderInfo.code;
      const token = this.isOrderOwnedByCurrentUser ? this.authService.token : null;
      const res = await fetch(`${environment.apiBaseUrl}/orders/${encodeURIComponent(orderRef)}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason,
          phone: this.orderInfo.customer?.phone || '',
          otp: this.requiresOtpForCancel ? this.otpInput.trim() : undefined,
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.success) {
        this.otpError = resData.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.';
        return;
      }

      // 3. Đồng bộ bản lưu cục bộ (nếu có) với kết quả từ backend
      try {
        const storedOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
        const updated = storedOrders.map((o: any) =>
          o.orderCode === this.orderInfo?.code
            ? { ...o, orderStatus: 'cancelled', cancelReason: reason, updatedAt: new Date().toISOString() }
            : o
        );
        localStorage.setItem('livora_user_orders', JSON.stringify(updated));
      } catch (localErr) {
        console.warn('[Module 6] LocalStorage update error:', localErr);
      }

      // 4. Cập nhật state hiển thị trên giao diện
      this.orderInfo.status = 'cancelled';
      this.orderInfo.statusDisplay = 'Đã hủy';
      this.orderInfo.cancelReason = reason;
      this.orderInfo.canCancel = false;

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

  // ====== HOÀN TIỀN (REFUND) ======
  showRefundModal = false;
  refundReason = 'Sản phẩm lỗi kỹ thuật hoặc trầy xước trong quá trình vận chuyển';
  refundType: 'full' | 'partial' = 'full';
  refundBankName = '';
  refundBankAccountNumber = '';
  refundBankAccountOwner = '';
  submittingRefund = false;
  refundError = '';
  refundSuccessToast = '';

  get canRequestRefund(): boolean {
    if (!this.orderInfo) return false;
    const status = (this.orderInfo.status || '').toLowerCase();
    const pmStatus = (this.orderInfo.paymentStatus || '').toLowerCase();
    const isPaid = pmStatus.includes('paid') || pmStatus.includes('đã thanh toán');

    // Điều kiện hoàn tiền:
    // 1. Đơn đã hoàn thành / đã giao thành công (delivered / completed / đã hoàn thành) -> được phép hủy đổi trả & yêu cầu hoàn tiền
    // 2. Hoặc đơn đã thanh toán (paid) mà bị hủy hoặc đang chờ giao
    const isDeliveredOrCompleted = ['delivered', 'completed', 'đã hoàn thành', 'hoàn thành', 'đã giao'].some(st => status.includes(st));
    return isDeliveredOrCompleted || (isPaid && (status === 'cancelled' || status === 'confirmed' || status === 'processing' || status === 'pending'));
  }

  openRefundModal(): void {
    if (!this.orderInfo) return;
    this.showRefundModal = true;
    this.refundError = '';
    this.refundBankAccountOwner = this.orderInfo.customer?.name || '';
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.refundError = '';
  }

  async submitRefundRequest(): Promise<void> {
    if (!this.orderInfo) return;
    if (!this.refundReason.trim()) {
      this.refundError = 'Vui lòng nhập lý do yêu cầu hoàn tiền.';
      return;
    }
    if (!this.refundBankName.trim() || !this.refundBankAccountNumber.trim()) {
      this.refundError = 'Vui lòng cung cấp đầy đủ tên ngân hàng và số tài khoản nhận tiền hoàn.';
      return;
    }

    this.submittingRefund = true;
    this.refundError = '';

    try {
      const res = await fetch(`${environment.apiBaseUrl}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: this.orderInfo.code,
          phone: this.orderInfo.customer?.phone || '',
          reason: this.refundReason.trim(),
          refundType: this.refundType,
          bankName: this.refundBankName.trim(),
          bankAccountNumber: this.refundBankAccountNumber.trim(),
          bankAccountOwner: this.refundBankAccountOwner.trim() || this.orderInfo.customer?.name,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        this.refundError = data.message || 'Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại sau.';
        return;
      }

      this.showRefundModal = false;
      this.refundSuccessToast = `Yêu cầu hoàn tiền cho đơn hàng #${this.orderInfo.code} đã được gửi thành công! Kế toán LIVORA sẽ liên hệ và xử lý chuyển tiền trong 24h làm việc.`;
    } catch {
      this.refundError = 'Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại.';
    } finally {
      this.submittingRefund = false;
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

    const rawCustId = o.customerId
      ? (typeof o.customerId === 'object' ? (o.customerId._id || o.customerId.id) : o.customerId)
      : (o.userId || '');
    const customerId = rawCustId ? String(rawCustId).trim() : '';

    return {
      id: o.id || o._id || '',
      code: o.orderCode || o.code || 'ORD-LIV',
      customerId,
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
