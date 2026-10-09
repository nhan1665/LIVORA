import { TestBed } from '@angular/core/testing';
import { RefundService } from './refund.service';
import { OrderService } from './order.service';

describe('RefundService', () => {
  let refundService: RefundService;
  let orderService: OrderService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    orderService = TestBed.inject(OrderService);
    refundService = TestBed.inject(RefundService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and load initial refund requests', () => {
    expect(refundService).toBeTruthy();
    const res = refundService.listRefunds();
    expect(res.total).toBeGreaterThanOrEqual(2);
  });

  it('should approve refund and update linked order payment status to refunded', () => {
    const pendingList = refundService.listRefunds({ status: 'pending' });
    expect(pendingList.refunds.length).toBeGreaterThan(0);
    const pendingRefund = pendingList.refunds[0];

    const res = refundService.processRefund({
      refundId: pendingRefund._id,
      approved: true,
      staffName: 'Admin Kế toán',
    });

    expect(res.success).toBe(true);
    expect(res.refund?.status).toBe('completed');

    // Verify linked order paymentStatus is 'refunded'
    const linkedOrder = orderService.getOrderById(pendingRefund.orderId);
    expect(linkedOrder?.paymentStatus).toBe('refunded');
  });

  it('should reject refund request with reason', () => {
    const pendingList = refundService.listRefunds({ status: 'pending' });
    const pendingRefund = pendingList.refunds[0];

    const res = refundService.processRefund({
      refundId: pendingRefund._id,
      approved: false,
      rejectReason: 'Sản phẩm đã qua 30 ngày đổi trả quy định',
      staffName: 'Admin Kế toán',
    });

    expect(res.success).toBe(true);
    expect(res.refund?.status).toBe('rejected');
    expect(res.refund?.rejectReason).toBe('Sản phẩm đã qua 30 ngày đổi trả quy định');
  });

  it('should fail rejecting without reason', () => {
    const pendingList = refundService.listRefunds({ status: 'pending' });
    const pendingRefund = pendingList.refunds[0];

    const res = refundService.processRefund({
      refundId: pendingRefund._id,
      approved: false,
      rejectReason: '',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('lý do');
  });
});
