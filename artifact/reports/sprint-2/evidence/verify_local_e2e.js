// Verify a completed browser run against the isolated local MongoDB fixture.
const mongoose = require('../../../../livora_backend/node_modules/mongoose');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Customer = require('../../../../livora_backend/src/models/Customer');
const Product = require('../../../../livora_backend/src/models/Product');
const Voucher = require('../../../../livora_backend/src/models/Voucher');
const Shipping = require('../../../../livora_backend/src/models/Shipping');
const Order = require('../../../../livora_backend/src/models/Order');

const root = path.resolve(__dirname, '../../../..');
const creds = JSON.parse(fs.readFileSync(path.join(root, '.venv/qa-credentials.json')));
const browser = JSON.parse(fs.readFileSync(path.join(__dirname, 'browser-results.json')));
const orderCode = browser.checks.find((x) => x.name === 'Combined voucher and shipping checkout')?.detail;
const voucherCode = browser.checks.find((x) => x.name === 'Admin creates persistent voucher')?.detail;
const results = [];
function check(name, passed, detail = '') {
  results.push({ name, passed: !!passed, detail });
  if (!passed) throw new Error(`${name}: ${detail}`);
}
async function api(url, method = 'GET', body, token) {
  const response = await fetch(`http://127.0.0.1:5000${url}`, {
    method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}
async function main() {
  const uri = process.env.MONGODB_TEST_URI;
  if (!/^mongodb:\/\/127\.0\.0\.1:27019\/LIVORA_SPRINT2_E2E\?replicaSet=livoraTestRs$/.test(uri || '')) {
    throw new Error('Refusing non-local E2E database.');
  }
  await mongoose.connect(uri);
  try {
    const [customer, product, voucher, shipping, order] = await Promise.all([
      Customer.findById(creds.customer.id), Product.findById(creds.productId),
      Voucher.findOne({ code: voucherCode }), Shipping.findOne({ province: 'Hà Nội', isActive: true }),
      Order.findOne({ orderCode }),
    ]);
    check('Customer profile persisted under stable ID', !!customer && customer.fullName === 'Sprint Two Updated Customer', String(customer?._id || ''));
    check('Admin voucher persisted', !!voucher && voucher.usedCount === 1, voucher?.code || '');
    check('Admin shipping persisted', !!shipping && shipping.fee === 50000, String(shipping?._id || ''));
    check('Checkout order references same customer', !!order && String(order.customerId) === String(customer._id));
    check('Order stores product/VND pricing snapshot', order.subtotalAmount === 2800000 && order.items[0].unitPrice === 2800000);
    check('Voucher applies to subtotal only', order.discountAmount === 280000 && String(order.voucherId) === String(voucher._id));
    check('Shipping and final amount persisted', order.shippingFee === 50000 && order.shippingMethod === 'standard' && order.totalAmount === 2570000);
    check('Inventory and customer counters persisted', product.stockQuantity === 9 && customer.totalOrders === 1 && customer.accumulatedSpent === 2570000);
    const adminLogin = await api('/api/auth/admin/login', 'POST', { employeeCode: creds.admin.code, password: creds.admin.password });
    const customerLogin = await api('/api/auth/customer/login', 'POST', { email: creds.customer.email, password: creds.customer.password });
    check('Real persisted account login', adminLogin.status === 200 && customerLogin.status === 200);
    const adminToken = adminLogin.data.data.token;
    const customerToken = customerLogin.data.data.token;
    const adminRead = await api(`/api/customers/${customer._id}`, 'GET', null, adminToken);
    check('Admin API reads updated Customer record', adminRead.status === 200 && JSON.stringify(adminRead.data).includes(customer.fullName));
    check('Unauthorized Admin customer read rejected', (await api('/api/customers')).status === 401);
    check('Unauthorized Admin order read rejected', (await api('/api/orders')).status === 401);
    check('Unauthorized profile update rejected', (await api('/api/auth/customer/me', 'PATCH', { fullName: 'Wrong' })).status === 401);
    check('Profile administrative field rejected', (await api('/api/auth/customer/me', 'PATCH', { customerId: String(customer._id) }, customerToken)).status === 400);
    const baseQuote = { items: [{ productId: String(product._id), quantity: 1 }], province: 'Hà Nội',
      shippingId: String(shipping._id), voucherCode };
    check('Quote blocks voucher after per-customer limit', (await api('/api/checkout/quote', 'POST', baseQuote, customerToken)).status === 409);
    const noVoucher = { ...baseQuote, voucherCode: '' };
    check('Inactive shipping rejected', await (async () => {
      await Shipping.updateOne({ _id: shipping._id }, { $set: { isActive: false } });
      try { return (await api('/api/checkout/quote', 'POST', noVoucher, customerToken)).status === 409; }
      finally { await Shipping.updateOne({ _id: shipping._id }, { $set: { isActive: true } }); }
    })());
    check('Unknown product rejected', (await api('/api/checkout/quote', 'POST', { ...noVoucher,
      items: [{ productId: String(new mongoose.Types.ObjectId()), quantity: 1 }] }, customerToken)).status === 409);
    const tampered = { ...noVoucher, customerInfo: { fullName: customer.fullName, phone: customer.phone,
      email: customer.email, address: '123 Test Street' }, paymentMethod: 'cod', requestKey: crypto.randomUUID(), shippingFee: 0 };
    check('Client-supplied shipping fee rejected', (await api('/api/checkout/orders', 'POST', tampered, customerToken)).status === 400);
    const priorFee = shipping.fee;
    await Shipping.updateOne({ _id: shipping._id }, { $set: { fee: 60000 } });
    try {
      const changedQuote = await api('/api/checkout/quote', 'POST', noVoucher, customerToken);
      const unchangedOrder = await Order.findById(order._id);
      check('New shipping fee updates quotes without rewriting historical orders',
        changedQuote.status === 200 && changedQuote.data.data.shippingFee === 60000 && unchangedOrder.shippingFee === 50000);
    } finally {
      await Shipping.updateOne({ _id: shipping._id }, { $set: { fee: priorFee } });
    }
    const output = path.join(__dirname, 'database-and-security-results.json');
    fs.writeFileSync(output, JSON.stringify({ environment: 'isolated local MongoDB', orderCode,
      totalsVND: { subtotal: order.subtotalAmount, discount: order.discountAmount,
        shipping: order.shippingFee, final: order.totalAmount }, checks: results }, null, 2));
    console.log(`${results.length} local database and API checks passed.`);
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
