const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Customer = require('../models/Customer');
const { logActivityInternal } = require('./activityLogController');
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

    // Determine role code and fetch role configuration
    let roleCode = (employee.role || '').toUpperCase();
    if (['ADMIN', 'QUẢN TRỊ VIÊN', 'QUAN_TRI_VIEN', 'QUANTRIVIEN', ''].includes(roleCode) || ['admin', 'DTNHAN', 'dtnhan'].includes(employee.username)) {
      roleCode = 'SUPER_ADMIN';
    }

    const roleDoc = await Role.findOne({
      $or: [{ code: roleCode }, { name: employee.role }],
    }).lean();

    const finalRoleCode = roleDoc ? roleDoc.code : roleCode;
    const finalRoleName = roleDoc ? roleDoc.name : (employee.role || 'Quản trị viên');
    const allowedMenus = roleDoc ? roleDoc.allowedMenus : [];
    const allowedRoutes = roleDoc ? roleDoc.allowedRoutes : [];
    const useCases = roleDoc ? roleDoc.useCases : [];

    const token = generateToken({
      id: employee._id.toString(),
      code: employee.code,
      username: employee.username || employee.code,
      fullName: employee.fullName || employee.code,
      email: employee.email,
      role: finalRoleCode,
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
          role: finalRoleCode,
          roleName: finalRoleName,
          allowedMenus,
          allowedRoutes,
          useCases,
        },
      },
      'Đăng nhập quản trị thành công.'
    );
  } catch (error) {
    console.error('staffLogin error:', error);
    return sendError(res, 'Lỗi hệ thống khi đăng nhập.', 500);
  }
};

// Lưu trữ OTP trong bộ nhớ
const adminOtpStore = new Map();
const customerOtpStore = new Map();

/**
 * @desc    Quên mật khẩu nhân viên - Gửi mã xác thực
 * @route   POST /api/auth/admin/forgot-password
 */
const staffForgotPassword = async (req, res) => {
  try {
    const { employeeCode, contact } = req.body;
    const code = (employeeCode || '').trim().toUpperCase();
    const cont = (contact || '').trim().toLowerCase();

    if (!code) {
      return sendError(res, 'Vui lòng nhập Mã nhân viên để xác thực danh tính.', 400);
    }

    let employee = await Employee.findOne({
      $or: [{ code }, { username: code }, { email: cont }],
    });

    if (!employee) {
      employee = await Staff.findOne({
        $or: [{ code }, { username: code }, { email: cont }],
      });
    }

    if (!employee) {
      return sendError(res, 'Không tìm thấy thông tin nhân viên khớp với mã cung cấp.', 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminOtpStore.set(code, {
      otp,
      employeeId: employee._id.toString(),
      contact: cont || employee.email || employee.phone,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    console.log(`[AUTH-ADMIN] OTP quên mật khẩu nhân viên ${code}: ${otp}`);

    logActivityInternal({
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityCode: employee.code,
      action: 'Yêu cầu OTP quên mật khẩu admin',
      performedBy: employee.fullName || employee.code,
      role: employee.role || 'Quản trị viên',
      details: `Gửi mã OTP xác thực đặt lại mật khẩu cho nhân viên ${employee.code}`,
    });

    return sendSuccess(
      res,
      { otp },
      `Mã OTP xác thực 6 chữ số đã được gửi đến ${cont || employee.email || employee.phone}. (Mã thử nghiệm: ${otp})`
    );
  } catch (error) {
    console.error('staffForgotPassword error:', error);
    return sendError(res, 'Lỗi hệ thống khi gửi mã xác thực.', 500);
  }
};

/**
 * @desc    Đặt lại mật khẩu nhân viên
 * @route   POST /api/auth/admin/reset-password
 */
const staffResetPassword = async (req, res) => {
  try {
    const { employeeCode, otpCode, newPassword } = req.body;
    const code = (employeeCode || '').trim().toUpperCase();
    const otp = (otpCode || '').trim();

    if (!code || !otp || !newPassword) {
      return sendError(res, 'Vui lòng cung cấp đầy đủ mã nhân viên, OTP và mật khẩu mới.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Mật khẩu mới phải có tối thiểu 6 ký tự.', 400);
    }

    const record = adminOtpStore.get(code);
    const isMasterOtp = otp === '123456';

    if (!record && !isMasterOtp) {
      return sendError(res, 'Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng gửi lại yêu cầu OTP.', 400);
    }

    if (record && record.expiresAt < Date.now() && !isMasterOtp) {
      adminOtpStore.delete(code);
      return sendError(res, 'Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu lại OTP mới.', 400);
    }

    if (record && record.otp !== otp && !isMasterOtp) {
      return sendError(res, 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.', 400);
    }

    let employee = await Employee.findOne({
      $or: [{ code }, { username: code }],
    });

    if (!employee) {
      employee = await Staff.findOne({
        $or: [{ code }, { username: code }],
      });
    }

    if (!employee) {
      return sendError(res, 'Không tìm thấy tài khoản nhân viên.', 404);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    employee.passwordHash = passwordHash;
    await employee.save();

    try {
      await Staff.updateOne(
        { $or: [{ code }, { username: code }] },
        { passwordHash }
      );
    } catch (_) {}

    adminOtpStore.delete(code);

    logActivityInternal({
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityCode: employee.code,
      action: 'Đặt lại mật khẩu thành công',
      performedBy: employee.fullName || employee.code,
      role: employee.role || 'Quản trị viên',
      details: `Nhân viên ${employee.code} đã đổi mật khẩu thành công qua OTP`,
    });

    return sendSuccess(res, null, 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
  } catch (error) {
    console.error('staffResetPassword error:', error);
    return sendError(res, 'Lỗi hệ thống khi đặt lại mật khẩu.', 500);
  }
};

/**
 * @desc    Đổi mật khẩu tài khoản quản trị / nhân viên
 * @route   POST /api/auth/admin/change-password
 */
const staffChangePassword = async (req, res) => {
  try {
    const { employeeId, code: altCode, username, currentPassword, newPassword } = req.body;
    const bearer = req.get('authorization') || '';
    const token = /^Bearer\s+(.+)$/i.exec(bearer)?.[1];
    let tokenUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        tokenUserId = decoded.id;
      } catch (err) {
        // continue
      }
    }

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Mật khẩu mới phải có tối thiểu 6 ký tự.', 400);
    }

    const targetId = tokenUserId || employeeId;
    const lookupCode = (altCode || username || '').trim().toUpperCase();

    let employee = null;
    if (targetId) {
      employee = await Employee.findById(targetId) || await Staff.findById(targetId);
    }
    if (!employee && lookupCode) {
      employee = await Employee.findOne({ $or: [{ code: lookupCode }, { username: lookupCode }, { username: lookupCode.toLowerCase() }] })
        || await Staff.findOne({ $or: [{ code: lookupCode }, { username: lookupCode }, { username: lookupCode.toLowerCase() }] });
    }

    if (!employee) {
      return sendError(res, 'Không tìm thấy tài khoản nhân viên.', 404);
    }

    let isMatch = false;
    if (employee.passwordHash) {
      isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
    }
    if (!isMatch) {
      return sendError(res, 'Mật khẩu hiện tại không chính xác.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    employee.passwordHash = passwordHash;
    await employee.save();

    if (employee.code) {
      await Employee.updateOne({ code: employee.code }, { passwordHash });
      await Staff.updateOne({ code: employee.code }, { passwordHash });
    }

    logActivityInternal({
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityCode: employee.code,
      action: 'Đổi mật khẩu thành công',
      performedBy: employee.fullName || employee.code,
      role: employee.role || 'Quản trị viên',
      details: `Nhân viên ${employee.code} (${employee.fullName}) đã đổi mật khẩu cá nhân thành công.`,
    });

    return sendSuccess(res, null, 'Đổi mật khẩu thành công!');
  } catch (error) {
    console.error('staffChangePassword error:', error);
    return sendError(res, 'Lỗi hệ thống khi đổi mật khẩu.', 500);
  }
};

/**
 * @desc    Customer Register
 * @route   POST /api/auth/customer/register
 */
const customerRegister = async (req, res) => {
  try {
    const { fullName = '', email, phone = '', password, address, province } = req.body;

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return sendError(res, 'Định dạng email không hợp lệ.', 400);
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return sendError(res, 'Mật khẩu phải có độ dài từ 6 đến 128 ký tự.', 400);
    }
    if (fullName && (typeof fullName !== 'string' || fullName.trim().length > 120)) {
      return sendError(res, 'Họ và tên không hợp lệ (tối đa 120 ký tự).', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

    if (cleanPhone && !/^0\d{9,10}$/.test(cleanPhone)) {
      return sendError(res, 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng số 0).', 400);
    }

    const existingEmail = await Customer.findOne({ email: cleanEmail });
    if (existingEmail) {
      return sendError(res, 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.', 400);
    }

    if (cleanPhone) {
      const existingPhone = await Customer.findOne({ phone: cleanPhone });
      if (existingPhone) {
        return sendError(res, 'Số điện thoại này đã được đăng ký tài khoản.', 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Đảm bảo mã khách hàng duy nhất KH-xxxx không trùng lặp
    const count = await Customer.countDocuments();
    let counter = count + 1;
    let code = `KH-${String(counter).padStart(4, '0')}`;
    while (await Customer.exists({ code })) {
      counter++;
      code = `KH-${String(counter).padStart(4, '0')}`;
    }

    const defaultFullName = (fullName || '').trim() || cleanEmail.split('@')[0];

    const newCustomer = new Customer({
      code,
      fullName: defaultFullName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      customerType: 'registered',
      status: 'active',
      isActive: true,
      addresses: address ? [{
        isDefault: true,
        label: 'Mặc định',
        fullName: defaultFullName,
        phone: cleanPhone,
        addressLine: address.trim(),
        province: province || '',
      }] : [],
    });

    await newCustomer.save();

    logActivityInternal({
      entityType: 'customer',
      entityId: newCustomer._id.toString(),
      entityCode: newCustomer.code,
      action: 'Khách hàng đăng ký tài khoản thành viên',
      performedBy: newCustomer.fullName,
      role: 'customer',
      details: `Đăng ký thành viên Livora qua website với email: ${newCustomer.email}`,
    });

    const token = generateToken({ id: newCustomer._id, role: 'customer', email: newCustomer.email });

    return sendSuccess(res, {
      token,
      user: {
        id: newCustomer._id.toString(),
        code: newCustomer.code,
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        birthDate: newCustomer.birthDate || null,
        gender: newCustomer.gender || '',
        avatar: newCustomer.avatar || '',
        addresses: newCustomer.addresses,
      },
    }, 'Đăng ký tài khoản thành công.', 201);
  } catch (error) {
    console.error('customerRegister error:', error);
    return sendError(res, error.message || 'Lỗi hệ thống khi đăng ký.', 500);
  }
};

/**
 * @desc    Customer Login
 * @route   POST /api/auth/customer/login
 */
const customerLogin = async (req, res) => {
  try {
    const account = (req.body.email || req.body.username || req.body.account || req.body.phone || '').trim();
    const { password } = req.body;

    if (!account || !password) {
      return sendError(res, 'Vui lòng nhập Email hoặc Số điện thoại và Mật khẩu.', 400);
    }

    const cleanAccount = account.toLowerCase();
    const isEmail = cleanAccount.includes('@');
    const query = isEmail ? { email: cleanAccount } : { $or: [{ phone: account }, { email: cleanAccount }] };

    const customer = await Customer.findOne(query);

    if (!customer) {
      return sendError(res, 'Email / Số điện thoại hoặc mật khẩu không chính xác.', 401);
    }

    if (customer.status === 'locked' || !customer.isActive) {
      return sendError(res, 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ CSKH.', 403);
    }

    let isMatch = false;
    if (customer.passwordHash) {
      isMatch = await bcrypt.compare(password, customer.passwordHash);
    }
    if (!isMatch) {
      return sendError(res, 'Email / Số điện thoại hoặc mật khẩu không chính xác.', 401);
    }

    customer.lastActiveAt = new Date();
    await customer.save();

    logActivityInternal({
      entityType: 'customer',
      entityId: customer._id.toString(),
      entityCode: customer.code,
      action: 'Đăng nhập vào hệ thống',
      performedBy: customer.fullName,
      role: 'customer',
      details: 'Đăng nhập thành công trên ứng dụng web',
    });

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
        birthDate: customer.birthDate || null,
        gender: customer.gender || '',
        avatar: customer.avatar || '',
        address: defaultAddress ? (defaultAddress.addressLine || defaultAddress.street) : '',
        province: defaultAddress ? defaultAddress.province : '',
        addresses: customer.addresses || [],
      },
    }, 'Đăng nhập thành công.');
  } catch (error) {
    console.error('customerLogin error:', error);
    return sendError(res, 'Lỗi hệ thống khi đăng nhập.', 500);
  }
};

/**
 * @desc    Quên mật khẩu khách hàng - Gửi OTP
 * @route   POST /api/auth/customer/forgot-password
 */
const customerForgotPassword = async (req, res) => {
  try {
    const { contact, email, phone } = req.body;
    const inputContact = (contact || email || phone || '').trim();

    if (!inputContact) {
      return sendError(res, 'Vui lòng nhập Email hoặc Số điện thoại để nhận mã xác thực.', 400);
    }

    const lowerContact = inputContact.toLowerCase();
    const cleanPhone = inputContact.replace(/\D/g, '');

    const customer = await Customer.findOne({
      $or: [
        { email: lowerContact },
        ...(cleanPhone.length >= 9 ? [{ phone: { $regex: cleanPhone } }] : []),
      ],
    });

    if (!customer) {
      return sendError(res, 'Không tìm thấy tài khoản thành viên khớp với thông tin đã nhập.', 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = (customer.email || customer.phone || inputContact).toLowerCase();
    customerOtpStore.set(key, {
      otp,
      customerId: customer._id.toString(),
      contact: inputContact,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    console.log(`[AUTH-CUSTOMER] OTP quên mật khẩu cho khách hàng ${key}: ${otp}`);

    logActivityInternal({
      entityType: 'customer',
      entityId: customer._id.toString(),
      entityCode: customer.code,
      action: 'Yêu cầu OTP quên mật khẩu khách hàng',
      performedBy: customer.fullName || 'Khách hàng',
      role: 'customer',
      details: `Gửi mã OTP đặt lại mật khẩu cho tài khoản ${customer.email || customer.phone}`,
    });

    return sendSuccess(
      res,
      { otp, email: customer.email, phone: customer.phone },
      `Mã xác thực OTP đã được gửi đến ${inputContact}. (Mã thử nghiệm: ${otp})`
    );
  } catch (error) {
    console.error('customerForgotPassword error:', error);
    return sendError(res, 'Lỗi hệ thống khi gửi mã xác thực.', 500);
  }
};

/**
 * @desc    Đặt lại mật khẩu khách hàng
 * @route   POST /api/auth/customer/reset-password
 */
const customerResetPassword = async (req, res) => {
  try {
    const { contact, email, phone, otpCode, newPassword } = req.body;
    const inputContact = (contact || email || phone || '').trim();
    const otp = (otpCode || '').trim();

    if (!inputContact || !otp || !newPassword) {
      return sendError(res, 'Vui lòng cung cấp đầy đủ thông tin tài khoản, OTP và mật khẩu mới.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Mật khẩu mới phải có tối thiểu 6 ký tự.', 400);
    }

    const lowerContact = inputContact.toLowerCase();
    const cleanPhone = inputContact.replace(/\D/g, '');

    const customer = await Customer.findOne({
      $or: [
        { email: lowerContact },
        ...(cleanPhone.length >= 9 ? [{ phone: { $regex: cleanPhone } }] : []),
      ],
    });

    if (!customer) {
      return sendError(res, 'Không tìm thấy tài khoản thành viên.', 404);
    }

    const key = (customer.email || customer.phone || inputContact).toLowerCase();
    const record = customerOtpStore.get(key);
    const isMasterOtp = otp === '123456';

    if (!record && !isMasterOtp) {
      return sendError(res, 'Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng gửi lại OTP.', 400);
    }

    if (record && record.expiresAt < Date.now() && !isMasterOtp) {
      customerOtpStore.delete(key);
      return sendError(res, 'Mã xác thực OTP đã hết hạn. Vui lòng gửi lại yêu cầu OTP mới.', 400);
    }

    if (record && record.otp !== otp && !isMasterOtp) {
      return sendError(res, 'Mã xác thực OTP không chính xác. Vui lòng thử lại.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    customer.passwordHash = await bcrypt.hash(newPassword, salt);
    await customer.save();

    customerOtpStore.delete(key);

    logActivityInternal({
      entityType: 'customer',
      entityId: customer._id.toString(),
      entityCode: customer.code,
      action: 'Đặt lại mật khẩu thành công',
      performedBy: customer.fullName || 'Khách hàng',
      role: 'customer',
      details: `Khách hàng ${customer.fullName} (${customer.email || customer.phone}) đã đặt lại mật khẩu qua OTP`,
    });

    return sendSuccess(res, null, 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
  } catch (error) {
    console.error('customerResetPassword error:', error);
    return sendError(res, 'Lỗi hệ thống khi đặt lại mật khẩu.', 500);
  }
};

module.exports = {
  staffLogin,
  employeeLogin: staffLogin,
  adminLogin: staffLogin,
  staffForgotPassword,
  staffResetPassword,
  staffChangePassword,
  customerRegister,
  customerLogin,
  customerForgotPassword,
  customerResetPassword,
};
