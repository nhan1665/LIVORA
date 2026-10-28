import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CheckoutService, ShippingOption } from '../../../services/checkout.service';

// 1. IMPORT AUTH SERVICE
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
export class Payment implements OnInit {
  public readonly cartService = inject(CartService);
  // 2. INJECT AUTH SERVICE VÀO COMPONENT
  public readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  
  public readonly router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoggedIn = false;
  savedAddresses: SavedAddress[] = [];
  selectedSavedAddressId = '';
  shippingOptions: ShippingOption[] = [];
  selectedShippingId = '';
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
  selectedProvince = '';
  selectedDistrict = '';
  selectedWard = '';

  // Options lists
  provinces: string[] = [];

  districtsMap: { [key: string]: string[] } = {
    'Ho Chi Minh City': ['District 1', 'District 3', 'Thu Duc City', 'Binh Thanh District'],
    'Hanoi': ['Hoan Kiem District', 'Ba Dinh District', 'Cau Giay District', 'Tay Ho District'],
    'Da Nang': ['Hai Chau District', 'Thanh Khe District', 'Lien Chieu District'],
    'Binh Duong Province': ['Thu Dau Mot City', 'Thuan An City', 'Di An City'],
    'Dong Thap Province': ['Chau Thanh District', 'Sa Dec City', 'Cao Lanh City']
  };

  wardsMap: { [key: string]: string[] } = {
    'District 1': ['Ben Nghe Ward', 'Da Kao Ward', 'Tan Dinh Ward', 'Pham Ngu Lao Ward'],
    'District 3': ['Vo Thi Sau Ward', 'Ward 12', 'Ward 14'],
    'Thu Duc City': ['Linh Trung Ward', 'Hiep Phu Ward', 'Thao Dien Ward', 'Binh Tho Ward', 'Linh Xuan Ward'],
    'Binh Thanh District': ['Ward 15', 'Ward 25', 'Truong Tho Ward'],
    'Hoan Kiem District': ['Hang Trong Ward', 'Trang Tien Ward', 'Hang Bong Ward'],
    'Ba Dinh District': ['Truc Bach Ward', 'Lieu Giai Ward', 'Kim Ma Ward'],
    'Cau Giay District': ['Dich Vong Ward', 'Nghia Tan Ward', 'Mai Dich Ward'],
    'Tay Ho District': ['Quang An Ward', 'Buoi Ward', 'Nhat Tan Ward'],
    'Hai Chau District': ['Thuan Phuoc Ward', 'Thach Thang Ward', 'Binh Thuan Ward'],
    'Thanh Khe District': ['An Khe Ward', 'Vinh Trung Ward', 'Chinh Gian Ward'],
    'Lien Chieu District': ['Hoa Khanh Bac Ward', 'Hoa Minh Ward', 'Hoa Hiep Nam Ward'],
    'Thu Dau Mot City': ['Phu Cuong Ward', 'Hiep Thanh Ward', 'Chanh Nghia Ward'],
    'Thuan An City': ['Lai Thieu Ward', 'An Phu Ward', 'Vinh Phu Ward'],
    'Di An City': ['Di An Ward', 'Dong Hoa Ward', 'Tan Dong Hiep Ward'],
    'Chau Thanh District': ['Vinh Binh Commune', 'Tan Nhuan Dong Commune', 'An Nhon Commune']
  };

  availableDistricts: string[] = [];
  availableWards: string[] = [];

  // Promo Code fields
  promoInput = '';
  promoMessage = '';
  promoError = false;

  // Validation
  showValidationErrors = false;

  // Success Modal
  showSuccessModal = false;
  orderNumber = '';

  ngOnInit() {
    if (this.cartService.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.checkoutService.regions().then((regions) => {
      this.provinces = regions;
      this.cdr.detectChanges();
    }).catch((error) => {
      this.checkoutError = error instanceof Error ? error.message : 'Không thể tải khu vực giao hàng.';
      this.cdr.detectChanges();
    });

    // 3. ĐỒNG BỘ TRẠNG THÁI TỪ AUTH SERVICE
    this.isLoggedIn = this.authService.isLoggedIn;
    const info = this.cartService.shippingInfo();

    if (this.isLoggedIn) {
      // Lấy thông tin user thật
      const userProfile = this.authService.currentUser();
      if (userProfile) {
        this.email = userProfile.email || '';
        
        // Khởi tạo sổ địa chỉ dựa trên thông tin User
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

        // LOGIC AUTOFILL UX TỐI ƯU: Chỉ tự động điền nếu form đang trống
        if (!info.fullName) {
          const defaultAddr = this.savedAddresses.find(a => a.isDefault);
          if (defaultAddr) {
            this.selectedSavedAddressId = defaultAddr.id;
            this.applySavedAddress(defaultAddr);
          }
        } else {
          // Tải lại những gì user đã gõ dở
          this.loadExistingInfo(info);
        }
      } else {
        this.loadExistingInfo(info);
      }
    } else {
      // Khách vãng lai
      this.loadExistingInfo(info);
    }

    this.promoInput = this.cartService.discountCode();
    if (this.selectedProvince) void this.refreshShippingOptions();
  }

  // 4. HÀM HỖ TRỢ TẢI LẠI DỮ LIỆU ĐÃ NHẬP
  loadExistingInfo(info: any) {
    this.fullName = info.fullName;
    this.email = info.email;
    this.phone = info.phone;
    this.address = info.address;
    
    this.selectedProvince = info.province;
    if (this.selectedProvince) this.onProvinceChange();
    
    this.selectedDistrict = info.district;
    if (this.selectedDistrict) this.onDistrictChange();
    
    this.selectedWard = info.ward;
  }

  onSavedAddressChange() {
    if (this.selectedSavedAddressId === 'custom') {
      this.fullName = '';
      this.phone = '';
      this.address = '';
      this.selectedProvince = '';
      this.selectedDistrict = '';
      this.selectedWard = '';
      this.availableDistricts = [];
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
    this.selectedProvince = addr.province;
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
    this.address = parts.join(' - ');
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
      ward: this.selectedWard
    });
  }

  private checkoutItems() {
    return this.cartService.items().map((item) => ({ productId: item.productId || item.id, quantity: item.quantity }));
  }

  async refreshShippingOptions(): Promise<void> {
    const version = ++this.optionsVersion;
    this.shippingOptions = [];
    this.selectedShippingId = '';
    this.cartService.serverQuote.set(null);
    if (!this.selectedProvince) return;
    this.loadingOptions = true;
    this.checkoutError = '';
    try {
      const result = await this.checkoutService.shippingOptions(this.checkoutItems(), this.selectedProvince);
      if (version !== this.optionsVersion) return;
      this.shippingOptions = result.options;
      if (!result.options.length) this.checkoutError = 'Không có phương thức vận chuyển cho khu vực này.';
    } catch (error) {
      if (version === this.optionsVersion) this.checkoutError = error instanceof Error ? error.message : 'Không thể tải phương thức vận chuyển.';
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
    if (!this.selectedProvince || !this.selectedShippingId) return false;
    this.loadingQuote = true;
    this.checkoutError = '';
    this.cartService.serverQuote.set(null);
    try {
      const quote = await this.checkoutService.quote(
        this.checkoutItems(), this.selectedProvince, this.selectedShippingId, this.cartService.discountCode()
      );
      this.cartService.serverQuote.set(quote);
      this.promoMessage = quote.voucherCode ? 'Áp dụng mã giảm giá thành công.' : '';
      this.promoError = false;
      return true;
    } catch (error) {
      this.checkoutError = error instanceof Error ? error.message : 'Không thể tính giá đơn hàng.';
      this.promoError = !!this.cartService.discountCode();
      if (this.promoError) this.promoMessage = this.checkoutError;
      return false;
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
    if (!this.selectedShippingId) {
      this.promoMessage = 'Vui lòng chọn phương thức vận chuyển trước.';
      this.promoError = true;
      return;
    }
    await this.refreshQuote();
  }

  async completeOrder(): Promise<void> {
    if (this.placingOrder) return;
    if (!this.fullName.trim() || !this.email.trim() || !this.phone.trim() ||
        !this.address.trim() || !this.selectedProvince || !this.selectedShippingId) {
      this.showValidationErrors = true;
      this.checkoutError = 'Vui lòng điền thông tin giao hàng và chọn phương thức vận chuyển.';
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) || !/^0\d{9,10}$/.test(this.phone.trim())) {
      this.checkoutError = 'Email hoặc số điện thoại không hợp lệ.';
      return;
    }
    this.showValidationErrors = false;
    if (!await this.refreshQuote()) return;
    if (!this.requestKey) this.requestKey = crypto.randomUUID();
    this.placingOrder = true;
    this.checkoutError = '';
    try {
      const result = await this.checkoutService.placeOrder({
        items: this.checkoutItems(),
        customerInfo: {
          fullName: this.fullName.trim(),
          phone: this.phone.trim(),
          email: this.email.trim(),
          address: this.address.trim(),
          district: this.selectedDistrict,
          ward: this.selectedWard,
        },
        province: this.selectedProvince,
        shippingId: this.selectedShippingId,
        voucherCode: this.cartService.discountCode(),
        paymentMethod: this.cartService.paymentMethod() === 'bank' ? 'bank_transfer' : 'cod',
        requestKey: this.requestKey,
        note: this.cartService.orderNote(),
      });
      this.orderNumber = result.orderCode;
      this.confirmedTotal = result.finalAmount;
      this.showSuccessModal = true;
    } catch (error) {
      this.checkoutError = error instanceof Error ? error.message : 'Không thể đặt hàng.';
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
