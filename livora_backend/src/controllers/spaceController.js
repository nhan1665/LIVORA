const RoomDesign = require('../models/RoomDesign');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get room designs (templates & customer spaces)
 * @route   GET /api/room-designs
 */
const getRoomDesigns = async (req, res) => {
  try {
    const { search = '', roomId = '', isTemplate = 'all', page = 1, pageSize = 10, all = 'false' } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (roomId) filter.roomId = roomId;
    if (isTemplate !== 'all') filter.isTemplate = isTemplate === 'true';

    if (all === 'true') {
      const items = await RoomDesign.find(filter).populate('roomId').populate('suggestedProducts').lean();
      return sendSuccess(res, items.map((s) => ({
        id: s._id.toString(),
        code: s.code || `SP-${s._id.toString().slice(-4).toUpperCase()}`,
        name: s.name,
        roomName: s.roomId?.name || 'Phòng mẫu',
        file3DUrl: s.file3DUrl,
        previewImage: s.previewImage,
        isTemplate: s.isTemplate,
        isActive: s.isActive,
      })));
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, templateCount] = await Promise.all([
      RoomDesign.countDocuments(filter),
      RoomDesign.countDocuments({ isTemplate: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const designs = await RoomDesign.find(filter)
      .populate('roomId', 'name slug')
      .populate('customerId', 'fullName phone')
      .populate('suggestedProducts', 'name sku price thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = designs.map((d) => ({
      id: d._id.toString(),
      code: d.code || `SP-${d._id.toString().slice(-4).toUpperCase()}`,
      name: d.name,
      roomId: d.roomId?._id ? d.roomId._id.toString() : d.roomId,
      roomName: d.roomId?.name || 'Không gian chung',
      customerId: d.customerId?._id ? d.customerId._id.toString() : d.customerId,
      customerName: d.customerId?.fullName || 'LIVORA Design',
      customerPhone: d.customerId?.phone || '',
      file3DUrl: d.file3DUrl,
      previewImage: d.previewImage,
      dimensions: d.dimensions,
      description: d.description,
      suggestedProducts: d.suggestedProducts || [],
      isTemplate: d.isTemplate,
      isActive: d.isActive,
      createdAt: d.createdAt,
    }));

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      templateCount,
    });
  } catch (error) {
    console.error('getRoomDesigns error:', error);
    return sendError(res, 'Không thể tải danh sách không gian thiết kế.', 500);
  }
};

/**
 * @desc    Create room design
 * @route   POST /api/room-designs
 */
const createRoomDesign = async (req, res) => {
  try {
    const { name, roomId, file3DUrl, previewImage, dimensions, description, suggestedProducts, isTemplate } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Tên không gian thiết kế là bắt buộc.', 400);
    }

    const count = await RoomDesign.countDocuments();
    const code = `SP-${String(count + 1).padStart(4, '0')}`;

    const design = new RoomDesign({
      code,
      name: name.trim(),
      roomId: roomId || null,
      file3DUrl: file3DUrl || '',
      previewImage: previewImage || '/images/rooms/default-space.png',
      dimensions: dimensions || { length: 0, width: 0, height: 0 },
      description: description || '',
      suggestedProducts: suggestedProducts || [],
      isTemplate: isTemplate !== undefined ? Boolean(isTemplate) : true,
      isActive: true,
    });

    await design.save();

    return sendSuccess(res, {
      id: design._id.toString(),
      code: design.code,
      name: design.name,
    }, 'Thêm mới không gian thiết kế thành công.', 201);
  } catch (error) {
    console.error('createRoomDesign error:', error);
    return sendError(res, error.message || 'Không thể tạo không gian thiết kế.', 500);
  }
};

/**
 * @desc    Update room design
 * @route   PUT /api/room-designs/:id
 */
const updateRoomDesign = async (req, res) => {
  try {
    const design = await RoomDesign.findById(req.params.id);
    if (!design) return sendError(res, 'Không tìm thấy không gian thiết kế.', 404);

    const b = req.body;
    if (b.name) design.name = b.name.trim();
    if (b.roomId !== undefined) design.roomId = b.roomId || null;
    if (b.file3DUrl !== undefined) design.file3DUrl = b.file3DUrl;
    if (b.previewImage !== undefined) design.previewImage = b.previewImage;
    if (b.dimensions !== undefined) design.dimensions = b.dimensions;
    if (b.description !== undefined) design.description = b.description;
    if (b.suggestedProducts !== undefined) design.suggestedProducts = b.suggestedProducts;
    if (b.isTemplate !== undefined) design.isTemplate = Boolean(b.isTemplate);

    await design.save();

    return sendSuccess(res, {
      id: design._id.toString(),
      name: design.name,
    }, 'Cập nhật không gian thiết kế thành công.');
  } catch (error) {
    console.error('updateRoomDesign error:', error);
    return sendError(res, error.message || 'Không thể cập nhật không gian.', 500);
  }
};

/**
 * @desc    Toggle room design active status
 * @route   PATCH /api/room-designs/:id/toggle
 */
const toggleRoomDesign = async (req, res) => {
  try {
    const design = await RoomDesign.findById(req.params.id);
    if (!design) return sendError(res, 'Không tìm thấy không gian thiết kế.', 404);

    design.isActive = !design.isActive;
    await design.save();

    return sendSuccess(res, {
      id: design._id.toString(),
      isActive: design.isActive,
    }, `Đã ${design.isActive ? 'kích hoạt' : 'tạm dừng'} không gian thiết kế.`);
  } catch (error) {
    console.error('toggleRoomDesign error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái không gian.', 500);
  }
};

/**
 * @desc    Delete room design
 * @route   DELETE /api/room-designs/:id
 */
const deleteRoomDesign = async (req, res) => {
  try {
    const design = await RoomDesign.findById(req.params.id);
    if (!design) return sendError(res, 'Không tìm thấy không gian thiết kế.', 404);

    await RoomDesign.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa không gian thiết kế thành công.');
  } catch (error) {
    console.error('deleteRoomDesign error:', error);
    return sendError(res, 'Không thể xóa không gian.', 500);
  }
};

module.exports = {
  getRoomDesigns,
  createRoomDesign,
  updateRoomDesign,
  toggleRoomDesign,
  deleteRoomDesign,
};
