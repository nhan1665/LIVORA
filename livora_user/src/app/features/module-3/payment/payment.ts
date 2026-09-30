import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';
import { Header } from '../../../layouts/header/header';
import { Footer } from '../../../layouts/footer/footer';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, RouterModule, Header, Footer, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit {
  public readonly cartService = inject(CartService);
  // 2. INJECT AUTH SERVICE VÀO COMPONENT
  public readonly authService = inject(AuthService);
  
  public readonly router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoggedIn = false;
  savedAddresses: SavedAddress[] = [];
  selectedSavedAddressId = '';

  // Form Fields
  fullName = '';
  email = '';
  phone = '';
  address = '';
  selectedProvince = '';
  selectedDistrict = '';
  selectedWard = '';

  // Options lists
  provinces = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Binh Duong Province', 'Dong Thap Province'];

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

  // QR Modal
  showQRModal = false;
  qrTimer = 300;
  qrInterval: any;
  qrDataString = '';

  // Success Modal
  showSuccessModal = false;
  orderNumber = '';

  ngOnInit() {
    if (this.cartService.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // 3. ĐỒNG BỘ TRẠNG THÁI TỪ AUTH SERVICE
    this.isLoggedIn = this.authService.isLoggedIn;
    const info = this.cartService.shippingInfo();

    if (this.isLoggedIn) {
      // Lấy thông tin user thật
      const userProfile = this.authService.currentUser();
      this.email = userProfile.email || '';
      
      // Khởi tạo sổ địa chỉ dựa trên thông tin User
      this.savedAddresses = [
        {
          id: 'addr1',
          fullName: userProfile.fullName,
          phone: userProfile.phone,
          province: userProfile.province,
          district: 'Thu Duc City', // Mock cho khớp với map
          ward: 'Linh Xuan Ward',
          addressLine: userProfile.address,
          isDefault: true
        },
        {
          id: 'addr2',
          fullName: userProfile.fullName,
          phone: '0988777666',
          province: 'Dong Thap Province',
          district: 'Chau Thanh District',
          ward: 'Vinh Binh Commune',
          addressLine: 'Tan Thanh Hamlet, Vinh Binh Commune',
          isDefault: false
        }
      ];

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
      // Khách vãng lai
      this.loadExistingInfo(info);
    }

    this.promoInput = this.cartService.discountCode();
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
  }

  onProvinceChange() {
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.availableWards = [];
    this.availableDistricts = this.districtsMap[this.selectedProvince] || [];
    this.updateAddress();
    this.saveShippingInfo();
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

  setShippingMethod(method: 'nhanh' | 'hoa-toc') {
    this.cartService.shippingMethod.set(method);
  }

  setPaymentMethod(method: 'cod' | 'bank') {
    this.cartService.paymentMethod.set(method);
  }

  applyPromo() {
    if (!this.promoInput.trim()) return;
    const success = this.cartService.applyDiscountCode(this.promoInput);
    if (success) {
      this.promoMessage = 'Áp dụng mã giảm giá thành công!';
      this.promoError = false;
    } else {
      this.promoMessage = 'Mã giảm giá không hợp lệ.';
      this.promoError = true;
    }
  }

  completeOrder() {
    this.saveShippingInfo();

    if (!this.fullName || !this.email || !this.phone || !this.address || !this.selectedProvince) {
      this.showValidationErrors = true;
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    this.showValidationErrors = false;

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.orderNumber = `LIV-${randomNum}`;

    if (this.cartService.paymentMethod() === 'bank') {
      this.showQRModal = true;
      this.startQRTimer();
    } else {
      this.showSuccessModal = true;
    }
  }

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
    const timestamp = new Date().getTime();
    this.qrDataString = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Chuyen khoan cho LIVORA - So tien: $${this.cartService.total()} - TS: ${timestamp}`;
  }

  get formattedQRTime() {
    const m = Math.floor(this.qrTimer / 60);
    const s = this.qrTimer % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  confirmQRPayment() {
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.showQRModal = false;
    this.showSuccessModal = true;
  }

  cancelQRPayment() {
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.showQRModal = false;
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.cartService.clearCart();
    this.router.navigate(['/home']);
  }
}