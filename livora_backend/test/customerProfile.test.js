const test = require('node:test');
const assert = require('node:assert/strict');
const Customer = require('../src/models/Customer');
const { getMyProfile, updateMyProfile } = require('../src/controllers/customerProfileController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const customer = () => ({
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  code: 'KH-0001',
  fullName: 'Existing Name',
  email: 'existing@example.test',
  phone: '0901234567',
  passwordHash: 'private-value',
  status: 'active',
  addresses: [],
  async save() {},
});

test('profile read is sanitized', () => {
  const res = response();
  getMyProfile({ customer: customer() }, res);
  assert.equal(res.body.data.id, '507f1f77bcf86cd799439011');
  assert.equal(res.body.data.passwordHash, undefined);
  assert.equal(res.body.data.status, undefined);
});

test('profile rejects administrative fields', async () => {
  const res = response();
  await updateMyProfile({ customer: customer(), body: { status: 'active' } }, res);
  assert.equal(res.statusCode, 400);
});

test('profile rejects invalid phone without saving', async () => {
  const record = customer();
  let saves = 0;
  record.save = async () => { saves++; };
  const res = response();
  await updateMyProfile({ customer: record, body: { phone: '12' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(saves, 0);
});

test('profile rejects duplicate phone', async () => {
  const exists = Customer.exists;
  Customer.exists = async () => ({ _id: 'other' });
  try {
    const res = response();
    await updateMyProfile({ customer: customer(), body: { phone: '0987654321' } }, res);
    assert.equal(res.statusCode, 409);
  } finally {
    Customer.exists = exists;
  }
});

test('profile saves allowed fields under the existing ID', async () => {
  const exists = Customer.exists;
  Customer.exists = async () => null;
  try {
    const record = customer();
    const res = response();
    await updateMyProfile({ customer: record, body: { fullName: 'New Name', phone: '0987654321' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.id, '507f1f77bcf86cd799439011');
    assert.equal(res.body.data.fullName, 'New Name');
    assert.equal(res.body.data.phone, '0987654321');
    assert.equal(res.body.data.passwordHash, undefined);
  } finally {
    Customer.exists = exists;
  }
});
