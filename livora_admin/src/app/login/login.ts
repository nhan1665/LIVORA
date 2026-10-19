import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type AuthViewMode = 'LOGIN' | 'FORGOT_STEP_1' | 'FORGOT_STEP_2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Current view state
  viewMode: AuthViewMode = 'LOGIN';

  // Login Form Data (Mặc định điền sẵn)
  employeeCode: string = 'ADMIN_LIVORA';
  password: string = 'livora@2026';
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

  // Switch between Login and Forgot Password modes
  switchMode(mode: AuthViewMode): void {
    this.viewMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
    this.cdr.detectChanges();
  }

  // Convert employee code input to uppercase/trimmed
  onEmployeeCodeInput(event: Event, field: 'login' | 'forgot'): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (field === 'login') {
      this.employeeCode = value;
    } else {
      this.forgotEmployeeCode = value;
    }
  }

  // Quick fill demo credentials
  fillDemoCredentials(): void {
    this.employeeCode = 'ADMIN_LIVORA';
    this.password = 'livora@2026';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  // Handle Login submission: Gửi request xác thực nhân viên với Backend
  onLoginSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const code = (this.employeeCode || '').trim();
    const pwd = this.password;

    if (!code) {
      this.errorMessage = 'Vui lòng nhập Mã nhân viên hoặc Tên đăng nhập.';
      this.cdr.detectChanges();
      return;
    }

    if (!pwd) {
      this.errorMessage = 'Vui lòng nhập Mật khẩu.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.post<any>(`${environment.apiBaseUrl}/auth/admin/login`, {
      employeeCode: code,
      password: pwd,
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const { token, user } = res.data;
          // Lưu token và thông tin nhân viên vào session
          localStorage.setItem('livora_admin_token', token);
          localStorage.setItem('livora_admin_user', JSON.stringify(user));

          this.successMessage = `Đăng nhập thành công! Xin chào ${user.fullName || user.username || user.code}. Đang chuyển hướng...`;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.router.navigate(['/dashboard/revenue']);
          }, 350);
        } else {
          this.errorMessage = res.message || 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        const backendMsg = err.error?.message;
        if (backendMsg) {
          this.errorMessage = backendMsg;
        } else if (err.status === 401) {
          this.errorMessage = 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        } else if (err.status === 404) {
          this.errorMessage = 'Mã nhân viên hoặc tên đăng nhập không tồn tại.';
        } else {
          this.errorMessage = 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại thông tin đăng nhập.';
        }
        this.cdr.detectChanges();
      },
    });
  }

  // Handle Request OTP (Forgot Password Step 1)
  onRequestOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const code = this.forgotEmployeeCode.trim();
    const contact = this.recoveryEmailOrPhone.trim();

    if (!code) {
      this.errorMessage = 'Vui lòng nhập Mã nhân viên để xác thực danh tính.';
      this.cdr.detectChanges();
      return;
    }

    if (!contact) {
      this.errorMessage = 'Vui lòng nhập Email nội bộ hoặc Số điện thoại đã đăng ký.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.post<any>(`${environment.apiBaseUrl}/auth/admin/forgot-password`, {
      employeeCode: code,
      contact: contact,
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.successMessage = res.message || `Mã xác thực 6 chữ số đã được gửi đến ${contact}.`;
        if (res.data?.otpSimulated) {
          this.otpCode = res.data.otpSimulated;
        }
        this.viewMode = 'FORGOT_STEP_2';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Không tìm thấy thông tin nhân viên khớp với mã cung cấp.';
        this.cdr.detectChanges();
      },
    });
  }

  // Handle Reset Password (Forgot Password Step 2)
  onResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otpCode || this.otpCode.trim().length < 4) {
      this.errorMessage = 'Vui lòng nhập mã OTP xác thực hợp lệ.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không trùng khớp.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.post<any>(`${environment.apiBaseUrl}/auth/admin/reset-password`, {
      employeeCode: this.forgotEmployeeCode,
      otpCode: this.otpCode,
      newPassword: this.newPassword,
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.successMessage = 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.';
        this.employeeCode = this.forgotEmployeeCode;
        this.password = this.newPassword;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.switchMode('LOGIN');
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
        this.cdr.detectChanges();
      },
    });
  }
}
