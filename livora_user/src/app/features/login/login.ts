import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLogin = true;
  isForgot = false;
  resetEmail = '';
  resetSuccessMessage = '';

  username = '';
  password = '';
  submitting = false;
  errorMessage = '';
  loginSuccessMessage = '';
  /** Why the visitor was sent here (e.g. tried to add to cart while signed out). */
  infoMessage = '';
  returnUrl = '/home';

  showPassword = false;
  showSignUpPassword = false;
  showSignUpConfirmPassword = false;

  // Sign up fields
  signUpEmail = '';
  signUpPhone = '';
  signUpPassword = '';
  signUpConfirmPassword = '';
  signUpErrorMessage = '';
  signUpSuccessMessage = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup') {
        this.isLogin = false;
        this.isForgot = false;
      } else {
        this.isLogin = true;
        this.isForgot = false;
      }

      if (params['returnUrl'] && String(params['returnUrl']).startsWith('/') && !String(params['returnUrl']).startsWith('//')) {
        this.returnUrl = params['returnUrl'];
      }
      this.infoMessage = params['reason'] === 'cart'
        ? 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng. Sau khi đăng nhập bạn sẽ được đưa về trang trước đó.'
        : '';
      this.cdr.detectChanges();
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleSignUpPasswordVisibility() {
    this.showSignUpPassword = !this.showSignUpPassword;
  }

  toggleSignUpConfirmPasswordVisibility() {
    this.showSignUpConfirmPassword = !this.showSignUpConfirmPassword;
  }

  showForgotForm(event: Event) {
    event.preventDefault();
    this.isForgot = true;
    this.isLogin = false;
    this.resetSuccessMessage = '';
    this.resetEmail = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  showLoginForm(event: Event) {
    event.preventDefault();
    this.isForgot = false;
    this.isLogin = true;
    this.errorMessage = '';
    this.signUpErrorMessage = '';
    this.loginSuccessMessage = '';
    this.cdr.detectChanges();
  }

  doResetPassword(event: Event) {
    event.preventDefault();
    if (!this.resetEmail.trim()) {
      this.errorMessage = 'Vui lòng nhập email hoặc số điện thoại.';
      return;
    }
    this.errorMessage = 'Khôi phục mật khẩu hiện chưa khả dụng. Vui lòng liên hệ quản trị viên.';
    this.cdr.detectChanges();
  }

  toggleForm(event: Event) {
    event.preventDefault();
    this.isLogin = !this.isLogin;
    this.isForgot = false;
    this.errorMessage = '';
    this.signUpErrorMessage = '';
    this.signUpSuccessMessage = '';
    this.loginSuccessMessage = '';
    this.cdr.detectChanges();
  }

  async doLogin(event?: Event) {
    if (event) event.preventDefault();
    if (this.submitting) return;

    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Vui lòng nhập Email / Số điện thoại và Mật khẩu.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.loginSuccessMessage = '';
    this.cdr.detectChanges();

    try {
      await this.authService.login(this.username, this.password);
      this.errorMessage = '';
      await this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.';
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  async doRegister(event?: Event) {
    if (event) event.preventDefault();
    if (this.submitting) return;

    const email = this.signUpEmail.trim().toLowerCase();
    const phone = this.signUpPhone.trim();
    const password = this.signUpPassword;
    const confirm = this.signUpConfirmPassword;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.signUpErrorMessage = 'Vui lòng nhập định dạng email hợp lệ.';
      return;
    }
    if (phone && !/^0\d{9,10}$/.test(phone)) {
      this.signUpErrorMessage = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
      return;
    }
    if (!password || password.length < 6) {
      this.signUpErrorMessage = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
      return;
    }
    if (password !== confirm) {
      this.signUpErrorMessage = 'Mật khẩu xác nhận không trùng khớp.';
      return;
    }

    this.submitting = true;
    this.signUpErrorMessage = '';
    this.signUpSuccessMessage = '';
    this.cdr.detectChanges();

    try {
      await this.authService.register({
        email,
        phone: phone || undefined,
        password,
      });

      this.signUpSuccessMessage = 'Đăng ký tài khoản thành công! Đang chuyển sang màn hình đăng nhập...';
      this.cdr.detectChanges();

      setTimeout(() => {
        this.isLogin = true;
        this.isForgot = false;
        this.username = email;
        this.password = '';
        this.errorMessage = '';
        this.loginSuccessMessage = 'Đăng ký tài khoản thành công! Vui lòng nhập mật khẩu để đăng nhập.';
        this.signUpPassword = '';
        this.signUpConfirmPassword = '';
        this.signUpSuccessMessage = '';
        this.cdr.detectChanges();
      }, 1200);
    } catch (error) {
      this.signUpErrorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.';
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  goToHome(event: Event) {
    event.preventDefault();
    this.router.navigate(['/home']);
  }

  blockAction(event: Event) {
    event.preventDefault();
  }
}
