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
      this.errorMessage = 'Please enter your email or phone number.';
      return;
    }
    this.errorMessage = '';
    this.resetSuccessMessage = 'A password reset link has been successfully sent!';
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

  doLogin(event: Event) {
    event.preventDefault();
    const loginResult = this.authService.login(this.username, this.password);

    if (loginResult === 'SUCCESS') {
      this.errorMessage = '';
      this.router.navigateByUrl(this.returnUrl);
    } else if (loginResult === 'INVALID_USERNAME') {
      this.errorMessage = 'This phone number/email address has not been logged into the system.';
    } else if (loginResult === 'INVALID_PASSWORD') {
      this.errorMessage = 'The password is incorrect. Please check again.';
    }
  }

  goToHome(event: Event) {
    event.preventDefault();
    this.authService.login('admin@livora.com', 'password123');
    this.router.navigate(['/home']);
  }

  blockAction(event: Event) {
    event.preventDefault();
  }
}
