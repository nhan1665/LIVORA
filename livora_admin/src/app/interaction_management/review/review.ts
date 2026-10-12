import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../shared/form-modal/form-modal';
import {
  Review as ReviewRecord,
  ReviewListQuery,
  ReviewRatingFilter,
  ReviewStatusFilter,
} from './review.model';
import { ReviewService } from './review.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [FormsModule, FormModal],
  templateUrl: './review.html',
  // Note: review styles live in interaction.css and are imported globally via styles.css
  // to stay below the 8 kB angular component style budget (team convention).
})
export class Review implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 5;
  readonly stars = [1, 2, 3, 4, 5];

  readonly reviews = signal<ReviewRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly hiddenCount = signal(0);

  searchDraft = '';
  ratingDraft: ReviewRatingFilter = 'all';
  statusDraft: ReviewStatusFilter = 'all';

  activeSearch = '';
  activeRating: ReviewRatingFilter = 'all';
  activeStatus: ReviewStatusFilter = 'all';

  readonly selectedReview = signal<ReviewRecord | null>(null);
  readonly isDetailModalOpen = signal(false);
  readonly isHideModalOpen = signal(false);
  hideReasonDraft = '';
  readonly isSubmitting = signal(false);

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.loadError.set('');

    const query: ReviewListQuery = {
      search: this.activeSearch,
      rating: this.activeRating,
      status: this.activeStatus,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.reviewService.listReviews(query).subscribe({
      next: (res) => {
        this.reviews.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.hiddenCount.set(res.hiddenCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError.set('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.activeSearch = this.searchDraft;
    this.activeRating = this.ratingDraft;
    this.activeStatus = this.statusDraft;
    this.currentPage.set(1);
    this.loadReviews();
  }

  resetFilter(): void {
    this.searchDraft = '';
    this.ratingDraft = 'all';
    this.statusDraft = 'all';
    this.activeSearch = '';
    this.activeRating = 'all';
    this.activeStatus = 'all';
    this.currentPage.set(1);
    this.loadReviews();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadReviews();
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

  openDetailModal(review: ReviewRecord): void {
    this.selectedReview.set(review);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedReview.set(null);
  }

  openHideModal(review: ReviewRecord): void {
    if (review.status === 'hidden') {
      return;
    }
    this.selectedReview.set(review);
    this.hideReasonDraft = '';
    this.isHideModalOpen.set(true);
  }

  closeHideModal(): void {
    this.isHideModalOpen.set(false);
    this.hideReasonDraft = '';
  }

  confirmHide(): void {
    const review = this.selectedReview();
    if (!review) {
      return;
    }

    this.isSubmitting.set(true);
    this.reviewService.hideReview(review.id, this.hideReasonDraft).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.isHideModalOpen.set(false);
        this.hideReasonDraft = '';
        if (this.isDetailModalOpen()) {
          this.selectedReview.set(updated);
        }
        this.showToast(`Đã ẩn đánh giá ${updated.code}. Đánh giá không còn hiển thị trên trang sản phẩm.`, 'success');
        this.loadReviews();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.showToast(err.message || 'Không thể cập nhật trạng thái đánh giá.', 'error');
      },
    });
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return iso;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
