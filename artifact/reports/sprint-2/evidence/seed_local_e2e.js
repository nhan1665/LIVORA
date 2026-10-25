// Run only against the disposable MongoDB replica set on 127.0.0.1:27019.
const mongoose = require('../../../../livora_backend/node_modules/mongoose');
const bcrypt = require('../../../../livora_backend/node_modules/bcryptjs');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Employee = require('../../../../livora_backend/src/models/Employee');
const Customer = require('../../../../livora_backend/src/models/Customer');
const Product = require('../../../../livora_backend/src/models/Product');
const Order = require('../../../../livora_backend/src/models/Order');
const Voucher = require('../../../../livora_backend/src/models/Voucher');
const Shipping = require('../../../../livora_backend/src/models/Shipping');

async function main() {
  const uri = process.env.MONGODB_TEST_URI;
  if (!/^mongodb:\/\/127\.0\.0\.1:27019\/LIVORA_SPRINT2_E2E\?replicaSet=livoraTestRs$/.test(uri || '')) {
    throw new Error('Refusing to seed any database except isolated LIVORA_SPRINT2_E2E.');
  }
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all([Employee, Customer, Product, Order, Voucher, Shipping].map((model) => model.createIndexes()));
  const tag = crypto.randomBytes(4).toString('hex');
  const adminPassword = crypto.randomBytes(20).toString('hex');
  const customerPassword = crypto.randomBytes(20).toString('hex');
  const admin = await Employee.create({ code: `S2${tag}`.toUpperCase(), username: `s2${tag}`,
    fullName: 'Sprint Two Admin', email: `s2admin${tag}@example.test`,
    passwordHash: await bcrypt.hash(adminPassword, 10), role: 'Admin' });
  const customer = await Customer.create({ code: `S2C${tag}`.toUpperCase(),
    fullName: 'Sprint Two Customer', email: `s2customer${tag}@example.test`,
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    passwordHash: await bcrypt.hash(customerPassword, 10), status: 'active', isActive: true });
  const product = await Product.create({ sku: `S2P${tag}`.toUpperCase(), slug: `s2-p-${tag}`,
    name: 'Sprint Two Table', price: 3000000, salePrice: 2800000, stockQuantity: 10,
    thumbnail: '/images/categories/kitchen/dining-tables.png', status: 'active', isActive: true });
  const output = path.resolve(__dirname, '../../../../.venv/qa-credentials.json');
  fs.writeFileSync(output, JSON.stringify({ admin: { code: admin.code, password: adminPassword },
    customer: { email: customer.email, password: customerPassword, phone: customer.phone, id: String(customer._id) },
    productId: String(product._id) }));
  console.log('Seeded isolated E2E database with one admin, one customer and one product.');
  await mongoose.disconnect();
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
