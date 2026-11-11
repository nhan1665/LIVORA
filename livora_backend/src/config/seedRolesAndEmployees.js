const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const Employee = require('../models/Employee');

const INITIAL_ROLES = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Toàn quyền tối cao quản trị toàn bộ hệ thống LIVORA',
    badgeClass: 'badge-super',
    useCases: [
      'Thiết lập động',
      'Phân quyền',
      'Đăng nhập',
      'Đăng xuất',
      'Quên mật khẩu',
      'Toàn quyền quản trị hệ thống',
    ],
    allowedMenus: ['dashboard', 'home', 'customers', 'products', 'rooms', 'interactions', 'orders', 'settings'],
    allowedRoutes: [
      '/dashboard',
      '/dashboard/revenue',
      '/home-management',
      '/customers',
      '/customers/list',
      '/products',
      '/products/categories',
      '/products/list',
      '/rooms',
      '/rooms/list',
      '/rooms/inspirations',
      '/rooms/spaces',
      '/interactions',
      '/interactions/contact',
      '/interactions/reviews',
      '/orders',
      '/orders/list',
      '/orders/refunds',
      '/settings',
      '/settings/vouchers',
      '/settings/shipping',
      '/settings/permissions',
      '/settings/system-config',
    ],
  },
  {
    code: 'KE_TOAN',
    name: 'Kế toán',
    description: 'Xem báo cáo doanh thu và xử lý các yêu cầu hoàn tiền',
    badgeClass: 'badge-finance',
    useCases: [
      'Xem báo cáo',
      'Xử lý yêu cầu hoàn tiền',
      'Đăng nhập',
      'Đăng xuất',
      'Quên mật khẩu',
    ],
    allowedMenus: ['dashboard', 'orders'],
    allowedRoutes: [
      '/dashboard',
      '/dashboard/revenue',
      '/orders',
      '/orders/refunds',
    ],
  },
  {
    code: 'NV_VAN_HANH',
    name: 'Nhân viên vận hành',
    description: 'Xử lý đơn hàng, quản lý khách hàng, quản lý voucher và thiết lập vận chuyển',
    badgeClass: 'badge-ops',
    useCases: [
      'Xử lý đơn hàng',
      'Quản lý khách hàng',
      'Quản lý voucher',
      'Thiết lập vận chuyển',
      'Đăng nhập',
      'Đăng xuất',
      'Quên mật khẩu',
    ],
    allowedMenus: ['customers', 'orders', 'settings'],
    allowedRoutes: [
      '/customers',
      '/customers/list',
      '/orders',
      '/orders/list',
      '/settings',
      '/settings/vouchers',
      '/settings/shipping',
    ],
  },
  {
    code: 'NV_NOI_DUNG',
    name: 'Nhân viên nội dung',
    description: 'Quản lý sản phẩm, loại sản phẩm, danh sách phòng, cảm hứng, không gian và toàn bộ trang chủ',
    badgeClass: 'badge-content',
    useCases: [
      'Quản lý không gian',
      'Quản lý danh sách phòng',
      'Quản lý Footer',
      'Quản lý danh sách cảm hứng',
      'Quản lý Blogs',
      'Quản lý thông báo Marquee',
      'Quản lý banner',
      'Quản lý thương hiệu',
      'Quản lý sản phẩm',
      'Quản lý loại sản phẩm',
      'Đăng nhập',
      'Đăng xuất',
      'Quên mật khẩu',
    ],
    allowedMenus: ['home', 'products', 'rooms'],
    allowedRoutes: [
      '/home-management',
      '/products',
      '/products/categories',
      '/products/list',
      '/rooms',
      '/rooms/list',
      '/rooms/inspirations',
      '/rooms/spaces',
    ],
  },
  {
    code: 'CSKH',
    name: 'CSKH',
    description: 'Chăm sóc khách hàng, xử lý tin nhắn liên hệ và quản lý phản hồi đánh giá',
    badgeClass: 'badge-cskh',
    useCases: [
      'Xử lý liên hệ',
      'Quản lý đánh giá',
      'Đăng nhập',
      'Đăng xuất',
      'Quên mật khẩu',
    ],
    allowedMenus: ['interactions'],
    allowedRoutes: [
      '/interactions',
      '/interactions/contact',
      '/interactions/reviews',
    ],
  },
];

const INITIAL_EMPLOYEES = [
  {
    code: 'NV-LIV-001',
    username: 'admin',
    fullName: 'Quản Trị Viên (Super Admin)',
    email: 'admin@livora.vn',
    phone: '0901000001',
    role: 'SUPER_ADMIN',
    password: '123456',
  },
  {
    code: 'NV-LIV-002',
    username: 'ketoan',
    fullName: 'Trần Thị Mai (Kế toán)',
    email: 'ketoan@livora.vn',
    phone: '0901000002',
    role: 'KE_TOAN',
    password: '123456',
  },
  {
    code: 'NV-LIV-003',
    username: 'vanhanh',
    fullName: 'Lê Hoàng Nam (Vận hành)',
    email: 'vanhanh@livora.vn',
    phone: '0901000003',
    role: 'NV_VAN_HANH',
    password: '123456',
  },
  {
    code: 'NV-LIV-004',
    username: 'noidung',
    fullName: 'Đặng Thu Hà (Nội dung)',
    email: 'noidung@livora.vn',
    phone: '0901000004',
    role: 'NV_NOI_DUNG',
    password: '123456',
  },
  {
    code: 'NV-LIV-005',
    username: 'cskh',
    fullName: 'Vũ Thùy Linh (CSKH)',
    email: 'cskh@livora.vn',
    phone: '0901000005',
    role: 'CSKH',
    password: '123456',
  },
];

const seedRolesAndEmployees = async () => {
  try {
    // 1. Khởi tạo / cập nhật 5 Roles
    for (const r of INITIAL_ROLES) {
      await Role.findOneAndUpdate(
        { code: r.code },
        { $set: r },
        { upsert: true, new: true }
      );
    }
    console.log('✅ [Roles] Đã khởi tạo và đồng bộ 5 vai trò hệ thống.');

    // 2. Khởi tạo / cập nhật nhân viên cho 5 vai trò
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('123456', salt);

    for (const emp of INITIAL_EMPLOYEES) {
      const existing = await Employee.findOne({
        $or: [{ code: emp.code }, { username: emp.username }, { email: emp.email }],
      });

      if (!existing) {
        await Employee.create({
          code: emp.code,
          username: emp.username,
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone,
          passwordHash: defaultPasswordHash,
          role: emp.role,
        });
        console.log(`✅ [Employees] Đã tạo nhân viên ${emp.fullName} (${emp.role})`);
      } else {
        // Cập nhật vai trò chuẩn cho nhân viên
        existing.role = emp.role;
        if (!existing.fullName) existing.fullName = emp.fullName;
        await existing.save();
      }
    }

    // 3. Đảm bảo tài khoản đang đăng nhập (như DTNHAN hoặc tài khoản Admin đầu tiên) là SUPER_ADMIN
    await Employee.updateMany(
      {
        $or: [
          { username: 'DTNHAN' },
          { code: 'DTNHAN' },
          { username: 'admin' },
          { role: { $in: ['Admin', 'admin', 'QUAN_TRI_VIEN'] } },
        ],
      },
      { $set: { role: 'SUPER_ADMIN' } }
    );

    console.log('✅ [Employees] Đã hoàn tất gán vai trò nhân viên.');
    return true;
  } catch (error) {
    console.error('seedRolesAndEmployees error:', error);
    return false;
  }
};

module.exports = {
  INITIAL_ROLES,
  INITIAL_EMPLOYEES,
  seedRolesAndEmployees,
};

