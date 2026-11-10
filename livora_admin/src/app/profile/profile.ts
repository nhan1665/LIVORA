import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  user: any = null;
  roleCode: string = '';
  roleDisplayName: string = '';

  // Đổi mật khẩu
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    try {
      const rawUser = localStorage.getItem('livora_admin_user');
      if (rawUser) {
        this.user = JSON.parse(rawUser);
        this.roleCode = (this.user.role || '').toUpperCase();
        this.roleDisplayName = this.getRoleName(this.roleCode);
      } else {
        this.router.navigate(['/login']);
      }
    } catch {
      this.router.navigate(['/login']);
    }
  }

  getRoleName(role: string): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin (Toàn quyền quản trị)',
      KE_TOAN: 'Kế toán viên',
      NV_VAN_HANH: 'Nhân viên Vận hành',
      NV_NOI_DUNG: 'Nhân viên Nội dung & Không gian 3D',
      CSKH: 'Nhân viên Chăm sóc khách hàng (CSKH)',
    };
    return map[role] || this.user?.roleName || 'Quản trị viên';
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'badge-super',
      KE_TOAN: 'badge-ketoan',
      NV_VAN_HANH: 'badge-vanhanh',
      NV_NOI_DUNG: 'badge-noidung',
      CSKH: 'badge-cskh',
    };
    return map[role] || 'badge-super';
  }

  getInitials(): string {
    const name = this.user?.fullName || this.user?.username || 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onSubmitChangePassword(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.currentPassword) {
      this.errorMessage = 'Vui lòng nhập mật khẩu hiện tại.';
      return;
    }

    if (!this.newPassword) {
      this.errorMessage = 'Vui lòng nhập mật khẩu mới.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Xác nhận mật khẩu mới không trùng khớp.';
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.errorMessage = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
      return;
    }

    this.isSubmitting = true;
    const token = localStorage.getItem('livora_admin_token') || '';

    const payload = {
      employeeId: this.user?.id || this.user?._id,
      code: this.user?.code,
      username: this.user?.username,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.http.post<any>(`${environment.apiBaseUrl}/auth/admin/change-password`, payload, { headers }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res && res.success) {
          this.successMessage = 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới cho lần đăng nhập tiếp theo.';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        } else {
          this.errorMessage = res?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Mật khẩu hiện tại không chính xác hoặc đã xảy ra lỗi.';
      },
    });
  }
}

