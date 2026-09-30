import { Component, signal, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('livora_admin');
  isLoginPage = signal<boolean>(true);

  constructor() {
    // Initial check
    this.checkIsLoginPage(this.router.url);

    // Watch navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkIsLoginPage(event.urlAfterRedirects);
      });
  }

  private checkIsLoginPage(url: string): void {
    const isLogin = url.includes('/login') || url === '/' || url === '';
    this.isLoginPage.set(isLogin);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
