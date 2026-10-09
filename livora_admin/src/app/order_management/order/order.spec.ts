import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderComponent } from './order';
import { OrderService } from '../services/order.service';

describe('OrderComponent', () => {
  let component: OrderComponent;
  let fixture: ComponentFixture<OrderComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OrderComponent],
      providers: [OrderService],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title and stats', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Danh sách đơn hàng');
    expect(component.orders.length).toBeGreaterThan(0);
  });

  it('should open and close order detail modal', () => {
    expect(component.isDetailOpen).toBe(false);
    component.openDetail(component.orders[0]);
    expect(component.isDetailOpen).toBe(true);
    expect(component.selectedOrder).toEqual(component.orders[0]);

    component.closeDetail();
    expect(component.isDetailOpen).toBe(false);
  });

  it('should open create order modal and initialize fields', () => {
    expect(component.isCreateOpen).toBe(false);
    component.openCreateOrderModal();
    expect(component.isCreateOpen).toBe(true);
    expect(component.availableProducts.length).toBeGreaterThan(0);
  });
});
