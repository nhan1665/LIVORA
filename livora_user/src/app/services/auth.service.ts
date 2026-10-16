import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface CustomerUser {
  id?: string;
  code?: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  province?: string;
  addresses?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth/customer`;

  // TÀI KHOẢN MẪU MẶC ĐỊNH
  private readonly DEFAULT_USER: CustomerUser = {
    fullName: 'LIVORA Customer',
    email: 'admin@livora.com',
    phone: '0901234567',
    address: '669 Đỗ Mười',
    province: 'TP. Hồ Chí Minh'
  };

  readonly currentUser = signal<CustomerUser | null>(this.getUserFromStorage());

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  constructor(private router: Router) {}

  private getUserFromStorage(): CustomerUser | null {
    try {
      const saved = localStorage.getItem('livora_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  /**
   * Đăng nhập khách hàng (hỗ trợ cả API backend và tài khoản mặc định)
   */
  login(email: string, pass: string): string {
    const cleanEmail = email.trim().toLowerCase();

    // Async sync với Backend API
    if (typeof fetch !== 'undefined') {
      fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.user) {
            this.currentUser.set(data.data.user);
            localStorage.setItem('livora_user', JSON.stringify(data.data.user));
            if (data.data.token) {
              localStorage.setItem('livora_customer_token', data.data.token);
            }
          }
        })
        .catch(() => {});
    }

    // Kiểm tra tài khoản mặc định
    if (cleanEmail === this.DEFAULT_USER.email) {
      if (pass !== 'password123') {
        return 'INVALID_PASSWORD';
      }
      this.currentUser.set(this.DEFAULT_USER);
      localStorage.setItem('livora_user', JSON.stringify(this.DEFAULT_USER));
      return 'SUCCESS';
    }

    // Nếu là email mới nhưng có pass, cho phép đăng nhập thành công
    if (cleanEmail && pass && pass.length >= 6) {
      const newUser: CustomerUser = {
        fullName: cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '0901234567',
        address: 'Hồ Chí Minh',
      };
      this.currentUser.set(newUser);
      localStorage.setItem('livora_user', JSON.stringify(newUser));
      return 'SUCCESS';
    }

    if (!cleanEmail.includes('@') && cleanEmail.length < 9) {
      return 'INVALID_USERNAME';
    }

    return 'INVALID_PASSWORD';
  }

  /**
   * Đăng ký tài khoản khách hàng mới lên Backend
   */
  async register(data: { fullName: string; email: string; phone: string; password: string; address?: string }): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        this.currentUser.set(json.data.user);
        localStorage.setItem('livora_user', JSON.stringify(json.data.user));
        if (json.data.token) {
          localStorage.setItem('livora_customer_token', json.data.token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('livora_user');
    localStorage.removeItem('livora_customer_token');
    this.router.navigate(['/home']);
  }
}