import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ShippingDraft, ShippingListQuery } from './shipping.model';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  let service: ShippingService;

  const buildQuery = (overrides: Partial<ShippingListQuery> = {}): ShippingListQuery => ({
    search: '',
    method: 'all',
    status: 'all',
    page: 1,
    pageSize: 6,
    ...overrides,
  });

  const buildDraft = (overrides: Partial<ShippingDraft> = {}): ShippingDraft => ({
    shippingMethod: 'standard',
    province: 'TP. Hồ Chí Minh',
    hub: 'Kho kiểm thử',
    fee: 35000,
    estimatedDeliveryTime: '2 - 4 ngày',
    freeShipEnabled: false,
    freeShipThreshold: 0,
    timeSlot: 'Theo lịch hẹn gia chủ (Bespoke Slot)',
    whiteGloveIncluded: true,
    isActive: true,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShippingService],
    });
    service = TestBed.inject(ShippingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed 54 configurations with a consistent active count', async () => {
    const res = await firstValueFrom(service.listConfigs(buildQuery({ pageSize: 100 })));
    expect(res.totalItems).toBe(54);
    const active = res.items.filter((c) => c.isActive).length;
    expect(res.activeCount).toBe(active);
    expect(res.activeCount).toBeGreaterThan(0);
  });

  it('should search by province or hub name', async () => {
    const byProvince = await firstValueFrom(service.listConfigs(buildQuery({ search: 'hà nội' })));
    expect(byProvince.totalItems).toBe(2);

    const byHub = await firstValueFrom(service.listConfigs(buildQuery({ search: 'long biên' })));
    expect(byHub.totalItems).toBe(2);
  });

  it('should filter by method and status', async () => {
    const express = await firstValueFrom(
      service.listConfigs(buildQuery({ method: 'express', pageSize: 100 }))
    );
    expect(express.items.every((c) => c.shippingMethod === 'express')).toBe(true);

    const off = await firstValueFrom(service.listConfigs(buildQuery({ status: 'off', pageSize: 100 })));
    expect(off.totalItems).toBeGreaterThan(0);
    expect(off.items.every((c) => !c.isActive)).toBe(true);
  });

  it('should paginate the registry (54 configurations, 9 pages of 6)', async () => {
    const firstPage = await firstValueFrom(service.listConfigs(buildQuery()));
    expect(firstPage.totalPages).toBe(9);
    expect(firstPage.items.length).toBe(6);

    const lastPage = await firstValueFrom(service.listConfigs(buildQuery({ page: 9 })));
    expect(lastPage.items.length).toBe(6);
  });

  it('should create a configuration', async () => {
    const created = await firstValueFrom(service.createConfig(buildDraft()));
    expect(created.province).toBe('TP. Hồ Chí Minh');
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();

    const res = await firstValueFrom(service.listConfigs(buildQuery({ pageSize: 100 })));
    expect(res.totalItems).toBe(55);
  });

  it('should reject invalid configurations', async () => {
    await expect(
      firstValueFrom(service.createConfig(buildDraft({ province: '   ' })))
    ).rejects.toThrow('tỉnh / thành phố');

    await expect(
      firstValueFrom(service.createConfig(buildDraft({ estimatedDeliveryTime: '' })))
    ).rejects.toThrow('thời gian giao dự kiến');

    await expect(
      firstValueFrom(
        service.createConfig(buildDraft({ freeShipEnabled: true, freeShipThreshold: 0 }))
      )
    ).rejects.toThrow('miễn phí vận chuyển');
  });

  it('should update and toggle an existing configuration', async () => {
    const updated = await firstValueFrom(
      service.updateConfig('shipping-001', buildDraft({ fee: 39000 }))
    );
    expect(updated.fee).toBe(39000);

    const toggled = await firstValueFrom(service.toggleConfig('shipping-001'));
    expect(toggled.isActive).toBe(false);
  });
});
