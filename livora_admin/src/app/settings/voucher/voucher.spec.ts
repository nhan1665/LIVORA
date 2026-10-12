import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Voucher } from './voucher';
import { VoucherService } from './voucher.service';

describe('Voucher Component', () => {
  let component: Voucher;
  let fixture: ComponentFixture<Voucher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Voucher],
      providers: [VoucherService],
    }).compileComponents();

    fixture = TestBed.createComponent(Voucher);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the Voucher component', () => {
    expect(component).toBeTruthy();
  });

  it('should load page 1 with 5 of 36 vouchers and 8 pages', () => {
    expect(component.vouchers().length).toBe(5);
    expect(component.totalItems()).toBe(36);
    expect(component.totalPages()).toBe(8);
    expect(component.activeCount()).toBeGreaterThan(0);
  });

  it('should filter vouchers by discount type when applyFilter is called', () => {
    component.discountTypeDraft = 'fixed_amount';
    component.applyFilter();
    fixture.detectChanges();

    expect(component.vouchers().every((v) => v.discountType === 'fixed_amount')).toBe(true);
  });

  it('should reset filters and restore page 1', () => {
    component.searchDraft = 'vip10';
    component.applyFilter();
    expect(component.totalItems()).toBe(1);

    component.resetFilter();
    fixture.detectChanges();

    expect(component.totalItems()).toBe(36);
    expect(component.currentPage()).toBe(1);
  });

  it('should create a voucher through the form modal', () => {
    component.openCreateModal();
    fixture.detectChanges();
    expect(component.isFormModalOpen()).toBe(true);

    component.formDraft.code = 'TEST-NEW-VOUCHER';
    component.formDraft.title = 'Chương trình kiểm thử';
    component.saveVoucher();
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Đã tạo voucher');
    expect(component.totalItems()).toBe(37);
  });

  it('should show a validation error when the code is missing', () => {
    component.openCreateModal();
    component.formDraft.code = '';
    component.saveVoucher();
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBe(true);
    expect(component.formError()).toContain('mã voucher');
  });

  it('should edit an existing voucher', () => {
    const first = component.vouchers()[0];
    component.openEditModal(first);
    expect(component.isEditMode()).toBe(true);
    expect(component.formDraft.code).toBe(first.code);

    component.formDraft.title = 'Đặc quyền VIP (cập nhật từ test)';
    component.saveVoucher();
    fixture.detectChanges();

    expect(component.toastMessage()).toContain('Đã cập nhật voucher');
    expect(component.vouchers().find((v) => v.id === first.id)?.title).toBe(
      'Đặc quyền VIP (cập nhật từ test)'
    );
  });

  it('should toggle voucher state with toast feedback', () => {
    const first = component.vouchers()[0];
    const initial = first.isActive;

    component.toggleVoucher(first);
    fixture.detectChanges();

    expect(component.vouchers().find((v) => v.id === first.id)?.isActive).toBe(!initial);
    expect(component.toastMessage()).toBeTruthy();
  });
});
