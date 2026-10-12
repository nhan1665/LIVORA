import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Review, ReviewListQuery, ReviewListResponse } from './review.model';

/**
 * Session-only Review service boundary for the Admin Interaction Management module.
 *
 * No backend or API contract exists in the repository (see SYSTEM_DESIGN.md section 7),
 * so this service exposes a typed in-memory registry seeded with demo fixtures. All
 * moderation changes stay in the current browser session and reset on reload; the
 * typed Observable boundary is kept so an approved API implementation can replace it.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly reviews$ = new BehaviorSubject<Review[]>(this.generateInitialFixtures());

  /** Queries reviews with keyword, rating, status filtering and pagination. */
  listReviews(query: ReviewListQuery): Observable<ReviewListResponse> {
    return this.reviews$.pipe(
      map((reviews) => {
        let filtered = [...reviews];

        const term = query.search.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            (r) =>
              r.customerName.toLowerCase().includes(term) ||
              r.productName.toLowerCase().includes(term)
          );
        }

        if (query.rating !== 'all') {
          filtered = filtered.filter((r) => r.rating === query.rating);
        }

        if (query.status !== 'all') {
          filtered = filtered.filter((r) => r.status === query.status);
        }

        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const currentPage = Math.min(Math.max(1, query.page), totalPages);
        const startIndex = (currentPage - 1) * query.pageSize;

        return {
          items: filtered.slice(startIndex, startIndex + query.pageSize),
          page: currentPage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
          hiddenCount: reviews.filter((r) => r.status === 'hidden').length,
        };
      })
    );
  }

  getReviewById(idOrCode: string): Observable<Review | null> {
    return this.reviews$.pipe(
      map((reviews) => reviews.find((r) => r.id === idOrCode || r.code === idOrCode) || null)
    );
  }

  /**
   * Hides an inappropriate review (BPMN 3.3.2.10 "Ẩn đánh giá"). The record is
   * retained and an already hidden review cannot be hidden again (exception flow).
   */
  hideReview(
    id: string,
    hiddenReason = '',
    moderatedBy = 'CSKH — Trần Mai Phương'
  ): Observable<Review> {
    return of(null).pipe(
      map(() => {
        const reviews = this.reviews$.getValue();
        const index = reviews.findIndex((r) => r.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy đánh giá.');
        }
        if (reviews[index].status === 'hidden') {
          throw new Error('Đánh giá đã được ẩn.');
        }

        const updated: Review = {
          ...reviews[index],
          status: 'hidden',
          hiddenReason: hiddenReason.trim() || 'Nội dung không phù hợp với quy định kiểm duyệt.',
          moderatedBy,
          moderatedAt: new Date().toISOString(),
        };

        const next = [...reviews];
        next[index] = updated;
        this.reviews$.next(next);

        return updated;
      })
    );
  }

  private generateInitialFixtures(): Review[] {
    const productPool = [
      { name: 'Sofa Da Bò Cognac Atelier', sku: 'SP-SF-0102', thumbnail: '/images/rooms/living-room.png' },
      { name: 'Bàn ăn Đá Travertine Tự Nhiên', sku: 'SP-TB-0045', thumbnail: '/images/rooms/dining-room.png' },
      { name: 'Ghế Armchair Nỉ Bouclé', sku: 'SP-AC-0089', thumbnail: '/images/rooms/bedroom.png' },
      { name: 'Đèn Cây Đứng Brass Atelier', sku: 'SP-LT-0012', thumbnail: '/images/rooms/kitchen.png' },
      { name: 'Kệ Tivi Gỗ Óc Chó Bắc Mỹ', sku: 'SP-CB-0033', thumbnail: '/images/rooms/living-room.png' },
      { name: 'Giường Bọc Nhung Cao Cấp', sku: 'SP-BD-0071', thumbnail: '/images/rooms/bedroom.png' },
      { name: 'Tủ Rượu Gỗ Sồi Khảm Đồng', sku: 'SP-CB-0058', thumbnail: '/images/rooms/dining-room.png' },
      { name: 'Bàn Trà Đá Cẩm Thạch', sku: 'SP-TB-0019', thumbnail: '/images/rooms/living-room.png' },
      { name: 'Thảm Len Dệt Tay Anatolia', sku: 'SP-RG-0027', thumbnail: '/images/rooms/bathroom.jpg' },
      { name: 'Đèn Thả Trần Mây Đan', sku: 'SP-LT-0044', thumbnail: '/images/rooms/kitchen.png' },
    ];

    const referenceRows: Review[] = [
      {
        id: 'review-001',
        code: 'DG-9021',
        customerName: 'Hoàng Kim Oanh',
        customerContext: 'Biệt thự Ciputra, Hà Nội',
        productId: 'prod-001',
        productName: 'Sofa Da Bò Cognac Atelier',
        productSku: 'SP-SF-0102',
        productThumbnail: '/images/rooms/living-room.png',
        orderId: 'ORD-2025-1021',
        rating: 5,
        comment:
          'Chất da bò thật sự rất êm và mềm tay, đường may tỉ mỉ, màu sắc cognac bên ngoài đẹp hơn mong đợi. Đội ngũ giao hàng và lắp đặt rất chuyên nghiệp.',
        images: [],
        status: 'visible',
        createdAt: '2025-10-24T09:12:00',
      },
      {
        id: 'review-002',
        code: 'DG-9020',
        customerName: 'Đỗ Quốc Thắng',
        customerContext: 'Penthouse Landmark 81, TP.HCM',
        productId: 'prod-002',
        productName: 'Bàn ăn Đá Travertine Tự Nhiên',
        productSku: 'SP-TB-0045',
        productThumbnail: '/images/rooms/dining-room.png',
        orderId: 'ORD-2025-1018',
        rating: 5,
        comment:
          'Mặt đá vân tự nhiên vân mây cực kỳ sang trọng, kết cấu chân bàn gỗ óc chó vững chãi. Xứng đáng với mức giá cho một sản phẩm bespoke.',
        images: [],
        status: 'visible',
        createdAt: '2025-10-23T14:05:00',
      },
      {
        id: 'review-003',
        code: 'DG-9019',
        customerName: 'Vũ Mai Chi',
        customerContext: 'Sunwah Pearl, Bình Thạnh',
        productId: 'prod-003',
        productName: 'Ghế Armchair Nỉ Bouclé',
        productSku: 'SP-AC-0089',
        productThumbnail: '/images/rooms/bedroom.png',
        orderId: 'ORD-2025-1015',
        rating: 4,
        comment:
          'Kiểu dáng độc đáo, đệm ngồi êm ái đàn hồi tốt. Trừ 1 sao do thời gian chờ xuống bọc vải hơi lâu so với dự kiến nhưng chất lượng hoàn thiện rất tốt.',
        images: [],
        status: 'visible',
        createdAt: '2025-10-22T16:40:00',
      },
      {
        id: 'review-004',
        code: 'DG-9018',
        customerName: 'nguyen_van_a',
        customerFlag: 'Tài khoản nghi vấn / spam',
        productId: 'prod-004',
        productName: 'Đèn Cây Đứng Brass Atelier',
        productSku: 'SP-LT-0012',
        productThumbnail: '/images/rooms/kitchen.png',
        orderId: 'ORD-2025-1011',
        rating: 1,
        comment:
          'Sản phẩm rác, đừng mua. Mua món này đi qua bên shop xyz bán rẻ hơn nhiều, liên hệ zalo 0909xxxxxx để được giá tốt hơn.',
        images: [],
        status: 'hidden',
        hiddenReason: 'Nội dung quảng cáo, spam và chứa thông tin liên hệ bên ngoài không đúng quy định.',
        moderatedBy: 'CSKH — Trần Mai Phương',
        moderatedAt: '2025-10-21T17:20:00',
        createdAt: '2025-10-21T10:30:00',
      },
      {
        id: 'review-005',
        code: 'DG-9017',
        customerName: 'Bùi Anh Tuấn',
        customerContext: 'Kiến trúc sư nội thất, Studio A+',
        productId: 'prod-005',
        productName: 'Kệ Tivi Gỗ Óc Chó Bắc Mỹ',
        productSku: 'SP-CB-0033',
        productThumbnail: '/images/rooms/living-room.png',
        orderId: 'ORD-2025-1008',
        rating: 5,
        comment:
          'Chất lượng hoàn thiện sơn mờ cao cấp, phụ kiện bản lề giảm chấn Hafele chính hãng. Tôi đã giới thiệu cho nhiều khách hàng dự án tiếp theo.',
        images: [],
        status: 'visible',
        createdAt: '2025-10-20T11:15:00',
      },
    ];

    const names = [
      'Nguyễn Bích Trâm',
      'Trần Hữu Đạt',
      'Lê Ngọc Hân',
      'Phạm Tuấn Kiệt',
      'Hoàng Diệu Linh',
      'Đặng Quốc Khánh',
      'Ngô Thanh Vân',
      'Bùi Minh Quân',
      'Đinh Yến Nhi',
      'Tạ Hoàng Long',
      'Chu Khánh Vy',
      'Võ Thành Nam',
    ];
    const contexts = [
      'Chung cư Vinhomes Golden River, TP.HCM',
      'Biệt thự Thảo Điền, TP.HCM',
      'Nhà phố Quận 3, TP.HCM',
      'Villa FLC Sầm Sơn, Thanh Hoá',
      'Căn hộ Sunshine City, Hà Nội',
      'Nhà vườn Ecopark, Hưng Yên',
    ];
    const positiveComments = [
      'Sản phẩm hoàn thiện cực kỳ tỉ mỉ, gỗ lên màu đúng như hình tư vấn. Rất hài lòng với dịch vụ của LIVORA.',
      'Đóng gói kỹ càng, giao đúng hẹn, nhân viên lắp đặt thân thiện. Chất liệu đúng mô tả và bền chắc.',
      'Giá hợp lý so với chất lượng, thiết kế chuẩn không gian tối giản của gia đình tôi. Sẽ tiếp tục ủng hộ.',
      'Mua lần thứ hai cho dự án mới, chất lượng vẫn ổn định như lần đầu. Tư vấn viên hỗ trợ nhiệt tình.',
      'Màu sắc thực tế đẹp hơn ảnh, đường nét thủ công tinh xảo. Cả nhà ai cũng khen.',
    ];
    const mixedComments = [
      'Sản phẩm đẹp nhưng thời gian giao hơi trễ so với cam kết, mong shop cải thiện khâu vận chuyển.',
      'Chất lượng ổn trong tầm giá. Một vài chi tiết nhỏ chưa thật hoàn hảo nhưng tổng thể vẫn rất đáng mua.',
      'Thiết kế đẹp, đóng gói chắc chắn. Nhân viên lắp đặt chưa dọn sạch bụi sau khi hoàn tất, cần chú ý hơn.',
    ];
    const negativeComments = [
      'Màu thực tế lệch khá nhiều so với ảnh chụp, cần cải thiện khâu kiểm tra chất lượng trước khi giao.',
      'Sản phẩm có vết xước nhỏ ở mặt bên, đổi trả mất khá nhiều thời gian. Mong bộ phận CSKH phản hồi nhanh hơn.',
    ];

    const generated: Review[] = [];
    const baseDate = new Date('2025-10-19T18:00:00');

    for (let i = 6; i <= 342; i++) {
      const name = names[(i - 6) % names.length];
      const product = productPool[(i - 6) % productPool.length];
      const created = new Date(baseDate.getTime() - (i - 5) * 3.4 * 60 * 60 * 1000);
      const ratingPattern = [5, 5, 4, 5, 3, 4, 5, 2, 5, 1, 4, 5];
      const rating = ratingPattern[(i - 6) % ratingPattern.length];
      const comment =
        rating >= 4
          ? positiveComments[(i - 6) % positiveComments.length]
          : rating === 3
            ? mixedComments[(i - 6) % mixedComments.length]
            : negativeComments[(i - 6) % negativeComments.length];
      const hiddenPattern = i % 13 === 0;

      generated.push({
        id: `review-${String(i).padStart(3, '0')}`,
        code: `DG-${String(9022 - i).padStart(4, '0')}`,
        customerName: name,
        customerContext: contexts[(i - 6) % contexts.length],
        productId: `prod-${String(((i - 6) % productPool.length) + 1).padStart(3, '0')}`,
        productName: product.name,
        productSku: product.sku,
        productThumbnail: product.thumbnail,
        orderId: `ORD-2025-${String(1000 + i)}`,
        rating,
        comment,
        images: [],
        status: hiddenPattern ? 'hidden' : 'visible',
        hiddenReason: hiddenPattern
          ? 'Nội dung không phù hợp với quy định kiểm duyệt của LIVORA.'
          : undefined,
        moderatedBy: hiddenPattern ? 'CSKH — Trần Mai Phương' : undefined,
        moderatedAt: hiddenPattern
          ? new Date(created.getTime() + 5 * 60 * 60 * 1000).toISOString()
          : undefined,
        createdAt: created.toISOString(),
      });
    }

    return [...referenceRows, ...generated];
  }
}
