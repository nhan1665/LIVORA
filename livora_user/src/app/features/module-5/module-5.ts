import { Component, inject, OnInit } from '@angular/core';
import { Header } from '../../layouts/header/header';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-module-5',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './module-5.html',
  styleUrl: './module-5.css',
})
export class Module5 implements OnInit {
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);
  
  isEditingPersonal = false;
  isAddingAddress = false;
  activeTab: 'personal' | 'history' | 'reviews' = 'personal';
  activeFilter = 'all';
  reviewFilter: 'not_reviewed' | 'reviewed' = 'not_reviewed';
  showLogoutConfirm = false;
  profileForm = { fullName: '', phone: '', birthDate: '', gender: '' };
  profileError = '';
  profileSuccess = '';
  profileLoading = false;
  profileSaving = false;

  get addresses() {
    return this.authService.currentUser()?.addresses || [];
  }

  async ngOnInit(): Promise<void> {
    this.profileLoading = true;
    try {
      const user = await this.authService.refreshProfile();
      this.setProfileForm(user);
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể tải hồ sơ.';
    } finally {
      this.profileLoading = false;
    }
  }

  private setProfileForm(user: { fullName: string; phone: string; birthDate?: string | null; gender?: string }): void {
    this.profileForm = {
      fullName: user.fullName,
      phone: user.phone,
      birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
      gender: user.gender || '',
    };
  }

  startProfileEdit(): void {
    const user = this.authService.currentUser();
    if (user) this.setProfileForm(user);
    this.profileError = '';
    this.profileSuccess = '';
    this.isEditingPersonal = true;
  }

  cancelProfileEdit(): void {
    this.isEditingPersonal = false;
    this.profileError = '';
  }

  async saveProfile(): Promise<void> {
    const fullName = this.profileForm.fullName.trim();
    const phone = this.profileForm.phone.trim();

    if (fullName.length > 120) {
      this.profileError = 'Họ tên không được vượt quá 120 ký tự.';
      return;
    }

    if (phone && !/^0\d{9,10}$/.test(phone)) {
      this.profileError = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
      return;
    }

    this.profileSaving = true;
    this.profileError = '';
    this.profileSuccess = '';
    try {
      const user = await this.authService.updateProfile({
        fullName,
        phone,
        birthDate: this.profileForm.birthDate || null,
        gender: this.profileForm.gender,
      });
      this.setProfileForm(user);
      this.isEditingPersonal = false;
      this.profileSuccess = 'Đã lưu thông tin cá nhân vào cơ sở dữ liệu thành công.';
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể lưu hồ sơ.';
    } finally {
      this.profileSaving = false;
    }
  }

  // Quản lý địa chỉ giao hàng
  addressForm = {
    recipientName: '',
    recipientPhone: '',
    province: '',
    district: '',
    ward: '',
    addressLine: '',
    isDefault: false,
  };
  addressSaving = false;
  addressError = '';

  resetAddressForm(): void {
    const user = this.authService.currentUser();
    this.addressForm = {
      recipientName: user?.fullName || '',
      recipientPhone: user?.phone || '',
      province: '',
      district: '',
      ward: '',
      addressLine: '',
      isDefault: !user?.addresses || user.addresses.length === 0,
    };
    this.addressError = '';
  }

  openAddAddress(): void {
    this.resetAddressForm();
    this.isAddingAddress = true;
  }

  async saveNewAddress(): Promise<void> {
    const { recipientName, recipientPhone, addressLine, province } = this.addressForm;
    if (!recipientName.trim()) {
      this.addressError = 'Vui lòng nhập tên người nhận.';
      return;
    }
    if (recipientPhone && !/^0\d{9,10}$/.test(recipientPhone.trim())) {
      this.addressError = 'Số điện thoại người nhận không hợp lệ.';
      return;
    }
    if (!addressLine.trim()) {
      this.addressError = 'Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường...).';
      return;
    }

    this.addressSaving = true;
    this.addressError = '';
    try {
      await this.authService.updateProfile({
        newAddress: {
          ...this.addressForm,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          addressLine: addressLine.trim(),
          province: province.trim(),
        },
      });
      this.isAddingAddress = false;
      this.profileSuccess = 'Thêm địa chỉ giao hàng thành công.';
    } catch (error) {
      this.addressError = error instanceof Error ? error.message : 'Không thể thêm địa chỉ.';
    } finally {
      this.addressSaving = false;
    }
  }

  async setDefaultAddress(index: number): Promise<void> {
    const current = this.authService.currentUser();
    if (!current?.addresses || !current.addresses[index]) return;
    const updated = current.addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    try {
      await this.authService.updateProfile({ addresses: updated });
      this.profileSuccess = 'Đã đặt làm địa chỉ mặc định.';
    } catch (error) {
      this.profileError = 'Không thể đặt địa chỉ mặc định.';
    }
  }

  async deleteAddress(index: number): Promise<void> {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    const current = this.authService.currentUser();
    if (!current?.addresses) return;
    const updated = current.addresses.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    try {
      await this.authService.updateProfile({ addresses: updated });
      this.profileSuccess = 'Đã xóa địa chỉ thành công.';
    } catch (error) {
      this.profileError = 'Không thể xóa địa chỉ.';
    }
  }

  // Upload Avatar
  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.profileError = 'Ảnh đại diện không được vượt quá 2MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await this.authService.updateProfile({ avatar: base64 });
        this.profileSuccess = 'Đã cập nhật ảnh đại diện.';
      } catch (e) {
        this.profileError = 'Không thể cập nhật ảnh đại diện.';
      }
    };
    reader.readAsDataURL(file);
  }

  setActiveTab(tab: 'personal' | 'history' | 'reviews') {
    this.activeTab = tab;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  setReviewFilter(filter: 'not_reviewed' | 'reviewed') {
    this.reviewFilter = filter;
  }

  logout(event: Event) {
    event.preventDefault();
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }
}
