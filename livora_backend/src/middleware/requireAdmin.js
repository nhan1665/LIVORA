const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const { sendError } = require('../utils/responseHelper');

module.exports = async function requireAdmin(req, res, next) {
  const token = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '')?.[1];
  if (!token) return sendError(res, 'Vui lòng đăng nhập quản trị.', 401);
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.isValidObjectId(claims.id) || claims.role === 'customer') {
      return sendError(res, 'Tài khoản không có quyền quản trị.', 403);
    }
    const employee = await Employee.findById(claims.id);
    if (!employee) return sendError(res, 'Tài khoản quản trị không còn tồn tại.', 403);
    req.admin = employee;
    next();
  } catch (_) {
    return sendError(res, 'Phiên quản trị không hợp lệ hoặc đã hết hạn.', 401);
  }
};
