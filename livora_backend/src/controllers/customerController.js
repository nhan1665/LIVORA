const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get customers list with filter, search, summary & pagination
 * @route   GET /api/customers
 */
const getCustomers = async (req, res) => {
  try {
    const {
      search = '',
      customerType = 'all',
      status = 'all',
      page = 1,
      pageSize = 10,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { fullName: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    if (customerType !== 'all') {
      filter.customerType = customerType;
    }

    if (status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, registeredCustomers, guestCustomers, activeThisMonth, totalItems] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ customerType: 'registered' }),
      Customer.countDocuments({ customerType: 'guest' }),
      Customer.countDocuments({ lastActiveAt: { $gte: firstDayOfMonth } }),
      Customer.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = customers.map((c) => {
      const defaultAddr = c.addresses?.find((a) => a.isDefault) || c.addresses?.[0];
      const addressString = defaultAddr
        ? [defaultAddr.addressLine, defaultAddr.ward, defaultAddr.district, defaultAddr.province].filter(Boolean).join(', ')
        : 'Chưa có địa chỉ';

      return {
        id: c._id.toString(),
        code: c.code || `#KH-${c._id.toString().slice(-4).toUpperCase()}`,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        customerType: c.customerType,
        status: c.status,
        isActive: c.status === 'active',
        activeThisMonth: c.lastActiveAt ? new Date(c.lastActiveAt) >= firstDayOfMonth : false,
        totalOrders: c.totalOrders || 0,
        accumulatedSpent: c.accumulatedSpent || 0,
        address: addressString,
        createdAt: c.createdAt,
      };
    });

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      summary: {
        totalCustomers,
        registeredCustomers,
        guestCustomers,
        activeThisMonth,
      },
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    return sendError(res, 'Không thể tải danh sách khách hàng.', 500);
  }
};

/**
 * @desc    Get customer details by ID (including address list & order history)
 * @route   GET /api/customers/:id
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return sendError(res, 'Không tìm thấy khách hàng.', 404);
    }

    // Lấy lịch sử đơn hàng của khách hàng
    const orders = await Order.find({
      $or: [{ userId: customer._id }, { 'customerInfo.phone': customer.phone }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((o) => ({
      id: o._id.toString(),
      orderCode: o.orderCode,
      createdAt: o.createdAt,
      totalAmount: o.finalAmount,
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      itemCount: o.items?.reduce((acc, it) => acc + it.quantity, 0) || 0,
    }));

    return sendSuccess(res, {
      id: customer._id.toString(),
      code: customer.code || `#KH-${customer._id.toString().slice(-4).toUpperCase()}`,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      customerType: customer.customerType,
      status: customer.status,
      isActive: customer.status === 'active',
      birthDate: customer.birthDate,
      gender: customer.gender,
      addresses: customer.addresses || [],
      totalOrders: orders.length,
      accumulatedSpent: orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0),
      orders: formattedOrders,
      createdAt: customer.createdAt,
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    return sendError(res, 'Không thể tải thông tin chi tiết khách hàng.', 500);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 */
const createCustomer = async (req, res) => {
  try {
    const { fullName, email, phone, customerType, address, birthDate, gender } = req.body;

    if (!fullName || !phone) {
      return sendError(res, 'Họ tên và số điện thoại là bắt buộc.', 400);
    }

    const count = await Customer.countDocuments();
    const code = `KH-${String(count + 1).padStart(4, '0')}`;

    const customer = new Customer({
      code,
      fullName: fullName.trim(),
      email: email ? email.trim().toLowerCase() : `${code.toLowerCase()}@guest.livora.vn`,
      phone: phone.trim(),
      customerType: customerType || 'registered',
      status: 'active',
      birthDate: birthDate || null,
      gender: gender || '',
      addresses: address ? [{
        isDefault: true,
        label: 'Mặc định',
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine: address.trim(),
      }] : [],
    });

    await customer.save();

    return sendSuccess(res, {
      id: customer._id.toString(),
      code: customer.code,
      fullName: customer.fullName,
      phone: customer.phone,
    }, 'Tạo thông tin khách hàng thành công.', 201);
  } catch (error) {
    console.error('createCustomer error:', error);
    return sendError(res, error.message || 'Không thể tạo khách hàng.', 500);
  }
};

/**
 * @desc    Update customer profile
 * @route   PUT /api/customers/:id
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return sendError(res, 'Không tìm thấy khách hàng.', 404);

    const { fullName, email, phone, birthDate, gender, status } = req.body;
    if (fullName) customer.fullName = fullName.trim();
    if (email) customer.email = email.trim().toLowerCase();
    if (phone) customer.phone = phone.trim();
    if (birthDate !== undefined) customer.birthDate = birthDate;
    if (gender !== undefined) customer.gender = gender;
    if (status) {
      customer.status = status;
      customer.isActive = status === 'active';
    }

    await customer.save();

    return sendSuccess(res, {
      id: customer._id.toString(),
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
    }, 'Cập nhật thông tin khách hàng thành công.');
  } catch (error) {
    console.error('updateCustomer error:', error);
    return sendError(res, error.message || 'Không thể cập nhật khách hàng.', 500);
  }
};

/**
 * @desc    Toggle customer active/locked status
 * @route   PATCH /api/customers/:id/toggle
 */
const toggleCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return sendError(res, 'Không tìm thấy khách hàng.', 404);

    customer.status = customer.status === 'active' ? 'locked' : 'active';
    customer.isActive = customer.status === 'active';
    await customer.save();

    return sendSuccess(res, {
      id: customer._id.toString(),
      status: customer.status,
      isActive: customer.isActive,
    }, `Đã ${customer.status === 'active' ? 'mở khóa' : 'khóa'} tài khoản khách hàng.`);
  } catch (error) {
    console.error('toggleCustomer error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái khách hàng.', 500);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  toggleCustomer,
};
