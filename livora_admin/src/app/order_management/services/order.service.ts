import { Injectable } from '@angular/core';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  CreateOrderRequest,
  OrderFilterParams,
  CatalogProductOption,
  ORDER_LIFECYCLE_SEQUENCE,
  CustomerSnapshot,
} from '../models/order.model';

const STORAGE_KEY = 'livora_admin_orders';
const STOCK_KEY = 'livora_admin_order_stock';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private initialProducts: CatalogProductOption[] = [
    {
      productId: 'prod-001',
      name: 'Khung giường ngủ cao cấp thiết kế đơn giản 4 chân',
      sku: 'BED-LIV-01',
      price: 2000000,
      stockQuantity: 15,
      thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Trắng - đen', 'Gỗ tự nhiên', 'Xám nhạt'],
    },
    {
      productId: 'prod-002',
      name: 'Sofa góc nỉ bọc đệm cao cấp Scandinavian',
      sku: 'SOFA-LIV-02',
      price: 6500000,
      stockQuantity: 8,
      thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Beige', 'Xanh lam', 'Ghi đậm'],
    },
    {
      productId: 'prod-003',
      name: 'Bàn trà gỗ sồi tròn đôi mặt kính cường lực',
      sku: 'TABLE-LIV-03',
      price: 1850000,
      stockQuantity: 20,
      thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Gỗ sồi sáng', 'Walnut nâu'],
    },
    {
      productId: 'prod-004',
      name: 'Tủ quần áo 3 cánh mở phủ Melamine chống ẩm',
      sku: 'WARD-LIV-04',
      price: 4900000,
      stockQuantity: 6,
      thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Trắng vân gỗ', 'Xám xi măng'],
    },
    {
      productId: 'prod-005',
      name: 'Ghế bành thư giãn da PU chân kim loại mạ vàng',
      sku: 'CHAIR-LIV-05',
      price: 2450000,
      stockQuantity: 12,
      thumbnail: 'https://images.unsplash.com/photo-1580481077114-1e039433dc51?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Cam đất', 'Xanh cổ vịt', 'Đen'],
    },
    {
      productId: 'prod-006',
      name: 'Đèn cây đứng phòng khách phong cách Ý',
      sku: 'LAMP-LIV-06',
      price: 950000,
      stockQuantity: 25,
      thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
      availableColors: ['Đen nhám', 'Vàng đồng'],
    },
  ];

  private initialOrders: Order[] = [];

  private orders: Order[] = [];
  private catalogProducts: CatalogProductOption[] = [];

  constructor() {
    this.loadState();
    this.syncFromBackend();
  }

  public async syncFromBackend(force: boolean = false): Promise<void> {
    if (typeof fetch === 'undefined') return;
    try {
      const cacheBuster = force ? `&_t=${Date.now()}` : '';
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('livora_admin_token') : null) ||
                    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('livora_admin_token') : null) || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Tải danh sách đơn hàng thật 100% từ MongoDB Atlas Orders Collection
      const res = await fetch(`http://localhost:5000/api/orders?pageSize=200${cacheBuster}`, {
        cache: 'no-store',
        headers,
      });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const backendOrders: Order[] = json.data.map((o: any) => this.mapBackendOrderToModel(o));

        // 2. Tải danh sách phiếu hoàn tiền thật từ MongoDB Atlas Refunds Collection để map chính xác
        try {
          const refRes = await fetch(`http://localhost:5000/api/refunds?pageSize=200${cacheBuster}`, {
            cache: 'no-store',
            headers,
          });
          const refJson = await refRes.json();
          if (refJson && refJson.success && Array.isArray(refJson.data)) {
            const refundMap = new Map<string, any>();
            refJson.data.forEach((r: any) => {
              if (r.orderId) refundMap.set(String(r.orderId), r);
              if (r.orderCode) refundMap.set(String(r.orderCode), r);
            });
            backendOrders.forEach(bo => {
              const matchedRefund = refundMap.get(String(bo._id)) || refundMap.get(String(bo.orderCode));
              if (matchedRefund) {
                bo.hasRefund = true;
                bo.refundId = matchedRefund.id || matchedRefund._id;
                bo.refundReason = matchedRefund.reason || bo.cancelReason || '';
                bo.refundStatus = matchedRefund.status || 'pending';
                bo.refundAmount = matchedRefund.amount || bo.totalAmount;
              }
            });
          }
        } catch (_) {}

        this.orders = backendOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.saveOrders();
      }

      // Tải danh sách sản phẩm thật từ MongoDB Atlas
      const prodRes = await fetch(`http://localhost:5000/api/products?pageSize=100${cacheBuster}`, { cache: 'no-store' });
      const prodJson = await prodRes.json();
      if (prodJson && prodJson.success && Array.isArray(prodJson.data) && prodJson.data.length > 0) {
        this.catalogProducts = prodJson.data.map((p: any) => ({
          productId: p._id || p.id,
          name: p.name,
          sku: p.sku || 'SKU-FURNITURE',
          price: p.salePrice || p.price || 1000000,
          stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : 10,
          thumbnail: p.thumbnail || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
          availableColors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Tiêu chuẩn'],
        }));
        this.saveStock();
      }
    } catch (_) {
      // Fallback
    }
  }

  public async fetchOrders(params: OrderFilterParams = {}): Promise<{
    orders: Order[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    await this.syncFromBackend();
    return this.listOrders(params);
  }

  private mapBackendOrderToModel(o: any): Order {
    return {
      _id: o.id || o._id,
      orderCode: o.orderCode,
      customerId: o.userId || 'guest',
      customerInfo: o.customerInfo || { name: '', phone: '', address: '' },
      items: (o.items || []).map((it: any) => ({
        productId: it.productId || 'prod-custom',
        productName: it.productName || it.name || 'Sản phẩm nội thất',
        sku: it.sku || '',
        thumbnail: it.thumbnail || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        color: it.color || '',
        price: it.price || 0,
        quantity: it.quantity || 1,
        subtotal: it.subtotal || ((it.price || 0) * (it.quantity || 1)),
      })),
      voucherCode: o.voucherCode || '',
      subtotalAmount: o.subtotalAmount || 0,
      discountAmount: o.discountAmount || 0,
      shippingFee: o.shippingFee || 0,
      shippingMethod: o.shippingMethod || '',
      shippingProvince: o.shippingProvince || '',
      totalAmount: o.finalAmount || 0,
      paymentMethod: (o.paymentMethod === 'BANK_TRANSFER' ? 'Banking' : (o.paymentMethod || 'COD')) as any,
      paymentStatus: o.paymentStatus || 'unpaid',
      orderStatus: o.orderStatus || 'pending',
      notes: o.note || '',
      cancelReason: o.cancelReason || '',
      exportSlipCode: o.exportSlipCode || (o.orderStatus !== 'pending' && o.orderStatus !== 'cancelled' ? 'PX-' + (o.orderCode || '').replace(/^LIV-/, '') : null),
      exportSlipStatus: o.exportSlipStatus || (o.orderStatus === 'shipping' || o.orderStatus === 'delivered' ? 'exported' : 'pending'),
      exportedAt: o.exportedAt || null,
      isStockDeducted: Boolean(o.isStockDeducted),
      isRestockedReturned: Boolean(o.isRestockedReturned),
      restockedReturnedAt: o.restockedReturnedAt || null,
      hasRefund: Boolean(o.hasRefund),
      refundId: o.refundId || null,
      refundReason: o.refundReason || '',
      refundStatus: o.refundStatus || '',
      refundAmount: o.refundAmount || 0,
      history: (o.statusHistory || []).map((h: any) => ({
        status: h.status,
        timestamp: h.timestamp,
        note: h.note,
        updatedBy: h.actor || 'Hệ thống',
      })),
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString(),
    };
  }

  private loadState(): void {
    try {
      const storedOrders = localStorage.getItem(STORAGE_KEY);
      if (storedOrders) {
        const parsed: Order[] = JSON.parse(storedOrders);
        // Loại bỏ hoàn toàn data mock (ord-001..ord-006)
        this.orders = parsed.filter(o => !String(o._id).startsWith('ord-00'));
      } else {
        this.orders = [];
      }

      const storedStock = localStorage.getItem(STOCK_KEY);
      if (storedStock) {
        this.catalogProducts = JSON.parse(storedStock);
      } else {
        this.catalogProducts = [...this.initialProducts];
        this.saveStock();
      }
    } catch {
      this.orders = [];
      this.catalogProducts = [...this.initialProducts];
    }
  }

  private saveOrders(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
    } catch {
      // ignore storage failure in mock
    }
  }

  private saveStock(): void {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(this.catalogProducts));
    } catch {
      // ignore
    }
  }

  private readonly catalogCustomers: CustomerSnapshot[] = [
    {
      name: 'Dương Trọng Nhân',
      phone: '0562173125',
      email: 'nhandt23406@st.uel.edu.vn',
      address: '123 Nguyễn Huệ, Quận 1, TP. HCM',
    },
    {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'vana@example.com',
      address: '456 Lê Lợi, Quận 1, TP. HCM',
    },
  ];

  getCatalogProducts(): CatalogProductOption[] {
    return [...this.catalogProducts];
  }

  findCustomerByPhone(phone: string): CustomerSnapshot | null {
    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
    if (!cleanPhone) return null;
    const match = this.catalogCustomers.find(c => {
      const cp = (c.phone || '').trim().replace(/[\s\-\.]/g, '');
      return cp === cleanPhone || cp.includes(cleanPhone) || cleanPhone.includes(cp);
    });
    return match ? { ...match } : null;
  }

  async findCustomerByPhoneAsync(phone: string): Promise<{
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    customerType?: string;
  } | null> {
    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
    if (!cleanPhone) return null;

    // 1. Kiểm tra DUY NHẤT trong CSDL Khách hàng (MongoDB Atlas Customers Collection)
    if (typeof fetch !== 'undefined') {
      try {
        const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('livora_admin_token') : null) ||
                      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('livora_admin_token') : null);
        const res = await fetch(`http://localhost:5000/api/customers?search=${encodeURIComponent(cleanPhone)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const match = json.data.find((c: any) => {
            const cp = (c.phone || '').trim().replace(/[\s\-\.]/g, '');
            return cp === cleanPhone || cp.includes(cleanPhone) || cleanPhone.includes(cp);
          });
          if (match) {
            return {
              id: match.id || match._id,
              name: match.fullName || match.name,
              phone: match.phone,
              email: match.email || '',
              address: match.address === 'Chưa có địa chỉ' ? '' : (match.address || ''),
              customerType: match.customerType || 'registered',
            };
          }
        }
      } catch (err) {
        console.warn('[OrderService] Lỗi tra cứu CSDL Khách hàng:', err);
      }
    }

    // 2. Fallback cho CSDL Customer mẫu (TUYỆT ĐỐI KHÔNG tìm theo danh sách Đơn hàng)
    const local = this.findCustomerByPhone(cleanPhone);
    if (local) {
      return {
        name: local.name,
        phone: local.phone,
        email: local.email || '',
        address: local.address || '',
        customerType: 'registered',
      };
    }

    return null;
  }

  listOrders(params: OrderFilterParams = {}): {
    orders: Order[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let result = [...this.orders];

    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim().toLowerCase();
      const cleanKwDigits = kw.replace(/[\s\-\.]/g, '');
      result = result.filter(o => {
        const code = (o.orderCode || '').toLowerCase();
        const cName = (o.customerInfo?.name || (o.customerInfo as any)?.fullName || '').toLowerCase();
        const cPhone = (o.customerInfo?.phone || '').replace(/[\s\-\.]/g, '').toLowerCase();
        const cEmail = (o.customerInfo?.email || '').toLowerCase();
        return (
          code.includes(kw) ||
          cName.includes(kw) ||
          (cleanKwDigits.length > 0 && cPhone.includes(cleanKwDigits)) ||
          cEmail.includes(kw)
        );
      });
    }

    if (params.orderStatus && params.orderStatus !== 'all') {
      const targetStatus = params.orderStatus.toLowerCase();
      result = result.filter(o => (o.orderStatus || '').toLowerCase() === targetStatus);
    }

    if (params.paymentStatus && params.paymentStatus !== 'all') {
      const targetPay = params.paymentStatus.toLowerCase();
      result = result.filter(o => {
        const pStatus = (o.paymentStatus || '').toLowerCase();
        if (targetPay === 'unpaid') {
          return pStatus === 'unpaid' || pStatus === 'pending';
        }
        return pStatus === targetPay;
      });
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const total = result.length;
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = result.slice(startIndex, startIndex + pageSize);

    return {
      orders: paginated,
      total,
      page,
      pageSize,
    };
  }

  getAllRawOrders(): Order[] {
    return [...this.orders];
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o._id === id);
  }

  getOrderByCode(code: string): Order | undefined {
    return this.orders.find(o => o.orderCode.toLowerCase() === code.trim().toLowerCase());
  }

  getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
    const idx = ORDER_LIFECYCLE_SEQUENCE.indexOf(currentStatus);
    if (idx >= 0 && idx < ORDER_LIFECYCLE_SEQUENCE.length - 1) {
      return ORDER_LIFECYCLE_SEQUENCE[idx + 1];
    }
    return null;
  }

  updateOrderStatus(orderId: string, targetStatus: OrderStatus, note?: string): { success: boolean; message: string; order?: Order } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng cần cập nhật.' };
    }

    if (order.orderStatus === 'cancelled') {
      return { success: false, message: 'Đơn hàng đã hủy, không thể thay đổi trạng thái.' };
    }

    if (order.orderStatus === 'delivered' && targetStatus !== 'delivered') {
      return { success: false, message: 'Đơn hàng đã hoàn tất giao hàng, không thể quay lại trạng thái trước đó.' };
    }

    // Validate sequential progression
    const currentIdx = ORDER_LIFECYCLE_SEQUENCE.indexOf(order.orderStatus);
    const targetIdx = ORDER_LIFECYCLE_SEQUENCE.indexOf(targetStatus);

    if (targetIdx === -1) {
      return { success: false, message: 'Trạng thái chuyển tiếp không hợp lệ.' };
    }

    if (targetIdx !== currentIdx + 1 && targetStatus !== order.orderStatus) {
      return {
        success: false,
        message: `Không thể chuyển trực tiếp từ "${order.orderStatus}" sang "${targetStatus}". Phải tuân thủ trình tự xử lý từng bước.`,
      };
    }

    if (targetStatus === 'shipping' && order.exportSlipStatus !== 'exported') {
      return {
        success: false,
        message: 'Vui lòng thực hiện "Xuất hàng" trên Phiếu xuất bán trước khi chuyển đơn sang trạng thái Đang giao.',
      };
    }

    order.orderStatus = targetStatus;
    if (targetStatus === 'confirmed') {
      if (!order.exportSlipCode) {
        order.exportSlipCode = 'PX-' + order.orderCode.replace(/^LIV-/, '');
      }
      if (!order.exportSlipStatus) {
        order.exportSlipStatus = 'pending';
      }
    } else if (targetStatus === 'shipping') {
      if (!order.exportSlipCode) {
        order.exportSlipCode = 'PX-' + order.orderCode.replace(/^LIV-/, '');
      }
      order.exportSlipStatus = 'exported';
      if (!order.exportedAt) {
        order.exportedAt = new Date().toISOString();
      }
    }
    order.updatedAt = new Date().toISOString();
    order.history.push({
      status: targetStatus,
      timestamp: order.updatedAt,
      note: note || `Chuyển trạng thái sang ${targetStatus}`,
      updatedBy: 'Admin Operator',
    });

    // Auto mark paid on delivered if COD
    if (targetStatus === 'delivered' && order.paymentMethod === 'COD' && order.paymentStatus === 'unpaid') {
      order.paymentStatus = 'paid';
    }

    this.saveOrders();

    // Sync status change to backend
    if (typeof fetch !== 'undefined') {
      fetch(`http://localhost:5000/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('livora_admin_token') || ''}` },
        body: JSON.stringify({ status: targetStatus, note, actor: 'Admin Operator' }),
      }).catch(() => {});
    }

    return { success: true, message: 'Cập nhật trạng thái đơn hàng thành công.', order };
  }

  async exportOrderAsync(orderId: string): Promise<{ success: boolean; message: string; order?: Order }> {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Không tìm thấy đơn hàng cần xuất.' };

    try {
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('livora_admin_token') : null) || '';
      const res = await fetch(`http://localhost:5000/api/orders/${order._id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Lỗi khi xuất hàng từ máy chủ.' };
      }
    } catch (err: any) {
      console.warn('Lỗi gọi API export:', err);
    }

    if (!order.exportSlipCode) {
      order.exportSlipCode = 'PX-' + order.orderCode.replace(/^LIV-/, '');
    }
    order.exportSlipStatus = 'exported';
    order.exportedAt = new Date().toISOString();
    order.isStockDeducted = true;

    // Trừ tồn kho local
    for (const item of (order.items || [])) {
      const p = this.catalogProducts.find(cp => cp.productId === item.productId || cp.sku === item.sku);
      if (p) {
        p.stockQuantity = Math.max(0, (Number(p.stockQuantity) || 0) - (Number(item.quantity) || 1));
      }
    }
    this.saveStock();

    order.updatedAt = new Date().toISOString();
    order.history.push({
      status: order.orderStatus,
      timestamp: order.updatedAt,
      note: `Xuất kho Phiếu #${order.exportSlipCode} - Đã trừ tồn kho sản phẩm. Mở khóa nút chuyển Đang giao.`,
      updatedBy: 'Admin Warehouse',
    });
    this.saveOrders();

    return {
      success: true,
      message: `Đã xuất hàng thành công cho đơn #${order.orderCode}! Tồn kho đã được trừ. Nút chuyển sang "Đang giao" đã mở khóa.`,
      order,
    };
  }

  cancelOrder(orderId: string, reason: string): { success: boolean; message: string; order?: Order } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng cần hủy.' };
    }

    if (order.orderStatus === 'delivered') {
      return { success: false, message: 'Đơn hàng đã được giao thành công, không thể hủy bỏ.' };
    }

    if (order.orderStatus === 'cancelled') {
      return { success: false, message: 'Đơn hàng này đã bị hủy trước đó.' };
    }

    if (!reason || !reason.trim()) {
      return { success: false, message: 'Bắt buộc phải nhập lý do hủy đơn hàng.' };
    }

    // Restore stock quantities only if stock was actually deducted
    if (order.isStockDeducted) {
      for (const item of order.items) {
        const prod = this.catalogProducts.find(p => p.productId === item.productId || p.sku === item.sku);
        if (prod) {
          prod.stockQuantity += item.quantity;
        }
      }
      this.saveStock();
      order.isStockDeducted = false;
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason.trim();
    order.updatedAt = new Date().toISOString();
    order.history.push({
      status: 'cancelled',
      timestamp: order.updatedAt,
      note: `Hủy đơn: ${reason.trim()}`,
      updatedBy: 'Admin Operator',
    });

    this.saveOrders();

    // Sync cancellation to backend
    if (typeof fetch !== 'undefined') {
      fetch(`http://localhost:5000/api/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('livora_admin_token') || ''}` },
        body: JSON.stringify({ reason: reason.trim(), actor: 'Admin Operator' }),
      }).catch(() => {});
    }

    return { success: true, message: 'Hủy đơn hàng thành công. Tồn kho đã được hoàn trả.', order };
  }

  updatePaymentStatus(orderId: string, status: PaymentStatus): { success: boolean; message: string; order?: Order } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng.' };
    }

    order.paymentStatus = status;
    order.updatedAt = new Date().toISOString();
    this.saveOrders();
    return { success: true, message: 'Cập nhật trạng thái thanh toán thành công.', order };
  }

  async restockReturnOrder(orderId: string): Promise<{ success: boolean; message: string; order?: Order }> {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng cần nhập kho hoàn trả.' };
    }

    if (order.isRestockedReturned) {
      return { success: false, message: 'Đơn hàng này đã được thực hiện nhập kho hoàn trả trước đó.' };
    }

    try {
      if (typeof fetch !== 'undefined') {
        const token = localStorage.getItem('livora_admin_token') || '';
        const res = await fetch(`http://localhost:5000/api/orders/${order._id}/return-restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) {
          return { success: false, message: data.message || 'Lỗi khi nhập kho hoàn trả từ server.' };
        }
      }
    } catch (err: any) {
      console.warn('Lỗi gọi API return-restock:', err);
    }

    // Hoàn trả tồn kho local
    for (const item of (order.items || [])) {
      const prod = this.catalogProducts.find(p => p.productId === item.productId || p.sku === item.sku);
      if (prod) {
        prod.stockQuantity = (Number(prod.stockQuantity) || 0) + (Number(item.quantity) || 1);
      }
    }
    this.saveStock();

    order.isRestockedReturned = true;
    order.restockedReturnedAt = new Date().toISOString();
    order.history.push({
      status: order.orderStatus,
      timestamp: order.restockedReturnedAt,
      note: 'Nhập hàng hoàn trả về kho - Tồn kho sản phẩm đã được cộng lại',
      updatedBy: 'Admin Operator',
    });

    this.saveOrders();
    return { success: true, message: `Đã nhập hàng hoàn trả về kho cho đơn #${order.orderCode} thành công!`, order };
  }

  createOrder(request: CreateOrderRequest): { success: boolean; message: string; order?: Order } {
    // Validations
    if (!request.customerInfo.name || !request.customerInfo.name.trim()) {
      return { success: false, message: 'Vui lòng nhập họ tên khách hàng.' };
    }

    const cleanPhone = (request.customerInfo.phone || '').trim().replace(/[\s\-\.]/g, '');
    const phoneRegex = /^[0-9+]{9,12}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return { success: false, message: 'Số điện thoại khách hàng phải có từ 9 đến 11 chữ số.' };
    }
    request.customerInfo.phone = cleanPhone;

    if (!request.customerInfo.address || !request.customerInfo.address.trim()) {
      return { success: false, message: 'Vui lòng nhập địa chỉ nhận hàng đầy đủ.' };
    }

    if (!request.items || request.items.length === 0) {
      return { success: false, message: 'Vui lòng chọn ít nhất một sản phẩm vào đơn hàng.' };
    }

    // Check inventory and construct order items
    const orderItems = [];
    let subtotal = 0;

    for (const itemReq of request.items) {
      const prod = this.catalogProducts.find(p => p.productId === itemReq.productId);
      if (!prod) {
        return { success: false, message: `Sản phẩm với mã ${itemReq.productId} không tồn tại hoặc đã ngừng kinh doanh.` };
      }

      if (prod.stockQuantity < itemReq.quantity) {
        return {
          success: false,
          message: `Sản phẩm "${prod.name}" chỉ còn ${prod.stockQuantity} món trong kho (yêu cầu: ${itemReq.quantity}).`,
        };
      }

      const itemTotal = prod.price * itemReq.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: prod.productId,
        productName: prod.name,
        sku: prod.sku,
        thumbnail: prod.thumbnail,
        color: itemReq.color || prod.availableColors?.[0] || 'Tiêu chuẩn',
        price: prod.price,
        quantity: itemReq.quantity,
        subtotal: itemTotal,
      });
    }

    // Discount & Shipping calculation
    let discount = 0;
    if (request.voucherCode && request.voucherCode.trim().toUpperCase() === 'LIVORA10') {
      discount = Math.min(200000, subtotal * 0.1);
    }
    const shipping = request.shippingFee !== undefined ? request.shippingFee : (subtotal >= 5000000 ? 0 : 40000);
    const totalAmount = Math.max(0, subtotal - discount + shipping);

    const now = new Date();
    const dateCode = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderCode = `LIV-${dateCode}-${randomSuffix}`;

    const newOrder: Order = {
      _id: `ord-${Date.now()}`,
      orderCode,
      customerInfo: {
        name: request.customerInfo.name.trim(),
        phone: request.customerInfo.phone.trim(),
        email: request.customerInfo.email?.trim() || '',
        address: request.customerInfo.address.trim(),
      },
      items: orderItems,
      voucherCode: request.voucherCode?.trim() || '',
      subtotalAmount: subtotal,
      discountAmount: discount,
      shippingFee: shipping,
      totalAmount,
      paymentMethod: request.paymentMethod,
      paymentStatus: request.paymentMethod === 'Banking' ? 'paid' : 'unpaid',
      orderStatus: 'pending',
      notes: request.notes?.trim() || '',
      history: [
        {
          status: 'pending',
          timestamp: now.toISOString(),
          note: 'Đơn hàng được tạo mới bởi nhân viên quản trị',
          updatedBy: 'Admin Operator',
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.orders.unshift(newOrder);
    this.saveOrders();

    return {
      success: true,
      message: `Tạo đơn hàng ${orderCode} thành công.`,
      order: newOrder,
    };
  }

  async createOrderAsync(
    request: CreateOrderRequest,
    isNewCustomer: boolean = false,
    customerId?: string | null
  ): Promise<{ success: boolean; message: string; order?: Order; newCustomerCreated?: boolean }> {
    let resolvedCustomerId = customerId || request.customerId || null;
    let newCustomerCreated = false;
    let persistedOrder = false;

    // 1. Tạo mới khách hàng trên backend nếu là người dùng mới
    if (isNewCustomer && typeof fetch !== 'undefined') {
      try {
        const custRes = await fetch('http://localhost:5000/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('livora_admin_token') || ''}` },
          body: JSON.stringify({
            fullName: request.customerInfo.name.trim(),
            phone: request.customerInfo.phone.trim(),
            email: request.customerInfo.email?.trim() || '',
            address: request.customerInfo.address.trim(),
            customerType: 'registered',
          }),
        });
        const custJson = await custRes.json();
        if (custJson && custJson.success && custJson.data) {
          resolvedCustomerId = custJson.data.id || custJson.data._id;
          newCustomerCreated = true;
          console.log('[LIVORA ADMIN] Đã tạo mới khách hàng vào CSDL:', custJson.data);
        }
      } catch (err) {
        console.warn('[LIVORA ADMIN] Không thể tạo khách hàng trên server:', err);
      }
    }

    // 2. Tạo đơn hàng cục bộ để trừ tồn kho và cập nhật state
    const localRes = this.createOrder({
      ...request,
      customerId: resolvedCustomerId,
    });

    if (!localRes.success || !localRes.order) {
      return localRes;
    }

    // 3. Gửi đơn hàng lên backend MongoDB Atlas
    if (typeof fetch !== 'undefined') {
      try {
        const orderPayload = {
          userId: resolvedCustomerId || undefined,
          customerInfo: {
            name: request.customerInfo.name.trim(),
            phone: request.customerInfo.phone.trim(),
            email: request.customerInfo.email?.trim() || '',
            address: request.customerInfo.address.trim(),
          },
          items: localRes.order.items.map(it => ({
            productId: it.productId,
            name: it.productName,
            sku: it.sku,
            price: it.price,
            quantity: it.quantity,
            color: it.color,
            thumbnail: it.thumbnail,
          })),
          voucherCode: request.voucherCode?.trim() || '',
          shippingFee: localRes.order.shippingFee,
          paymentMethod: request.paymentMethod === 'Banking' ? 'BANK_TRANSFER' : 'COD',
          note: request.notes?.trim() || '',
        };

        const orderRes = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('livora_admin_token') || ''}` },
          body: JSON.stringify(orderPayload),
        });
        const orderJson = await orderRes.json();
        if (orderJson && orderJson.success && orderJson.data?.orderCode) {
          localRes.order.orderCode = orderJson.data.orderCode;
          localRes.order._id = orderJson.data.id || localRes.order._id;
          this.saveOrders();
          persistedOrder = true;
        }
      } catch (orderErr) {
        console.warn('[LIVORA ADMIN] Không thể gửi đơn hàng lên server:', orderErr);
      }
    }

    const message = persistedOrder
      ? `Đơn hàng ${localRes.order.orderCode} đã được máy chủ ghi nhận.${newCustomerCreated ? ' Đã tạo khách hàng trên máy chủ.' : ''}`
      : `Đơn hàng ${localRes.order.orderCode} chỉ được lưu trên trình duyệt; máy chủ chưa xác nhận. Vui lòng kiểm tra trước khi tạo lại để tránh trùng đơn.`;

    return {
      success: true,
      message,
      order: localRes.order,
      newCustomerCreated,
    };
  }

  getOrderStats(): {
    totalOrders: number;
    pendingCount: number;
    shippingCount: number;
    deliveredCount: number;
    cancelledCount: number;
    totalRevenue: number;
  } {
    const totalOrders = this.orders.length;
    let pendingCount = 0;
    let shippingCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let totalRevenue = 0;

    for (const o of this.orders) {
      if (o.orderStatus === 'pending') pendingCount++;
      if (o.orderStatus === 'shipping') shippingCount++;
      if (o.orderStatus === 'delivered') deliveredCount++;
      if (o.orderStatus === 'cancelled') cancelledCount++;
      if (o.paymentStatus === 'paid') totalRevenue += o.totalAmount;
    }

    return {
      totalOrders,
      pendingCount,
      shippingCount,
      deliveredCount,
      cancelledCount,
      totalRevenue,
    };
  }
}
