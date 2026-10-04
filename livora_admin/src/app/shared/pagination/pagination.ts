import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() itemLabel: string = '';
  @Input() totalPages?: number;
  @Input() disabled: boolean = false;

  @Output() pageChange = new EventEmitter<number>();

  get totalPagesCount(): number {
    if (this.totalPages && this.totalPages > 0) {
      return this.totalPages;
    }
    const perPage = this.itemsPerPage > 0 ? this.itemsPerPage : 10;
    return Math.max(1, Math.ceil(this.totalItems / perPage));
  }

  get startItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPagesCount;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  }

  onPageChange(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPagesCount || page === this.currentPage || this.disabled) {
      return;
    }
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  onPrevPage(): void {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPagesCount) {
      this.onPageChange(this.currentPage + 1);
    }
  }
}
