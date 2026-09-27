import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  public readonly cartService = inject(CartService);
  public readonly authService = inject(AuthService);
  public readonly router = inject(Router);
  private eRef = inject(ElementRef);
  
  showAccountDropdown = false;

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
