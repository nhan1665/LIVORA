const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * @desc    Lấy danh sách tất cả nhân viên
 * @route   GET /api/employees
 */
const getAllEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ code: regex }, { username: regex }, { fullName: regex }, { email: regex }, { phone: regex }];
    }

    const employees = await Employee.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(
      res,
      {
        count: employees.length,
        employees,
      },
      'Lấy danh sách nhân viên thành công.'
    );
  } catch (error) {
    console.error('getAllEmployees error:', error);
    return sendError(res, 'Lỗi khi tải danh sách nhân viên.', 500);
  }
};

/**
 * @desc    Lấy chi tiết một nhân viên theo ID hoặc mã nhân viên
 * @route   GET /api/employees/:idOrCode
 */
const getEmployeeByIdOrCode = async (req, res) => {
  try {
    const { idOrCode } = req.params;
    let employee = null;

    if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      employee = await Employee.findById(idOrCode).select('-passwordHash').lean();
    }
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ code: idOrCode.toUpperCase() }, { username: idOrCode }],
      })
        .select('-passwordHash')
        .lean();
    }

    if (!employee) {
      return sendError(res, 'Không tìm thấy thông tin nhân viên.', 404);
    }

    return sendSuccess(res, employee, 'Lấy chi tiết nhân viên thành công.');
  } catch (error) {
    return sendError(res, 'Lỗi khi tìm kiếm nhân viên.', 500);
  }
};

/**
 * @desc    Thêm mới một nhân viên phục vụ đăng nhập
 * @route   POST /api/employees
 */
const createEmployee = async (req, res) => {
  try {
    const { code, username, fullName, email, phone, password, role } = req.body;

    if (!code || !email || !password) {
      return sendError(res, 'Vui lòng cung cấp mã NV, email và mật khẩu.', 400);
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanUsername = (username || cleanCode).trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await Employee.findOne({
      $or: [{ code: cleanCode }, { username: cleanUsername }, { email: cleanEmail }],
    });

    if (existing) {
      return sendError(res, 'Mã nhân viên, tên đăng nhập hoặc email đã tồn tại.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newEmployee = new Employee({
      code: cleanCode,
      username: cleanUsername,
      fullName: (fullName || cleanCode).trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      passwordHash,
      role: (role || 'Admin').trim(),
    });

    await newEmployee.save();

    const result = newEmployee.toObject();
    delete result.passwordHash;

    return sendSuccess(res, result, 'Thêm nhân viên mới thành công.', 201);
  } catch (error) {
    console.error('createEmployee error:', error);
    return sendError(res, 'Lỗi khi tạo mới nhân viên.', 500);
  }
};

/**
 * @desc    Cập nhật thông tin nhân viên
 * @route   PUT /api/employees/:id
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, email, phone, role, password } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên cần cập nhật.', 404);
    }

    if (username) employee.username = username.trim();
    if (fullName) employee.fullName = fullName.trim();
    if (email) employee.email = email.trim().toLowerCase();
    if (phone !== undefined) employee.phone = phone.trim();
    if (role) employee.role = role.trim();

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      employee.passwordHash = await bcrypt.hash(password, salt);
    }

    await employee.save();

    const result = employee.toObject();
    delete result.passwordHash;

    return sendSuccess(res, result, 'Cập nhật thông tin nhân viên thành công.');
  } catch (error) {
    return sendError(res, 'Lỗi khi cập nhật nhân viên.', 500);
  }
};

/**
 * @desc    Xóa nhân viên
 * @route   DELETE /api/employees/:id
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên.', 404);
    }

    if (employee.code === 'NV2709') {
      return sendError(res, 'Không thể xóa tài khoản Quản trị viên mặc định của hệ thống.', 403);
    }

    await Employee.findByIdAndDelete(id);

    return sendSuccess(res, { id }, 'Đã xóa tài khoản nhân viên thành công.');
  } catch (error) {
    return sendError(res, 'Lỗi khi xóa nhân viên.', 500);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeByIdOrCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
