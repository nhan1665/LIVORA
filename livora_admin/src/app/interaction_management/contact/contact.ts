import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { FormModal } from '../../shared/form-modal/form-modal';
import {
  Contact as ContactRecord,
  ContactListQuery,
  ContactStatus,
  ContactStatusFilter,
  ContactTimeFilter,
} from './contact.model';
import { ContactService } from './contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, FormModal, ConfirmDialog],
  templateUrl: './contact.html',
  // Note: contact styles live in interaction.css and are imported globally via styles.css
  // to stay below the 8 kB angular component style budget (team convention).
})
export class Contact implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 5;

  readonly contacts = signal<ContactRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly pendingCount = signal(0);

  searchDraft = '';
  statusDraft: ContactStatusFilter = 'all';
  timeDraft: ContactTimeFilter = 'all';

  activeSearch = '';
  activeStatus: ContactStatusFilter = 'all';
  activeTime: ContactTimeFilter = 'all';

  readonly selectedContact = signal<ContactRecord | null>(null);
  readonly isDetailModalOpen = signal(false);
  readonly isResolveConfirmOpen = signal(false);
  readonly isSubmitting = signal(false);

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    this.loadError.set('');

    const query: ContactListQuery = {
      search: this.activeSearch,
      status: this.activeStatus,
      time: this.activeTime,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.contactService.listContacts(query).subscribe({
      next: (res) => {
        this.contacts.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.pendingCount.set(res.pendingCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError.set('Không thể tải danh sách liên hệ. Vui lòng thử lại.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.activeSearch = this.searchDraft;
    this.activeStatus = this.statusDraft;
    this.activeTime = this.timeDraft;
    this.currentPage.set(1);
    this.loadContacts();
  }

  resetFilter(): void {
    this.searchDraft = '';
    this.statusDraft = 'all';
    this.timeDraft = 'all';
    this.activeSearch = '';
    this.activeStatus = 'all';
    this.activeTime = 'all';
    this.currentPage.set(1);
    this.loadContacts();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadContacts();
  }

  getPaginationPages(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }

  openDetailModal(contact: ContactRecord): void {
    this.selectedContact.set(contact);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedContact.set(null);
  }

  openResolveConfirm(contact: ContactRecord): void {
    if (contact.status === 'resolved') {
      return;
    }
    this.selectedContact.set(contact);
    this.isResolveConfirmOpen.set(true);
  }

  cancelResolve(): void {
    this.isResolveConfirmOpen.set(false);
  }

  resolveMessage(): string {
    const contact = this.selectedContact();
    if (!contact) {
      return '';
    }
    return `Đánh dấu liên hệ ${contact.code} của ${contact.fullName} là "Đã xử lý"? Thao tác không thể hoàn tác.`;
  }

  confirmResolve(): void {
    const contact = this.selectedContact();
    if (!contact) {
      return;
    }

    this.isSubmitting.set(true);
    this.contactService.resolveContact(contact.id).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.isResolveConfirmOpen.set(false);
        if (this.isDetailModalOpen()) {
          this.selectedContact.set(updated);
        }
        this.showToast(`Đã cập nhật liên hệ ${updated.code} sang trạng thái Đã xử lý.`, 'success');
        this.loadContacts();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.isResolveConfirmOpen.set(false);
        this.showToast(err.message || 'Không thể cập nhật trạng thái liên hệ.', 'error');
      },
    });
  }

  statusLabel(status: ContactStatus): string {
    return status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý';
  }

  formatDateTime(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return iso;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.cdr.markForCheck();
    }, 3500);
    this.cdr.markForCheck();
  }
}
