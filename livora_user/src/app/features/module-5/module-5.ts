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
    if (!fullName || fullName.length > 120 || !/^0\d{9,10}$/.test(phone)) {
      this.profileError = 'Vui lòng nhập họ tên và số điện thoại hợp lệ.';
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
      this.profileSuccess = 'Đã lưu thông tin cá nhân.';
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể lưu hồ sơ.';
    } finally {
      this.profileSaving = false;
    }
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
