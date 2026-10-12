import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ShippingConfig,
  ShippingDraft,
  ShippingListQuery,
  ShippingListResponse,
} from './shipping.model';

/**
 * Session-only Shipping configuration service boundary for the Admin Settings module.
 *
 * No backend or API contract exists in the repository (see SYSTEM_DESIGN.md section 7),
 * so this service exposes a typed in-memory registry seeded with demo fixtures. All
 * mutations stay in the current browser session and reset on reload; the typed
 * Observable boundary is kept so an approved API implementation can replace it.
 */
@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private readonly configs$ = new BehaviorSubject<ShippingConfig[]>(this.generateInitialFixtures());

  /** Queries shipping configurations with keyword, method, status filtering and pagination. */
  listConfigs(query: ShippingListQuery): Observable<ShippingListResponse> {
    return this.configs$.pipe(
      map((configs) => {
        let filtered = [...configs];

        const term = query.search.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            (c) => c.province.toLowerCase().includes(term) || (c.hub || '').toLowerCase().includes(term)
          );
        }

        if (query.method !== 'all') {
          filtered = filtered.filter((c) => c.shippingMethod === query.method);
        }

        if (query.status !== 'all') {
          filtered = filtered.filter((c) =>
            query.status === 'active' ? c.isActive : !c.isActive
          );
        }

        filtered.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
          activeCount: configs.filter((c) => c.isActive).length,
        };
      })
    );
  }

  getConfigById(id: string): Observable<ShippingConfig | null> {
    return this.configs$.pipe(map((configs) => configs.find((c) => c.id === id) || null));
  }

  createConfig(draft: ShippingDraft): Observable<ShippingConfig> {
    return of(null).pipe(
      map(() => {
        const configs = this.configs$.getValue();
        const normalized = this.normalizeDraft(draft);
        this.validateDraft(normalized);

        const now = new Date().toISOString();
        const created: ShippingConfig = {
          ...normalized,
          id: `shipping-${Date.now()}-${configs.length + 1}`,
          createdAt: now,
          updatedAt: now,
        };

        this.configs$.next([created, ...configs]);
        return created;
      })
    );
  }

  updateConfig(id: string, draft: ShippingDraft): Observable<ShippingConfig> {
    return of(null).pipe(
      map(() => {
        const configs = this.configs$.getValue();
        const index = configs.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy cấu hình vận chuyển.');
        }

        const normalized = this.normalizeDraft(draft);
        this.validateDraft(normalized);

        const updated: ShippingConfig = {
          ...configs[index],
          ...normalized,
          updatedAt: new Date().toISOString(),
        };

        const next = [...configs];
        next[index] = updated;
        this.configs$.next(next);
        return updated;
      })
    );
  }

  /** Applies or pauses a shipping configuration (Table 29 `isActive`). */
  toggleConfig(id: string): Observable<ShippingConfig> {
    return of(null).pipe(
      map(() => {
        const configs = this.configs$.getValue();
        const index = configs.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy cấu hình vận chuyển.');
        }

        const updated: ShippingConfig = {
          ...configs[index],
          isActive: !configs[index].isActive,
          updatedAt: new Date().toISOString(),
        };

        const next = [...configs];
        next[index] = updated;
        this.configs$.next(next);
        return updated;
      })
    );
  }

  private normalizeDraft(draft: ShippingDraft): ShippingDraft {
    return {
      ...draft,
      province: draft.province.trim(),
      hub: draft.hub?.trim() || undefined,
      fee: Number(draft.fee) || 0,
      estimatedDeliveryTime: draft.estimatedDeliveryTime.trim(),
      freeShipThreshold: Number(draft.freeShipThreshold) || 0,
    };
  }

  private validateDraft(draft: ShippingDraft): void {
    if (!draft.province) {
      throw new Error('Vui lòng chọn khu vực tỉnh / thành phố áp dụng.');
    }
    if (draft.fee < 0) {
      throw new Error('Phí vận chuyển không được nhỏ hơn 0.');
    }
    if (!draft.estimatedDeliveryTime) {
      throw new Error('Vui lòng nhập thời gian giao dự kiến.');
    }
    if (draft.freeShipEnabled && draft.freeShipThreshold <= 0) {
      throw new Error('Vui lòng nhập giá trị đơn hàng tối thiểu để miễn phí vận chuyển.');
    }
  }

  private generateInitialFixtures(): ShippingConfig[] {
    const referenceRows: ShippingConfig[] = [
      {
        id: 'shipping-001',
        shippingMethod: 'standard',
        province: 'TP. Hồ Chí Minh',
        hub: 'Kho Nam Sài Gòn (Hub 1)',
        fee: 30000,
        feeNote: 'Miễn phí đơn > 5M',
        estimatedDeliveryTime: '2-4 ngày',
        freeShipEnabled: true,
        freeShipThreshold: 5000000,
        timeSlot: 'Theo lịch hẹn gia chủ (Bespoke Slot)',
        whiteGloveIncluded: true,
        isActive: true,
        createdAt: '2025-09-01T08:00:00',
        updatedAt: '2025-10-24T09:30:00',
      },
      {
        id: 'shipping-002',
        shippingMethod: 'express',
        province: 'TP. Hồ Chí Minh',
        hub: 'Giao 24h nội thành',
        fee: 50000,
        feeNote: 'Giao hỏa tốc nội thành',
        estimatedDeliveryTime: '1-2 ngày',
        freeShipEnabled: false,
        freeShipThreshold: 0,
        timeSlot: 'Khung giờ ưu tiên',
        whiteGloveIncluded: true,
        isActive: true,
        createdAt: '2025-09-01T08:00:00',
        updatedAt: '2025-10-24T09:30:00',
      },
      {
        id: 'shipping-003',
        shippingMethod: 'standard',
        province: 'Hà Nội',
        hub: 'Kho Long Biên (Hub 2)',
        fee: 45000,
        feeNote: 'Phí tiêu chuẩn',
        estimatedDeliveryTime: '3-5 ngày',
        freeShipEnabled: true,
        freeShipThreshold: 7000000,
        timeSlot: 'Theo lịch hẹn gia chủ (Bespoke Slot)',
        whiteGloveIncluded: true,
        isActive: true,
        createdAt: '2025-09-05T08:00:00',
        updatedAt: '2025-10-20T14:15:00',
      },
      {
        id: 'shipping-004',
        shippingMethod: 'express',
        province: 'Hà Nội',
        hub: 'Kho Long Biên (Hub 2)',
        fee: 80000,
        feeNote: 'Giao hỏa tốc liên tỉnh',
        estimatedDeliveryTime: '2-3 ngày',
        freeShipEnabled: false,
        freeShipThreshold: 0,
        timeSlot: 'Khung giờ ưu tiên',
        whiteGloveIncluded: true,
        isActive: true,
        createdAt: '2025-09-05T08:00:00',
        updatedAt: '2025-10-20T14:15:00',
      },
      {
        id: 'shipping-005',
        shippingMethod: 'standard',
        province: 'Đà Nẵng',
        hub: 'Chi nhánh Hải Châu',
        fee: 50000,
        feeNote: 'Phí tiêu chuẩn',
        estimatedDeliveryTime: '3-5 ngày',
        freeShipEnabled: false,
        freeShipThreshold: 0,
        timeSlot: 'Theo lịch hẹn gia chủ (Bespoke Slot)',
        whiteGloveIncluded: true,
        isActive: true,
        createdAt: '2025-08-18T08:00:00',
        updatedAt: '2025-10-18T10:00:00',
      },
      {
        id: 'shipping-006',
        shippingMethod: 'express',
        province: 'Đà Nẵng',
        hub: 'Chi nhánh Hải Châu',
        fee: 90000,
        feeNote: 'Tạm ngưng tiếp nhận',
        estimatedDeliveryTime: '2-3 ngày',
        freeShipEnabled: false,
        freeShipThreshold: 0,
        timeSlot: 'Khung giờ ưu tiên',
        whiteGloveIncluded: true,
        isActive: false,
        createdAt: '2025-08-18T08:00:00',
        updatedAt: '2025-09-15T16:45:00',
      },
    ];

    const hubProvinces: Array<[string, string]> = [
      ['Hải Phòng', 'Trung tâm Hải Phòng'],
      ['Cần Thơ', 'Trung tâm Cần Thơ'],
      ['Bình Dương', 'Kho Thuận An'],
      ['Đồng Nai', 'Kho Biên Hòa'],
      ['Khánh Hoà', 'Chi nhánh Nha Trang'],
      ['Quảng Ninh', 'Chi nhánh Hạ Long'],
      ['Huế', 'Trung tâm Huế'],
      ['Lâm Đồng', 'Chi nhánh Đà Lạt'],
      ['Nghệ An', 'Trung tâm Vinh'],
      ['Bắc Ninh', 'Kho Bắc Ninh'],
      ['Thanh Hoá', 'Trung tâm Thanh Hoá'],
      ['Long An', 'Kho Bến Lức'],
      ['Bà Rịa - Vũng Tàu', 'Chi nhánh Vũng Tàu'],
      ['Quảng Nam', 'Chi nhánh Hội An'],
      ['Vĩnh Phúc', 'Kho Vĩnh Yên'],
      ['Hải Dương', 'Trung tâm Hải Dương'],
      ['Thái Nguyên', 'Kho Thái Nguyên'],
      ['Bình Định', 'Chi nhánh Quy Nhơn'],
      ['Phú Yên', 'Trung tâm Tuy Hòa'],
      ['Quảng Ngãi', 'Trung tâm Quảng Ngãi'],
      ['Ninh Bình', 'Kho Ninh Bình'],
      ['Nam Định', 'Trung tâm Nam Định'],
      ['Thừa Thiên Huế', 'Kho Phú Bài'],
      ['Đắk Lắk', 'Chi nhánh Buôn Ma Thuột'],
    ];

    const generated: ShippingConfig[] = [];
    let index = 0;
    for (const [province, hub] of hubProvinces) {
      for (const method of ['standard', 'express'] as const) {
        index += 1;
        const isStandard = method === 'standard';
        const fee = isStandard ? 40000 + (index % 6) * 2500 : 65000 + (index % 5) * 4000;
        const freeShipEnabled = isStandard && index % 3 === 0;
        const updatedAt = new Date(2025, 9, 24 - (index % 22), 9 + (index % 8), 0, 0);
        const createdAt = new Date(2025, 8, 1 + (index % 14), 8, 0, 0);

        generated.push({
          id: `shipping-${String(referenceRows.length + index).padStart(3, '0')}`,
          shippingMethod: method,
          province,
          hub,
          fee,
          feeNote: isStandard ? 'Phí tiêu chuẩn' : 'Giao hỏa tốc liên tỉnh',
          estimatedDeliveryTime: isStandard ? '3-5 ngày' : '2-3 ngày',
          freeShipEnabled,
          freeShipThreshold: freeShipEnabled ? 5000000 + (index % 4) * 1000000 : 0,
          timeSlot: isStandard ? 'Theo lịch hẹn gia chủ (Bespoke Slot)' : 'Khung giờ ưu tiên',
          whiteGloveIncluded: true,
          isActive: index % 7 !== 0,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        });
      }
    }

    return [...referenceRows, ...generated];
  }
}
