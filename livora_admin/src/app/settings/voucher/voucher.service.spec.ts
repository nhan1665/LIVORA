import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { VoucherDraft, VoucherListQuery } from './voucher.model';
import { VoucherService } from './voucher.service';

describe('VoucherService', () => {
  let service: VoucherService;

  const buildQuery = (overrides: Partial<VoucherListQuery> = {}): VoucherListQuery => ({
    search: '',
    discountType: 'all',
    status: 'all',
    time: 'all',
    page: 1,
    pageSize: 5,
    ...overrides,
  });

  const buildDraft = (overrides: Partial<VoucherDraft> = {}): VoucherDraft => ({
    code: 'TEST-VOUCHER-01',
    title: 'Chương trình kiểm thử',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: 5000000,
    minOrderValue: 10000000,
    quantity: 50,
    perCustomerLimit: 1,
    startDate: '2025-11-01T00:00:00',
    endDate: '2025-11-30T23:59:59',
    isActive: true,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VoucherService],
    });
    service = TestBed.inject(VoucherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed 36 vouchers with a consistent active count', async () => {
    const res = await firstValueFrom(service.listVouchers(buildQuery({ pageSize: 100 })));
    expect(res.totalItems).toBe(36);
    const active = res.items.filter((v) => v.isActive).length;
    expect(res.activeCount).toBe(active);
  });

  it('should search by code or program title', async () => {
    const byCode = await firstValueFrom(service.listVouchers(buildQuery({ search: 'vip10' })));
    expect(byCode.totalItems).toBe(1);
    expect(byCode.items[0].code).toBe('LIVORA-VIP10');

    const byTitle = await firstValueFrom(service.listVouchers(buildQuery({ search: 'thu đông' })));
    expect(byTitle.totalItems).toBe(1);
    expect(byTitle.items[0].code).toBe('ATELIER-AUTUMN');
  });

  it('should filter by discount type and status', async () => {
    const fixed = await firstValueFrom(
      service.listVouchers(buildQuery({ discountType: 'fixed_amount', pageSize: 100 }))
    );
    expect(fixed.items.every((v) => v.discountType === 'fixed_amount')).toBe(true);

    const off = await firstValueFrom(service.listVouchers(buildQuery({ status: 'off', pageSize: 100 })));
    expect(off.totalItems).toBeGreaterThan(0);
    expect(off.items.every((v) => !v.isActive)).toBe(true);
  });

  it('should filter by applicability window against the demo reference date', async () => {
    const running = await firstValueFrom(
      service.listVouchers(buildQuery({ time: 'running', pageSize: 100 }))
    );
    const demoNow = new Date('2025-10-24T12:00:00').getTime();
    expect(running.totalItems).toBeGreaterThan(0);
    expect(
      running.items.every(
        (v) =>
          new Date(v.startDate).getTime() <= demoNow && new Date(v.endDate).getTime() >= demoNow
      )
    ).toBe(true);

    const expired = await firstValueFrom(
      service.listVouchers(buildQuery({ time: 'expired', pageSize: 100 }))
    );
    expect(expired.items.some((v) => v.code === 'SUMMER-SALE20')).toBe(true);
  });

  it('should paginate the registry (36 vouchers, 8 pages of 5)', async () => {
    const firstPage = await firstValueFrom(service.listVouchers(buildQuery()));
    expect(firstPage.totalPages).toBe(8);
    expect(firstPage.items.length).toBe(5);
    expect(firstPage.items[0].code).toBe('LIVORA-VIP10');

    const lastPage = await firstValueFrom(service.listVouchers(buildQuery({ page: 8 })));
    expect(lastPage.items.length).toBe(1);
  });

  it('should create a voucher with zero usage', async () => {
    const created = await firstValueFrom(service.createVoucher(buildDraft()));
    expect(created.code).toBe('TEST-VOUCHER-01');
    expect(created.usedCount).toBe(0);
    expect(created.isActive).toBe(true);

    const res = await firstValueFrom(service.listVouchers(buildQuery({ pageSize: 100 })));
    expect(res.totalItems).toBe(37);
  });

  it('should reject duplicate voucher codes and invalid rules', async () => {
    await expect(
      firstValueFrom(service.createVoucher(buildDraft({ code: 'livora-vip10' })))
    ).rejects.toThrow('đã tồn tại');

    await expect(
      firstValueFrom(service.createVoucher(buildDraft({ discountValue: 120 })))
    ).rejects.toThrow('100%');

    await expect(
      firstValueFrom(
        service.createVoucher(
          buildDraft({
            discountType: 'fixed_amount',
            discountValue: 900000,
            maxDiscountAmount: 500000,
          })
        )
      )
    ).rejects.toThrow('nhỏ hơn giá trị giảm cố định');

    await expect(
      firstValueFrom(
        service.createVoucher(buildDraft({ startDate: '2025-12-01T00:00:00', endDate: '2025-11-01T00:00:00' }))
      )
    ).rejects.toThrow('kết thúc');
  });

  it('should update an existing voucher and toggle its state', async () => {
    const updated = await firstValueFrom(
      service.updateVoucher('voucher-001', buildDraft({ code: 'LIVORA-VIP10', title: 'Đặc quyền VIP (cập nhật)' }))
    );
    expect(updated.title).toBe('Đặc quyền VIP (cập nhật)');

    const toggled = await firstValueFrom(service.toggleVoucher('voucher-001'));
    expect(toggled.isActive).toBe(false);
  });
});
