import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  CatalogProductOption,
} from '../models/order.model';
import { OrderService } from '../services/order.service';
import { DataTable, TableColumn, TableActionEvent, BadgeInfo } from '../../shared/data-table/data-table';
import { FilterBar, FilterSelectOption } from '../../shared/filter-bar/filter-bar';
import { FormModal } from '../../shared/form-modal/form-modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTable,
    FilterBar,
    FormModal,
    ConfirmDialog,
  ],
  templateUrl: './order.html',
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  loading: boolean = false;

  // Search & Filter
  keyword: string = '';
  orderStatusFilter: string = 'all';
  paymentStatusFilter: string = 'all';

  statusOptions: FilterSelectOption[] = [
    { label: 'Tất cả trạng thái đơn', value: 'all' },
    { label: 'Chờ xác nhận', value: 'pending' },
    { label: 'Đã xác nhận', value: 'confirmed' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Đang giao', value: 'shipping' },
    { label: 'Đã giao', value: 'delivered' },
    { label: 'Đã hủy', value: 'cancelled' },
  ];

  paymentOptions: FilterSelectOption[] = [
    { label: 'Tất cả thanh toán', value: 'all' },
    { label: 'Chưa thanh toán', value: 'unpaid' },
    { label: 'Đã thanh toán', value: 'paid' },
    { label: 'Đã hoàn tiền', value: 'refunded' },
  ];

  // Stats
  stats = {
    totalOrders: 0,
    pendingCount: 0,
    shippingCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  };

  // Table Columns
  columns: TableColumn<Order>[] = [
    {
      key: 'orderCode',
      label: 'MÃ ĐƠN HÀNG',
      minWidth: '150px',
      formatter: (val: string) => val,
    },
    {
      key: 'customerInfo',
      label: 'KHÁCH HÀNG',
      minWidth: '200px',
      formatter: (val: any) => `${val?.name || ''}\n${val?.phone || ''}`,
    },
    {
      key: 'totalAmount',
      label: 'TỔNG TIỀN',
      minWidth: '130px',
      type: 'currency',
      formatter: (val: number) => `${val?.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'paymentMethod',
      label: 'PHƯƠNG THỨC',
      minWidth: '120px',
      formatter: (val: string) => val,
    },
    {
      key: 'paymentStatus',
      label: 'THANH TOÁN',
      minWidth: '140px',
      type: 'badge',
      badgeResolver: (val: PaymentStatus): BadgeInfo => {
        switch (val) {
          case 'paid':
            return { label: 'Đã thanh toán', variant: 'completed' };
          case 'unpaid':
            return { label: 'Chưa thanh toán', variant: 'warning' };
          case 'refunded':
            return { label: 'Đã hoàn tiền', variant: 'info' };
          default:
            return { label: 'Thất bại', variant: 'danger' };
        }
      },
    },
    {
      key: 'orderStatus',
      label: 'TRẠNG THÁI ĐƠN',
      minWidth: '150px',
      type: 'badge',
      badgeResolver: (val: OrderStatus): BadgeInfo => {
        switch (val) {
          case 'pending':
            return { label: 'Chờ xác nhận', variant: 'pending' };
          case 'confirmed':
            return { label: 'Đã xác nhận', variant: 'info' };
          case 'processing':
            return { label: 'Đang xử lý', variant: 'default' };
          case 'shipping':
            return { label: 'Đang giao', variant: 'warning' };
          case 'delivered':
            return { label: 'Đã giao', variant: 'completed' };
          case 'cancelled':
            return { label: 'Đã hủy', variant: 'danger' };
          default:
            return { label: val, variant: 'default' };
        }
      },
    },
    {
      key: 'createdAt',
      label: 'NGÀY TẠO',
      minWidth: '120px',
      formatter: (val: string) => {
        if (!val) return '';
        const d = new Date(val);
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      },
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      type: 'actions',
      minWidth: '130px',
      actions: [
        {
          id: 'view',
          label: 'Chi tiết',
          variant: 'view',
        },
        {
          id: 'advance',
          label: 'Duyệt',
          variant: 'edit',
          show: (row: Order) => row.orderStatus !== 'delivered' && row.orderStatus !== 'cancelled',
        },
        {
          id: 'cancel',
          label: 'Hủy đơn',
          variant: 'hide',
          danger: true,
          show: (row: Order) => row.orderStatus !== 'delivered' && row.orderStatus !== 'cancelled',
        },
      ],
    },
  ];

  // Feedback notifications
  notice: { message: string; type: 'success' | 'error' } | null = null;

  // Detail Modal
  isDetailOpen: boolean = false;
  selectedOrder: Order | null = null;

  // Advance Status Modal
  isAdvanceConfirmOpen: boolean = false;
  advanceTargetOrder: Order | null = null;
  advanceTargetStatus: OrderStatus | null = null;

  // Cancel Modal
  isCancelOpen: boolean = false;
  cancelTargetOrder: Order | null = null;
  cancelReason: string = '';

  // Create Order Modal
  isCreateOpen: boolean = false;
  availableProducts: CatalogProductOption[] = [];
  customerName: string = '';
  customerPhone: string = '';
  customerEmail: string = '';
  customerAddress: string = '';
  selectedProductId: string = '';
  selectedQuantity: number = 1;
  selectedColor: string = '';
  orderItemsToCreate: {
    productId: string;
    productName: string;
    sku: string;
    price: number;
    quantity: number;
    color: string;
    thumbnail: string;
  }[] = [];
  voucherCodeInput: string = '';
  paymentMethodInput: PaymentMethod = 'COD';
  orderNotesInput: string = '';
  phoneLookupFound: boolean = false;
  createFormError: string = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadProducts();
  }

  loadOrders(): void {
    this.loading = true;
    const res = this.orderService.listOrders({
      keyword: this.keyword,
      orderStatus: this.orderStatusFilter,
      paymentStatus: this.paymentStatusFilter,
      page: this.currentPage,
      pageSize: this.pageSize,
    });
    this.orders = res.orders;
    this.totalItems = res.total;
    this.stats = this.orderService.getOrderStats();
    this.loading = false;
  }

  loadProducts(): void {
    this.availableProducts = this.orderService.getCatalogProducts();
  }

  onFilter(event: { search: string; status: string }): void {
    this.keyword = event.search;
    this.orderStatusFilter = event.status;
    this.currentPage = 1;
    this.loadOrders();
  }

  onPaymentStatusChange(status: string): void {
    this.paymentStatusFilter = status;
    this.currentPage = 1;
    this.loadOrders();
  }

  onResetFilter(): void {
    this.keyword = '';
    this.orderStatusFilter = 'all';
    this.paymentStatusFilter = 'all';
    this.currentPage = 1;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  onRowClick(event: { row: Order; index: number }): void {
    if (event?.row) {
      this.openDetail(event.row);
    }
  }

  onTableAction(event: TableActionEvent<Order>): void {
    const order = event.row;
    if (event.action === 'view') {
      this.openDetail(order);
    } else if (event.action === 'advance') {
      this.promptAdvanceStatus(order);
    } else if (event.action === 'cancel') {
      this.promptCancelOrder(order);
    }
  }

  openDetail(order: Order): void {
    this.selectedOrder = this.orderService.getOrderById(order._id) || order;
    this.isDetailOpen = true;
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedOrder = null;
  }

  promptAdvanceStatus(order: Order): void {
    const next = this.orderService.getNextStatus(order.orderStatus);
    if (!next) {
      this.showNotice('Đơn hàng đã ở trạng thái cuối cùng, không thể chuyển tiếp.', 'error');
      return;
    }
    this.advanceTargetOrder = order;
    this.advanceTargetStatus = next;
    this.isAdvanceConfirmOpen = true;
  }

  get advanceConfirmMessage(): string {
    if (!this.advanceTargetOrder || !this.advanceTargetStatus) return '';
    return `Bạn có chắc chắn muốn chuyển đơn hàng ${this.advanceTargetOrder.orderCode} từ "${this.getStatusLabel(this.advanceTargetOrder.orderStatus)}" sang "${this.getStatusLabel(this.advanceTargetStatus)}"?`;
  }

  confirmAdvanceStatus(): void {
    if (!this.advanceTargetOrder || !this.advanceTargetStatus) return;
    const res = this.orderService.updateOrderStatus(
      this.advanceTargetOrder._id,
      this.advanceTargetStatus,
      `Nhân viên cập nhật trạng thái lên ${ORDER_STATUS_LABELS[this.advanceTargetStatus]}`
    );

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.loadOrders();
      if (this.selectedOrder && this.selectedOrder._id === this.advanceTargetOrder._id) {
        this.selectedOrder = res.order || null;
      }
    } else {
      this.showNotice(res.message, 'error');
    }

    this.isAdvanceConfirmOpen = false;
    this.advanceTargetOrder = null;
    this.advanceTargetStatus = null;
  }

  cancelAdvanceStatus(): void {
    this.isAdvanceConfirmOpen = false;
    this.advanceTargetOrder = null;
    this.advanceTargetStatus = null;
  }

  promptCancelOrder(order: Order): void {
    this.cancelTargetOrder = order;
    this.cancelReason = '';
    this.isCancelOpen = true;
  }

  confirmCancelOrder(): void {
    if (!this.cancelTargetOrder) return;
    if (!this.cancelReason.trim()) {
      this.showNotice('Vui lòng nhập lý do hủy đơn hàng.', 'error');
      return;
    }

    const res = this.orderService.cancelOrder(this.cancelTargetOrder._id, this.cancelReason);
    if (res.success) {
      this.showNotice(res.message, 'success');
      this.loadOrders();
      if (this.selectedOrder && this.selectedOrder._id === this.cancelTargetOrder._id) {
        this.selectedOrder = res.order || null;
      }
    } else {
      this.showNotice(res.message, 'error');
    }

    this.isCancelOpen = false;
    this.cancelTargetOrder = null;
    this.cancelReason = '';
  }

  cancelCancelDialog(): void {
    this.isCancelOpen = false;
    this.cancelTargetOrder = null;
    this.cancelReason = '';
  }

  // Create Order Methods
  openCreateOrderModal(): void {
    this.customerName = '';
    this.customerPhone = '';
    this.customerEmail = '';
    this.customerAddress = '';
    this.orderItemsToCreate = [];
    this.voucherCodeInput = '';
    this.paymentMethodInput = 'COD';
    this.orderNotesInput = '';
    this.phoneLookupFound = false;
    this.createFormError = '';
    this.loadProducts();

    if (this.availableProducts.length > 0) {
      this.selectedProductId = this.availableProducts[0].productId;
      this.selectedColor = this.availableProducts[0].availableColors?.[0] || 'Tiêu chuẩn';
    }

    this.isCreateOpen = true;
  }

  closeCreateOrderModal(): void {
    this.isCreateOpen = false;
  }

  onPhoneBlur(): void {
    if (!this.customerPhone.trim()) return;
    const existing = this.orderService.findCustomerByPhone(this.customerPhone.trim());
    if (existing) {
      this.customerName = existing.name;
      this.customerEmail = existing.email || '';
      this.customerAddress = existing.address;
      this.phoneLookupFound = true;
    } else {
      this.phoneLookupFound = false;
    }
  }

  onProductSelectChange(): void {
    const prod = this.availableProducts.find(p => p.productId === this.selectedProductId);
    if (prod && prod.availableColors && prod.availableColors.length > 0) {
      this.selectedColor = prod.availableColors[0];
    } else {
      this.selectedColor = 'Tiêu chuẩn';
    }
  }

  addProductToOrder(): void {
    this.createFormError = '';
    if (!this.selectedProductId) {
      this.createFormError = 'Vui lòng chọn sản phẩm.';
      return;
    }

    const prod = this.availableProducts.find(p => p.productId === this.selectedProductId);
    if (!prod) return;

    if (this.selectedQuantity <= 0) {
      this.createFormError = 'Số lượng sản phẩm phải lớn hơn 0.';
      return;
    }

    if (prod.stockQuantity < this.selectedQuantity) {
      this.createFormError = `Sản phẩm chỉ còn ${prod.stockQuantity} món trong kho.`;
      return;
    }

    const existingIdx = this.orderItemsToCreate.findIndex(
      i => i.productId === prod.productId && i.color === this.selectedColor
    );

    if (existingIdx >= 0) {
      const newQty = this.orderItemsToCreate[existingIdx].quantity + this.selectedQuantity;
      if (prod.stockQuantity < newQty) {
        this.createFormError = `Tổng số lượng vượt quá tồn kho khả dụng (${prod.stockQuantity}).`;
        return;
      }
      this.orderItemsToCreate[existingIdx].quantity = newQty;
    } else {
      this.orderItemsToCreate.push({
        productId: prod.productId,
        productName: prod.name,
        sku: prod.sku,
        price: prod.price,
        quantity: this.selectedQuantity,
        color: this.selectedColor,
        thumbnail: prod.thumbnail,
      });
    }

    this.selectedQuantity = 1;
  }

  removeProductFromOrder(index: number): void {
    this.orderItemsToCreate.splice(index, 1);
  }

  get createSubtotal(): number {
    return this.orderItemsToCreate.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get createDiscount(): number {
    if (this.voucherCodeInput.trim().toUpperCase() === 'LIVORA10') {
      return Math.min(200000, this.createSubtotal * 0.1);
    }
    return 0;
  }

  get createShipping(): number {
    return this.createSubtotal >= 5000000 || this.orderItemsToCreate.length === 0 ? 0 : 40000;
  }

  get createTotal(): number {
    return Math.max(0, this.createSubtotal - this.createDiscount + this.createShipping);
  }

  submitCreateOrder(): void {
    this.createFormError = '';
    if (this.orderItemsToCreate.length === 0) {
      this.createFormError = 'Đơn hàng phải có ít nhất một sản phẩm.';
      return;
    }

    const res = this.orderService.createOrder({
      customerInfo: {
        name: this.customerName,
        phone: this.customerPhone,
        email: this.customerEmail,
        address: this.customerAddress,
      },
      items: this.orderItemsToCreate.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        color: i.color,
      })),
      voucherCode: this.voucherCodeInput,
      paymentMethod: this.paymentMethodInput,
      notes: this.orderNotesInput,
    });

    if (res.success) {
      this.showNotice(res.message, 'success');
      this.closeCreateOrderModal();
      this.loadOrders();
    } else {
      this.createFormError = res.message;
    }
  }

  showNotice(message: string, type: 'success' | 'error'): void {
    this.notice = { message, type };
    setTimeout(() => {
      if (this.notice && this.notice.message === message) {
        this.notice = null;
      }
    }, 4500);
  }

  dismissNotice(): void {
    this.notice = null;
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getPaymentLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status] || status;
  }

  getNextStatusLabel(status: OrderStatus): string {
    const next = this.orderService.getNextStatus(status);
    return next ? ORDER_STATUS_LABELS[next] : '';
  }
}

export { OrderComponent as Order };
