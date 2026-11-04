import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface CustomerAddress {
  addressId?: string;
  recipientName?: string;
  recipientPhone?: string;
  fullName?: string;
  phone?: string;
  addressLine?: string;
  street?: string;
  province?: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
  label?: string;
  notes?: string;
}

export interface CustomerUser {
  id: string;
  code?: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  gender?: string;
  avatar?: string;
  address?: string;
  province?: string;
  addresses?: CustomerAddress[];
}

export interface ProfileUpdate {
  fullName?: string;
  phone?: string;
  birthDate?: string | null;
  gender?: string;
  avatar?: string;
  address?: string;
  province?: string;
  addresses?: any[];
  newAddress?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth/customer`;
  readonly currentUser = signal<CustomerUser | null>(this.getStoredUser());

  constructor(private router: Router) {
    if (this.currentUser()) void this.refreshProfile().catch(() => this.clearSession());
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser() && !!this.token;
  }

  get token(): string | null {
    return localStorage.getItem('livora_customer_token');
  }

  private getStoredUser(): CustomerUser | null {
    try {
      if (!localStorage.getItem('livora_customer_token')) return null;
      const stored = localStorage.getItem('livora_user');
      return stored ? JSON.parse(stored) as CustomerUser : null;
    } catch {
      return null;
    }
  }

  private storeSession(user: CustomerUser, token?: string): void {
    if (token) localStorage.setItem('livora_customer_token', token);
    this.currentUser.set(user);
    localStorage.setItem('livora_user', JSON.stringify(user));
  }

  private clearSession(): void {
    this.currentUser.set(null);
    localStorage.removeItem('livora_user');
    localStorage.removeItem('livora_customer_token');
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('Quá thời gian kết nối đến máy chủ. Vui lòng kiểm tra backend server.');
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Không thể kết nối đến máy chủ backend (http://localhost:5000). Vui lòng đảm bảo server đang chạy.');
      }
      throw err;
    }
  }

  private async parseResponse(response: Response): Promise<any> {
    const text = await response.text();
    let result: any = null;
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Máy chủ phản hồi không đúng định dạng JSON (${response.status}).`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Không thể kết nối với máy chủ.');
    }
    return result.data;
  }

  async login(account: string, password: string): Promise<boolean> {
    const response = await this.fetchWithTimeout(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account.trim(), password }),
    });
    const data = await this.parseResponse(response);
    if (!data?.token || !data?.user?.id) throw new Error('Phản hồi đăng nhập không hợp lệ.');
    this.storeSession(data.user, data.token);
    return true;
  }

  async register(data: { email: string; password: string; fullName?: string; phone?: string }): Promise<boolean> {
    const response = await this.fetchWithTimeout(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await this.parseResponse(response);
    return true;
  }

  async refreshProfile(): Promise<CustomerUser> {
    const token = this.token;
    if (!token) throw new Error('Vui lòng đăng nhập.');
    const response = await this.fetchWithTimeout(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await this.parseResponse(response) as CustomerUser;
    this.storeSession(user);
    return user;
  }

  async updateProfile(update: ProfileUpdate): Promise<CustomerUser> {
    const token = this.token;
    if (!token) throw new Error('Vui lòng đăng nhập.');
    const response = await this.fetchWithTimeout(`${this.apiUrl}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(update),
    });
    const user = await this.parseResponse(response) as CustomerUser;
    this.storeSession(user);
    return user;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/home']);
  }
}
