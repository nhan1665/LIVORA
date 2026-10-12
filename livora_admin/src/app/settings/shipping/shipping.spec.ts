import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Shipping } from './shipping';
import { ShippingService } from './shipping.service';

describe('Shipping Component', () => {
  let component: Shipping;
  let fixture: ComponentFixture<Shipping>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shipping],
      providers: [ShippingService],
    }).compileComponents();

    fixture = TestBed.createComponent(Shipping);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the Shipping component', () => {
    expect(component).toBeTruthy();
  });

  it('should load page 1 with 6 of 54 configurations and 9 pages', () => {
    expect(component.configs().length).toBe(6);
    expect(component.totalItems()).toBe(54);
    expect(component.totalPages()).toBe(9);
    expect(component.activeCount()).toBeGreaterThan(0);
  });

  it('should filter configurations by method when applyFilter is called', () => {
    component.methodDraft = 'standard';
    component.applyFilter();
    fixture.detectChanges();

    expect(component.configs().every((c) => c.shippingMethod === 'standard')).toBe(true);
  });

  it('should reset filters and restore page 1', () => {
    component.searchDraft = 'hà nội';
    component.applyFilter();
    expect(component.totalItems()).toBe(2);

    component.resetFilter();
    fixture.detectChanges();

    expect(component.totalItems()).toBe(54);
    expect(component.currentPage()).toBe(1);
  });

  it('should create a configuration through the form modal', () => {
    component.openCreateModal();
    fixture.detectChanges();
    expect(component.isFormModalOpen()).toBe(true);

    component.saveConfig();
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Đã thêm cấu hình');
    expect(component.totalItems()).toBe(55);
  });

  it('should edit an existing configuration', () => {
    const first = component.configs()[0];
    component.openEditModal(first);
    expect(component.isEditMode()).toBe(true);
    expect(component.formDraft.province).toBe(first.province);

    component.formDraft.fee = 99000;
    component.saveConfig();
    fixture.detectChanges();

    expect(component.toastMessage()).toContain('Đã cập nhật cấu hình');
    expect(component.configs().find((c) => c.id === first.id)?.fee).toBe(99000);
  });

  it('should toggle configuration state with toast feedback', () => {
    const first = component.configs()[0];
    const initial = first.isActive;

    component.toggleConfig(first);
    fixture.detectChanges();

    expect(component.configs().find((c) => c.id === first.id)?.isActive).toBe(!initial);
    expect(component.toastMessage()).toBeTruthy();
  });
});
