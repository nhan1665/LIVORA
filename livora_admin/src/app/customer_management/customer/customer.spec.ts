import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Customer } from './customer';
import { CustomerService } from './customer.service';

describe('Customer Component', () => {
  let component: Customer;
  let fixture: ComponentFixture<Customer>;
  let service: CustomerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Customer],
      providers: [CustomerService],
    }).compileComponents();

    fixture = TestBed.createComponent(Customer);
    component = fixture.componentInstance;
    service = TestBed.inject(CustomerService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the Customer component', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data with 125 total customers and 10 items on page 1', () => {
    expect(component.customers().length).toBe(10);
    expect(component.totalItems()).toBe(125);
    expect(component.totalPages()).toBe(13);
    expect(component.summary().totalCustomers).toBe(125);
    expect(component.summary().registeredCustomers).toBe(94);
    expect(component.summary().guestCustomers).toBe(31);
    expect(component.summary().activeThisMonth).toBe(118);
  });

  it('should filter customers by search keyword when applyFilter is called', () => {
    component.searchDraft = 'Hoàng Nam';
    component.applyFilter();
    fixture.detectChanges();

    expect(component.customers().length).toBe(1);
    expect(component.customers()[0].fullName).toBe('KTS. Hoàng Nam');
    expect(component.totalItems()).toBe(1);
  });

  it('should reset filters and restore page 1 when resetFilter is called', () => {
    component.searchDraft = 'Hoàng Nam';
    component.applyFilter();
    expect(component.customers().length).toBe(1);

    component.resetFilter();
    fixture.detectChanges();

    expect(component.searchDraft).toBe('');
    expect(component.customers().length).toBe(10);
    expect(component.totalItems()).toBe(125);
    expect(component.currentPage()).toBe(1);
  });

  it('should navigate to page 2 when changePage is called', () => {
    component.changePage(2);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(component.customers().length).toBe(10);
  });

  it('should open customer detail modal with full customer profile', () => {
    const first = component.customers()[0];
    component.openDetailModal(first);
    fixture.detectChanges();

    expect(component.isDetailModalOpen()).toBe(true);
    expect(component.selectedCustomer()?.id).toBe(first.id);
    expect(component.selectedCustomer()?.fullName).toBe(first.fullName);
    expect(component.activeModalTab()).toBe('detail');
  });

  it('should switch between detail tab and order history tab in modal', () => {
    const first = component.customers()[0];
    component.openDetailModal(first);

    component.switchModalTab('orders');
    expect(component.activeModalTab()).toBe('orders');

    component.switchModalTab('detail');
    expect(component.activeModalTab()).toBe('detail');
  });

  it('should toggle edit mode and save updated customer profile', () => {
    const first = component.customers()[0];
    component.openDetailModal(first);
    component.toggleEditMode();
    expect(component.isEditMode()).toBe(true);

    component.editForm.fullName = 'KTS. Hoàng Nam - Test Edit';
    component.saveEdit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(false);
    expect(component.selectedCustomer()?.fullName).toBe('KTS. Hoàng Nam - Test Edit');
    expect(component.toastMessage()).toContain('thành công');
  });

  it('should set default address for a customer', () => {
    const first = component.customers()[0];
    component.openDetailModal(first);

    // Set second address as default
    const addr2 = first.addresses[1];
    if (addr2) {
      component.setDefaultAddress(addr2.addressId);
      fixture.detectChanges();
      const updatedAddr2 = component.selectedCustomer()?.addresses.find(a => a.addressId === addr2.addressId);
      expect(updatedAddr2?.isDefault).toBe(true);
    }
  });

  it('should toggle customer status and show toast', () => {
    const first = component.customers()[0];
    const initialStatus = first.status;

    component.toggleCustomerStatus(first);
    fixture.detectChanges();

    const expectedNewStatus = initialStatus === 'active' ? 'inactive' : 'active';
    expect(component.customers().find(c => c.id === first.id)?.status).toBe(expectedNewStatus);
    expect(component.toastMessage()).toBeTruthy();
  });
});
