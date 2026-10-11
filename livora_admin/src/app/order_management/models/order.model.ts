export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export type PaymentMethod = 'COD' | 'VNPay' | 'MoMo' | 'Banking';

export interface CustomerSnapshot {
  name: string;
  phone: string;
  email?: string;
  address: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  thumbnail: string;
  color?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  _id: string;
  orderCode: string;
  customerId?: string | null;
  customerInfo: CustomerSnapshot;
  items: OrderItem[];
  voucherCode?: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancelReason?: string;
  notes?: string;
  history: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerInfo: CustomerSnapshot;
  items: {
    productId: string;
    quantity: number;
    color?: string;
  }[];
  voucherCode?: string;
  shippingFee?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderFilterParams {
  keyword?: string;
  orderStatus?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface CatalogProductOption {
  productId: string;
  name: string;
  sku: string;
  price: number;
  thumbnail: string;
  stockQuantity: number;
  availableColors?: string[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  returned: 'Trả hàng',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thanh toán thất bại',
};

export const ORDER_LIFECYCLE_SEQUENCE: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
];
