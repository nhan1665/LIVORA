import { Component, inject } from '@angular/core';
import { Header } from '../../layouts/header/header';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-module-5',
  standalone: true,
  imports: [Header, CommonModule, RouterModule],
  templateUrl: './module-5.html',
  styleUrl: './module-5.css',
})
export class Module5 {
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);
  
  isEditingPersonal = false;
  isAddingAddress = false;
  activeTab: 'personal' | 'history' | 'reviews' = 'personal';
  activeFilter = 'all';
  reviewFilter: 'not_reviewed' | 'reviewed' = 'not_reviewed';
  showLogoutConfirm = false;

  setActiveTab(tab: 'personal' | 'history' | 'reviews') {
    this.activeTab = tab;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  setReviewFilter(filter: 'not_reviewed' | 'reviewed') {
    this.reviewFilter = filter;
  }

  logout(event: Event) {
    event.preventDefault();
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }
}