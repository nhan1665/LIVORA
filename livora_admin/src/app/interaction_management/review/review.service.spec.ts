import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReviewListQuery } from './review.model';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;

  const buildQuery = (overrides: Partial<ReviewListQuery> = {}): ReviewListQuery => ({
    search: '',
    rating: 'all',
    status: 'all',
    page: 1,
    pageSize: 5,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReviewService],
    });
    service = TestBed.inject(ReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed 342 visible/hidden reviews with a consistent hidden count', async () => {
    const res = await firstValueFrom(service.listReviews(buildQuery({ pageSize: 400 })));
    expect(res.totalItems).toBe(342);
    const hidden = res.items.filter((r) => r.status === 'hidden').length;
    expect(res.hiddenCount).toBe(hidden);
    expect(res.hiddenCount).toBeGreaterThan(0);
  });

  it('should search by customer name or product name', async () => {
    const byCustomer = await firstValueFrom(
      service.listReviews(buildQuery({ search: 'hoàng kim oanh' }))
    );
    expect(byCustomer.totalItems).toBe(1);
    expect(byCustomer.items[0].code).toBe('DG-9021');

    const byProduct = await firstValueFrom(
      service.listReviews(buildQuery({ search: 'cognac atelier' }))
    );
    expect(byProduct.totalItems).toBeGreaterThan(0);
    expect(
      byProduct.items.every((r) => r.productName.toLowerCase().includes('cognac atelier'))
    ).toBe(true);
  });

  it('should filter reviews by star rating', async () => {
    const res = await firstValueFrom(
      service.listReviews(buildQuery({ rating: 5, pageSize: 400 }))
    );
    expect(res.totalItems).toBeGreaterThan(0);
    expect(res.items.every((r) => r.rating === 5)).toBe(true);
  });

  it('should filter hidden reviews', async () => {
    const res = await firstValueFrom(
      service.listReviews(buildQuery({ status: 'hidden', pageSize: 400 }))
    );
    expect(res.totalItems).toBeGreaterThan(0);
    expect(res.items.every((r) => r.status === 'hidden')).toBe(true);
  });

  it('should paginate the registry (342 reviews, 69 pages of 5)', async () => {
    const firstPage = await firstValueFrom(service.listReviews(buildQuery()));
    expect(firstPage.totalPages).toBe(69);
    expect(firstPage.items.length).toBe(5);
    expect(firstPage.items[0].code).toBe('DG-9021');

    const lastPage = await firstValueFrom(service.listReviews(buildQuery({ page: 69 })));
    expect(lastPage.items.length).toBe(2);
  });

  it('should hide a visible review with a reason and retain the record', async () => {
    const hidden = await firstValueFrom(service.hideReview('review-001', 'Ngôn từ không phù hợp'));
    expect(hidden.status).toBe('hidden');
    expect(hidden.hiddenReason).toBe('Ngôn từ không phù hợp');
    expect(hidden.moderatedAt).toBeTruthy();

    const found = await firstValueFrom(service.getReviewById('review-001'));
    expect(found?.status).toBe('hidden');
    expect(found?.comment).toBeTruthy();
  });

  it('should reject hiding an already hidden review', async () => {
    await expect(firstValueFrom(service.hideReview('review-004'))).rejects.toThrow('đã được ẩn');
  });
});
