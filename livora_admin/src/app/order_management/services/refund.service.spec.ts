import { TestBed } from '@angular/core/testing';
import { RefundService } from './refund.service';

const backendRefund = {
  id: '64b000000000000000000001',
  orderId: '64b0000000000000000000aa',
  orderCode: 'ORD-2611-001',
  userId: '',
  customerName: 'Khách QA',
  customerPhone: '0911222333',
  amount: 500000,
  orderTotalAmount: 1850000,
  orderExists: true,
  reason: 'Sản phẩm trầy xước',
  refundType: 'partial',
  status: 'pending',
  rejectReason: '',
  processedBy: '',
  createdAt: '2026-11-09T09:00:00.000Z',
  updatedAt: '2026-11-09T09:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('RefundService', () => {
  let refundService: RefundService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The unit-test environment has no Web Storage, so give the service an in-memory one.
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    });
    localStorage.setItem('livora_admin_token', 'admin-token');
    TestBed.configureTestingModule({});
    refundService = TestBed.inject(RefundService);
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('lists refunds from the backend with the admin token', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({
      success: true,
      data: [backendRefund],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      stats: { pending: 1, completed: 0, totalRefundedAmount: 0 },
    }));

    const res = await refundService.listRefunds({ status: 'pending' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/refunds?');
    expect(url).toContain('status=pending');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer admin-token');
    expect(res.total).toBe(1);
    expect(res.stats.pending).toBe(1);
    expect(res.refunds[0].orderId).toBe(backendRefund.orderId);
    expect(res.refunds[0].orderTotalAmount).toBe(1850000);
  });

  it('approves through PATCH /refunds/:id/status', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ success: true, data: [backendRefund], pagination: { totalItems: 1 } }));
    await refundService.listRefunds();

    fetchSpy.mockResolvedValueOnce(jsonResponse({
      success: true,
      data: { id: backendRefund.id, status: 'completed', processedBy: 'Admin Kế toán', updatedAt: '2026-11-09T10:00:00.000Z' },
    }));
    const res = await refundService.processRefund({ refundId: backendRefund.id, approved: true, staffName: 'Admin Kế toán' });

    const [url, init] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(url).toContain(`/refunds/${backendRefund.id}/status`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string).status).toBe('completed');
    expect(res.success).toBe(true);
    expect(res.refund?.status).toBe('completed');
  });

  it('surfaces the backend error message when approval fails', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ success: true, data: [backendRefund], pagination: { totalItems: 1 } }));
    await refundService.listRefunds();

    fetchSpy.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Đơn hàng liên kết không tồn tại trong hệ thống.' }, 404));
    const res = await refundService.processRefund({ refundId: backendRefund.id, approved: true });

    expect(res.success).toBe(false);
    expect(res.message).toContain('không tồn tại');
    expect(refundService.getRefundById(backendRefund.id)?.status).toBe('pending');
  });

  it('requires a reason before rejecting', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ success: true, data: [backendRefund], pagination: { totalItems: 1 } }));
    await refundService.listRefunds();

    const res = await refundService.processRefund({ refundId: backendRefund.id, approved: false, rejectReason: '' });

    expect(res.success).toBe(false);
    expect(res.message).toContain('lý do');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
