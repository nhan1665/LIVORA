const Order = require('../models/Order');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Customer = require('../models/Customer');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

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
        { 'customerInfo.name': { $regex: term, $options: 'i' } },
        { 'customerInfo.phone': { $regex: term, $options: 'i' } },
      ];
    }

    if (orderStatus !== 'all') {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    if (userId) {
      filter.userId = userId;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

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
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
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

    const items = orders.map((o) => ({
      id: o._id.toString(),
      orderCode: o.orderCode,
      userId: o.userId ? o.userId.toString() : null,
      customerInfo: o.customerInfo,
      items: o.items,
      subtotalAmount: o.subtotalAmount,
      discountAmount: o.discountAmount,
      voucherCode: o.voucherCode,
      shippingFee: o.shippingFee,
      finalAmount: o.finalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      shippingAddress: o.shippingAddress,
      note: o.note,
      cancelReason: o.cancelReason,
      statusHistory: o.statusHistory,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

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

    return sendSuccess(res, {
      id: order._id.toString(),
      orderCode: order.orderCode,
      userId: order.userId ? order.userId.toString() : null,
      customerInfo: order.customerInfo,
      items: order.items,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      voucherCode: order.voucherCode,
      shippingFee: order.shippingFee,
      finalAmount: order.finalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      shippingAddress: order.shippingAddress,
      note: order.note,
      cancelReason: order.cancelReason,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
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
      shippingAddress,
      shippingFee = 0,
      userId,
    } = req.body;

    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return sendError(res, 'Thông tin người nhận (Họ tên, SĐT) là bắt buộc.', 400);
    }

    if (!items || !items.length) {
      return sendError(res, 'Giỏ hàng không có sản phẩm nào.', 400);
    }

    const orderAddress = shippingAddress || customerInfo.address;
    if (!orderAddress) {
      return sendError(res, 'Địa chỉ giao hàng là bắt buộc.', 400);
    }

    // Xác thực sản phẩm, giá và tồn kho
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      let product = null;
      if (item.productId && item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(item.productId);
      } else if (item.id && item.id.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(item.id);
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = product ? (product.salePrice || product.price) : (Number(item.price) || 0);
      const lineSubtotal = unitPrice * qty;

      calculatedSubtotal += lineSubtotal;

      verifiedItems.push({
        productId: product ? product._id : (item.productId || item.id),
        sku: product ? product.sku : (item.sku || 'N/A'),
        productName: product ? product.name : (item.name || item.productName || 'Sản phẩm nội thất'),
        color: item.color || '',
        thumbnail: product ? product.thumbnail : (item.thumbnail || item.image || ''),
        price: unitPrice,
        quantity: qty,
        subtotal: lineSubtotal,
      });

      // Giảm tồn kho sản phẩm nếu có
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - qty);
        product.stockStatus = product.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
        await product.save();
      }
    }

    // Tính giảm giá voucher
    let calculatedDiscount = 0;
    let validVoucherCode = '';

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
    const finalAmount = Math.max(0, calculatedSubtotal - calculatedDiscount + shipFee);

    // Tạo mã đơn hàng duy nhất e.g. ORD-2610-001
    const count = await Order.countDocuments();
    const today = new Date();
    const dateStr = `${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const orderCode = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const newOrder = new Order({
      orderCode,
      userId: userId || null,
      customerInfo: {
        name: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email ? customerInfo.email.trim() : '',
        address: orderAddress.trim(),
      },
      items: verifiedItems,
      subtotalAmount: calculatedSubtotal,
      discountAmount: calculatedDiscount,
      voucherCode: validVoucherCode,
      shippingFee: shipFee,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'unpaid' : 'paid',
      orderStatus: 'pending',
      shippingAddress: orderAddress.trim(),
      note: note || '',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Đơn hàng được khởi tạo thành công.',
          actor: 'Khách hàng',
        },
      ],
    });

    await newOrder.save();

    // Cập nhật thống kê khách hàng nếu có
    if (userId) {
      await Customer.findByIdAndUpdate(userId, {
        $inc: { totalOrders: 1, accumulatedSpent: finalAmount },
        $set: { lastActiveAt: new Date() },
      });
    }

    return sendSuccess(res, {
      id: newOrder._id.toString(),
      orderCode: newOrder.orderCode,
      finalAmount: newOrder.finalAmount,
      orderStatus: newOrder.orderStatus,
      paymentStatus: newOrder.paymentStatus,
    }, 'Đặt hàng thành công.', 201);
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
    const { status, note, actor = 'Quản trị viên' } = req.body;

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

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Chuyển trạng thái sang [${status}].`,
      actor,
    });

    await order.save();

    return sendSuccess(res, {
      id: order._id.toString(),
      orderCode: order.orderCode,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory,
    }, `Đã cập nhật trạng thái đơn hàng sang: ${status}`);
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return sendError(res, 'Không thể cập nhật trạng thái đơn hàng.', 500);
  }
};

/**
 * @desc    Cancel order (Restores product stock)
 * @route   PATCH /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const { reason = 'Khách yêu cầu hủy đơn', actor = 'Quản trị viên' } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

    if (order.orderStatus === 'delivered') {
      return sendError(res, 'Đơn hàng đã giao thành công, không thể hủy.', 400);
    }
    if (order.orderStatus === 'cancelled') {
      return sendError(res, 'Đơn hàng này đã được hủy trước đó.', 400);
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Hủy đơn: ${reason}`,
      actor,
    });

    // Hoàn trả tồn kho cho các sản phẩm trong đơn
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: item.quantity },
          $set: { stockStatus: 'in_stock' },
        });
      }
    }

    await order.save();

    return sendSuccess(res, {
      id: order._id.toString(),
      orderCode: order.orderCode,
      orderStatus: order.orderStatus,
      cancelReason: order.cancelReason,
    }, 'Đã hủy đơn hàng và hoàn trả tồn kho thành công.');
  } catch (error) {
    console.error('cancelOrder error:', error);
    return sendError(res, 'Không thể hủy đơn hàng.', 500);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
};
