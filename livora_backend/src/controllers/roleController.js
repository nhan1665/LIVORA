const Role = require('../models/Role');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { seedRolesAndEmployees } = require('../config/seedRolesAndEmployees');

/**
 * @desc    Lấy danh sách tất cả vai trò kèm số lượng nhân viên
 * @route   GET /api/roles
 */
const getRoles = async (req, res) => {
  try {
    let roles = await Role.find().sort({ createdAt: 1 }).lean();

    // Nếu chưa có vai trò nào, tự động seed ngay
    if (!roles || roles.length === 0) {
      await seedRolesAndEmployees();
      roles = await Role.find().sort({ createdAt: 1 }).lean();
    }

    // Đếm số lượng nhân viên theo từng vai trò
    const employees = await Employee.find({}, 'role').lean();
    const countMap = {};
    employees.forEach((emp) => {
      const roleCode = (emp.role || '').toUpperCase();
      countMap[roleCode] = (countMap[roleCode] || 0) + 1;
    });

    const rolesWithCount = roles.map((r) => ({
      ...r,
      employeeCount: countMap[r.code] || 0,
    }));

    return sendSuccess(res, rolesWithCount, 'Lấy danh sách vai trò thành công.');
  } catch (error) {
    console.error('getRoles error:', error);
    return sendError(res, 'Lỗi khi tải danh mục vai trò.', 500);
  }
};

/**
 * @desc    Lấy chi tiết một vai trò theo mã code
 * @route   GET /api/roles/:code
 */
const getRoleByCode = async (req, res) => {
  try {
    const code = (req.params.code || '').toUpperCase();
    const role = await Role.findOne({ code }).lean();

    if (!role) {
      return sendError(res, `Không tìm thấy vai trò với mã ${code}.`, 404);
    }

    const employees = await Employee.find({ role: code }).select('-passwordHash').lean();

    return sendSuccess(
      res,
      {
        ...role,
        employees,
        employeeCount: employees.length,
      },
      'Lấy thông tin vai trò thành công.'
    );
  } catch (error) {
    console.error('getRoleByCode error:', error);
    return sendError(res, 'Lỗi khi tải chi tiết vai trò.', 500);
  }
};

/**
 * @desc    Cập nhật phân quyền / thông tin vai trò
 * @route   PUT /api/roles/:code
 */
const updateRole = async (req, res) => {
  try {
    const code = (req.params.code || '').toUpperCase();
    const { name, description, allowedMenus, allowedRoutes, useCases, isActive } = req.body;

    const role = await Role.findOne({ code });
    if (!role) {
      return sendError(res, `Không tìm thấy vai trò với mã ${code}.`, 404);
    }

    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (Array.isArray(allowedMenus)) role.allowedMenus = allowedMenus;
    if (Array.isArray(allowedRoutes)) role.allowedRoutes = allowedRoutes;
    if (Array.isArray(useCases)) role.useCases = useCases;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    return sendSuccess(res, role, `Cập nhật vai trò ${code} thành công.`);
  } catch (error) {
    console.error('updateRole error:', error);
    return sendError(res, 'Lỗi khi cập nhật vai trò.', 500);
  }
};

/**
 * @desc    Tái tạo hoặc đặt lại vai trò mặc định
 * @route   POST /api/roles/seed
 */
const resetRolesSeed = async (req, res) => {
  try {
    const result = await seedRolesAndEmployees();
    return sendSuccess(res, result, 'Khởi tạo dữ liệu 5 vai trò và nhân viên thành công.');
  } catch (error) {
    console.error('resetRolesSeed error:', error);
    return sendError(res, 'Lỗi khi seed dữ liệu vai trò.', 500);
  }
};

module.exports = {
  getRoles,
  getRoleByCode,
  updateRole,
  resetRolesSeed,
};

