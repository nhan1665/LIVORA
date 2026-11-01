const Voucher = require('../models/Voucher');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

const validVnd = (value) =>
  (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()))) &&
  Number.isSafeInteger(Number(value)) && Number(value) >= 0;

/**
 * Helper: format voucher payload to return to client
 */
const formatVoucherData = (voucher) => {
  const applicableIds = Array.isArray(voucher.applicableCustomerIds)
    ? voucher.applicableCustomerIds.map((c) => (c._id ? c._id.toString() : c.toString()))
    : [];
  const applicableCustomers = Array.isArray(voucher.applicableCustomerIds)
    ? voucher.applicableCustomerIds
        .filter((c) => c && typeof c === 'object' && c._id)
        .map((c) => ({
          id: c._id.toString(),
          fullName: c.fullName || '',
          email: c.email || '',
          phone: c.phone || '',
          code: c.code || '',
        }))
    : [];

  return {
    id: voucher._id.toString(),
    code: voucher.code,
    title: voucher.title,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscountAmount: voucher.maxDiscountAmount,
    minOrderValue: voucher.minOrderValue,
    quantity: voucher.quantity,
    usedCount: voucher.usedCount,
    perCustomerLimit: voucher.perCustomerLimit,
    targetType: voucher.targetType || 'all',
    applicableCustomerIds: applicableIds,
    applicableCount: applicableIds.length,
    applicableCustomers,
    startDate: voucher.startDate.toISOString(),
    endDate: voucher.endDate.toISOString(),
    isActive: voucher.isActive,
  };
};

/**
 * @desc    Get all vouchers with filtering, searching & pagination
 * @route   GET /api/vouchers
 * @access  Admin
 */
const getVouchers = async (req, res) => {
  try {
    const {
      search = '',
      discountType = 'all',
      status = 'all',
      time = 'all',
      page = 1,
      pageSize = 5,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(50, parseInt(pageSize)));

    // Build filter query
    const filter = {};

    // Search by code or title
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
      ];
    }

    // Filter by discount type
    if (discountType !== 'all') {
      filter.discountType = discountType;
    }

    // Filter by active status
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }

    // Filter by time window
    const now = new Date();
    if (time === 'upcoming') {
      filter.startDate = { $gt: now };
    } else if (time === 'running') {
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    } else if (time === 'expired') {
      filter.endDate = { $lt: now };
    }

    // Count total matching + total active
    const [totalItems, activeCount] = await Promise.all([
      Voucher.countDocuments(filter),
      Voucher.countDocuments({ isActive: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    // Fetch paginated results
    const vouchers = await Voucher.find(filter)
      .populate('applicableCustomerIds', 'fullName email phone code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map _id to id for frontend compatibility
    const items = vouchers.map(formatVoucherData);

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      activeCount,
    });
  } catch (error) {
    console.error('getVouchers error:', error);
    return sendError(res, 'Không thể tải danh sách voucher.', 500);
  }
};

/**
 * @desc    Get single voucher by ID
 * @route   GET /api/vouchers/:id
 * @access  Admin
 */
const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('applicableCustomerIds', 'fullName email phone code')
      .lean();
    if (!voucher) {
      return sendError(res, 'Không tìm thấy voucher.', 404);
    }

    const data = formatVoucherData(voucher);
    return sendSuccess(res, data);
  } catch (error) {
    console.error('getVoucherById error:', error);
    return sendError(res, 'Không thể tải thông tin voucher.', 500);
  }
};

/**
 * @desc    Create a new voucher
 * @route   POST /api/vouchers
 * @access  Admin
 */
const createVoucher = async (req, res) => {
  try {
    const {
      code, title, discountType, discountValue,
      maxDiscountAmount, minOrderValue, quantity,
      perCustomerLimit, targetType, applicableCustomerIds,
      startDate, endDate, isActive,
    } = req.body;

    // Validate required fields
    if (!code || !code.trim()) {
      return sendError(res, 'Vui lòng nhập mã voucher.', 400);
    }
    if (!title || !title.trim()) {
      return sendError(res, 'Vui lòng nhập tên chương trình ưu đãi.', 400);
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check code format
    if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
      return sendError(res, 'Mã voucher chỉ gồm chữ in hoa, chữ số và dấu gạch ngang.', 400);
    }

    // Check duplicate code
    const existing = await Voucher.findOne({ code: normalizedCode });
    if (existing) {
      return sendError(res, `Mã voucher "${normalizedCode}" đã tồn tại. Vui lòng nhập mã khác.`, 409);
    }

    // Validate discount value
    if (!discountValue || discountValue <= 0) {
      return sendError(res, 'Giá trị giảm phải lớn hơn 0.', 400);
    }
    if (!validVnd(minOrderValue) || !validVnd(maxDiscountAmount ?? 0) ||
      (discountType === 'fixed_amount' && !validVnd(discountValue))) {
      return sendError(res, 'Giá trị tiền của voucher phải là số nguyên VND không âm.', 400);
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return sendError(res, 'Giá trị giảm theo phần trăm không được vượt quá 100%.', 400);
    }
    if (discountType === 'percentage' && (!maxDiscountAmount || maxDiscountAmount <= 0)) {
      return sendError(res, 'Vui lòng nhập hạn mức giảm tối đa cho voucher theo phần trăm.', 400);
    }
    if (discountType === 'fixed_amount' && maxDiscountAmount > 0 && maxDiscountAmount < discountValue) {
      return sendError(res, 'Hạn mức giảm tối đa không được nhỏ hơn giá trị giảm cố định.', 400);
    }

    // Validate min order
    if (!minOrderValue || minOrderValue <= 0) {
      return sendError(res, 'Giá trị đơn hàng tối thiểu phải lớn hơn 0.', 400);
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return sendError(res, 'Số lượng voucher phát hành phải lớn hơn 0.', 400);
    }

    // Validate dates
    if (!startDate || !endDate) {
      return sendError(res, 'Vui lòng chọn thời gian hiệu lực của voucher.', 400);
    }
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      return sendError(res, 'Thời gian kết thúc phải sau thời điểm kích hoạt.', 400);
    }

    // Validate per customer limit
    if (perCustomerLimit !== undefined && perCustomerLimit <= 0) {
      return sendError(res, 'Giới hạn lượt dùng mỗi khách hàng phải lớn hơn 0.', 400);
    }

    // Validate targetType & applicableCustomerIds
    const normalizedTargetType = targetType === 'specific' ? 'specific' : 'all';
    let customerIds = [];
    if (normalizedTargetType === 'specific') {
      if (!Array.isArray(applicableCustomerIds) || applicableCustomerIds.length === 0) {
        return sendError(res, 'Vui lòng chọn ít nhất một khách hàng cho voucher chỉ định.', 400);
      }
      customerIds = applicableCustomerIds;
    }

    // Create voucher
    const voucher = await Voucher.create({
      code: normalizedCode,
      title: title.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      minOrderValue: Number(minOrderValue),
      quantity: Number(quantity),
      usedCount: 0,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      targetType: normalizedTargetType,
      applicableCustomerIds: customerIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== false,
    });

    const populated = await Voucher.findById(voucher._id)
      .populate('applicableCustomerIds', 'fullName email phone code')
      .lean();

    return sendSuccess(res, formatVoucherData(populated), `Đã tạo voucher ${voucher.code} thành công.`, 201);
  } catch (error) {
    console.error('createVoucher error:', error);
    if (error.code === 11000) {
      return sendError(res, 'Mã voucher đã tồn tại.', 409);
    }
    return sendError(res, error.message || 'Không thể tạo voucher.', 500);
  }
};

/**
 * @desc    Update an existing voucher
 * @route   PUT /api/vouchers/:id
 * @access  Admin
 */
const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return sendError(res, 'Không tìm thấy voucher.', 404);
    }

    const {
      code, title, discountType, discountValue,
      maxDiscountAmount, minOrderValue, quantity,
      perCustomerLimit, targetType, applicableCustomerIds,
      startDate, endDate, isActive,
    } = req.body;

    const effectiveType = discountType ?? voucher.discountType;
    const effectiveDiscount = discountValue ?? voucher.discountValue;
    if ((minOrderValue !== undefined && !validVnd(minOrderValue)) ||
      (maxDiscountAmount !== undefined && !validVnd(maxDiscountAmount)) ||
      (effectiveType === 'fixed_amount' && !validVnd(effectiveDiscount))) {
      return sendError(res, 'Giá trị tiền của voucher phải là số nguyên VND không âm.', 400);
    }

    // Validate code
    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
        return sendError(res, 'Mã voucher chỉ gồm chữ in hoa, chữ số và dấu gạch ngang.', 400);
      }
      // Check duplicate code (exclude current voucher)
      const existing = await Voucher.findOne({ code: normalizedCode, _id: { $ne: req.params.id } });
      if (existing) {
        return sendError(res, `Mã voucher "${normalizedCode}" đã tồn tại. Vui lòng nhập mã khác.`, 409);
      }
      voucher.code = normalizedCode;
    }

    if (title !== undefined) voucher.title = title.trim();
    if (discountType !== undefined) voucher.discountType = discountType;
    if (discountValue !== undefined) voucher.discountValue = Number(discountValue);
    if (maxDiscountAmount !== undefined) voucher.maxDiscountAmount = Number(maxDiscountAmount);
    if (minOrderValue !== undefined) voucher.minOrderValue = Number(minOrderValue);
    if (quantity !== undefined) voucher.quantity = Number(quantity);
    if (perCustomerLimit !== undefined) voucher.perCustomerLimit = Number(perCustomerLimit);
    if (startDate !== undefined) voucher.startDate = new Date(startDate);
    if (endDate !== undefined) voucher.endDate = new Date(endDate);
    if (isActive !== undefined) voucher.isActive = isActive;

    if (targetType !== undefined) {
      voucher.targetType = targetType === 'specific' ? 'specific' : 'all';
    }
    if (voucher.targetType === 'specific') {
      if (applicableCustomerIds !== undefined) {
        if (!Array.isArray(applicableCustomerIds) || applicableCustomerIds.length === 0) {
          return sendError(res, 'Vui lòng chọn ít nhất một khách hàng cho voucher chỉ định.', 400);
        }
        voucher.applicableCustomerIds = applicableCustomerIds;
      } else if (!voucher.applicableCustomerIds || voucher.applicableCustomerIds.length === 0) {
        return sendError(res, 'Vui lòng chọn ít nhất một khách hàng cho voucher chỉ định.', 400);
      }
    } else {
      voucher.applicableCustomerIds = [];
    }

    // Validate after update
    if (voucher.discountValue <= 0) {
      return sendError(res, 'Giá trị giảm phải lớn hơn 0.', 400);
    }
    if (voucher.discountType === 'percentage' && voucher.discountValue > 100) {
      return sendError(res, 'Giá trị giảm theo phần trăm không được vượt quá 100%.', 400);
    }
    if (voucher.endDate.getTime() <= voucher.startDate.getTime()) {
      return sendError(res, 'Thời gian kết thúc phải sau thời điểm kích hoạt.', 400);
    }

    await voucher.save();

    const populated = await Voucher.findById(voucher._id)
      .populate('applicableCustomerIds', 'fullName email phone code')
      .lean();

    return sendSuccess(res, formatVoucherData(populated), `Đã cập nhật voucher ${voucher.code}.`);
  } catch (error) {
    console.error('updateVoucher error:', error);
    if (error.code === 11000) {
      return sendError(res, 'Mã voucher đã tồn tại.', 409);
    }
    return sendError(res, error.message || 'Không thể cập nhật voucher.', 500);
  }
};

/**
 * @desc    Toggle voucher isActive status
 * @route   PATCH /api/vouchers/:id/toggle
 * @access  Admin
 */
const toggleVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return sendError(res, 'Không tìm thấy voucher.', 404);
    }

    voucher.isActive = !voucher.isActive;
    await voucher.save();

    const action = voucher.isActive ? 'kích hoạt' : 'tạm tắt';
    const populated = await Voucher.findById(voucher._id)
      .populate('applicableCustomerIds', 'fullName email phone code')
      .lean();

    return sendSuccess(res, formatVoucherData(populated), `Đã ${action} voucher ${voucher.code}.`);
  } catch (error) {
    console.error('toggleVoucher error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái voucher.', 500);
  }
};

/**
 * @desc    Bulk create vouchers from Excel/CSV import
 * @route   POST /api/vouchers/bulk
 * @access  Admin
 */
const createVouchersBulk = async (req, res) => {
  try {
    const { vouchers = [] } = req.body;
    if (!Array.isArray(vouchers) || vouchers.length === 0) {
      return sendError(res, 'Danh sách voucher tải lên không hợp lệ hoặc rỗng.', 400);
    }

    const inserted = [];
    const errors = [];
    const existingCodes = new Set(
      (await Voucher.find({}, 'code').lean()).map((v) => v.code.toUpperCase())
    );

    for (let i = 0; i < vouchers.length; i++) {
      const item = vouchers[i];
      const rowNum = i + 2; // Tính theo dòng Excel bắt đầu từ 2

      if (!item.code || !item.code.trim()) {
        errors.push(`Dòng ${rowNum}: Thiếu mã voucher.`);
        continue;
      }

      const normalizedCode = item.code.trim().toUpperCase();
      if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
        errors.push(`Dòng ${rowNum}: Mã "${normalizedCode}" chỉ gồm chữ in hoa, số và dấu gạch ngang.`);
        continue;
      }

      if (existingCodes.has(normalizedCode)) {
        errors.push(`Dòng ${rowNum}: Mã "${normalizedCode}" đã tồn tại trong hệ thống.`);
        continue;
      }

      if (!item.title || !item.title.trim()) {
        errors.push(`Dòng ${rowNum}: Thiếu tên chương trình ưu đãi.`);
        continue;
      }

      const discountType = item.discountType === 'fixed_amount' ? 'fixed_amount' : 'percentage';
      const discountValue = Number(item.discountValue);
      if (!discountValue || discountValue <= 0) {
        errors.push(`Dòng ${rowNum}: Giá trị giảm phải lớn hơn 0.`);
        continue;
      }
      if (discountType === 'percentage' && discountValue > 100) {
        errors.push(`Dòng ${rowNum}: Giá trị giảm theo phần trăm không được vượt quá 100%.`);
        continue;
      }

      const maxDiscountAmount = Number(item.maxDiscountAmount) || 0;
      const minOrderValue = Number(item.minOrderValue) || 1;
      const quantity = Number(item.quantity) || 100;
      const perCustomerLimit = Number(item.perCustomerLimit) || 1;

      let startDate = item.startDate ? new Date(item.startDate) : new Date();
      let endDate = item.endDate ? new Date(item.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (isNaN(startDate.getTime())) startDate = new Date();
      if (isNaN(endDate.getTime())) endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      try {
        const created = await Voucher.create({
          code: normalizedCode,
          title: item.title.trim(),
          discountType,
          discountValue,
          maxDiscountAmount,
          minOrderValue,
          quantity,
          usedCount: 0,
          perCustomerLimit,
          targetType: item.targetType === 'specific' ? 'specific' : 'all',
          applicableCustomerIds: Array.isArray(item.applicableCustomerIds) ? item.applicableCustomerIds : [],
          startDate,
          endDate,
          isActive: item.isActive !== false,
        });

        existingCodes.add(normalizedCode);
        inserted.push(created.code);
      } catch (err) {
        errors.push(`Dòng ${rowNum} (${normalizedCode}): ${err.message}`);
      }
    }

    return sendSuccess(res, {
      totalUploaded: vouchers.length,
      insertedCount: inserted.length,
      insertedCodes: inserted,
      errorCount: errors.length,
      errors,
    }, `Đã nhập thành công ${inserted.length}/${vouchers.length} voucher.`);
  } catch (error) {
    console.error('createVouchersBulk error:', error);
    return sendError(res, error.message || 'Lỗi khi nhập danh sách voucher.', 500);
  }
};

module.exports = {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  toggleVoucher,
  createVouchersBulk,
};
