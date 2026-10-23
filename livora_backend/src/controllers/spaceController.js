const RoomDesign = require('../models/RoomDesign');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get room designs (templates & customer spaces)
 * @route   GET /api/room-designs
 */
const getRoomDesigns = async (req, res) => {
  try {
    const { search = '', roomId = '', customerId = '', isTemplate = 'all', page = 1, pageSize = 10, all = 'false' } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (roomId) filter.roomId = roomId;
    if (customerId) filter.customerId = customerId;
    if (isTemplate !== 'all') filter.isTemplate = isTemplate === 'true';

    if (all === 'true') {
      const items = await RoomDesign.find(filter).populate('roomId').populate('suggestedProducts').sort({ createdAt: -1 }).lean();
      return sendSuccess(res, items.map((s) => ({
        id: s._id.toString(),
        code: s.code || `SP-${s._id.toString().slice(-4).toUpperCase()}`,
        name: s.name,
        roomId: s.roomId?._id ? s.roomId._id.toString() : s.roomId,
        roomName: s.roomId?.name || 'Phòng mẫu',
        file3DUrl: s.file3DUrl,
        previewImage: s.roomId?.thumbnail || s.previewImage || '/images/rooms/living-room.png',
        dimensions: s.dimensions || {
          length: s.lengthM || 6,
          width: s.widthM || 4,
          height: s.heightM || 2.8,
        },
        lengthM: s.lengthM || s.dimensions?.length || 6,
        widthM: s.widthM || s.dimensions?.width || 4,
        heightM: s.heightM || s.dimensions?.height || 2.8,
        description: s.description || '',
        suggestedProducts: s.suggestedProducts || [],
        layoutData: s.layoutData || {},
        isTemplate: s.isTemplate,
        isActive: s.isActive,
        createdAt: s.createdAt,
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
      .populate('roomId', 'name slug thumbnail')
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
      previewImage: d.roomId?.thumbnail || d.previewImage || '/images/rooms/living-room.png',
      dimensions: d.dimensions,
      lengthM: d.dimensions?.length || d.lengthM || 6,
      widthM: d.dimensions?.width || d.widthM || 4,
      heightM: d.dimensions?.height || d.heightM || 2.8,
      description: d.description,
      suggestedProducts: d.suggestedProducts || [],
      layoutData: d.layoutData || {},
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
    const { name, code: reqCode, roomId, customerId, file3DUrl, previewImage, dimensions, lengthM, widthM, heightM, description, layoutData, suggestedProducts, isTemplate, isActive } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Tên không gian thiết kế là bắt buộc.', 400);
    }

    const count = await RoomDesign.countDocuments();
    const code = reqCode || `KG-${String(count + 1).padStart(4, '0')}`;

    const parsedDims = dimensions || {
      length: Number(lengthM) || 6,
      width: Number(widthM) || 4,
      height: Number(heightM) || 2.8,
    };

    let finalPreview = previewImage;
    if (roomId) {
      const Room = require('../models/Room');
      const roomDoc = await Room.findById(roomId).lean();
      if (roomDoc && roomDoc.thumbnail) {
        finalPreview = roomDoc.thumbnail;
      }
    }
    if (!finalPreview) {
      finalPreview = '/images/rooms/living-room.png';
    }

    const design = new RoomDesign({
      code,
      name: name.trim(),
      roomId: roomId || null,
      customerId: customerId || null,
      file3DUrl: file3DUrl || '',
      previewImage: finalPreview,
      dimensions: parsedDims,
      description: description || '',
      layoutData: layoutData || {},
      suggestedProducts: suggestedProducts || [],
      isTemplate: isTemplate !== undefined ? Boolean(isTemplate) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await design.save();

    return sendSuccess(res, {
      id: design._id.toString(),
      code: design.code,
      name: design.name,
      lengthM: design.dimensions?.length || 6,
      widthM: design.dimensions?.width || 4,
      heightM: design.dimensions?.height || 2.8,
      previewImage: design.previewImage,
      isActive: design.isActive,
      layoutData: design.layoutData,
      suggestedProducts: design.suggestedProducts,
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
    if (b.code) design.code = b.code;
    if (b.roomId !== undefined) {
      design.roomId = b.roomId || null;
      if (!b.previewImage && design.roomId) {
        const Room = require('../models/Room');
        const roomDoc = await Room.findById(design.roomId).lean();
        if (roomDoc && roomDoc.thumbnail) {
          design.previewImage = roomDoc.thumbnail;
        }
      }
    }
    if (b.file3DUrl !== undefined) design.file3DUrl = b.file3DUrl;
    if (b.previewImage !== undefined) design.previewImage = b.previewImage;
    if (b.dimensions !== undefined) {
      design.dimensions = b.dimensions;
    } else if (b.lengthM !== undefined || b.widthM !== undefined || b.heightM !== undefined) {
      design.dimensions = {
        length: Number(b.lengthM) || design.dimensions?.length || 6,
        width: Number(b.widthM) || design.dimensions?.width || 4,
        height: Number(b.heightM) || design.dimensions?.height || 2.8,
      };
    }
    if (b.description !== undefined) design.description = b.description;
    if (b.suggestedProducts !== undefined) design.suggestedProducts = b.suggestedProducts;
    if (b.isTemplate !== undefined) design.isTemplate = Boolean(b.isTemplate);
    if (b.isActive !== undefined) design.isActive = Boolean(b.isActive);

    await design.save();

    return sendSuccess(res, {
      id: design._id.toString(),
      name: design.name,
      code: design.code,
      isActive: design.isActive,
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

/**
 * @desc    Seed default space templates
 * @route   GET /api/room-designs/seed-defaults
 */
const seedDefaultSpaces = async (req, res) => {
  try {
    const Room = require('../models/Room');
    const Product = require('../models/Product');

    const rooms = await Room.find({}).lean();
    const livingRoom = rooms.find(r => r.code === 'RM-LIVING' || (r.name && r.name.toLowerCase().includes('khách'))) || rooms[0];
    const bedRoom = rooms.find(r => r.code === 'RM-BEDROOM' || (r.name && r.name.toLowerCase().includes('ngủ'))) || rooms[1] || rooms[0];
    const kitchenRoom = rooms.find(r => r.code === 'RM-KITCHEN' || (r.name && r.name.toLowerCase().includes('bếp'))) || rooms[2] || rooms[0];
    const diningRoom = rooms.find(r => r.code === 'RM-DINING' || (r.name && r.name.toLowerCase().includes('ăn'))) || rooms[3] || rooms[0];

    const sampleProducts = await Product.find({}).limit(5).lean();
    const productIds = sampleProducts.map(p => p._id);

    const templates = [
      {
        code: 'KG-LIV-01',
        name: 'Phòng khách Penthouse Horizon',
        roomId: livingRoom ? livingRoom._id : null,
        file3DUrl: 'living_room_penthouse.glb',
        previewImage: '/images/rooms/living-room.png',
        dimensions: { length: 8, width: 4, height: 2.8 },
        description: 'Không gian mở đón trọn ánh sáng tự nhiên, phong cách Bắc Âu Hiện Đại.',
        suggestedProducts: productIds,
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-BED-01',
        name: 'Phòng ngủ Master Suite Zen',
        roomId: bedRoom ? bedRoom._id : null,
        file3DUrl: 'master_bedroom_zen.glb',
        previewImage: '/images/rooms/bedroom.png',
        dimensions: { length: 6, width: 4, height: 2.8 },
        description: 'Thiết kế tối giản giúp thư thái tinh thần và tái tạo năng lượng hoàn hảo.',
        suggestedProducts: productIds.slice(0, 3),
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-KIT-01',
        name: 'Phòng bếp Gourmet Island',
        roomId: kitchenRoom ? kitchenRoom._id : null,
        file3DUrl: 'gourmet_kitchen.glb',
        previewImage: '/images/rooms/kitchen.png',
        dimensions: { length: 5, width: 3.6, height: 2.8 },
        description: 'Tối ưu công năng lưu trữ, tích hợp đảo bếp sang trọng và thông thoáng.',
        suggestedProducts: productIds.slice(0, 2),
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-DIN-01',
        name: 'Phòng ăn Sum Vầy Harmony',
        roomId: diningRoom ? diningRoom._id : null,
        file3DUrl: 'harmony_dining.glb',
        previewImage: '/images/rooms/dining-room.png',
        dimensions: { length: 6, width: 3.5, height: 2.8 },
        description: 'Không gian kết nối yêu thương với bàn ăn lớn và ánh sáng vàng ấm áp.',
        suggestedProducts: productIds.slice(0, 2),
        isTemplate: true,
        isActive: true,
      },
    ];

    for (const t of templates) {
      const existing = await RoomDesign.findOne({ code: t.code });
      if (existing) {
        await RoomDesign.findByIdAndUpdate(existing._id, t);
      } else {
        await RoomDesign.create(t);
      }
    }

    const count = await RoomDesign.countDocuments({ isTemplate: true });
    return sendSuccess(res, { count }, `Đã đồng bộ ${count} không gian mẫu vào cơ sở dữ liệu.`);
  } catch (error) {
    console.error('seedDefaultSpaces error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getRoomDesigns,
  createRoomDesign,
  updateRoomDesign,
  toggleRoomDesign,
  deleteRoomDesign,
  seedDefaultSpaces,
};
