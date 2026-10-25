const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const { sendError } = require('../utils/responseHelper');

// The token identifies the record; no customer ID is accepted from the request body.
module.exports = async function requireCustomer(req, res, next) {
  const bearer = req.get('authorization') || '';
  const token = /^Bearer\s+(.+)$/i.exec(bearer)?.[1];
  if (!token) return sendError(res, 'Vui lòng đăng nhập.', 401);

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.role !== 'customer' || !mongoose.isValidObjectId(claims.id)) {
      return sendError(res, 'Tài khoản không hợp lệ.', 401);
    }
    const customer = await Customer.findById(claims.id);
    if (!customer || customer.status !== 'active' || !customer.isActive) {
      return sendError(res, 'Tài khoản không khả dụng.', 403);
    }
    req.customer = customer;
    next();
  } catch (_) {
    return sendError(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401);
  }
};
