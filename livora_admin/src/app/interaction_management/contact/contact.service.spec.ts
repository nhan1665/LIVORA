import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ContactListQuery } from './contact.model';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;

  const buildQuery = (overrides: Partial<ContactListQuery> = {}): ContactListQuery => ({
    search: '',
    status: 'all',
    time: 'all',
    page: 1,
    pageSize: 5,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContactService],
    });
    service = TestBed.inject(ContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed 48 contacts with a consistent pending count', async () => {
    const res = await firstValueFrom(service.listContacts(buildQuery({ pageSize: 100 })));
    expect(res.totalItems).toBe(48);
    expect(res.totalPages).toBe(1);
    const pending = res.items.filter((c) => c.status === 'new').length;
    expect(res.pendingCount).toBe(pending);
    expect(res.pendingCount).toBeGreaterThan(0);
  });

  it('should search by code, name, phone and email case-insensitively', async () => {
    const byCode = await firstValueFrom(service.listContacts(buildQuery({ search: 'lh-2610-089' })));
    expect(byCode.totalItems).toBe(1);
    expect(byCode.items[0].fullName).toBe('Nguyễn Hoàng Nam');

    const byName = await firstValueFrom(service.listContacts(buildQuery({ search: 'hoàng nam' })));
    expect(byName.totalItems).toBe(1);

    const byEmail = await firstValueFrom(service.listContacts(buildQuery({ search: 'hoangnam.arch@gmail.com' })));
    expect(byEmail.totalItems).toBe(1);
  });

  it('should filter contacts by processing status', async () => {
    const res = await firstValueFrom(service.listContacts(buildQuery({ status: 'resolved', pageSize: 100 })));
    expect(res.totalItems).toBeGreaterThan(0);
    expect(res.items.every((c) => c.status === 'resolved')).toBe(true);
  });

  it('should filter contacts inside the 7-day demo window', async () => {
    const res = await firstValueFrom(service.listContacts(buildQuery({ time: 'last7days', pageSize: 100 })));
    const demoNow = new Date('2025-10-24T15:00:00').getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    expect(res.totalItems).toBeGreaterThan(0);
    expect(
      res.items.every((c) => demoNow - new Date(c.createdAt).getTime() <= 7 * dayMs)
    ).toBe(true);
  });

  it('should paginate the registry (page size 5, newest first)', async () => {
    const firstPage = await firstValueFrom(service.listContacts(buildQuery()));
    expect(firstPage.items.length).toBe(5);
    expect(firstPage.totalPages).toBe(10);
    expect(firstPage.items[0].code).toBe('LH-2610-089');

    const secondPage = await firstValueFrom(service.listContacts(buildQuery({ page: 2 })));
    expect(secondPage.page).toBe(2);
    expect(secondPage.items.length).toBe(5);
    expect(secondPage.items[0].code).not.toBe(firstPage.items[0].code);
  });

  it('should resolve a pending contact and record resolvedAt', async () => {
    const updated = await firstValueFrom(service.resolveContact('contact-001'));
    expect(updated.status).toBe('resolved');
    expect(updated.resolvedAt).toBeTruthy();
    expect(updated.respondedBy).toBeTruthy();

    const found = await firstValueFrom(service.getContactById('contact-001'));
    expect(found?.status).toBe('resolved');
  });

  it('should reject resolving an already resolved contact', async () => {
    await expect(firstValueFrom(service.resolveContact('contact-004'))).rejects.toThrow(
      'đã được xử lý'
    );
  });
});
