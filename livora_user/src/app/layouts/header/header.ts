import { Component, inject, HostListener, ElementRef, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ProductService, UserProduct } from '../../services/product.service';
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
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  public readonly cartService = inject(CartService);
  public readonly authService = inject(AuthService);
  public readonly router = inject(Router);
  public readonly productService = inject(ProductService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private eRef = inject(ElementRef);
  
  showAccountDropdown = false;
  marquees = signal<MarqueeItem[]>([]);

  // Search state
  searchKeyword = '';
  searchResults: UserProduct[] = [];
  isSearching = false;
  showSearchDropdown = false;
  private searchDebounceTimer: any = null;

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
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showAccountDropdown = false;
      this.showSearchDropdown = false;
    }
  }

  onSearchInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const term = this.searchKeyword.trim();
    if (term.length < 2) {
      this.searchResults = [];
      this.isSearching = false;
      this.showSearchDropdown = false;
      this.cdr.detectChanges();
      return;
    }

    this.showSearchDropdown = true;
    this.isSearching = true;
    this.cdr.detectChanges();

    this.searchDebounceTimer = setTimeout(() => {
      this.productService.getProducts({ search: term, pageSize: 6 }).subscribe({
        next: (items) => {
          this.searchResults = items || [];
          this.isSearching = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.searchResults = [];
          this.isSearching = false;
          this.cdr.detectChanges();
        },
      });
    }, 280);
  }

  onSearchFocus(): void {
    if (this.searchKeyword.trim().length >= 2) {
      this.showSearchDropdown = true;
    }
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.searchResults = [];
    this.showSearchDropdown = false;
    this.cdr.detectChanges();
  }

  executeSearch(): void {
    const term = this.searchKeyword.trim();
    if (!term) return;

    this.showSearchDropdown = false;
    this.router.navigate(['/search'], { queryParams: { q: term } });
  }

  selectProduct(item: UserProduct): void {
    this.showSearchDropdown = false;
    const room = item.roomSlugs && item.roomSlugs.length > 0 ? item.roomSlugs[0] : 'all';
    const category = item.categorySlug || 'all';
    this.router.navigate(['/rooms', room, category, item.id || item.slug]);
  }

  onAccountIconClick(event: Event) {
    event.preventDefault();
    this.showAccountDropdown = !this.showAccountDropdown;
  }

  goToProfile() {
    this.showAccountDropdown = false;
    this.router.navigate(['/profile']);
  }

  goToLogin(isLogin: boolean) {
    this.showAccountDropdown = false;
    this.router.navigate(['/login'], { queryParams: { mode: isLogin ? 'login' : 'signup' } });
  }

  onLogout(event: Event) {
    event.preventDefault();
    this.showAccountDropdown = false;
    this.authService.logout();
  }
}
