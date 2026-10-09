import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and load initial orders', () => {
    expect(service).toBeTruthy();
    const res = service.listOrders();
    expect(res.total).toBeGreaterThanOrEqual(5);
  });

  it('should filter orders by keyword', () => {
    const res = service.listOrders({ keyword: 'Dương Trọng Nhân' });
    expect(res.orders.length).toBeGreaterThanOrEqual(1);
    expect(res.orders[0].customerInfo.name).toContain('Dương Trọng Nhân');
  });

  it('should filter orders by order status', () => {
    const res = service.listOrders({ orderStatus: 'confirmed' });
    expect(res.orders.every(o => o.orderStatus === 'confirmed')).toBe(true);
  });

  it('should filter orders by payment status', () => {
    const res = service.listOrders({ paymentStatus: 'paid' });
    expect(res.orders.every(o => o.paymentStatus === 'paid')).toBe(true);
  });

  it('should find existing customer by phone number', () => {
    const customer = service.findCustomerByPhone('0562173125');
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('Dương Trọng Nhân');
  });

  it('should return null for non-existing phone number', () => {
    const customer = service.findCustomerByPhone('0999999999');
    expect(customer).toBeNull();
  });

  it('should create order successfully and deduct stock', () => {
    const products = service.getCatalogProducts();
    const targetProd = products[0];
    const initialStock = targetProd.stockQuantity;

    const res = service.createOrder({
      customerInfo: {
        name: 'Nguyễn Văn Test',
        phone: '0918123456',
        address: '123 Đường Test, Quận 1, TP. HCM',
      },
      items: [
        {
          productId: targetProd.productId,
          quantity: 2,
        },
      ],
      paymentMethod: 'COD',
    });

    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();
    expect(res.order?.orderStatus).toBe('pending');
    expect(res.order?.paymentStatus).toBe('unpaid');

    // Verify stock deduction
    const updatedProducts = service.getCatalogProducts();
    const updatedProd = updatedProducts.find(p => p.productId === targetProd.productId);
    expect(updatedProd?.stockQuantity).toBe(initialStock - 2);
  });

  it('should fail creation if phone format is invalid', () => {
    const res = service.createOrder({
      customerInfo: {
        name: 'Nguyễn Văn Test',
        phone: '12345',
        address: '123 Test',
      },
      items: [{ productId: 'prod-001', quantity: 1 }],
      paymentMethod: 'COD',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Số điện thoại');
  });

  it('should fail creation if quantity exceeds stock', () => {
    const res = service.createOrder({
      customerInfo: {
        name: 'Nguyễn Văn Test',
        phone: '0918123456',
        address: '123 Test',
      },
      items: [{ productId: 'prod-001', quantity: 9999 }],
      paymentMethod: 'COD',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('trong kho');
  });

  it('should advance order status step by step sequentially', () => {
    const orders = service.listOrders({ orderStatus: 'pending' });
    expect(orders.orders.length).toBeGreaterThan(0);
    const pendingOrder = orders.orders[0];

    // Try illegal skip: pending -> delivered (should fail)
    const illegalRes = service.updateOrderStatus(pendingOrder._id, 'delivered');
    expect(illegalRes.success).toBe(false);

    // Legal next step: pending -> confirmed
    const legalRes = service.updateOrderStatus(pendingOrder._id, 'confirmed');
    expect(legalRes.success).toBe(true);
    expect(legalRes.order?.orderStatus).toBe('confirmed');

    // Next step: confirmed -> processing
    const procRes = service.updateOrderStatus(pendingOrder._id, 'processing');
    expect(procRes.success).toBe(true);
    expect(procRes.order?.orderStatus).toBe('processing');
  });

  it('should cancel order and restore stock', () => {
    const products = service.getCatalogProducts();
    const targetProd = products[0];
    const initialStock = targetProd.stockQuantity;

    const createRes = service.createOrder({
      customerInfo: {
        name: 'Khách Hàng Hủy',
        phone: '0988112233',
        address: 'Địa chỉ hủy',
      },
      items: [{ productId: targetProd.productId, quantity: 3 }],
      paymentMethod: 'COD',
    });

    expect(createRes.success).toBe(true);
    const newOrderId = createRes.order!._id;

    // Cancel order
    const cancelRes = service.cancelOrder(newOrderId, 'Khách hàng đổi ý');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.order?.orderStatus).toBe('cancelled');
    expect(cancelRes.order?.cancelReason).toBe('Khách hàng đổi ý');

    // Verify stock restored
    const updatedProducts = service.getCatalogProducts();
    const restoredProd = updatedProducts.find(p => p.productId === targetProd.productId);
    expect(restoredProd?.stockQuantity).toBe(initialStock);
  });

  it('should not allow cancelling delivered orders', () => {
    const delivered = service.listOrders({ orderStatus: 'delivered' });
    expect(delivered.orders.length).toBeGreaterThan(0);
    const order = delivered.orders[0];

    const cancelRes = service.cancelOrder(order._id, 'Muốn hủy sau khi đã nhận');
    expect(cancelRes.success).toBe(false);
    expect(cancelRes.message).toContain('không thể hủy');
  });
});
