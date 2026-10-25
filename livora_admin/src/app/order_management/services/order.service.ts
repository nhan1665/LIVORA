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

  private initialOrders: Order[] = [
    {
      _id: 'ord-001',
      orderCode: 'LIV-260301-889',
      customerId: 'cust-001',
      customerInfo: {
        name: 'Dương Trọng Nhân',
        phone: '0562173125',
        email: 'nhandt23406@st.uel.edu.vn',
        address: 'Đường số 8, Phường Linh Xuân, Thành phố Thủ Đức, TP. Hồ Chí Minh',
      },
      items: [
        {
          productId: 'prod-001',
          productName: 'Khung giường ngủ cao cấp thiết kế đơn giản 4 chân',
          sku: 'BED-LIV-01',
          thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=60',
          color: 'Trắng - đen',
          price: 2000000,
          quantity: 1,
          subtotal: 2000000,
        },
      ],
      voucherCode: 'LIVORA10',
      subtotalAmount: 2000000,
      discountAmount: 200000,
      shippingFee: 50000,
      totalAmount: 1850000,
      paymentMethod: 'Banking',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      notes: 'Giao giờ hành chính, gọi trước 30 phút.',
      history: [
        { status: 'pending', timestamp: '2026-10-08T08:30:00Z', note: 'Khách hàng tạo đơn qua website' },
        { status: 'confirmed', timestamp: '2026-10-08T09:15:00Z', note: 'Nhân viên vận hành xác nhận đơn' },
      ],
      createdAt: '2026-10-08T08:30:00Z',
      updatedAt: '2026-10-08T09:15:00Z',
    },
    {
      _id: 'ord-002',
      orderCode: 'LIV-260302-104',
      customerId: 'cust-002',
      customerInfo: {
        name: 'Tống Phước Hưng',
        phone: '0912345678',
        email: 'hungtp@example.com',
        address: 'Khu phố 6, Phường Linh Trung, Thành phố Thủ Đức, TP. Hồ Chí Minh',
      },
      items: [
        {
          productId: 'prod-002',
          productName: 'Sofa góc nỉ bọc đệm cao cấp Scandinavian',
          sku: 'SOFA-LIV-02',
          thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60',
          color: 'Beige',
          price: 6500000,
          quantity: 1,
          subtotal: 6500000,
        },
        {
          productId: 'prod-003',
          productName: 'Bàn trà gỗ sồi tròn đôi mặt kính cường lực',
          sku: 'TABLE-LIV-03',
          thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60',
          color: 'Gỗ sồi sáng',
          price: 1850000,
          quantity: 1,
          subtotal: 1850000,
        },
      ],
      voucherCode: '',
      subtotalAmount: 8350000,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 8350000,
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
      orderStatus: 'shipping',
      notes: 'Nhà trong ngõ, hỗ trợ bê lên tầng 2.',
      history: [
        { status: 'pending', timestamp: '2026-10-07T14:20:00Z', note: 'Đơn hàng được đặt thành công' },
        { status: 'confirmed', timestamp: '2026-10-07T15:00:00Z', note: 'Xác nhận đơn hàng và gọi khách' },
        { status: 'processing', timestamp: '2026-10-08T08:00:00Z', note: 'Đóng gói sản phẩm xuất kho' },
        { status: 'shipping', timestamp: '2026-10-08T13:30:00Z', note: 'Bàn giao cho đơn vị vận chuyển GHTK' },
      ],
      createdAt: '2026-10-07T14:20:00Z',
      updatedAt: '2026-10-08T13:30:00Z',
    },
    {
      _id: 'ord-003',
      orderCode: 'LIV-260302-315',
      customerId: 'cust-003',
      customerInfo: {
        name: 'Võ Tuấn Đạt',
        phone: '0987654321',
        email: 'datvt@example.com',
        address: '123 Cách Mạng Tháng Tám, Quận 3, TP. Hồ Chí Minh',
      },
      items: [
        {
          productId: 'prod-005',
          productName: 'Ghế bành thư giãn da PU chân kim loại mạ vàng',
          sku: 'CHAIR-LIV-05',
          thumbnail: 'https://images.unsplash.com/photo-1580481077114-1e039433dc51?w=500&auto=format&fit=crop&q=60',
          color: 'Cam đất',
          price: 2450000,
          quantity: 2,
          subtotal: 4900000,
        },
      ],
      subtotalAmount: 4900000,
      discountAmount: 0,
      shippingFee: 40000,
      totalAmount: 4940000,
      paymentMethod: 'VNPay',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      notes: '',
      history: [
        { status: 'pending', timestamp: '2026-10-05T10:00:00Z', note: 'Đơn hàng tạo mới' },
        { status: 'confirmed', timestamp: '2026-10-05T10:30:00Z', note: 'Xác nhận đơn' },
        { status: 'processing', timestamp: '2026-10-05T14:00:00Z', note: 'Đang gia công kiểm tra chất lượng' },
        { status: 'shipping', timestamp: '2026-10-06T09:00:00Z', note: 'Đang giao hàng' },
        { status: 'delivered', timestamp: '2026-10-06T16:45:00Z', note: 'Giao hàng thành công cho khách' },
      ],
      createdAt: '2026-10-05T10:00:00Z',
      updatedAt: '2026-10-06T16:45:00Z',
    },
    {
      _id: 'ord-004',
      orderCode: 'LIV-260303-771',
      customerId: 'cust-004',
      customerInfo: {
        name: 'Đỗ Phạm Minh Tân',
        phone: '0903112233',
        email: 'tanpm@example.com',
        address: '45 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
      },
      items: [
        {
          productId: 'prod-004',
          productName: 'Tủ quần áo 3 cánh mở phủ Melamine chống ẩm',
          sku: 'WARD-LIV-04',
          thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60',
          color: 'Trắng vân gỗ',
          price: 4900000,
          quantity: 1,
          subtotal: 4900000,
        },
      ],
      subtotalAmount: 4900000,
      discountAmount: 0,
      shippingFee: 60000,
      totalAmount: 4960000,
      paymentMethod: 'Banking',
      paymentStatus: 'refunded',
      orderStatus: 'cancelled',
      cancelReason: 'Khách hàng đổi ý muốn chọn kích thước lớn hơn, đã xử lý hoàn tiền.',
      notes: '',
      history: [
        { status: 'pending', timestamp: '2026-10-06T11:00:00Z', note: 'Khách hàng đặt hàng' },
        { status: 'confirmed', timestamp: '2026-10-06T11:40:00Z', note: 'Đã xác nhận' },
        { status: 'cancelled', timestamp: '2026-10-07T09:00:00Z', note: 'Hủy đơn theo yêu cầu của khách hàng' },
      ],
      createdAt: '2026-10-06T11:00:00Z',
      updatedAt: '2026-10-07T09:00:00Z',
    },
    {
      _id: 'ord-005',
      orderCode: 'LIV-260304-992',
      customerId: 'cust-005',
      customerInfo: {
        name: 'Cao Thành Thuận',
        phone: '0938445566',
        email: 'thuanct@example.com',
        address: 'Ấn Tấn Thành, Xã Vĩnh Bình, Tỉnh Đồng Tháp',
      },
      items: [
        {
          productId: 'prod-006',
          productName: 'Đèn cây đứng phòng khách phong cách Ý',
          sku: 'LAMP-LIV-06',
          thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
          color: 'Vàng đồng',
          price: 950000,
          quantity: 2,
          subtotal: 1900000,
        },
      ],
      subtotalAmount: 1900000,
      discountAmount: 100000,
      shippingFee: 30000,
      totalAmount: 1830000,
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
      orderStatus: 'pending',
      notes: 'Giao trong tuần này giúp em nhé.',
      history: [
        { status: 'pending', timestamp: '2026-10-09T08:15:00Z', note: 'Đơn hàng mới tạo - Chờ nhân viên xác nhận' },
      ],
      createdAt: '2026-10-09T08:15:00Z',
      updatedAt: '2026-10-09T08:15:00Z',
    },
  ];

  private orders: Order[] = [];
  private catalogProducts: CatalogProductOption[] = [];

  constructor() {
    this.loadState();
    this.syncFromBackend();
  }

  public async syncFromBackend(): Promise<void> {
    if (typeof fetch === 'undefined') return;
    try {
      const res = await fetch('http://localhost:5000/api/orders?pageSize=100');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const backendOrders: Order[] = json.data.map((o: any) => this.mapBackendOrderToModel(o));
        const map = new Map<string, Order>();
        backendOrders.forEach(o => map.set(o.orderCode, o));
        this.orders.forEach(o => {
          if (!map.has(o.orderCode)) map.set(o.orderCode, o);
        });
        this.orders = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.saveOrders();
      }
    } catch (_) {
      // Fallback to local storage if backend not reachable
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
      totalAmount: o.finalAmount || 0,
      paymentMethod: (o.paymentMethod === 'BANK_TRANSFER' ? 'Banking' : (o.paymentMethod || 'COD')) as any,
      paymentStatus: o.paymentStatus || 'unpaid',
      orderStatus: o.orderStatus || 'pending',
      notes: o.note || '',
      cancelReason: o.cancelReason || '',
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
        this.orders = JSON.parse(storedOrders);
      } else {
        this.orders = [...this.initialOrders];
        this.saveOrders();
      }

      const storedStock = localStorage.getItem(STOCK_KEY);
      if (storedStock) {
        this.catalogProducts = JSON.parse(storedStock);
      } else {
        this.catalogProducts = [...this.initialProducts];
        this.saveStock();
      }
    } catch {
      this.orders = [...this.initialOrders];
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

  getCatalogProducts(): CatalogProductOption[] {
    return [...this.catalogProducts];
  }

  findCustomerByPhone(phone: string): CustomerSnapshot | null {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;
    const match = this.orders.find(o => o.customerInfo.phone === cleanPhone);
    return match ? { ...match.customerInfo } : null;
  }

  async findCustomerByPhoneAsync(phone: string): Promise<{
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    customerType?: string;
  } | null> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;

    // Check MongoDB Atlas backend customers
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`http://localhost:5000/api/customers?search=${encodeURIComponent(cleanPhone)}`);
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const match = json.data.find((c: any) => c.phone === cleanPhone || (c.phone && c.phone.includes(cleanPhone)));
          if (match) {
            return {
              id: match.id || match._id,
              name: match.fullName || match.name,
              phone: match.phone,
              email: match.email || '',
              address: match.address || '',
              customerType: match.customerType || 'registered',
            };
          }
        }
      } catch (_) {}
    }

    // Fallback to local cache in orders
    const local = this.findCustomerByPhone(cleanPhone);
    if (local) {
      return {
        name: local.name,
        phone: local.phone,
        email: local.email || '',
        address: local.address || '',
        customerType: 'guest',
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
      result = result.filter(
        o =>
          o.orderCode.toLowerCase().includes(kw) ||
          o.customerInfo.name.toLowerCase().includes(kw) ||
          o.customerInfo.phone.toLowerCase().includes(kw) ||
          (o.customerInfo.email && o.customerInfo.email.toLowerCase().includes(kw))
      );
    }

    if (params.orderStatus && params.orderStatus !== 'all') {
      result = result.filter(o => o.orderStatus === params.orderStatus);
    }

    if (params.paymentStatus && params.paymentStatus !== 'all') {
      result = result.filter(o => o.paymentStatus === params.paymentStatus);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    order.orderStatus = targetStatus;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, note, actor: 'Admin Operator' }),
      }).catch(() => {});
    }

    return { success: true, message: 'Cập nhật trạng thái đơn hàng thành công.', order };
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

    // Restore stock quantities
    for (const item of order.items) {
      const prod = this.catalogProducts.find(p => p.productId === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
      }
    }
    this.saveStock();

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
        headers: { 'Content-Type': 'application/json' },
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

  createOrder(request: CreateOrderRequest): { success: boolean; message: string; order?: Order } {
    // Validations
    if (!request.customerInfo.name || !request.customerInfo.name.trim()) {
      return { success: false, message: 'Vui lòng nhập họ tên khách hàng.' };
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!request.customerInfo.phone || !phoneRegex.test(request.customerInfo.phone.trim())) {
      return { success: false, message: 'Số điện thoại khách hàng không đúng định dạng.' };
    }

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

    // Deduct stock
    for (const itemReq of request.items) {
      const prod = this.catalogProducts.find(p => p.productId === itemReq.productId);
      if (prod) {
        prod.stockQuantity -= itemReq.quantity;
      }
    }
    this.saveStock();

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

    // 1. Tạo mới khách hàng trên backend nếu là người dùng mới
    if (isNewCustomer && typeof fetch !== 'undefined') {
      try {
        const custRes = await fetch('http://localhost:5000/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
        const orderJson = await orderRes.json();
        if (orderJson && orderJson.success && orderJson.data?.orderCode) {
          localRes.order.orderCode = orderJson.data.orderCode;
          localRes.order._id = orderJson.data.id || localRes.order._id;
          this.saveOrders();
          console.log('[LIVORA ADMIN] Đơn hàng đã được lưu vào MongoDB Atlas:', orderJson.data);
        }
      } catch (orderErr) {
        console.warn('[LIVORA ADMIN] Không thể gửi đơn hàng lên server:', orderErr);
      }
    }

    const message = newCustomerCreated
      ? `Tạo đơn hàng ${localRes.order.orderCode} thành công. Đã tạo mới 1 khách hàng vào hệ thống!`
      : `Tạo đơn hàng ${localRes.order.orderCode} thành công.`;

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
