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

function stripVietnamese(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/^(thanh pho|tinh|tp\.|tp)\s+/i, '')
    .replace(/[\s\-\.]+/g, ' ')
    .trim();
}

function isProvinceMatch(configured, requested) {
  const k1 = stripVietnamese(configured);
  const k2 = stripVietnamese(requested);
  if (!k1 || !k2) return false;
  if (k1 === k2) return true;
  if ((k1 === 'hcm' || k1 === 'tp hcm') && (k2.includes('ho chi minh') || k2 === 'hcm')) return true;
  if ((k2 === 'hcm' || k2 === 'tp hcm') && (k1.includes('ho chi minh') || k1 === 'hcm')) return true;
  return k1.includes(k2) || k2.includes(k1);
}

const normalizedProvince = (value) => stripVietnamese(value);

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
    const rawId = item?.productId || item?.id;
    const id = String(rawId || '');
    const quantity = Number(item?.quantity);
    if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 || seen.has(id)) {
      throw new CheckoutError('Sản phẩm hoặc số lượng không hợp lệ.');
    }
    seen.add(id);

    let product = null;
    if (mongoose.isValidObjectId(id)) {
      const query = Product.findById(id);
      if (session) query.session(session);
      product = await query;
    }

    if (product && (!product.isActive || !['active', 'Đang kinh doanh'].includes(product.status))) {
      throw new CheckoutError('Sản phẩm đã tạm ngừng kinh doanh.', 409);
    }

    const currentStock = product ? (Number(product.stockQuantity) || 0) : 10;
    const isOutOfStock = currentStock <= 0 || currentStock < quantity;

    const fallbackPrice = Math.max(0, Math.round(Number(item?.price || item?.unitPrice) || 500000));
    const unitPrice = product ? requireVnd(product.salePrice ?? product.price, 'Giá sản phẩm') : requireVnd(fallbackPrice, 'Giá sản phẩm');
    const lineSubtotal = requireVnd(unitPrice * quantity, 'Thành tiền sản phẩm');
    items.push({
      productId: product ? product._id : (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId()),
      sku: product ? product.sku : (item.sku || ('SKU-' + id)),
      productName: product ? product.name : (item.productName || item.name || 'Sản phẩm nội thất LIVORA'),
      quantity,
      unitPrice,
      subtotal: lineSubtotal,
      isOutOfStock,
      availableStock: currentStock,
    });
  }
  return items;
}

async function loadShippingOptions(province, subtotal, session) {
  const query = Shipping.find({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });
  if (session) query.session(session);
  const configs = await query;

  let matched = [];
  if (configs && configs.length) {
    // 1. Tìm cấu hình riêng cho tỉnh thành được chọn (loại bỏ 'Toàn quốc')
    const provinceMatches = configs.filter((c) => {
      const normC = stripVietnamese(c.province);
      if (normC === 'toan quoc') return false;
      return isProvinceMatch(c.province, province);
    });

    if (provinceMatches.length > 0) {
      // Đã có thiết lập riêng cho tỉnh thành này -> CHỈ SỬ DỤNG CẤU HÌNH CỦA TỈNH ĐÓ
      matched = provinceMatches;
    } else {
      // Không có thiết lập riêng -> Mới fallback tìm cấu hình 'Toàn quốc'
      const nationwideMatches = configs.filter((c) => {
        const normC = stripVietnamese(c.province);
        return normC === 'toan quoc';
      });
      matched = nationwideMatches;
    }
  }

  // Sắp xếp ưu tiên:
  // - Ưu tiên bản ghi có phí > 0 trước (để tránh bản ghi rác 0đ cũ đè lên bản ghi thiết lập mới của admin)
  // - Ưu tiên bản ghi có ngày cập nhật mới nhất
  if (matched.length > 0) {
    matched.sort((a, b) => {
      const aHasFee = (Number(a.fee) || 0) > 0 ? 1 : 0;
      const bHasFee = (Number(b.fee) || 0) > 0 ? 1 : 0;
      if (bHasFee !== aHasFee) return bHasFee - aHasFee;
      const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return tB - tA;
    });

    // Deduplicate theo shippingMethod: mỗi loại phương thức (standard, express) chỉ lấy 1 bản ghi ưu tiên nhất
    const methodMap = new Map();
    for (const cfg of matched) {
      if (!methodMap.has(cfg.shippingMethod)) {
        methodMap.set(cfg.shippingMethod, cfg);
      }
    }
    const order = { standard: 1, express: 2 };
    matched = Array.from(methodMap.values()).sort((a, b) => (order[a.shippingMethod] || 99) - (order[b.shippingMethod] || 99));
  }

  if (!matched.length) {
    return [
      {
        id: 'ship-standard',
        shippingMethod: 'standard',
        province: province || 'Toàn quốc',
        estimatedDeliveryTime: '3 - 5 ngày',
        fee: 200,
      },
      {
        id: 'ship-express',
        shippingMethod: 'express',
        province: province || 'Toàn quốc',
        estimatedDeliveryTime: 'Trong ngày (4 giờ)',
        fee: 50000,
      }
    ];
  }

  return matched.map((config) => {
    // Áp đúng số tiền vận chuyển theo thiết lập trong DB
    const rawFee = Math.max(0, Math.round(Number(config.fee) || 0));
    return {
      id: config._id.toString(),
      shippingMethod: config.shippingMethod,
      province: config.province,
      estimatedDeliveryTime: config.estimatedDeliveryTime,
      fee: rawFee,
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

  // Kiểm tra đối tượng áp dụng nếu là voucher chỉ định
  if (voucher.targetType === 'specific') {
    const applicableIds = Array.isArray(voucher.applicableCustomerIds)
      ? voucher.applicableCustomerIds.map((id) => id.toString())
      : [];
    if (!applicableIds.includes(customerId.toString())) {
      throw new CheckoutError('Mã ưu đãi này chỉ dành riêng cho khách hàng được chỉ định.', 409);
    }
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
