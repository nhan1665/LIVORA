import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CheckoutService, ShippingOption } from '../../../services/checkout.service';
import { AuthService } from '../../../services/auth.service';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
  public readonly cartService = inject(CartService);
  public readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  public readonly router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoggedIn = false;
  savedAddresses: SavedAddress[] = [];
  selectedSavedAddressId = '';
  shippingOptions: ShippingOption[] = [];
  selectedShippingId = 'ship-standard';
  checkoutError = '';
  loadingOptions = false;
  loadingQuote = false;
  placingOrder = false;
  confirmedTotal: number | null = null;
  private requestKey = '';
  private optionsVersion = 0;

  // Form Fields
  fullName = '';
  email = '';
  phone = '';
  address = '';
  selectedProvince = 'TP. Hồ Chí Minh';
  selectedDistrict = '';
  selectedWard = '';

  // Default fallback shipping options
  defaultShippingOptions: ShippingOption[] = [
    {
      id: 'ship-standard',
      shippingMethod: 'standard',
      province: 'Toàn quốc',
      estimatedDeliveryTime: '2 - 3 ngày',
      fee: 0,
    },
    {
      id: 'ship-express',
      shippingMethod: 'express',
      province: 'Toàn quốc',
      estimatedDeliveryTime: 'Trong ngày (4 giờ)',
      fee: 50000,
    },
  ];

  // Options lists
  provinces: string[] = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Bình Dương',
    'Đồng Tháp',
    'Cần Thơ',
    'Hải Phòng',
  ];

  districtsMap: { [key: string]: string[] } = {
    'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'TP. Thủ Đức', 'Quận Bình Thạnh', 'Quận 7', 'Quận Tân Bình'],
    'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'TP. Thủ Đức', 'Quận Bình Thạnh', 'Quận 7', 'Quận Tân Bình'],
    'Ho Chi Minh City': ['District 1', 'District 3', 'Thu Duc City', 'Binh Thanh District'],
    'Hà Nội': ['Quận Hoàn Kiếm', 'Quận Ba Đình', 'Quận Cầu Giấy', 'Quận Tây Hồ', 'Quận Đống Đa'],
    'Hanoi': ['Hoan Kiem District', 'Ba Dinh District', 'Cau Giay District', 'Tay Ho District'],
    'Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Liên Chiểu', 'Quận Sơn Trà'],
    'Da Nang': ['Hai Chau District', 'Thanh Khe District', 'Lien Chieu District'],
    'Bình Dương': ['TP. Thủ Dầu Một', 'TP. Thuận An', 'TP. Dĩ An', 'Bến Cát'],
    'Binh Duong Province': ['Thu Dau Mot City', 'Thuan An City', 'Di An City'],
    'Đồng Tháp': ['Huyện Châu Thành', 'TP. Sa Đéc', 'TP. Cao Lãnh'],
    'Dong Thap Province': ['Chau Thanh District', 'Sa Dec City', 'Cao Lanh City'],
    'Cần Thơ': ['Quận Ninh Kiều', 'Quận Cái Răng', 'Quận Bình Thủy'],
    'Hải Phòng': ['Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân'],
  };

  wardsMap: { [key: string]: string[] } = {
    'Quận 1': ['Phường Bến Nghé', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Phạm Ngũ Lão'],
    'Quận 3': ['Phường Võ Thị Sáu', 'Phường 12', 'Phường 14'],
    'TP. Thủ Đức': ['Phường Linh Trung', 'Phường Hiệp Phú', 'Phường Thảo Điền', 'Phường Linh Xuân'],
    'Quận Bình Thạnh': ['Phường 15', 'Phường 25', 'Phường Trường Thọ'],
    'District 1': ['Ben Nghe Ward', 'Da Kao Ward', 'Tan Dinh Ward', 'Pham Ngu Lao Ward'],
    'District 3': ['Vo Thi Sau Ward', 'Ward 12', 'Ward 14'],
    'Thu Duc City': ['Linh Trung Ward', 'Hiep Phu Ward', 'Thao Dien Ward', 'Binh Tho Ward', 'Linh Xuan Ward'],
    'Binh Thanh District': ['Ward 15', 'Ward 25', 'Truong Tho Ward'],
    'Quận Hoàn Kiếm': ['Phường Hàng Trống', 'Phường Tràng Tiền', 'Phường Hàng Bông'],
    'Hoan Kiem District': ['Hang Trong Ward', 'Trang Tien Ward', 'Hang Bong Ward'],
    'Quận Ba Đình': ['Phường Trúc Bạch', 'Phường Liễu Giai', 'Phường Kim Mã'],
    'Ba Dinh District': ['Truc Bach Ward', 'Lieu Giai Ward', 'Kim Ma Ward'],
    'Quận Cầu Giấy': ['Phường Dịch Vọng', 'Phường Nghĩa Tân', 'Phường Mai Dịch'],
    'Cau Giay District': ['Dich Vong Ward', 'Nghia Tan Ward', 'Mai Dich Ward'],
    'Quận Tây Hồ': ['Phường Quảng An', 'Phường Bưởi', 'Phường Nhật Tân'],
    'Tay Ho District': ['Quang An Ward', 'Buoi Ward', 'Nhat Tan Ward'],
    'Quận Hải Châu': ['Phường Thuận Phước', 'Phường Thạch Thang', 'Phường Bình Thuận'],
    'Hai Chau District': ['Thuan Phuoc Ward', 'Thach Thang Ward', 'Binh Thuan Ward'],
    'Quận Thanh Khê': ['Phường An Khê', 'Phường Vĩnh Trung', 'Phường Chính Gián'],
    'Thanh Khe District': ['An Khe Ward', 'Vinh Trung Ward', 'Chinh Gian Ward'],
    'Quận Liên Chiểu': ['Phường Hòa Khánh Bắc', 'Phường Hòa Minh', 'Phường Hòa Hiệp Nam'],
    'Lien Chieu District': ['Hoa Khanh Bac Ward', 'Hoa Minh Ward', 'Hoa Hiep Nam Ward'],
    'TP. Thủ Dầu Một': ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa'],
    'Thu Dau Mot City': ['Phu Cuong Ward', 'Hiep Thanh Ward', 'Chanh Nghia Ward'],
    'TP. Thuận An': ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Vĩnh Phú'],
    'Thuan An City': ['Lai Thieu Ward', 'An Phu Ward', 'Vinh Phu Ward'],
    'TP. Dĩ An': ['Phường Dĩ An', 'Phường Đông Hòa', 'Phường Tân Đông Hiệp'],
    'Di An City': ['Di An Ward', 'Dong Hoa Ward', 'Tan Dong Hiep Ward'],
    'Huyện Châu Thành': ['Xã Vĩnh Bình', 'Xã Tân Nhuận Đông', 'Xã An Nhơn'],
    'Chau Thanh District': ['Vinh Binh Commune', 'Tan Nhuan Dong Commune', 'An Nhon Commune'],
  };

  availableDistricts: string[] = [];
  availableWards: string[] = [];

  // Promo Code fields
  promoInput = '';
  promoMessage = '';
  promoError = false;

  // Validation
  showValidationErrors = false;

  // QR Modal
  showQRModal = false;
  qrTimer = 300;
  qrInterval: any = null;
  qrDataString = '';

  // Success Modal
  showSuccessModal = false;
  orderNumber = '';
  createdOrderPayload: any = null;

  ngOnInit() {
    if (this.cartService.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.shippingOptions = [...this.defaultShippingOptions];
    this.selectedShippingId = this.defaultShippingOptions[0].id;

    // Load available regions from API
    this.checkoutService.regions().then((regions) => {
      if (regions && regions.length) {
        const unique = Array.from(new Set([...regions, ...this.provinces]));
        this.provinces = unique;
      }
      this.cdr.detectChanges();
    }).catch(() => {
      // Use fallback provinces
    });

    // Sync auth state
    this.isLoggedIn = this.authService.isLoggedIn;
    const info = this.cartService.shippingInfo();

    if (this.isLoggedIn) {
      const userProfile = this.authService.currentUser();
      if (userProfile) {
        this.email = userProfile.email || '';
        this.savedAddresses = (userProfile.addresses || []).map((item, index) => ({
          id: item.addressId || `saved-${index}`,
          fullName: item.recipientName || item.fullName || userProfile.fullName,
          phone: item.recipientPhone || item.phone || userProfile.phone,
          province: item.province || '',
          district: item.district || '',
          ward: item.ward || '',
          addressLine: item.addressLine || '',
          isDefault: !!item.isDefault,
        }));

        if (!info.fullName) {
          const defaultAddr = this.savedAddresses.find(a => a.isDefault);
          if (defaultAddr) {
            this.selectedSavedAddressId = defaultAddr.id;
            this.applySavedAddress(defaultAddr);
          }
        } else {
          this.loadExistingInfo(info);
        }
      } else {
        this.loadExistingInfo(info);
      }
    } else {
      this.loadExistingInfo(info);
    }

    if (!this.selectedProvince) {
      this.selectedProvince = 'TP. Hồ Chí Minh';
    }
    this.availableDistricts = this.districtsMap[this.selectedProvince] || [];

    this.promoInput = this.cartService.discountCode();
    void this.refreshShippingOptions();
  }

  ngOnDestroy() {
    if (this.qrInterval) {
      clearInterval(this.qrInterval);
      this.qrInterval = null;
    }
  }

  loadExistingInfo(info: any) {
    if (info.fullName) this.fullName = info.fullName;
    if (info.email) this.email = info.email;
    if (info.phone) this.phone = info.phone;
    if (info.address) this.address = info.address;
    if (info.province) {
      this.selectedProvince = info.province;
      this.onProvinceChange();
    }
    if (info.district) {
      this.selectedDistrict = info.district;
      this.onDistrictChange();
    }
    if (info.ward) {
      this.selectedWard = info.ward;
    }
  }

  onSavedAddressChange() {
    if (this.selectedSavedAddressId === 'custom') {
      this.fullName = '';
      this.phone = '';
      this.address = '';
      this.selectedProvince = 'TP. Hồ Chí Minh';
      this.selectedDistrict = '';
      this.selectedWard = '';
      this.availableDistricts = this.districtsMap[this.selectedProvince] || [];
      this.availableWards = [];
    } else {
      const addr = this.savedAddresses.find(a => a.id === this.selectedSavedAddressId);
      if (addr) {
        this.applySavedAddress(addr);
      }
    }
  }

  applySavedAddress(addr: SavedAddress) {
    this.fullName = addr.fullName;
    this.phone = addr.phone;
    this.selectedProvince = addr.province || 'TP. Hồ Chí Minh';
    this.availableDistricts = this.districtsMap[this.selectedProvince] || [];
    this.selectedDistrict = addr.district;
    this.availableWards = this.wardsMap[this.selectedDistrict] || [];
    this.selectedWard = addr.ward;
    this.address = addr.addressLine;
    this.saveShippingInfo();
    void this.refreshShippingOptions();
  }

  onProvinceChange() {
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.availableWards = [];
    this.availableDistricts = this.districtsMap[this.selectedProvince] || [];
    this.updateAddress();
    this.saveShippingInfo();
    void this.refreshShippingOptions();
  }

  onDistrictChange() {
    this.selectedWard = '';
    this.availableWards = this.wardsMap[this.selectedDistrict] || [];
    this.updateAddress();
    this.saveShippingInfo();
  }

  onWardChange() {
    this.updateAddress();
    this.saveShippingInfo();
  }

  updateAddress() {
    const parts = [];
    if (this.selectedProvince) parts.push(this.selectedProvince);
    if (this.selectedDistrict) parts.push(this.selectedDistrict);
    if (this.selectedWard) parts.push(this.selectedWard);
    if (!this.address) {
      this.address = parts.join(' - ');
    }
  }

  saveShippingInfo() {
    this.cartService.serverQuote.set(null);
    this.requestKey = '';
    this.cartService.shippingInfo.set({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      address: this.address,
      province: this.selectedProvince,
      district: this.selectedDistrict,
      ward: this.selectedWard,
    });
  }

  private checkoutItems() {
    return this.cartService.items().map((item) => ({
      productId: item.productId || item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));
  }

  async refreshShippingOptions(): Promise<void> {
    const version = ++this.optionsVersion;
    if (!this.selectedProvince) return;
    this.loadingOptions = true;
    this.checkoutError = '';
    try {
      const result = await this.checkoutService.shippingOptions(this.checkoutItems(), this.selectedProvince);
      if (version !== this.optionsVersion) return;
      if (result.options && result.options.length) {
        this.shippingOptions = result.options;
      } else {
        this.shippingOptions = [...this.defaultShippingOptions];
      }
      if (!this.shippingOptions.some(o => o.id === this.selectedShippingId)) {
        this.selectedShippingId = this.shippingOptions[0]?.id || 'ship-standard';
      }
    } catch {
      if (version === this.optionsVersion) {
        this.shippingOptions = [...this.defaultShippingOptions];
        if (!this.selectedShippingId) this.selectedShippingId = this.defaultShippingOptions[0].id;
      }
    } finally {
      if (version === this.optionsVersion) {
        this.loadingOptions = false;
        this.cdr.detectChanges();
      }
    }
  }

  async setShippingMethod(id: string): Promise<void> {
    this.selectedShippingId = id;
    this.cartService.serverQuote.set(null);
    this.requestKey = '';
    await this.refreshQuote();
  }

  async refreshQuote(): Promise<boolean> {
    if (!this.selectedProvince || !this.selectedShippingId) return true;
    this.loadingQuote = true;
    this.checkoutError = '';
    try {
      const quote = await this.checkoutService.quote(
        this.checkoutItems(),
        this.selectedProvince,
        this.selectedShippingId,
        this.cartService.discountCode()
      );
      this.cartService.serverQuote.set(quote);
      this.promoMessage = quote.voucherCode ? 'Áp dụng mã giảm giá thành công.' : '';
      this.promoError = false;
      return true;
    } catch {
      // Graceful fallback to client-side pricing
      return true;
    } finally {
      this.loadingQuote = false;
      this.cdr.detectChanges();
    }
  }

  setPaymentMethod(method: 'cod' | 'bank') {
    this.cartService.paymentMethod.set(method);
  }

  async applyPromo(): Promise<void> {
    this.cartService.applyDiscountCode(this.promoInput);
    this.requestKey = '';
    if (!this.selectedShippingId && this.shippingOptions.length) {
      this.selectedShippingId = this.shippingOptions[0].id;
    }
    await this.refreshQuote();
  }

  // ====== QR TIMER LOGIC FOR BANK TRANSFER ======
  startQRTimer() {
    this.qrTimer = 300;
    this.updateQRString();
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.qrInterval = setInterval(() => {
      this.qrTimer--;
      if (this.qrTimer <= 0) {
        this.qrTimer = 300;
        this.updateQRString();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  updateQRString() {
    const timestamp = Date.now();
    const amount = this.confirmedTotal || this.cartService.total();
    this.qrDataString = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LIVORA_${this.orderNumber}_${amount}_${timestamp}`;
  }

  get formattedQRTime(): string {
    const m = Math.floor(this.qrTimer / 60);
    const s = this.qrTimer % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  confirmQRPayment() {
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.showQRModal = false;
    this.showSuccessModal = true;
    this.cdr.detectChanges();
  }

  cancelQRPayment() {
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.showQRModal = false;
    this.cdr.detectChanges();
  }

  // ====== COMPLETE ORDER (RULE 1 REQUIREMENT) ======
  async completeOrder(): Promise<void> {
    if (this.placingOrder) return;

    if (!this.fullName.trim() || !this.phone.trim() || !this.address.trim()) {
      this.showValidationErrors = true;
      this.checkoutError = 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.';
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    if (this.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.checkoutError = 'Email không hợp lệ.';
      return;
    }

    if (!/^[0-9+]{9,12}$/.test(this.phone.trim())) {
      this.checkoutError = 'Số điện thoại không hợp lệ (9 đến 11 chữ số).';
      return;
    }

    this.showValidationErrors = false;
    this.placingOrder = true;
    this.checkoutError = '';

    const currentU = this.authService.currentUser();
    const selectedOption = this.shippingOptions.find(o => o.id === this.selectedShippingId) || this.shippingOptions[0];
    const shippingFee = selectedOption?.fee || this.cartService.shippingFee() || 0;
    const finalAmount = this.cartService.total();

    const orderPayload = {
      userId: currentU ? (currentU.id || (currentU as any)._id) : undefined,
      customerId: currentU ? (currentU.id || (currentU as any)._id) : undefined,
      customerInfo: {
        fullName: this.fullName.trim(),
        name: this.fullName.trim(),
        phone: this.phone.trim(),
        email: this.email.trim() || undefined,
        address: this.address.trim(),
        province: this.selectedProvince,
        district: this.selectedDistrict,
        ward: this.selectedWard,
      },
      items: this.cartService.items().map(it => ({
        productId: it.productId || it.id,
        name: it.name,
        productName: it.name,
        price: it.price,
        unitPrice: it.price,
        quantity: it.quantity,
        thumbnail: it.image,
      })),
      voucherCode: this.cartService.discountCode() || undefined,
      shippingFee,
      paymentMethod: this.cartService.paymentMethod() === 'bank' ? 'BANK_TRANSFER' : 'COD',
      note: this.cartService.orderNote() || '',
    };

    try {
      // Gửi đơn hàng lên Backend MongoDB Atlas (/api/orders)
      const token = this.authService.token;
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const resData = await response.json();
      if (resData.success && resData.data?.orderCode) {
        this.orderNumber = resData.data.orderCode;
        this.confirmedTotal = resData.data.finalAmount || finalAmount;
      } else {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        this.orderNumber = `ORD-LIV-${randomNum}`;
        this.confirmedTotal = finalAmount;
      }

      // ====== RULE 1: GHI LOG VÀO WEB USER ======
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'USER_ORDER_CREATED',
        orderCode: this.orderNumber,
        customerName: this.fullName.trim(),
        phone: this.phone.trim(),
        paymentMethod: this.cartService.paymentMethod(),
        totalAmount: this.confirmedTotal,
        items: this.cartService.items().map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      };

      // 1. In log rõ ràng ra Web User DevTools Console
      console.log('📝 [LIVORA USER LOG] Đơn hàng đã được tạo thành công:', logEntry);
      console.info('[LIVORA USER LOG] Order Log Recorded:', JSON.stringify(logEntry, null, 2));

      // 2. Ghi log vào LocalStorage của Web User
      try {
        const logs = JSON.parse(localStorage.getItem('livora_user_order_logs') || '[]');
        logs.unshift(logEntry);
        localStorage.setItem('livora_user_order_logs', JSON.stringify(logs));

        const userOrders = JSON.parse(localStorage.getItem('livora_user_orders') || '[]');
        userOrders.unshift({
          ...orderPayload,
          orderCode: this.orderNumber,
          finalAmount: this.confirmedTotal,
          orderStatus: 'pending',
          paymentStatus: this.cartService.paymentMethod() === 'bank' ? 'paid' : 'unpaid',
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('livora_user_orders', JSON.stringify(userOrders));
      } catch (storageErr) {
        console.warn('[LIVORA USER] Lỗi lưu trữ log đơn hàng:', storageErr);
      }

      this.createdOrderPayload = orderPayload;

      // Xử lý phương thức thanh toán
      if (this.cartService.paymentMethod() === 'bank') {
        this.showQRModal = true;
        this.startQRTimer();
      } else {
        this.showSuccessModal = true;
      }
    } catch (error) {
      console.error('[LIVORA USER] Lỗi gửi đơn hàng:', error);
      this.checkoutError = error instanceof Error ? error.message : 'Không thể hoàn tất đơn hàng.';
    } finally {
      this.placingOrder = false;
      this.cdr.detectChanges();
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.cartService.clearCart();
    this.router.navigate(['/home']);
  }
}
