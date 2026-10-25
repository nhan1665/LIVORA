const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Product = require('../src/models/Product');
const Shipping = require('../src/models/Shipping');
const Voucher = require('../src/models/Voucher');
const Customer = require('../src/models/Customer');
const Order = require('../src/models/Order');
const { calculateQuote, CheckoutError } = require('../src/services/checkoutPricing');
const { createCheckoutOrder } = require('../src/controllers/checkoutController');
const { cancelOrder } = require('../src/controllers/orderController');
const { createShippingConfig } = require('../src/controllers/shippingController');
const { createVoucher } = require('../src/controllers/voucherController');

const uri = process.env.MONGODB_TEST_URI;
const localOnly = /^mongodb:\/\/(127\.0\.0\.1|localhost):27019\//.test(uri || '');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('checkout uses persisted VND prices, voucher and shipping, then creates one order atomically',
  { skip: !localOnly }, async () => {
    process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const ids = [];
    const tag = crypto.randomBytes(5).toString('hex');
    try {
      const product = await Product.create({
        sku: `S2-${tag}`, slug: `s2-${tag}`, name: 'Sprint 2 test table',
        price: 3000000, salePrice: 2800000, stockQuantity: 2,
        thumbnail: 'https://example.test/table.png', status: 'active', isActive: true,
      });
      ids.push(product._id);
      const shipping = await Shipping.create({ shippingMethod: 'standard', province: 'Hà Nội',
        fee: 50000, estimatedDeliveryTime: '2 days', isActive: true });
      const voucher = await Voucher.create({ code: `S2-${tag.toUpperCase()}`, title: 'Test discount',
        discountType: 'percentage', discountValue: 10, minOrderValue: 1000000,
        quantity: 2, usedCount: 0, perCustomerLimit: 1,
        startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000),
        isActive: true });
      const customer = await Customer.create({ fullName: 'Sprint 2 test user',
        email: `s2-${tag}@example.test`, phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: crypto.randomBytes(32).toString('hex'), status: 'active', isActive: true });
      const body = { items: [{ productId: String(product._id), quantity: 1 }], province: 'Hà Nội',
        shippingId: String(shipping._id), voucherCode: voucher.code };
      const quote = await calculateQuote(body, customer._id);
      assert.equal(quote.subtotal, 2800000);
      assert.equal(quote.discount, 280000);
      assert.equal(quote.shippingFee, 50000);
      assert.equal(quote.total, 2570000);
      await assert.rejects(() => calculateQuote({ ...body, shippingId: String(new mongoose.Types.ObjectId()) }, customer._id), CheckoutError);
      const token = jwt.sign({ id: String(customer._id), role: 'customer' }, process.env.JWT_SECRET);
      const req = { body: { ...body, customerInfo: { fullName: customer.fullName,
        phone: customer.phone, email: customer.email, address: '123 Test Street' },
        paymentMethod: 'cod', requestKey: crypto.randomUUID() },
        get: (name) => name === 'authorization' ? `Bearer ${token}` : '' };
      const first = response();
      await createCheckoutOrder(req, first);
      assert.equal(first.statusCode, 201, JSON.stringify(first.body));
      assert.equal(first.body.data.finalAmount, 2570000);
      assert.equal(first.body.data.paymentStatus, 'pending');
      const repeated = response();
      await createCheckoutOrder(req, repeated);
      assert.equal(repeated.statusCode, 200);
      assert.equal(repeated.body.data.orderCode, first.body.data.orderCode);
      const order = await Order.findOne({ orderCode: first.body.data.orderCode });
      assert.equal(order.shippingMethod, 'standard');
      assert.equal(order.voucherCode, voucher.code);
      assert.equal((await Product.findById(product._id)).stockQuantity, 1);
      assert.equal((await Voucher.findById(voucher._id)).usedCount, 1);
      const customerAfter = await Customer.findById(customer._id);
      assert.equal(customerAfter.totalOrders, 1);
      assert.equal(customerAfter.accumulatedSpent, 2570000);
      const tampered = response();
      await createCheckoutOrder({ ...req, body: { ...req.body, shippingFee: 0 } }, tampered);
      assert.equal(tampered.statusCode, 400);
      const secondVoucherUse = response();
      await createCheckoutOrder({ ...req, body: { ...req.body, requestKey: crypto.randomUUID() } }, secondVoucherUse);
      assert.equal(secondVoucherUse.statusCode, 409);
      const cancelled = response();
      await cancelOrder({ params: { id: String(order._id) }, body: { reason: 'Test cancellation' } }, cancelled);
      assert.equal(cancelled.statusCode, 200, JSON.stringify(cancelled.body));
      assert.equal((await Product.findById(product._id)).stockQuantity, 2);
      assert.equal((await Voucher.findById(voucher._id)).usedCount, 0);
      assert.equal((await Customer.findById(customer._id)).totalOrders, 0);
      const cancelAgain = response();
      await cancelOrder({ params: { id: String(order._id) }, body: { reason: 'Again' } }, cancelAgain);
      assert.equal(cancelAgain.statusCode, 409);

      // Admin writes reject fractional VND, and the checkout boundary also
      // rejects malformed historical records instead of persisting decimals.
      const invalidShipping = response();
      await createShippingConfig({ body: { shippingMethod: 'standard', province: 'Hà Nội',
        fee: 12500.5, estimatedDeliveryTime: '2 days' } }, invalidShipping);
      assert.equal(invalidShipping.statusCode, 400);
      const invalidVoucher = response();
      await createVoucher({ body: { code: `S2-BAD-${tag.toUpperCase()}`, title: 'Invalid amount',
        discountType: 'fixed_amount', discountValue: 100.5, minOrderValue: 1000,
        quantity: 1, startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000) } }, invalidVoucher);
      assert.equal(invalidVoucher.statusCode, 400);
      await Shipping.updateOne({ _id: shipping._id }, { $set: { fee: 50000.5 } });
      await assert.rejects(() => calculateQuote(body, customer._id), CheckoutError);
      await Shipping.updateOne({ _id: shipping._id }, { $set: { fee: 50000, freeShipThreshold: 0.5 } });
      await assert.rejects(() => calculateQuote(body, customer._id), CheckoutError);
      await Shipping.updateOne({ _id: shipping._id }, { $set: { freeShipThreshold: 0 } });
      await Voucher.updateOne({ _id: voucher._id }, { $set: { maxDiscountAmount: 10000.5 } });
      await assert.rejects(() => calculateQuote(body, customer._id), CheckoutError);
      await Voucher.updateOne({ _id: voucher._id }, { $set: { maxDiscountAmount: 0,
        discountType: 'fixed_amount', discountValue: 100.5 } });
      await assert.rejects(() => calculateQuote(body, customer._id), CheckoutError);
      await Voucher.updateOne({ _id: voucher._id }, { $set: { discountType: 'percentage', discountValue: 10 } });
      assert.equal((await calculateQuote(body, customer._id)).total, 2570000);

      const bankOrder = response();
      await createCheckoutOrder({ ...req, body: { ...req.body, voucherCode: '',
        paymentMethod: 'bank_transfer', requestKey: crypto.randomUUID() } }, bankOrder);
      assert.equal(bankOrder.statusCode, 201, JSON.stringify(bankOrder.body));
      assert.equal(bankOrder.body.data.paymentStatus, 'pending');
      assert.equal((await Order.findOne({ orderCode: bankOrder.body.data.orderCode })).paymentStatus, 'pending');
      const bankRecord = await Order.findOne({ orderCode: bankOrder.body.data.orderCode });
      await Product.deleteOne({ _id: product._id });
      const missingProductCancel = response();
      const originalError = console.error;
      console.error = () => {};
      try {
        await cancelOrder({ params: { id: String(bankRecord._id) },
          body: { reason: 'Missing-product reconciliation test' } }, missingProductCancel);
      } finally {
        console.error = originalError;
      }
      assert.equal(missingProductCancel.statusCode, 500);
      assert.equal((await Order.findById(bankRecord._id)).orderStatus, 'pending');
    } finally {
      await Order.deleteMany({ 'items.productId': { $in: ids } });
      await Product.deleteMany({ _id: { $in: ids } });
      await Shipping.deleteMany({ province: 'Hà Nội', estimatedDeliveryTime: '2 days' });
      await Voucher.deleteMany({ code: `S2-${tag.toUpperCase()}` });
      await Customer.deleteMany({ email: `s2-${tag}@example.test` });
      await mongoose.disconnect();
    }
  });
