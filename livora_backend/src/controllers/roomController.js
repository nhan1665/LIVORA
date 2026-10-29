const Room = require('../models/Room');
const Product = require('../models/Product');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get rooms (with filter/search/pagination)
 * @route   GET /api/rooms
 */
const getRooms = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      page = 1,
      pageSize = 10,
      all = 'false',
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { slug: { $regex: term, $options: 'i' } },
      ];
    }

    if (status !== 'all') {
      filter.isActive = status === 'active' || status === 'true';
    }

    if (all === 'true') {
      const items = await Room.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
      return sendSuccess(res, items.map(r => ({
        id: r._id.toString(),
        code: r.code || (r.slug ? `RM-${r.slug.toUpperCase()}` : 'RM-SPACE'),
        name: r.name,
        slug: r.slug || '',
        description: r.description,
        thumbnail: r.thumbnail,
        displayOrder: r.displayOrder,
        isActive: r.isActive,
      })));
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, activeCount] = await Promise.all([
      Room.countDocuments(filter),
      Room.countDocuments({ isActive: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const rooms = await Room.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = await Promise.all(
      rooms.map(async (r) => {
        const productCount = await Product.countDocuments({
          $or: [{ roomIds: r._id }, { roomSlugs: r.slug }],
        });
        return {
          id: r._id.toString(),
          code: r.code || (r.slug ? `RM-${r.slug.toUpperCase()}` : 'RM-SPACE'),
          name: r.name,
          slug: r.slug || '',
          description: r.description,
          thumbnail: r.thumbnail,
          displayOrder: r.displayOrder,
          isActive: r.isActive,
          productCount,
        };
      })
    );

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      activeCount,
    });
  } catch (error) {
    console.error('getRooms error:', error);
    return sendError(res, 'Không thể tải danh sách không gian phòng.', 500);
  }
};

/**
 * @desc    Get room by ID
 * @route   GET /api/rooms/:id
 */
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).lean();
    if (!room) {
      return sendError(res, 'Không tìm thấy không gian phòng.', 404);
    }
    return sendSuccess(res, {
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      slug: room.slug,
      description: room.description,
      thumbnail: room.thumbnail,
      displayOrder: room.displayOrder,
      isActive: room.isActive,
    });
  } catch (error) {
    console.error('getRoomById error:', error);
    return sendError(res, 'Không thể tải thông tin phòng.', 500);
  }
};

/**
 * @desc    Create room
 * @route   POST /api/rooms
 */
const createRoom = async (req, res) => {
  try {
    const { code, name, slug, description, thumbnail, displayOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Vui lòng nhập tên phòng.', 400);
    }

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existing = await Room.findOne({ slug: autoSlug });
    if (existing) {
      return sendError(res, `Slug [${autoSlug}] đã tồn tại. Vui lòng chọn slug khác.`, 400);
    }

    const room = new Room({
      code: code ? code.trim().toUpperCase() : `RM-${autoSlug.toUpperCase()}`,
      name: name.trim(),
      slug: autoSlug,
      description: description || '',
      thumbnail: thumbnail || '',
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await room.save();

    return sendSuccess(res, {
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      slug: room.slug,
      description: room.description,
      thumbnail: room.thumbnail,
      displayOrder: room.displayOrder,
      isActive: room.isActive,
    }, 'Thêm mới phòng thành công.', 201);
  } catch (error) {
    console.error('createRoom error:', error);
    return sendError(res, error.message || 'Không thể tạo phòng.', 500);
  }
};

/**
 * @desc    Update room
 * @route   PUT /api/rooms/:id
 */
const updateRoom = async (req, res) => {
  try {
    const { code, name, slug, description, thumbnail, displayOrder, isActive } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return sendError(res, 'Không tìm thấy phòng.', 404);
    }

    if (name) room.name = name.trim();
    if (code) room.code = code.trim().toUpperCase();
    if (slug) room.slug = slug.trim().toLowerCase();
    if (description !== undefined) room.description = description;
    if (thumbnail !== undefined) room.thumbnail = thumbnail;
    if (displayOrder !== undefined) room.displayOrder = Number(displayOrder);
    if (isActive !== undefined) room.isActive = Boolean(isActive);

    await room.save();

    return sendSuccess(res, {
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      slug: room.slug,
      description: room.description,
      thumbnail: room.thumbnail,
      displayOrder: room.displayOrder,
      isActive: room.isActive,
    }, 'Cập nhật phòng thành công.');
  } catch (error) {
    console.error('updateRoom error:', error);
    return sendError(res, error.message || 'Không thể cập nhật phòng.', 500);
  }
};

/**
 * @desc    Toggle room status (Ẩn / Hiện)
 * @route   PATCH /api/rooms/:id/toggle
 */
const toggleRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return sendError(res, 'Không tìm thấy phòng.', 404);
    }

    room.isActive = !room.isActive;
    await room.save();

    return sendSuccess(res, {
      id: room._id.toString(),
      isActive: room.isActive,
    }, `Đã ${room.isActive ? 'kích hoạt' : 'tạm dừng'} phòng thành công.`);
  } catch (error) {
    console.error('toggleRoom error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái phòng.', 500);
  }
};

/**
 * @desc    Delete room
 * @route   DELETE /api/rooms/:id
 */
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return sendError(res, 'Không tìm thấy phòng.', 404);
    }

    await Room.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa phòng thành công.');
  } catch (error) {
    console.error('deleteRoom error:', error);
    return sendError(res, 'Không thể xóa phòng.', 500);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleRoom,
  deleteRoom,
};
