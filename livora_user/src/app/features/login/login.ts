import { Component, inject } from '@angular/core';
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
  isLogin = true;
  isForgot = false;
  resetEmail = '';
  resetSuccessMessage = '';

  username = '';
  password = '';
  submitting = false;
  errorMessage = '';
  returnUrl = '/home';

  showPassword = false;
  showSignUpPassword = false;
  showSignUpConfirmPassword = false;

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
  }

  showLoginForm(event: Event) {
    event.preventDefault();
    this.isForgot = false;
    this.isLogin = true;
    this.errorMessage = '';
  }

  doResetPassword(event: Event) {
    event.preventDefault();
    if (!this.resetEmail.trim()) {
      this.errorMessage = 'Vui lòng nhập email hoặc số điện thoại.';
      return;
    }
    this.errorMessage = '';
    this.errorMessage = 'Khôi phục mật khẩu hiện chưa khả dụng. Vui lòng liên hệ quản trị viên.';
  }

  private readonly authService = inject(AuthService);
  
  constructor(private router: Router, private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup') {
        this.isLogin = false;
        this.isForgot = false;
      } else {
        this.isLogin = true;
        this.isForgot = false;
      }

      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  toggleForm(event: Event) {
    event.preventDefault();
    this.isLogin = !this.isLogin;
    this.isForgot = false;
    this.errorMessage = '';
  }

  async doLogin(event: Event) {
    event.preventDefault();
    if (this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    try {
      await this.authService.login(this.username, this.password);
      this.errorMessage = '';
      await this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.';
    } finally {
      this.submitting = false;
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
