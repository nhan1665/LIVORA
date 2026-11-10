const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Order = require('../models/Order');
const Shipping = require('../models/Shipping');
const { createNotification } = require('./notificationController');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { calculateQuote, loadItems, loadShippingOptions, CheckoutError, requireVnd } = require('../services/checkoutPricing');

async function customerIdFromRequest(req) {
  const bearer = req.get('authorization') || '';
  if (!bearer) return null;
  const token = /^Bearer\s+(.+)$/i.exec(bearer)?.[1];
  if (!token) throw new CheckoutError('Phiên đăng nhập không hợp lệ.', 401);
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.role !== 'customer' || !mongoose.isValidObjectId(claims.id)) throw new Error('Invalid identity');
    const customer = await Customer.findById(claims.id);
    if (!customer || customer.status !== 'active' || !customer.isActive) throw new Error('Inactive customer');
    return customer._id;
  } catch (_) {
    throw new CheckoutError('Phiên đăng nhập không hợp lệ.', 401);
  }
}

function handleCheckoutError(res, error) {
  if (error instanceof CheckoutError) return sendError(res, error.message, error.status);
  console.error('Checkout error:', error);
  return sendError(res, 'Không thể tính giá đơn hàng.', 500);
}

async function getShippingOptions(req, res) {
  try {
    const items = await loadItems(req.body.items);
    const subtotal = requireVnd(items.reduce((sum, item) => sum + item.subtotal, 0), 'Tạm tính');
    const options = await loadShippingOptions(req.body.province, subtotal);
    return sendSuccess(res, { subtotal, options });
  } catch (error) {
    return handleCheckoutError(res, error);
  }
}

async function getShippingRegions(req, res) {
  try {
    const regions = await Shipping.distinct('province', { isActive: true });
    return sendSuccess(res, regions.filter((region) => region && region !== 'Toàn quốc').sort());
  } catch (error) {
    return handleCheckoutError(res, error);
  }
}

async function getQuote(req, res) {
  try {
    const customerId = await customerIdFromRequest(req);
    const quote = await calculateQuote(req.body, customerId);
    return sendSuccess(res, {
      items: quote.items,
      subtotal: quote.subtotal,
      voucherCode: quote.voucherCode,
      discount: quote.discount,
      shipping: quote.shipping,
      shippingFee: quote.shippingFee,
      total: quote.total,
    });
  } catch (error) {
    return handleCheckoutError(res, error);
  }
}

const orderResponse = (order) => ({
  id: order._id.toString(),
  orderCode: order.orderCode,
  subtotalAmount: order.subtotalAmount,
  discountAmount: order.discountAmount,
  voucherCode: order.voucherCode,
  shippingMethod: order.shippingMethod,
  shippingFee: order.shippingFee,
  finalAmount: order.totalAmount,
  orderStatus: order.orderStatus,
  paymentStatus: order.paymentStatus,
});

async function createCheckoutOrder(req, res) {
  let session;
  try {
    const body = req.body || {};
    const { items, customerInfo, province, shippingId, voucherCode, paymentMethod, requestKey, note = '' } = body;
    const forbidden = ['shippingFee', 'subtotal', 'total', 'discount', 'userId', 'customerId'];
    if (forbidden.some((key) => key in body) || !Array.isArray(items) ||
      items.some((item) => !item || typeof item !== 'object' || Object.keys(item).some((key) => !['productId', 'quantity'].includes(key)))) {
      throw new CheckoutError('Giá và tài khoản phải được xác định bởi máy chủ.');
    }
    if (typeof requestKey !== 'string' || !/^[a-zA-Z0-9-]{32,80}$/.test(requestKey)) {
      throw new CheckoutError('Mã yêu cầu đặt hàng không hợp lệ.');
    }
    if (!customerInfo || typeof customerInfo.fullName !== 'string' || !customerInfo.fullName.trim() ||
      typeof customerInfo.phone !== 'string' || !/^0\d{9,10}$/.test(customerInfo.phone.trim()) ||
      typeof customerInfo.address !== 'string' || !customerInfo.address.trim() ||
      typeof province !== 'string' || !province.trim()) {
      throw new CheckoutError('Thông tin nhận hàng không hợp lệ.');
    }
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      throw new CheckoutError('Email không hợp lệ.');
    }
    if (!['cod', 'bank_transfer'].includes(paymentMethod)) {
      throw new CheckoutError('Phương thức thanh toán không hợp lệ.');
    }
    const customerId = await customerIdFromRequest(req);
    const normalized = {
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      customerInfo: {
        fullName: customerInfo.fullName.trim(), phone: customerInfo.phone.trim(),
        email: customerInfo.email?.trim() || '', address: customerInfo.address.trim(),
        district: customerInfo.district || '', ward: customerInfo.ward || '',
      },
      province: province.trim(), shippingId, voucherCode: voucherCode?.trim().toUpperCase() || '', paymentMethod,
      note: typeof note === 'string' ? note.trim() : '', customerId: customerId?.toString() || null,
    };
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    const orderCode = `ORD-C-${crypto.createHash('sha256').update(requestKey).digest('hex').slice(0, 24).toUpperCase()}`;
    const existing = await Order.findOne({ orderCode });
    if (existing) {
      if (existing.checkoutRequestHash !== requestHash) throw new CheckoutError('Mã yêu cầu đã được sử dụng.', 409);
      return sendSuccess(res, orderResponse(existing), 'Đơn hàng đã được ghi nhận.');
    }

    session = await mongoose.startSession();
    let created;
    let outOfStockItems = [];
    await session.withTransaction(async () => {
      const quote = await calculateQuote({ items, province, shippingId, voucherCode }, customerId, session);
      outOfStockItems = [];

      for (const item of quote.items) {
        const currentProd = await Product.findById(item.productId).session(session);
        if (currentProd) {
          const avail = Number(currentProd.stockQuantity) || 0;
          if (avail < item.quantity || avail <= 0) {
            outOfStockItems.push({
              name: item.productName,
              sku: item.sku,
              requested: item.quantity,
              available: Math.max(0, avail),
            });
            await Product.updateOne(
              { _id: item.productId },
              { $set: { stockQuantity: 0, stockStatus: 'out_of_stock' }, $inc: { soldQuantity: item.quantity } },
              { session }
            );
          } else {
            const newStock = avail - item.quantity;
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: { stockQuantity: -item.quantity, soldQuantity: item.quantity },
                $set: { stockStatus: newStock === 0 ? 'out_of_stock' : 'in_stock' },
              },
              { session }
            );
          }
        }
      }

      if (quote.voucher) {
        const reserved = await Voucher.findOneAndUpdate(
          { _id: quote.voucher._id, isActive: true, usedCount: { $lt: quote.voucher.quantity } },
          { $inc: { usedCount: 1 } },
          { session, new: true }
        );
        if (!reserved) throw new CheckoutError('Voucher vừa hết lượt sử dụng.', 409);
      }

      const hasOutOfStock = outOfStockItems.length > 0;
      // Nếu có sản phẩm hết hàng: pending (đợi Vận hành tăng tồn hoặc hủy).
      // Nếu đủ hàng: TỰ ĐỘNG XÁC NHẬN (confirmed) như Shopee/Lazada!
      const initialOrderStatus = hasOutOfStock ? 'pending' : 'confirmed';

      let finalNote = normalized.note;
      if (hasOutOfStock) {
        const warningTag = `[CẢNH BÁO: ĐƠN CHỨA SP HẾT HÀNG (TỒN KHO = 0): ${outOfStockItems.map(o => o.name).join(', ')} - CẦN VẬN HÀNH XỬ LÝ: 1. TĂNG TỒN HOẶC 2. HỦY ĐƠN]`;
        finalNote = finalNote ? `${finalNote} | ${warningTag}` : warningTag;
      }

      const [order] = await Order.create([{
        orderCode,
        checkoutRequestHash: requestHash,
        customerId,
        customerInfo: { ...normalized.customerInfo, province: normalized.province },
        items: quote.items,
        voucherId: quote.voucher?._id || null,
        voucherCode: quote.voucherCode,
        subtotalAmount: quote.subtotal,
        discountAmount: quote.discount,
        shippingConfigId: mongoose.isValidObjectId(shippingId) ? shippingId : null,
        shippingMethod: quote.shipping.shippingMethod,
        shippingProvince: quote.shipping.province,
        shippingFee: quote.shippingFee,
        totalAmount: quote.total,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: initialOrderStatus,
        notes: finalNote,
      }], { session });

      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalOrders: 1, accumulatedSpent: quote.total },
          $set: { lastActiveAt: new Date() },
        }, { session });
      }
      created = order;
    });

    if (created) {
      if (outOfStockItems.length > 0) {
        createNotification({
          title: `⚠️ Cảnh báo tồn kho: Đơn hàng mới #${created.orderCode} có SP hết hàng!`,
          message: `Đơn hàng #${created.orderCode} (${Number(created.totalAmount || 0).toLocaleString('vi-VN')} đ) chứa sản phẩm [${outOfStockItems.map(o => o.name).join(', ')}] đang hết hàng (tồn = 0). Cần NV Vận hành xử lý: 1. Tăng tồn kho (nhập hàng) hoặc 2. Hủy đơn.`,
          type: 'order',
          targetRoles: ['NV_VAN_HANH', 'SUPER_ADMIN'],
          link: '/orders/list',
          entityId: created._id,
          entityCode: created.orderCode,
        }).catch(() => {});
      } else {
        createNotification({
          title: `Đơn hàng mới #${created.orderCode} (Tự động xác nhận)`,
          message: `Khách hàng ${created.customerInfo?.fullName || 'Khách hàng'} vừa đặt đơn #${created.orderCode} (${Number(created.totalAmount || 0).toLocaleString('vi-VN')} đ). Hệ thống đã tự động xác nhận đơn hàng thành công.`,
          type: 'order',
          targetRoles: ['NV_VAN_HANH', 'SUPER_ADMIN'],
          link: '/orders/list',
          entityId: created._id,
          entityCode: created.orderCode,
        }).catch(() => {});
      }
    }

    return sendSuccess(res, orderResponse(created), 'Đặt hàng thành công.', 201);
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'Đơn hàng đã được ghi nhận. Vui lòng làm mới lịch sử đơn.', 409);
    return handleCheckoutError(res, error);
  } finally {
    if (session) await session.endSession();
  }
}

module.exports = { getShippingRegions, getShippingOptions, getQuote, createCheckoutOrder, customerIdFromRequest, handleCheckoutError };
