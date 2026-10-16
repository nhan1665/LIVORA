import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export type AuthViewMode = 'LOGIN' | 'FORGOT_STEP_1' | 'FORGOT_STEP_2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Current view state
  viewMode: AuthViewMode = 'LOGIN';

  // Login Form Data
  employeeCode: string = '';
  password: string = '';
  rememberMe: boolean = true;
  showPassword: boolean = false;

  // Forgot Password Form Data
  forgotEmployeeCode: string = '';
  recoveryEmailOrPhone: string = '';
  otpCode: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';
  showNewPassword: boolean = false;

  // Status & Feedback
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router) {}

  // Switch between Login and Forgot Password modes
  switchMode(mode: AuthViewMode): void {
    this.viewMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  // Convert employee code input to uppercase
  onEmployeeCodeInput(event: Event, field: 'login' | 'forgot'): void {
    const input = event.target as HTMLInputElement;
    const upperValue = input.value.toUpperCase();
    if (field === 'login') {
      this.employeeCode = upperValue;
    } else {
      this.forgotEmployeeCode = upperValue;
    }
  }

  // Quick fill demo credentials
  fillDemoCredentials(): void {
    this.employeeCode = 'NV2709';
    this.password = 'livora@2026';
    this.errorMessage = '';
  }

  // Handle Login submission
  async onLoginSubmit(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    const code = this.employeeCode.trim().toUpperCase();
    const pass = this.password;

    if (!code || !pass) {
      this.isLoading = false;
      this.errorMessage = 'Vui lòng nhập đầy đủ Mã nhân viên và Mật khẩu.';
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: code, password: pass }),
      });
      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('livora_admin_token', data.data.token);
        localStorage.setItem('livora_admin_user', JSON.stringify(data.data.user));
        this.isLoading = false;
        this.router.navigate(['/dashboard/revenue']);
        return;
      }

      this.isLoading = false;
      this.errorMessage = data.message || 'Mã nhân viên hoặc mật khẩu không chính xác.';
    } catch {
      // Fallback local check nếu backend không sẵn sàng
      this.isLoading = false;
      if (code === 'NV2709' && pass === 'livora@2026') {
        localStorage.setItem('livora_admin_user', JSON.stringify({ code: 'NV2709', role: 'super_admin' }));
        this.router.navigate(['/dashboard/revenue']);
      } else {
        this.errorMessage = 'Mã nhân viên hoặc mật khẩu không chính xác.';
      }
    }
  }

  // Handle Request OTP (Forgot Password Step 1)
  onRequestOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const code = this.forgotEmployeeCode.trim();
    const contact = this.recoveryEmailOrPhone.trim();

    if (!code) {
      this.errorMessage = 'Vui lòng nhập Mã nhân viên để xác thực danh tính.';
      return;
    }

    if (!contact) {
      this.errorMessage = 'Vui lòng nhập Email nội bộ hoặc Số điện thoại đã đăng ký.';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = `Mã xác thực 6 chữ số đã được gửi đến ${contact}.`;
      this.viewMode = 'FORGOT_STEP_2';
    }, 1200);
  }

  // Handle Reset Password (Forgot Password Step 2)
  onResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otpCode || this.otpCode.trim().length < 4) {
      this.errorMessage = 'Vui lòng nhập mã OTP xác thực hợp lệ.';
      return;
    }

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không trùng khớp.';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.';

      // Pre-fill login with new code
      this.employeeCode = this.forgotEmployeeCode;
      this.password = '';
      
      setTimeout(() => {
        this.switchMode('LOGIN');
      }, 1500);
    }, 1200);
  }
}
