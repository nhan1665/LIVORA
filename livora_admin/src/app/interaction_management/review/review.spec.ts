import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Review } from './review';
import { ReviewService } from './review.service';

describe('Review Component', () => {
  let component: Review;
  let fixture: ComponentFixture<Review>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Review],
      providers: [ReviewService],
    }).compileComponents();

    fixture = TestBed.createComponent(Review);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the Review component', () => {
    expect(component).toBeTruthy();
  });

  it('should load page 1 with 5 of 342 reviews and 69 pages', () => {
    expect(component.reviews().length).toBe(5);
    expect(component.totalItems()).toBe(342);
    expect(component.totalPages()).toBe(69);
    expect(component.hiddenCount()).toBeGreaterThan(0);
  });

  it('should filter reviews by rating when applyFilter is called', () => {
    component.ratingDraft = 5;
    component.applyFilter();
    fixture.detectChanges();

    expect(component.reviews().length).toBeGreaterThan(0);
    expect(component.reviews().every((r) => r.rating === 5)).toBe(true);
  });

  it('should reset filters and restore page 1', () => {
    component.ratingDraft = 1;
    component.statusDraft = 'hidden';
    component.applyFilter();

    component.resetFilter();
    fixture.detectChanges();

    expect(component.ratingDraft).toBe('all');
    expect(component.statusDraft).toBe('all');
    expect(component.totalItems()).toBe(342);
    expect(component.currentPage()).toBe(1);
  });

  it('should open and close the detail modal', () => {
    const first = component.reviews()[0];
    component.openDetailModal(first);
    fixture.detectChanges();

    expect(component.isDetailModalOpen()).toBe(true);
    expect(component.selectedReview()?.id).toBe(first.id);

    component.closeDetailModal();
    expect(component.isDetailModalOpen()).toBe(false);
  });

  it('should hide a visible review with a reason through the hide modal', () => {
    const visible = component.reviews().find((r) => r.status === 'visible');
    expect(visible).toBeTruthy();

    component.openHideModal(visible!);
    expect(component.isHideModalOpen()).toBe(true);

    component.hideReasonDraft = 'Nội dung tiêu cực, sai lệch.';
    component.confirmHide();
    fixture.detectChanges();

    expect(component.isHideModalOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Đã ẩn đánh giá');
    const updated = component.reviews().find((r) => r.id === visible!.id);
    expect(updated?.status).toBe('hidden');
  });

  it('should not open the hide modal for an already hidden review', () => {
    const hidden = component.reviews().find((r) => r.status === 'hidden');
    if (hidden) {
      component.openHideModal(hidden);
      expect(component.isHideModalOpen()).toBe(false);
    }
  });
});
