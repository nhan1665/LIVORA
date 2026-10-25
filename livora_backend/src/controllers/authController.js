const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * @desc    Admin / Employee Login
 * @route   POST /api/auth/admin/login
 */
const staffLogin = async (req, res) => {
  try {
    const { employeeCode, code: altCode, username, password } = req.body;
    const inputCode = (employeeCode || altCode || username || '').trim();

    if (!inputCode || !password) {
      return sendError(res, 'Vui lòng nhập Mã nhân viên hoặc Tên đăng nhập và Mật khẩu.', 400);
    }

    const upperCode = inputCode.toUpperCase();
    const lowerEmail = inputCode.toLowerCase();

    // Tìm trong collection Employees theo mã, tên đăng nhập hoặc email
    let employee = await Employee.findOne({
      $or: [
        { code: upperCode },
        { username: inputCode },
        { username: upperCode },
        { email: lowerEmail },
      ],
    });

    // Fallback tìm trong Staff nếu chưa có
    if (!employee) {
      const staff = await Staff.findOne({
        $or: [
          { code: upperCode },
          { username: inputCode },
          { username: upperCode },
          { email: lowerEmail },
        ],
      });
      if (staff) {
        employee = staff;
      }
    }

    if (!employee) {
      return sendError(res, 'Mã nhân viên hoặc tên đăng nhập không tồn tại.', 404);
    }

    // Verify only the persisted bcrypt password hash.
    let isMatch = false;
    if (employee.passwordHash) {
      try {
        isMatch = await bcrypt.compare(password, employee.passwordHash);
      } catch (e) {
        isMatch = false;
      }
    }
    if (!isMatch) {
      return sendError(res, 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.', 401);
    }

    const token = generateToken({
      id: employee._id.toString(),
      code: employee.code,
      username: employee.username || employee.code,
      fullName: employee.fullName || employee.code,
      email: employee.email,
      role: employee.role || 'Quản trị viên',
    });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: employee._id.toString(),
          code: employee.code,
          username: employee.username || employee.code,
          fullName: employee.fullName || employee.code,
          email: employee.email,
          phone: employee.phone || '',
          role: employee.role || 'Quản trị viên',
        },
      },
      'Đăng nhập quản trị thành công.'
    );
  } catch (error) {
    console.error('staffLogin error:', error);
    return sendError(res, 'Lỗi hệ thống khi đăng nhập.', 500);
  }
};

/**
 * @desc    Quên mật khẩu nhân viên - Gửi mã xác thực
 * @route   POST /api/auth/admin/forgot-password
 */
const staffForgotPassword = async (req, res) => sendError(res, 'Password recovery requires a verified delivery channel.', 501);

/**
 * @desc    Đặt lại mật khẩu nhân viên
 * @route   POST /api/auth/admin/reset-password
 */
const staffResetPassword = async (req, res) => sendError(res, 'Password recovery requires a verified delivery channel.', 501);

/**
 * @desc    Customer Register
 * @route   POST /api/auth/customer/register
 */
const customerRegister = async (req, res) => {
  try {
    const { fullName, email, phone, password, address, province } = req.body;

    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 120 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof phone !== 'string' || !/^0\d{9,10}$/.test(phone.trim()) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return sendError(res, 'Vui lòng điền đầy đủ họ tên, email, số điện thoại và mật khẩu.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const existingCustomer = await Customer.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existingCustomer) {
      return sendError(res, 'Email hoặc số điện thoại đã được đăng ký tài khoản.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const count = await Customer.countDocuments();
    const code = `KH-${String(count + 1).padStart(4, '0')}`;

    const newCustomer = new Customer({
      code,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      customerType: 'registered',
      status: 'active',
      addresses: address ? [{
        isDefault: true,
        label: 'Mặc định',
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine: address.trim(),
        province: province || '',
      }] : [],
    });

    await newCustomer.save();

    const token = generateToken({ id: newCustomer._id, role: 'customer', email: newCustomer.email });

    return sendSuccess(res, {
      token,
      user: {
        id: newCustomer._id.toString(),
        code: newCustomer.code,
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        addresses: newCustomer.addresses,
      },
    }, 'Đăng ký tài khoản thành công.', 201);
  } catch (error) {
    console.error('customerRegister error:', error);
    return sendError(res, 'Lỗi hệ thống khi đăng ký.', 500);
  }
};

/**
 * @desc    Customer Login
 * @route   POST /api/auth/customer/login
 */
const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Vui lòng nhập Email và Mật khẩu.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({ email: cleanEmail });

    if (!customer) {
      return sendError(res, 'Email hoặc mật khẩu không chính xác.', 401);
    }

    if (customer.status === 'locked' || !customer.isActive) {
      return sendError(res, 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ CSKH.', 403);
    }

    let isMatch = false;
    if (customer.passwordHash) {
      isMatch = await bcrypt.compare(password, customer.passwordHash);
    }
    if (!isMatch) {
      return sendError(res, 'Email hoặc mật khẩu không chính xác.', 401);
    }

    customer.lastActiveAt = new Date();
    await customer.save();

    const token = generateToken({ id: customer._id, role: 'customer', email: customer.email });

    const defaultAddress = customer.addresses?.find((a) => a.isDefault) || customer.addresses?.[0];

    return sendSuccess(res, {
      token,
      user: {
        id: customer._id.toString(),
        code: customer.code,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: defaultAddress ? defaultAddress.addressLine : '',
        province: defaultAddress ? defaultAddress.province : '',
        addresses: customer.addresses,
      },
    }, 'Đăng nhập thành công.');
  } catch (error) {
    console.error('customerLogin error:', error);
    return sendError(res, 'Lỗi hệ thống khi đăng nhập.', 500);
  }
};

module.exports = {
  staffLogin,
  employeeLogin: staffLogin,
  adminLogin: staffLogin,
  staffForgotPassword,
  staffResetPassword,
  customerRegister,
  customerLogin,
};
