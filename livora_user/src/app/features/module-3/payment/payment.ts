import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CheckoutService, ShippingOption, CheckoutApiError } from '../../../services/checkout.service';
import { AuthService } from '../../../services/auth.service';
import { VIETNAM_PROVINCE_NAMES, getWardsForProvince } from '../../../shared/data/vietnam-locations';
import { environment } from '../../../../environments/environment';

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

export interface CompanyPolicyData {
  _id?: string;
  title?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  fileUrl?: string;
  fileData?: string;
  summary?: string;
  content?: string;
  version?: string;
  updatedAt?: string;
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
      estimatedDeliveryTime: '3 - 5 ngày',
      fee: 200,
    },
    {
      id: 'ship-express',
      shippingMethod: 'express',
      province: 'Toàn quốc',
      estimatedDeliveryTime: 'Trong ngày (4 giờ)',
      fee: 50000,
    },
  ];

  // Options lists (34 tỉnh thành chuẩn Việt Nam)
  provinces: string[] = VIETNAM_PROVINCE_NAMES;
  availableDistricts: string[] = [];
  availableWards: string[] = [];

  // Promo Code fields
  promoInput = '';
  promoMessage = '';
  promoError = false;
  /** The last voucher was refused because the visitor is not signed in. */
  promoNeedsLogin = false;

  // Validation
  showValidationErrors = false;

  // Policy Fields
  companyPolicy: CompanyPolicyData | null = null;
  isPolicyAgreed: boolean = false;
  showPolicyModal: boolean = false;
  loadingPolicy: boolean = false;

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
    if (this.cartService.selectedItems().length === 0) {
      this.cartService.toggleSelectAll(true);
    }

    this.shippingOptions = [...this.defaultShippingOptions];
    this.selectedShippingId = this.defaultShippingOptions[0].id;

    // Load company policy
    this.fetchCompanyPolicy();

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
    this.availableWards = getWardsForProvince(this.selectedProvince);

    this.promoInput = this.cartService.discountCode();
    void this.refreshShippingOptions();
  }

  ngOnDestroy() {
    if (this.qrInterval) {
      clearInterval(this.qrInterval);
      this.qrInterval = null;
    }
  }

  async fetchCompanyPolicy() {
    this.loadingPolicy = true;
    try {
      const response = await fetch(`${environment.apiBaseUrl}/refunds/policy`);
      const data = await response.json();
      if (data && data.success) {
        this.companyPolicy = data.data || null;
      } else {
        this.companyPolicy = null;
      }
    } catch (err) {
      console.warn('Lỗi khi tải chính sách mua hàng:', err);
      this.companyPolicy = null;
    } finally {
      this.loadingPolicy = false;
      this.cdr.detectChanges();
    }
  }

  openPolicyModal(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showPolicyModal = true;
  }

  closePolicyModal() {
    this.showPolicyModal = false;
  }

  agreePolicyFromModal() {
    this.isPolicyAgreed = true;
    this.showPolicyModal = false;
    this.checkoutError = '';
    this.cdr.detectChanges();
  }

  openPolicyDocument(event?: MouseEvent | Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const rawTarget = this.companyPolicy?.fileUrl || this.companyPolicy?.fileData;
    if (!rawTarget) return;

    if (rawTarget.startsWith('/uploads') || rawTarget.startsWith('http')) {
      const fileTarget = rawTarget.startsWith('http') ? rawTarget : `http://localhost:5000${rawTarget}`;
      window.open(fileTarget, '_blank');
      return;
    }

    if (rawTarget.startsWith('data:')) {
      try {
        const parts = rawTarget.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (e) {
        console.error('Lỗi mở data url:', e);
      }
    }

    const fileTarget = `http://localhost:5000${rawTarget}`;
    window.open(fileTarget, '_blank');
  }

  loadExistingInfo(info: any) {
    if (info.fullName) this.fullName = info.fullName;
    if (info.email) this.email = info.email;
    if (info.phone) this.phone = info.phone;
    if (info.address) this.address = info.address;
    if (info.province) {
      this.selectedProvince = info.province;
      this.availableWards = getWardsForProvince(this.selectedProvince);
    }
    if (info.district) {
      this.selectedDistrict = info.district;
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
      this.availableWards = getWardsForProvince(this.selectedProvince);
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
    this.availableWards = getWardsForProvince(this.selectedProvince);
    this.selectedDistrict = addr.district || '';
    this.selectedWard = addr.ward || '';
    this.address = addr.addressLine;
    this.saveShippingInfo();
    void this.refreshShippingOptions();
  }

  onProvinceChange() {
    this.availableWards = getWardsForProvince(this.selectedProvince);
    if (!this.availableWards.includes(this.selectedWard)) {
      this.selectedWard = '';
    }
    this.updateAddress();
    this.saveShippingInfo();
    void this.refreshShippingOptions();
  }

  onDistrictChange() {
    this.updateAddress();
    this.saveShippingInfo();
  }

  onWardChange() {
    this.updateAddress();
    this.saveShippingInfo();
  }

  updateAddress() {
    const parts = [];
    if (this.selectedWard) parts.push(this.selectedWard);
    if (this.selectedDistrict) parts.push(this.selectedDistrict);
    if (this.selectedProvince) parts.push(this.selectedProvince);
    if (!this.address || this.address.includes(' - ') || this.address.includes(', ')) {
      this.address = parts.join(', ');
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
    return this.cartService.selectedItems().map((item) => ({
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
      const selectedOption = this.shippingOptions.find(o => o.id === this.selectedShippingId) || this.shippingOptions[0];
      if (selectedOption) {
        this.cartService.customShippingFee.set(selectedOption.fee);
      }
      void this.refreshQuote();
    } catch {
      if (version === this.optionsVersion) {
        this.shippingOptions = [...this.defaultShippingOptions];
        if (!this.selectedShippingId) this.selectedShippingId = this.defaultShippingOptions[0].id;
        const selectedOption = this.shippingOptions.find(o => o.id === this.selectedShippingId) || this.shippingOptions[0];
        if (selectedOption) {
          this.cartService.customShippingFee.set(selectedOption.fee);
        }
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
    const selectedOption = this.shippingOptions.find(o => o.id === id);
    if (selectedOption) {
      this.cartService.customShippingFee.set(selectedOption.fee);
    }
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
      if (quote.voucherCode) {
        this.promoMessage = 'Áp dụng mã giảm giá thành công.';
        this.promoError = false;
        this.promoNeedsLogin = false;
      } else if (!this.promoError) {
        this.promoMessage = '';
      }
      return true;
    } catch (err) {
      const voucherCode = this.cartService.discountCode();
      if (voucherCode) {
        // The quote was refused because of the voucher: tell the customer why, drop the code,
        // and re-price without it so the total on screen matches what will be charged.
        this.promoError = true;
        this.promoNeedsLogin = err instanceof CheckoutApiError && err.status === 401;
        this.promoMessage = this.promoNeedsLogin
          ? `Mã "${voucherCode}" chỉ áp dụng cho khách hàng đã đăng nhập. Vui lòng đăng nhập để sử dụng mã giảm giá.`
          : (err instanceof Error && err.message) || `Không thể áp dụng mã "${voucherCode}".`;
        this.cartService.clearDiscount();
        this.loadingQuote = false;
        return this.refreshQuote();
      }
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
    this.promoMessage = '';
    this.promoError = false;
    this.promoNeedsLogin = false;
    if (!this.cartService.applyDiscountCode(this.promoInput)) {
      this.cartService.clearDiscount();
      this.promoMessage = 'Vui lòng nhập mã giảm giá.';
      this.promoError = true;
      await this.refreshQuote();
      return;
    }
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

    // Kiểm tra xem khách hàng đã đồng ý với chính sách công ty chưa
    if (!this.isPolicyAgreed) {
      this.checkoutError = 'Vui lòng đọc và tích chọn đồng ý với Chính sách công ty trước khi hoàn tất đặt hàng.';
      return;
    }

    this.showValidationErrors = false;
    this.placingOrder = true;
    this.checkoutError = '';

    const currentU = this.authService.currentUser();
    const selectedOption = this.shippingOptions.find(o => o.id === this.selectedShippingId) || this.shippingOptions[0];
    const shippingFee = selectedOption && selectedOption.fee !== undefined ? selectedOption.fee : (this.cartService.shippingFee() || 0);
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
      items: this.cartService.selectedItems().map(it => ({
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
      shippingMethod: selectedOption?.shippingMethod || 'standard',
      shippingProvince: selectedOption?.province || this.selectedProvince,
      paymentMethod: this.cartService.paymentMethod() === 'bank' ? 'BANK_TRANSFER' : 'COD',
      note: this.cartService.orderNote() || '',
    };

    try {
      // Gửi đơn hàng lên Backend MongoDB Atlas (/api/orders)
      const token = this.authService.token;
      const response = await fetch(`${environment.apiBaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok || !resData.success || !resData.data?.orderCode) {
        // Never show a made-up order code: the order does not exist unless the backend saved it.
        throw new Error(resData.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
      this.orderNumber = resData.data.orderCode;
      this.confirmedTotal = resData.data.finalAmount || finalAmount;

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
