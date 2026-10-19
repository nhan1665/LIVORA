import { Component, inject, HostListener, ElementRef, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface MarqueeItem {
  id: string;
  code: string;
  title: string;
  iconType: string;
  order: number;
  status: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  public readonly cartService = inject(CartService);
  public readonly authService = inject(AuthService);
  public readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private eRef = inject(ElementRef);
  
  showAccountDropdown = false;
  marquees = signal<MarqueeItem[]>([]);

  ngOnInit(): void {
    this.loadMarquees();
  }

  loadMarquees(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/homepage/marquees?activeOnly=true`).subscribe({
      next: (res) => {
        const activeItems = (res.data || []).filter(
          (m: any) => m.status === 'Đang hoạt động' || m.status === 'active'
        );
        this.marquees.set(activeItems);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Không thể tải danh sách Marquee:', err);
      },
    });
  }

  getMarqueeIcon(type: string): string {
    switch (type) {
      case 'truck': return '🚚';
      case 'sparkle': return '✨';
      case 'user': return '👤';
      case 'sofa': return '🛋️';
      case 'discount': return '🏷️';
      case 'bell': return '🔔';
      default: return '✦';
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if(!this.eRef.nativeElement.contains(event.target)) {
      this.showAccountDropdown = false;
    }
  }

  onAccountIconClick(event: Event) {
    event.preventDefault();
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      this.router.navigate(['/profile']);
    } else {
      this.showAccountDropdown = !this.showAccountDropdown;
    }
  }

  goToLogin(isLogin: boolean) {
    this.showAccountDropdown = false;
    this.router.navigate(['/login'], { queryParams: { mode: isLogin ? 'login' : 'signup' } });
  }

  onLogout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
