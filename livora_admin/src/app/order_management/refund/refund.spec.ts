import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefundComponent } from './refund';
import { RefundService } from '../services/refund.service';
import { OrderService } from '../services/order.service';

describe('RefundComponent', () => {
  let component: RefundComponent;
  let fixture: ComponentFixture<RefundComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RefundComponent],
      providers: [RefundService, OrderService],
    }).compileComponents();

    fixture = TestBed.createComponent(RefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the refund component', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title and load refunds', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Yêu cầu hoàn tiền');
    expect(component.refunds.length).toBeGreaterThan(0);
  });

  it('should open and close process modal', () => {
    expect(component.isModalOpen).toBe(false);
    component.openProcessModal(component.refunds[0]);
    expect(component.isModalOpen).toBe(true);
    expect(component.selectedRefund).toEqual(component.refunds[0]);

    component.closeModal();
    expect(component.isModalOpen).toBe(false);
  });
});
