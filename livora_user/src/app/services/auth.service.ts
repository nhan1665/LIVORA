import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // TÀI KHOẢN MOCK ĐỂ TEST
  private readonly MOCK_USER = {
    email: 'admin@livora.com',
    password: 'password123',
    fullName: 'LIVORA Admin',
    phone: '0901234567',
    address: '669 Đỗ Mười',
    province: 'TP. Hồ Chí Minh'
  };

  readonly currentUser = signal<any>(this.getUserFromStorage());

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  constructor(private router: Router) {}

  private getUserFromStorage() {
    const saved = localStorage.getItem('livora_user');
    return saved ? JSON.parse(saved) : null;
  }

  login(email: string, pass: string): string {
    if (email !== this.MOCK_USER.email) {
      return 'INVALID_USERNAME';
    }

    if (pass !== this.MOCK_USER.password) {
      return 'INVALID_PASSWORD';
    }

    const { password, ...userProfile } = this.MOCK_USER; 
    this.currentUser.set(userProfile);
    localStorage.setItem('livora_user', JSON.stringify(userProfile));
    
    return 'SUCCESS';
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('livora_user');
    this.router.navigate(['/home']);
  }
}