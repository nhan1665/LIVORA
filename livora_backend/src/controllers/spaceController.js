const RoomDesign = require('../models/RoomDesign');
const { logActivityInternal } = require('./activityLogController');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

const getCleanCustomerCode = (cust, fallbackId) => {
  if (cust && cust.code && typeof cust.code === 'string' && cust.code.trim()) {
    return cust.code.trim().replace(/^#/, '');
  }
  if (fallbackId) {
    return `KH-${fallbackId.toString().slice(-4).toUpperCase()}`;
  }
  return 'KH-0001';
};

/**
 * @desc    Get room designs (templates & customer spaces)
 * @route   GET /api/room-designs
 */
const getRoomDesigns = async (req, res) => {
  try {
    const { search = '', roomId = '', customerId = '', customerCode = '', isTemplate = 'all', page = 1, pageSize = 10, all = 'false' } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { customerName: { $regex: search.trim(), $options: 'i' } },
        { customerCode: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (roomId) filter.roomId = roomId;
    if (customerId) filter.customerId = customerId;
    if (customerCode) {
      filter.$or = [
        { customerCode: customerCode },
        { customerCode: { $regex: customerCode, $options: 'i' } }
      ];
    }
    if (isTemplate !== 'all') filter.isTemplate = isTemplate === 'true';

    if (all === 'true') {
      const items = await RoomDesign.find(filter)
        .populate('roomId')
        .populate('customerId', 'fullName phone code email')
        .populate('suggestedProducts')
        .sort({ createdAt: -1 })
        .lean();

      return sendSuccess(res, items.map((s) => {
        const custObj = s.customerId && typeof s.customerId === 'object' ? s.customerId : null;
        let customerCode = custObj ? getCleanCustomerCode(custObj, custObj._id) : (s.customerCode ? s.customerCode.replace(/^#/, '') : '');
        let customerName = custObj?.fullName || s.customerName;
        let customerPhone = custObj?.phone || s.customerPhone || '';

        if (!customerName || customerName === 'Khách hàng' || customerCode === 'KH-USER' || !customerCode) {
          if (!s.isTemplate) {
            customerName = s.customerName && s.customerName !== 'Khách hàng' ? s.customerName : (custObj?.fullName ? custObj.fullName : 'Nguyễn Văn An');
            customerCode = customerCode && customerCode !== 'KH-USER' ? customerCode : (custObj ? getCleanCustomerCode(custObj, custObj._id) : 'KH-0001');
            customerPhone = customerPhone || '0901234567';
          } else {
            customerName = 'LIVORA Design';
            customerCode = 'LIVORA';
          }
        }

        return {
          id: s._id.toString(),
          code: s.code || `SP-${s._id.toString().slice(-4).toUpperCase()}`,
          name: s.name,
          roomId: s.roomId?._id ? s.roomId._id.toString() : s.roomId,
          roomName: s.roomId?.name || 'Phòng mẫu',
          customerId: custObj?._id ? custObj._id.toString() : (s.customerId ? s.customerId.toString() : null),
          customerCode,
          customerName,
          customerPhone,
          customer: {
            id: custObj?._id ? custObj._id.toString() : (s.customerId ? s.customerId.toString() : null),
            code: customerCode,
            fullName: customerName,
            phone: customerPhone,
          },
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
        };
      }));
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
      .populate('customerId', 'fullName phone code email')
      .populate('suggestedProducts', 'name sku price thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = designs.map((d) => {
      const custObj = d.customerId && typeof d.customerId === 'object' ? d.customerId : null;
      let customerCode = custObj ? getCleanCustomerCode(custObj, custObj._id) : (d.customerCode ? d.customerCode.replace(/^#/, '') : '');
      let customerName = custObj?.fullName || d.customerName;
      let customerPhone = custObj?.phone || d.customerPhone || '';

      if (!customerName || customerName === 'Khách hàng' || customerCode === 'KH-USER' || !customerCode) {
        if (!d.isTemplate) {
          customerName = d.customerName && d.customerName !== 'Khách hàng' ? d.customerName : (custObj?.fullName ? custObj.fullName : 'Nguyễn Văn An');
          customerCode = customerCode && customerCode !== 'KH-USER' ? customerCode : (custObj ? getCleanCustomerCode(custObj, custObj._id) : 'KH-0001');
          customerPhone = customerPhone || '0901234567';
        } else {
          customerName = 'LIVORA Design';
          customerCode = 'LIVORA';
        }
      }

      return {
        id: d._id.toString(),
        code: d.code || `SP-${d._id.toString().slice(-4).toUpperCase()}`,
        name: d.name,
        roomId: d.roomId?._id ? d.roomId._id.toString() : d.roomId,
        roomName: d.roomId?.name || 'Không gian chung',
        customerId: custObj?._id ? custObj._id.toString() : (d.customerId ? d.customerId.toString() : null),
        customerCode,
        customerName,
        customerPhone,
        customer: {
          id: custObj?._id ? custObj._id.toString() : (d.customerId ? d.customerId.toString() : null),
          code: customerCode,
          fullName: customerName,
          phone: customerPhone,
        },
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
      };
    });

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
    const {
      name,
      code: reqCode,
      roomId,
      customerId,
      customerName,
      customerCode,
      customerPhone,
      file3DUrl,
      previewImage,
      dimensions,
      lengthM,
      widthM,
      heightM,
      description,
      layoutData,
      suggestedProducts,
      isTemplate,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Tên không gian thiết kế là bắt buộc.', 400);
    }

    let finalCode = reqCode && reqCode.trim() ? reqCode.trim().toUpperCase() : '';
    if (!finalCode) {
      const count = await RoomDesign.countDocuments();
      let nextNum = count + 1;
      finalCode = `KG-${String(nextNum).padStart(3, '0')}`;
      while (await RoomDesign.findOne({ code: finalCode })) {
        nextNum++;
        finalCode = `KG-${String(nextNum).padStart(3, '0')}`;
      }
    }
    const code = finalCode;

    const parsedDims = dimensions || {
      length: Number(lengthM) || 6,
      width: Number(widthM) || 4,
      height: Number(heightM) || 2.8,
    };

    const mongoose = require('mongoose');
    let validRoomId = null;
    let finalPreview = previewImage;
    if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
      validRoomId = roomId;
      const Room = require('../models/Room');
      const roomDoc = await Room.findById(roomId).lean();
      if (roomDoc && roomDoc.thumbnail) {
        finalPreview = roomDoc.thumbnail;
      }
    }
    if (!finalPreview) {
      finalPreview = '/images/rooms/living-room.png';
    }

    let validCustomerId = customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null;
    let finalCustomerName = (customerName || '').trim();
    let finalCustomerCode = (customerCode || '').trim();
    let finalCustomerPhone = (customerPhone || '').trim();

    const Customer = require('../models/Customer');

    // Nếu không có customerId nhưng có token Authorization
    if (!validCustomerId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
          validCustomerId = decoded.id;
        }
      } catch (_) {}
    }

    // Tra cứu thông tin khách hàng từ DB nếu có ID
    if (validCustomerId) {
      try {
        const custDoc = await Customer.findById(validCustomerId).lean();
        if (custDoc) {
          finalCustomerName = custDoc.fullName || finalCustomerName;
          finalCustomerCode = getCleanCustomerCode(custDoc, custDoc._id);
          finalCustomerPhone = custDoc.phone || finalCustomerPhone;
          if (!custDoc.code || custDoc.code.startsWith('#')) {
            await Customer.findByIdAndUpdate(custDoc._id, { $set: { code: finalCustomerCode } });
          }
        }
      } catch (_) {}
    }

    // Nếu là thiết kế của khách hàng (isTemplate: false) mà vẫn chưa có thông tin, lấy khách hàng đầu tiên/mới nhất trong DB
    const isTpl = isTemplate !== undefined ? Boolean(isTemplate) : true;
    if (!isTpl && (!finalCustomerName || !validCustomerId)) {
      try {
        const sampleCustomer = await Customer.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
        if (sampleCustomer) {
          validCustomerId = sampleCustomer._id;
          finalCustomerName = sampleCustomer.fullName || finalCustomerName;
          finalCustomerCode = getCleanCustomerCode(sampleCustomer, sampleCustomer._id);
          finalCustomerPhone = sampleCustomer.phone || finalCustomerPhone;
        }
      } catch (_) {}
    }

    const design = new RoomDesign({
      code,
      name: name.trim(),
      roomId: validRoomId,
      customerId: validCustomerId,
      customerName: finalCustomerName,
      customerCode: finalCustomerCode,
      customerPhone: finalCustomerPhone,
      file3DUrl: file3DUrl || '',
      previewImage: finalPreview,
      dimensions: parsedDims,
      description: description || '',
      layoutData: layoutData || {},
      suggestedProducts: suggestedProducts || [],
      isTemplate: isTpl,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await design.save();

    logActivityInternal({
      entityType: 'space',
      entityId: design._id.toString(),
      entityCode: design.code,
      action: design.isTemplate ? 'Thêm mới không gian thiết kế' : 'Lưu bản thiết kế 3D của khách hàng',
      performedBy: design.isTemplate ? 'Quản trị viên (Admin)' : (design.customerName || 'Khách hàng'),
      role: design.isTemplate ? 'admin' : 'customer',
      details: `${design.isTemplate ? 'Tạo không gian mẫu' : 'Khách hàng thiết kế phòng'}: ${design.name} (${design.code})`,
    });

    return sendSuccess(res, {
      id: design._id.toString(),
      code: design.code,
      name: design.name,
      customerCode: design.customerCode,
      customerName: design.customerName,
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
      const mongoose = require('mongoose');
      design.roomId = (b.roomId && mongoose.Types.ObjectId.isValid(b.roomId)) ? b.roomId : null;
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

    logActivityInternal({
      entityType: 'space',
      entityId: design._id.toString(),
      entityCode: design.code,
      action: 'Cập nhật không gian thiết kế',
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Cập nhật thông tin kích thước và bố cục cho ${design.name} (${design.code})`,
    });

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

    logActivityInternal({
      entityType: 'space',
      entityId: design._id.toString(),
      entityCode: design.code,
      action: `Đổi trạng thái: ${design.isActive ? 'Kích hoạt' : 'Tạm dừng'}`,
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Chuyển trạng thái không gian ${design.name} sang ${design.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}`,
    });

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

    logActivityInternal({
      entityType: 'space',
      entityId: design._id.toString(),
      entityCode: design.code,
      action: 'Xóa không gian thiết kế',
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Đã xóa không gian ${design.name} (${design.code}) khỏi hệ thống`,
    });

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
    const seedMockSpacesAndProducts = require('../config/seedSpacesAndProducts');
    const result = await seedMockSpacesAndProducts(true);
    return sendSuccess(res, result, 'Đã đồng bộ 10 không gian (mỗi phòng 2 không gian) và 50 sản phẩm (mỗi phòng 10 sản phẩm) thành công.');
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
