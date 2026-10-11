import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CustomerService } from './customer.service';
import { CustomerListQuery } from './customer.model';

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return initial summary matching reference metrics (125 total, 94 registered, 31 guest, 118 active this month)', async () => {
    const summary = await firstValueFrom(service.getSummary());
    expect(summary.totalCustomers).toBe(125);
    expect(summary.registeredCustomers).toBe(94);
    expect(summary.guestCustomers).toBe(31);
    expect(summary.activeThisMonth).toBe(118);
  });

  it('should list first page of customers with 10 items and 13 total pages', async () => {
    const query: CustomerListQuery = {
      search: '',
      customerType: 'all',
      status: 'all',
      page: 1,
      pageSize: 10,
    };

    const res = await firstValueFrom(service.listCustomers(query));
    expect(res.items.length).toBe(10);
    expect(res.totalItems).toBe(125);
    expect(res.totalPages).toBe(13);
    expect(res.page).toBe(1);
    expect(res.items[0].fullName).toBe('KTS. Hoàng Nam');
    expect(res.items[0].code).toBe('270926-001');
  });

  it('should filter customers by search keyword matching name or phone or email', async () => {
    const query: CustomerListQuery = {
      search: 'Hoàng Nam',
      customerType: 'all',
      status: 'all',
      page: 1,
      pageSize: 10,
    };

    const res = await firstValueFrom(service.listCustomers(query));
    expect(res.items.length).toBe(1);
    expect(res.items[0].fullName).toBe('KTS. Hoàng Nam');
    expect(res.totalItems).toBe(1);
  });

  it('should filter customers by customer type (registered vs guest)', async () => {
    const queryGuest: CustomerListQuery = {
      search: '',
      customerType: 'guest',
      status: 'all',
      page: 1,
      pageSize: 10,
    };

    const res = await firstValueFrom(service.listCustomers(queryGuest));
    expect(res.totalItems).toBe(31);
    expect(res.items.every((c) => c.customerType === 'guest')).toBe(true);
  });

  it('should filter customers by status (active vs inactive)', async () => {
    const queryInactive: CustomerListQuery = {
      search: '',
      customerType: 'all',
      status: 'inactive',
      page: 1,
      pageSize: 10,
    };

    const res = await firstValueFrom(service.listCustomers(queryInactive));
    expect(res.totalItems).toBe(7);
    expect(res.items.every((c) => c.status === 'inactive')).toBe(true);
  });

  it('should get customer by id and code', async () => {
    const cust = await firstValueFrom(service.getCustomerById('270926-001'));
    expect(cust).toBeTruthy();
    expect(cust?.fullName).toBe('KTS. Hoàng Nam');
    expect(cust?.orders.length).toBe(4);
    expect(cust?.totalOrderValue).toBe(457500000);
  });

  it('should update customer profile in session', async () => {
    const updated = await firstValueFrom(
      service.updateCustomer('cust-001', {
        fullName: 'KTS. Hoàng Nam Updated',
        email: 'hoangnam.updated@livora.com',
      })
    );
    expect(updated.fullName).toBe('KTS. Hoàng Nam Updated');
    expect(updated.email).toBe('hoangnam.updated@livora.com');
  });

  it('should toggle customer status between active and inactive', async () => {
    const updated = await firstValueFrom(service.toggleStatus('cust-001'));
    expect(updated.status).toBe('inactive');

    const reverted = await firstValueFrom(service.toggleStatus('cust-001'));
    expect(reverted.status).toBe('active');
  });

  it('should set default address and add new address', async () => {
    const cust = await firstValueFrom(service.setDefaultAddress('cust-001', 'addr-001-2'));
    const addr2 = cust.addresses.find((a) => a.addressId === 'addr-001-2');
    const addr1 = cust.addresses.find((a) => a.addressId === 'addr-001-1');
    expect(addr2?.isDefault).toBe(true);
    expect(addr1?.isDefault).toBe(false);

    const custWithNewAddr = await firstValueFrom(
      service.addAddress('cust-001', {
        label: 'Địa chỉ kho 3',
        recipientName: 'KTS. Hoàng Nam',
        recipientPhone: '0918.421.xxx',
        street: 'Khu công nghiệp Tân Bình',
        ward: 'Tây Thạnh',
        district: 'Tân Phú',
        province: 'TP. Hồ Chí Minh',
        fullAddress: 'KCN Tân Bình, Tây Thạnh, Tân Phú, TP. Hồ Chí Minh',
        isDefault: false,
      })
    );
    expect(custWithNewAddr.addresses.length).toBe(3);
    expect(custWithNewAddr.addresses[2].label).toBe('Địa chỉ kho 3');
  });
});
