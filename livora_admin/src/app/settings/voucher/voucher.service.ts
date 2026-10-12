import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Voucher,
  VoucherDraft,
  VoucherListQuery,
  VoucherListResponse,
} from './voucher.model';

/**
 * Session-only Voucher service boundary for the Admin Settings module.
 *
 * No backend or API contract exists in the repository (see SYSTEM_DESIGN.md section 7),
 * so this service exposes a typed in-memory registry seeded with demo fixtures. All
 * mutations stay in the current browser session and reset on reload; the typed
 * Observable boundary is kept so an approved API implementation can replace it.
 */
@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  /**
   * Demo reference instant used by the applicability-window filter so the seeded
   * fixture timeline (October 2025, matching the design reference) stays stable.
   */
  private readonly demoNow = new Date('2025-10-24T12:00:00');

  private readonly vouchers$ = new BehaviorSubject<Voucher[]>(this.generateInitialFixtures());

  /** Queries vouchers with keyword, type, status, time-window filtering and pagination. */
  listVouchers(query: VoucherListQuery): Observable<VoucherListResponse> {
    return this.vouchers$.pipe(
      map((vouchers) => {
        let filtered = [...vouchers];

        const term = query.search.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            (v) => v.code.toLowerCase().includes(term) || v.title.toLowerCase().includes(term)
          );
        }

        if (query.discountType !== 'all') {
          filtered = filtered.filter((v) => v.discountType === query.discountType);
        }

        if (query.status !== 'all') {
          filtered = filtered.filter((v) =>
            query.status === 'active' ? v.isActive : !v.isActive
          );
        }

        if (query.time !== 'all') {
          filtered = filtered.filter((v) => this.timeWindowOf(v) === query.time);
        }

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
          activeCount: vouchers.filter((v) => v.isActive).length,
        };
      })
    );
  }

  getVoucherById(id: string): Observable<Voucher | null> {
    return this.vouchers$.pipe(map((vouchers) => vouchers.find((v) => v.id === id) || null));
  }

  createVoucher(draft: VoucherDraft): Observable<Voucher> {
    return of(null).pipe(
      map(() => {
        const vouchers = this.vouchers$.getValue();
        const normalized = this.normalizeDraft(draft);
        this.validateDraft(normalized);
        if (vouchers.some((v) => v.code === normalized.code)) {
          throw new Error(`Mã voucher "${normalized.code}" đã tồn tại. Vui lòng nhập mã khác.`);
        }

        const created: Voucher = {
          ...normalized,
          id: `voucher-${Date.now()}-${vouchers.length + 1}`,
          usedCount: 0,
        };

        this.vouchers$.next([created, ...vouchers]);
        return created;
      })
    );
  }

  updateVoucher(id: string, draft: VoucherDraft): Observable<Voucher> {
    return of(null).pipe(
      map(() => {
        const vouchers = this.vouchers$.getValue();
        const index = vouchers.findIndex((v) => v.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy voucher.');
        }

        const normalized = this.normalizeDraft(draft);
        this.validateDraft(normalized);
        if (vouchers.some((v) => v.code === normalized.code && v.id !== id)) {
          throw new Error(`Mã voucher "${normalized.code}" đã tồn tại. Vui lòng nhập mã khác.`);
        }

        const updated: Voucher = {
          ...vouchers[index],
          ...normalized,
        };

        const next = [...vouchers];
        next[index] = updated;
        this.vouchers$.next(next);
        return updated;
      })
    );
  }

  /** Switches a voucher on/off (Table 27 `isActive`). */
  toggleVoucher(id: string): Observable<Voucher> {
    return of(null).pipe(
      map(() => {
        const vouchers = this.vouchers$.getValue();
        const index = vouchers.findIndex((v) => v.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy voucher.');
        }

        const updated: Voucher = { ...vouchers[index], isActive: !vouchers[index].isActive };
        const next = [...vouchers];
        next[index] = updated;
        this.vouchers$.next(next);
        return updated;
      })
    );
  }

  private timeWindowOf(voucher: Voucher): 'upcoming' | 'running' | 'expired' {
    const now = this.demoNow.getTime();
    if (now < new Date(voucher.startDate).getTime()) {
      return 'upcoming';
    }
    if (now > new Date(voucher.endDate).getTime()) {
      return 'expired';
    }
    return 'running';
  }

  private normalizeDraft(draft: VoucherDraft): VoucherDraft {
    return {
      ...draft,
      code: draft.code.trim().toUpperCase(),
      title: draft.title.trim(),
      discountValue: Number(draft.discountValue) || 0,
      maxDiscountAmount: Number(draft.maxDiscountAmount) || 0,
      minOrderValue: Number(draft.minOrderValue) || 0,
      quantity: Number(draft.quantity) || 0,
      perCustomerLimit: Number(draft.perCustomerLimit) || 1,
    };
  }

  private validateDraft(draft: VoucherDraft): void {
    if (!draft.code) {
      throw new Error('Vui lòng nhập mã voucher.');
    }
    if (!/^[A-Z0-9-]+$/.test(draft.code)) {
      throw new Error('Mã voucher chỉ gồm chữ in hoa, chữ số và dấu gạch ngang.');
    }
    if (!draft.title) {
      throw new Error('Vui lòng nhập tên chương trình ưu đãi.');
    }
    if (draft.discountValue <= 0) {
      throw new Error('Giá trị giảm phải lớn hơn 0.');
    }
    if (draft.discountType === 'percentage' && draft.discountValue > 100) {
      throw new Error('Giá trị giảm theo phần trăm không được vượt quá 100%.');
    }
    if (draft.discountType === 'percentage' && draft.maxDiscountAmount <= 0) {
      throw new Error('Vui lòng nhập hạn mức giảm tối đa cho voucher theo phần trăm.');
    }
    if (
      draft.discountType === 'fixed_amount' &&
      draft.maxDiscountAmount > 0 &&
      draft.maxDiscountAmount < draft.discountValue
    ) {
      throw new Error('Hạn mức giảm tối đa không được nhỏ hơn giá trị giảm cố định.');
    }
    if (draft.minOrderValue <= 0) {
      throw new Error('Giá trị đơn hàng tối thiểu phải lớn hơn 0.');
    }
    if (draft.quantity <= 0) {
      throw new Error('Số lượng voucher phát hành phải lớn hơn 0.');
    }
    if (!draft.startDate || !draft.endDate) {
      throw new Error('Vui lòng chọn thời gian hiệu lực của voucher.');
    }
    if (new Date(draft.endDate).getTime() <= new Date(draft.startDate).getTime()) {
      throw new Error('Thời gian kết thúc phải sau thời điểm kích hoạt.');
    }
    if ((draft.perCustomerLimit ?? 1) <= 0) {
      throw new Error('Giới hạn lượt dùng mỗi khách hàng phải lớn hơn 0.');
    }
  }

  private generateInitialFixtures(): Voucher[] {
    const referenceRows: Voucher[] = [
      {
        id: 'voucher-001',
        code: 'LIVORA-VIP10',
        title: 'Đặc quyền Penthouse & VIP Resident — Dành cho chủ sở hữu biệt thự & penthouse',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 25000000,
        minOrderValue: 50000000,
        quantity: 100,
        usedCount: 42,
        perCustomerLimit: 1,
        startDate: '2025-10-01T00:00:00',
        endDate: '2025-12-31T23:59:59',
        isActive: true,
      },
      {
        id: 'voucher-002',
        code: 'ATELIER-AUTUMN',
        title: 'BST Thu Đông — Không gian phòng khách áp dụng sofa da & bàn trà gỗ óc chó',
        discountType: 'fixed_amount',
        discountValue: 5000000,
        maxDiscountAmount: 5000000,
        minOrderValue: 30000000,
        quantity: 150,
        usedCount: 85,
        perCustomerLimit: 1,
        startDate: '2025-09-15T00:00:00',
        endDate: '2025-11-15T23:59:59',
        isActive: true,
      },
      {
        id: 'voucher-003',
        code: 'KTS-PARTNER15',
        title: 'Hợp tác Kiến trúc sư & Nhà thiết kế — Chiết khấu chuyên gia dự án cao cấp',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscountAmount: 50000000,
        minOrderValue: 100000000,
        quantity: 50,
        usedCount: 19,
        perCustomerLimit: 2,
        startDate: '2025-01-01T00:00:00',
        endDate: '2025-12-31T23:59:59',
        isActive: true,
      },
      {
        id: 'voucher-004',
        code: 'WELCOME-LIVORA',
        title: 'Chào mừng thành viên mới đăng ký — Quà tặng trải nghiệm đặt đóng nội thất',
        discountType: 'fixed_amount',
        discountValue: 1000000,
        maxDiscountAmount: 1000000,
        minOrderValue: 10000000,
        quantity: 300,
        usedCount: 210,
        perCustomerLimit: 1,
        startDate: '2025-08-01T00:00:00',
        endDate: '2025-10-31T23:59:59',
        isActive: true,
      },
      {
        id: 'voucher-005',
        code: 'SUMMER-SALE20',
        title: 'Tri ân mùa hè Atelier Craft — Chương trình kết thúc đợt 1',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 15000000,
        minOrderValue: 40000000,
        quantity: 100,
        usedCount: 100,
        perCustomerLimit: 1,
        startDate: '2025-06-01T00:00:00',
        endDate: '2025-08-31T23:59:59',
        isActive: false,
      },
    ];

    const programs = [
      ['VIP-LOUNGE', 'Ưu đãi thành viên phòng chờ VIP'],
      ['CRAFT-SIGN', 'Tri ân khách hàng sản phẩm chữ ký Atelier'],
      ['DINNING10', 'Combo bàn ăn & ghế gỗ sồi'],
      ['OCT-BEDROOM', 'Ưu đãi phòng ngủ trọn gói tháng 10'],
      ['ARCH-VOUCHER', 'Chiết khấu đối tác kiến trúc toàn quốc'],
      ['LIGHTING-WEEK', 'Tuần lễ chiếu sáng nghệ thuật'],
      ['MEMBER-GOLD', 'Đặc quyền hội viên Gold'],
      ['FREESHIP-SOFA', 'Miễn phí vận chuyển cho dòng sofa da'],
      ['BATH-RENEW', 'Gói làm mới phòng tắm cao cấp'],
      ['TET-EARLY', 'Đặt sớm ưu đãi Tết sớm'],
      ['SHOWROOM-TOUR', 'Quà tặng khách tham quan showroom'],
      ['LUXE-DECK', 'Ưu đãi ghế deck & bàn ngoài trời'],
    ];

    const generated: Voucher[] = [];
    for (let i = 6; i <= 36; i++) {
      const program = programs[(i - 6) % programs.length];
      const isPercentage = i % 2 === 0;
      const quantity = 20 + ((i * 7) % 12) * 10;
      const usedCount = Math.min(quantity, 3 + ((i * 11) % (quantity - 2)));
      const offset = (i % 10) + 1;
      const start = new Date(2025, 9 - (i % 4), offset, 0, 0, 0);
      const end = new Date(start.getTime() + ((i % 5) + 1) * 30 * 24 * 60 * 60 * 1000);

      generated.push({
        id: `voucher-${String(i).padStart(3, '0')}`,
        code: `${program[0]}-${String(i).padStart(2, '0')}`,
        title: program[1],
        discountType: isPercentage ? 'percentage' : 'fixed_amount',
        discountValue: isPercentage ? 5 + (i % 15) : 200000 + (i % 10) * 100000,
        maxDiscountAmount: isPercentage ? 5000000 + (i % 6) * 5000000 : 1000000 + (i % 5) * 1000000,
        minOrderValue: isPercentage ? 20000000 + (i % 5) * 10000000 : 10000000 + (i % 4) * 5000000,
        quantity,
        usedCount,
        perCustomerLimit: 1 + (i % 2),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isActive: i % 9 !== 0,
      });
    }

    return [...referenceRows, ...generated];
  }
}
