const mongoose = require('mongoose');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Shipping = require('../models/Shipping');
const Order = require('../models/Order');

class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const normalizedProvince = (value) => String(value || '').trim().normalize('NFC').toLocaleLowerCase('vi');

function requireVnd(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CheckoutError(`${field} phải là số nguyên VND không âm.`, 409);
  }
  return value;
}

async function loadItems(requestedItems, session) {
  if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > 100) {
    throw new CheckoutError('Giỏ hàng không hợp lệ.');
  }
  const seen = new Set();
  const items = [];
  for (const item of requestedItems) {
    const id = item?.productId;
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 || seen.has(id)) {
      throw new CheckoutError('Sản phẩm hoặc số lượng không hợp lệ.');
    }
    seen.add(id);
    const query = Product.findById(id);
    if (session) query.session(session);
    const product = await query;
    if (!product || !product.isActive || !['active', 'Đang kinh doanh'].includes(product.status) || product.stockQuantity < quantity) {
      throw new CheckoutError('Sản phẩm không còn khả dụng hoặc đã hết hàng.', 409);
    }
    const unitPrice = requireVnd(product.salePrice ?? product.price, 'Giá sản phẩm');
    const lineSubtotal = requireVnd(unitPrice * quantity, 'Thành tiền sản phẩm');
    items.push({
      productId: product._id,
      sku: product.sku,
      productName: product.name,
      quantity,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }
  return items;
}

async function loadShippingOptions(province, subtotal, session) {
  const region = normalizedProvince(province);
  if (!region) return [];
  const query = Shipping.find({ isActive: true });
  if (session) query.session(session);
  const configs = await query;
  return configs.filter((config) => {
    const configured = normalizedProvince(config.province);
    return configured === region || configured === normalizedProvince('Toàn quốc');
  }).map((config) => {
    const fee = requireVnd(config.fee, 'Phí vận chuyển');
    const freeShipThreshold = requireVnd(config.freeShipThreshold ?? 0, 'Ngưỡng miễn phí vận chuyển');
    return {
      id: config._id.toString(),
      shippingMethod: config.shippingMethod,
      province: config.province,
      estimatedDeliveryTime: config.estimatedDeliveryTime,
      fee: config.freeShipEnabled && subtotal >= freeShipThreshold ? 0 : fee,
    };
  });
}

async function loadVoucher(code, subtotal, customerId, session) {
  if (!code?.trim()) return { voucher: null, discount: 0 };
  if (!customerId) throw new CheckoutError('Vui lòng đăng nhập để sử dụng voucher.', 401);
  const query = Voucher.findOne({ code: code.trim().toUpperCase() });
  if (session) query.session(session);
  const voucher = await query;
  const now = new Date();
  if (!voucher || !voucher.isActive || voucher.startDate > now || voucher.endDate < now ||
    voucher.usedCount >= voucher.quantity || subtotal < voucher.minOrderValue) {
    throw new CheckoutError('Voucher không còn hợp lệ cho đơn hàng này.', 409);
  }
  requireVnd(voucher.minOrderValue, 'Giá trị đơn hàng tối thiểu');
  const cap = requireVnd(voucher.maxDiscountAmount ?? 0, 'Mức giảm tối đa');
  if (!['fixed_amount', 'percentage'].includes(voucher.discountType)) {
    throw new CheckoutError('Loại voucher không hợp lệ.', 409);
  }
  if (voucher.discountType === 'fixed_amount') requireVnd(voucher.discountValue, 'Giảm giá cố định');
  if (voucher.discountType === 'percentage' &&
    (!Number.isFinite(voucher.discountValue) || voucher.discountValue <= 0 || voucher.discountValue > 100)) {
    throw new CheckoutError('Tỷ lệ giảm giá không hợp lệ.', 409);
  }
  const countQuery = Order.countDocuments({ customerId, voucherCode: voucher.code, orderStatus: { $ne: 'cancelled' } });
  if (session) countQuery.session(session);
  const usedByCustomer = await countQuery;
  if (usedByCustomer >= voucher.perCustomerLimit) {
    throw new CheckoutError('Bạn đã dùng hết lượt áp dụng voucher này.', 409);
  }
  const raw = voucher.discountType === 'percentage'
    ? Math.round(subtotal * voucher.discountValue / 100)
    : voucher.discountValue;
  const capped = cap > 0 ? Math.min(raw, cap) : raw;
  return { voucher, discount: requireVnd(Math.min(subtotal, capped), 'Giảm giá') };
}

async function calculateQuote(body, customerId = null, session = null) {
  const items = await loadItems(body.items, session);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  requireVnd(subtotal, 'Tạm tính');
  const options = await loadShippingOptions(body.province, subtotal, session);
  const shipping = options.find((option) => option.id === body.shippingId);
  if (!shipping) throw new CheckoutError('Phương thức vận chuyển không khả dụng cho địa chỉ này.', 409);
  const { voucher, discount } = await loadVoucher(body.voucherCode, subtotal, customerId, session);
  return {
    items,
    subtotal,
    voucher,
    voucherCode: voucher?.code || null,
    discount,
    shipping,
    shippingFee: shipping.fee,
    total: requireVnd(Math.max(0, subtotal - discount) + shipping.fee, 'Tổng thanh toán'),
  };
}

module.exports = { CheckoutError, calculateQuote, loadItems, loadShippingOptions, loadVoucher, requireVnd };
