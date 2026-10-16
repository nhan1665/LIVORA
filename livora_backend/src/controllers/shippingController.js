const Shipping = require('../models/Shipping');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get shipping configurations
 * @route   GET /api/shipping
 */
const getShippingConfigs = async (req, res) => {
  try {
    const {
      search = '',
      method = 'all',
      status = 'all',
      page = 1,
      pageSize = 10,
      all = 'false',
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      filter.province = { $regex: search.trim(), $options: 'i' };
    }

    if (method !== 'all') {
      filter.shippingMethod = method;
    }

    if (status !== 'all') {
      filter.isActive = status === 'active';
    }

    if (all === 'true') {
      const items = await Shipping.find(filter).sort({ province: 1 }).lean();
      return sendSuccess(res, items.map((s) => ({
        id: s._id.toString(),
        shippingMethod: s.shippingMethod,
        province: s.province,
        fee: s.fee,
        estimatedDeliveryTime: s.estimatedDeliveryTime,
        isActive: s.isActive,
        hub: s.hub,
        feeNote: s.feeNote,
        freeShipEnabled: s.freeShipEnabled,
        freeShipThreshold: s.freeShipThreshold,
        timeSlot: s.timeSlot,
        whiteGloveIncluded: s.whiteGloveIncluded,
      })));
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, activeCount] = await Promise.all([
      Shipping.countDocuments(filter),
      Shipping.countDocuments({ isActive: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const configs = await Shipping.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = configs.map((s) => ({
      id: s._id.toString(),
      shippingMethod: s.shippingMethod,
      province: s.province,
      fee: s.fee,
      estimatedDeliveryTime: s.estimatedDeliveryTime,
      isActive: s.isActive,
      hub: s.hub,
      feeNote: s.feeNote,
      freeShipEnabled: s.freeShipEnabled,
      freeShipThreshold: s.freeShipThreshold,
      timeSlot: s.timeSlot,
      whiteGloveIncluded: s.whiteGloveIncluded,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      activeCount,
    });
  } catch (error) {
    console.error('getShippingConfigs error:', error);
    return sendError(res, 'Không thể tải danh sách cấu hình vận chuyển.', 500);
  }
};

/**
 * @desc    Create shipping configuration
 * @route   POST /api/shipping
 */
const createShippingConfig = async (req, res) => {
  try {
    const {
      shippingMethod,
      province,
      fee,
      estimatedDeliveryTime,
      isActive,
      hub,
      feeNote,
      freeShipEnabled,
      freeShipThreshold,
      timeSlot,
      whiteGloveIncluded,
    } = req.body;

    if (!shippingMethod || !province || fee === undefined || !estimatedDeliveryTime) {
      return sendError(res, 'Phương thức, tỉnh thành, phí và thời gian giao hàng là bắt buộc.', 400);
    }

    const shipping = new Shipping({
      shippingMethod,
      province: province.trim(),
      fee: Number(fee),
      estimatedDeliveryTime: estimatedDeliveryTime.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      hub: hub || '',
      feeNote: feeNote || '',
      freeShipEnabled: Boolean(freeShipEnabled),
      freeShipThreshold: Number(freeShipThreshold) || 0,
      timeSlot: timeSlot || 'Giờ hành chính (8h00 - 18h00)',
      whiteGloveIncluded: Boolean(whiteGloveIncluded),
    });

    await shipping.save();

    return sendSuccess(res, {
      id: shipping._id.toString(),
      province: shipping.province,
      shippingMethod: shipping.shippingMethod,
      fee: shipping.fee,
      isActive: shipping.isActive,
    }, 'Thêm mới cấu hình vận chuyển thành công.', 201);
  } catch (error) {
    console.error('createShippingConfig error:', error);
    return sendError(res, error.message || 'Không thể tạo cấu hình vận chuyển.', 500);
  }
};

/**
 * @desc    Update shipping configuration
 * @route   PUT /api/shipping/:id
 */
const updateShippingConfig = async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id);
    if (!shipping) return sendError(res, 'Không tìm thấy cấu hình vận chuyển.', 404);

    const b = req.body;
    if (b.shippingMethod) shipping.shippingMethod = b.shippingMethod;
    if (b.province) shipping.province = b.province.trim();
    if (b.fee !== undefined) shipping.fee = Number(b.fee);
    if (b.estimatedDeliveryTime) shipping.estimatedDeliveryTime = b.estimatedDeliveryTime.trim();
    if (b.isActive !== undefined) shipping.isActive = Boolean(b.isActive);
    if (b.hub !== undefined) shipping.hub = b.hub;
    if (b.feeNote !== undefined) shipping.feeNote = b.feeNote;
    if (b.freeShipEnabled !== undefined) shipping.freeShipEnabled = Boolean(b.freeShipEnabled);
    if (b.freeShipThreshold !== undefined) shipping.freeShipThreshold = Number(b.freeShipThreshold);
    if (b.timeSlot !== undefined) shipping.timeSlot = b.timeSlot;
    if (b.whiteGloveIncluded !== undefined) shipping.whiteGloveIncluded = Boolean(b.whiteGloveIncluded);

    await shipping.save();

    return sendSuccess(res, {
      id: shipping._id.toString(),
      province: shipping.province,
      fee: shipping.fee,
      isActive: shipping.isActive,
    }, 'Cập nhật cấu hình vận chuyển thành công.');
  } catch (error) {
    console.error('updateShippingConfig error:', error);
    return sendError(res, error.message || 'Không thể cập nhật cấu hình.', 500);
  }
};

/**
 * @desc    Toggle shipping status
 * @route   PATCH /api/shipping/:id/toggle
 */
const toggleShippingConfig = async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id);
    if (!shipping) return sendError(res, 'Không tìm thấy cấu hình vận chuyển.', 404);

    shipping.isActive = !shipping.isActive;
    await shipping.save();

    return sendSuccess(res, {
      id: shipping._id.toString(),
      isActive: shipping.isActive,
    }, `Đã ${shipping.isActive ? 'kích hoạt' : 'tạm dừng'} cấu hình vận chuyển.`);
  } catch (error) {
    console.error('toggleShippingConfig error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái cấu hình.', 500);
  }
};

/**
 * @desc    Delete shipping config
 * @route   DELETE /api/shipping/:id
 */
const deleteShippingConfig = async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id);
    if (!shipping) return sendError(res, 'Không tìm thấy cấu hình vận chuyển.', 404);

    await Shipping.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa cấu hình vận chuyển thành công.');
  } catch (error) {
    console.error('deleteShippingConfig error:', error);
    return sendError(res, 'Không thể xóa cấu hình.', 500);
  }
};

module.exports = {
  getShippingConfigs,
  createShippingConfig,
  updateShippingConfig,
  toggleShippingConfig,
  deleteShippingConfig,
};
