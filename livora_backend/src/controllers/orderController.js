const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Customer = require('../models/Customer');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * Helper to map an Order document to frontend-friendly structure
 */
const formatOrderForResponse = (o) => ({
  id: o._id.toString(),
  _id: o._id.toString(),
  orderCode: o.orderCode,
  userId: o.customerId ? o.customerId.toString() : null,
  customerId: o.customerId ? o.customerId.toString() : null,
  customerInfo: {
    name: o.customerInfo?.fullName || '',
    fullName: o.customerInfo?.fullName || '',
    phone: o.customerInfo?.phone || '',
    email: o.customerInfo?.email || '',
    address: o.customerInfo?.address || '',
    province: o.customerInfo?.province || '',
    district: o.customerInfo?.district || '',
    ward: o.customerInfo?.ward || '',
  },
  items: (o.items || []).map((it) => ({
    productId: it.productId ? it.productId.toString() : null,
    sku: it.sku || '',
    productName: it.productName,
    name: it.productName,
    color: it.selectedColor || '',
    selectedColor: it.selectedColor || '',
    thumbnail: it.thumbnail || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
    price: it.unitPrice || 0,
    unitPrice: it.unitPrice || 0,
    quantity: it.quantity || 1,
    subtotal: it.subtotal || 0,
  })),
  subtotalAmount: o.subtotalAmount || 0,
  discountAmount: o.discountAmount || 0,
  voucherCode: o.voucherCode || '',
  shippingMethod: o.shippingMethod || '',
  shippingProvince: o.shippingProvince || '',
  shippingFee: o.shippingFee || 0,
  finalAmount: o.totalAmount || 0,
  totalAmount: o.totalAmount || 0,
  paymentMethod: o.paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : (o.paymentMethod === 'online' ? 'VNPAY' : 'COD'),
  paymentStatus: o.paymentStatus === 'pending' ? 'unpaid' : o.paymentStatus,
  orderStatus: o.orderStatus,
  shippingAddress: o.customerInfo?.address || '',
  note: o.notes || '',
  notes: o.notes || '',
  cancelReason: o.cancelReason || '',
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

/**
 * @desc    Get orders list with filter, search, summary & pagination
 * @route   GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const {
      search = '',
      orderStatus = 'all',
      paymentStatus = 'all',
      userId = '',
      page = 1,
      pageSize = 10,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { orderCode: { $regex: term, $options: 'i' } },
        { 'customerInfo.fullName': { $regex: term, $options: 'i' } },
        { 'customerInfo.phone': { $regex: term, $options: 'i' } },
      ];
    }

    if (orderStatus !== 'all') {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus !== 'all') {
      const pStatus = paymentStatus === 'unpaid' ? 'pending' : paymentStatus;
      filter.paymentStatus = pStatus;
    }

    if (userId) {
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.customerId = new mongoose.Types.ObjectId(userId);
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize) || 10));

    const [
      totalOrders,
      pendingOrders,
      shippingOrders,
      deliveredOrders,
      deliveredRevenue,
      totalItems,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ orderStatus: 'shipping' }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(filter),
    ]);

    const totalRevenue = deliveredRevenue.length > 0 ? deliveredRevenue[0].total : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = orders.map(formatOrderForResponse);

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      summary: {
        totalOrders,
        pendingOrders,
        shippingOrders,
        deliveredOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('getOrders error:', error);
    return sendError(res, 'Không thể tải danh sách đơn hàng.', 500);
  }
};

/**
 * @desc    Get order by ID or orderCode
 * @route   GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id).lean();
    }
    if (!order) {
      order = await Order.findOne({ orderCode: id.toUpperCase() }).lean();
    }

    if (!order) {
      return sendError(res, 'Không tìm thấy đơn hàng.', 404);
    }

    return sendSuccess(res, formatOrderForResponse(order));
  } catch (error) {
    console.error('getOrderById error:', error);
    return sendError(res, 'Không thể tải thông tin đơn hàng.', 500);
  }
};

/**
 * @desc    Create new order (from User Checkout or Admin POS)
 * @route   POST /api/orders
 */
const createOrder = async (req, res) => {
  try {
    const {
      customerInfo,
      items,
      voucherCode,
      paymentMethod = 'COD',
      note = '',
      notes = '',
      shippingAddress,
      shippingFee = 0,
      userId,
      customerId,
    } = req.body;

    const cName = customerInfo?.fullName || customerInfo?.name;
    const cPhone = customerInfo?.phone;
    if (!customerInfo || !cName || !cPhone) {
      return sendError(res, 'Thông tin người nhận (Họ tên, SĐT) là bắt buộc.', 400);
    }

    if (!items || !items.length) {
      return sendError(res, 'Giỏ hàng không có sản phẩm nào.', 400);
    }

    const orderAddress = (shippingAddress || customerInfo.address || '').trim();
    if (!orderAddress) {
      return sendError(res, 'Địa chỉ giao hàng là bắt buộc.', 400);
    }

    // Lấy một sản phẩm mẫu từ CSDL nếu cần fallback ObjectId
    const fallbackProduct = await Product.findOne();

    // Xác thực sản phẩm, tính toán giá tiền & tồn kho
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      let product = null;
      const pid = item.productId || item.id;
      if (pid && typeof pid === 'string' && pid.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(pid);
      } else if (item.sku) {
        product = await Product.findOne({ sku: item.sku });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = product ? (product.salePrice || product.price) : (Number(item.price || item.unitPrice) || 1000000);
      const lineSubtotal = unitPrice * qty;

      calculatedSubtotal += lineSubtotal;

      const validBsonProductId = product ? product._id : (fallbackProduct ? fallbackProduct._id : new mongoose.Types.ObjectId());

      verifiedItems.push({
        productId: validBsonProductId,
        sku: product ? product.sku : (item.sku || 'SKU-FURNITURE'),
        productName: product ? product.name : (item.name || item.productName || 'Sản phẩm nội thất LIVORA'),
        selectedColor: item.color || item.selectedColor || 'Tiêu chuẩn',
        quantity: qty,
        unitPrice,
        subtotal: lineSubtotal,
      });

      // Trừ tồn kho nếu tìm thấy product thật trong CSDL
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - qty);
        product.stockStatus = product.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
        await product.save();
      }
    }

    // Tính giảm giá voucher
    let calculatedDiscount = 0;
    let validVoucherCode = null;

    if (voucherCode && voucherCode.trim()) {
      const vCode = voucherCode.trim().toUpperCase();
      const voucher = await Voucher.findOne({ code: vCode, isActive: true });
      if (voucher) {
        if (voucher.discountType === 'percentage') {
          calculatedDiscount = Math.round((calculatedSubtotal * voucher.discountValue) / 100);
          if (voucher.maxDiscountAmount > 0 && calculatedDiscount > voucher.maxDiscountAmount) {
            calculatedDiscount = voucher.maxDiscountAmount;
          }
        } else {
          calculatedDiscount = voucher.discountValue;
        }
        voucher.usedCount = (voucher.usedCount || 0) + 1;
        await voucher.save();
        validVoucherCode = voucher.code;
      }
    }

    const shipFee = Math.max(0, Number(shippingFee) || 0);
    const totalAmount = Math.max(0, calculatedSubtotal - calculatedDiscount + shipFee);

    // Tạo mã đơn hàng duy nhất e.g. ORD-2610-001
    const count = await Order.countDocuments();
    const today = new Date();
    const dateStr = `${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}`;
    let orderCode = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
    const existingOrder = await Order.findOne({ orderCode });
    if (existingOrder) {
      orderCode = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Liên kết với Customer
    let linkedCustomer = null;
    const targetUserId = userId || customerId;
    if (targetUserId && typeof targetUserId === 'string' && targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
      linkedCustomer = await Customer.findById(targetUserId);
    }
    if (!linkedCustomer && cPhone) {
      linkedCustomer = await Customer.findOne({ phone: cPhone.trim() });
    }

    // Map payment method
    let mappedPaymentMethod = 'cod';
    const pmUpper = (paymentMethod || '').toUpperCase();
    if (pmUpper.includes('BANK') || pmUpper.includes('MOMO')) {
      mappedPaymentMethod = 'bank_transfer';
    } else if (pmUpper.includes('VNPAY') || pmUpper.includes('ONLINE')) {
      mappedPaymentMethod = 'online';
    }

    const mappedPaymentStatus = mappedPaymentMethod === 'cod' ? 'pending' : 'paid';

    const newOrder = new Order({
      orderCode,
      customerId: linkedCustomer ? linkedCustomer._id : null,
      customerInfo: {
        fullName: cName.trim(),
        phone: cPhone.trim(),
        email: customerInfo.email ? customerInfo.email.trim() : null,
        address: orderAddress.trim(),
        province: customerInfo.province || null,
        district: customerInfo.district || null,
        ward: customerInfo.ward || null,
      },
      items: verifiedItems,
      voucherCode: validVoucherCode,
      subtotalAmount: calculatedSubtotal,
      discountAmount: calculatedDiscount,
      shippingFee: shipFee,
      totalAmount,
      paymentMethod: mappedPaymentMethod,
      paymentStatus: mappedPaymentStatus,
      orderStatus: 'pending',
      notes: (notes || note || '').trim() || null,
      cancelReason: null,
    });

    await newOrder.save();

    // Cập nhật thống kê khách hàng
    if (linkedCustomer) {
      await Customer.findByIdAndUpdate(linkedCustomer._id, {
        $inc: { totalOrders: 1, accumulatedSpent: totalAmount },
        $set: { lastActiveAt: new Date() },
      });
    }

    return sendSuccess(
      res,
      {
        id: newOrder._id.toString(),
        orderCode: newOrder.orderCode,
        finalAmount: newOrder.totalAmount,
        totalAmount: newOrder.totalAmount,
        orderStatus: newOrder.orderStatus,
        paymentStatus: newOrder.paymentStatus,
      },
      'Đặt hàng thành công.',
      201
    );
  } catch (error) {
    console.error('createOrder error:', error);
    return sendError(res, error.message || 'Không thể tạo đơn hàng.', 500);
  }
};

/**
 * @desc    Update order stage status (pending -> confirmed -> processing -> shipping -> delivered)
 * @route   PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
    if (!allowed.includes(status)) {
      return sendError(res, 'Trạng thái chuyển đổi không hợp lệ.', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

    if (order.orderStatus === 'cancelled') {
      return sendError(res, 'Đơn hàng đã bị hủy, không thể thay đổi trạng thái.', 400);
    }

    order.orderStatus = status;
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }

    await order.save();
    return sendSuccess(res, formatOrderForResponse(order), 'Cập nhật trạng thái thành công.');
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return sendError(res, 'Không thể cập nhật trạng thái đơn hàng.', 500);
  }
};

/**
 * @desc    Cancel order
 * @route   PATCH /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  let session;
  try {
    const { reason = '' } = req.body;
    if (!reason || !reason.trim()) {
      return sendError(res, 'Vui lòng cung cấp lý do hủy đơn hàng.', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

    if (order.orderStatus === 'delivered') {
      return sendError(res, 'Đơn hàng đã giao thành công, không thể hủy.', 400);
    }
    if (order.orderStatus === 'cancelled') {
      return sendError(res, 'Đơn hàng đã được hủy trước đó.', 409);
    }

    if (order.checkoutRequestHash) {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const current = await Order.findOneAndUpdate(
          { _id: order._id, orderStatus: { $nin: ['cancelled', 'delivered'] } },
          { $set: { orderStatus: 'cancelled', cancelReason: reason.trim() } },
          { new: true, session }
        );
        if (!current) throw new Error('Order changed while cancelling.');
        for (const item of current.items) {
          const restored = await Product.updateOne({ _id: item.productId },
            { $inc: { stockQuantity: item.quantity }, $set: { stockStatus: 'in_stock' } }, { session });
          if (restored.matchedCount !== 1) throw new Error('Checkout product is missing; cancellation requires reconciliation.');
        }
        if (current.voucherId) {
          const restored = await Voucher.updateOne({ _id: current.voucherId, usedCount: { $gt: 0 } },
            { $inc: { usedCount: -1 } }, { session });
          if (restored.matchedCount !== 1) throw new Error('Checkout voucher cannot be restored; cancellation requires reconciliation.');
        }
        if (current.customerId) {
          const restored = await Customer.updateOne({ _id: current.customerId },
            { $inc: { totalOrders: -1, accumulatedSpent: -current.totalAmount } }, { session });
          if (restored.matchedCount !== 1) throw new Error('Checkout customer is missing; cancellation requires reconciliation.');
        }
      });
      order.orderStatus = 'cancelled';
      order.cancelReason = reason.trim();
    } else {
      order.orderStatus = 'cancelled';
      order.cancelReason = reason.trim();
      await order.save();
    }

    return sendSuccess(res, formatOrderForResponse(order), 'Hủy đơn hàng thành công.');
  } catch (error) {
    console.error('cancelOrder error:', error);
    return sendError(res, 'Không thể hủy đơn hàng.', 500);
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
};
