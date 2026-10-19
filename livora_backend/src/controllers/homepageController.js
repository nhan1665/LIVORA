const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Banner = require('../models/Banner');
const Marquee = require('../models/Marquee');
const Brand = require('../models/Brand');
const Footer = require('../models/Footer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const buildIdQuery = (id) => {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  }
  return { _id: id };
};

// Date parsers & formatters
const parseDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d === 'string') {
    const parts = d.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day));
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Automatic one-time sync: if MarqueeNotifications / FooterSettings exist, migrate to Marquees & Footers
const syncCollections = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    // 0. Drop extra Staffs collection
    if (names.includes('Staffs')) {
      await db.collection('Staffs').drop().catch(() => {});
      console.log('🗑️ Đã xóa collection Staffs thành công!');
    }
    if (names.includes('staffs')) {
      await db.collection('staffs').drop().catch(() => {});
    }

    // 1. Sync Marquees
    if (names.includes('MarqueeNotifications')) {
      const oldCol = db.collection('MarqueeNotifications');
      const targetCol = db.collection('Marquees');
      const countTarget = await targetCol.countDocuments();
      if (countTarget === 0) {
        const oldDocs = await oldCol.find({}).toArray();
        if (oldDocs.length > 0) {
          const migrated = oldDocs.map((d) => ({
            code: d.code,
            title: d.content || d.title,
            iconType: d.icon || d.iconType || 'truck',
            startDate: formatDate(d.startDate),
            endDate: formatDate(d.endDate),
            order: d.displayOrder || d.order || 1,
            status: d.status === 'active' || d.status === 'Đang hoạt động' ? 'Đang hoạt động' : 'Đã ẩn',
            createdAt: d.createdAt || new Date(),
            updatedAt: d.updatedAt || new Date(),
          }));
          await targetCol.insertMany(migrated);
        }
      }
      await oldCol.drop().catch(() => {});
    }

    // 2. Sync Footers
    if (names.includes('FooterSettings')) {
      const oldCol = db.collection('FooterSettings');
      const targetCol = db.collection('Footers');
      const countTarget = await targetCol.countDocuments();
      if (countTarget === 0) {
        const oldDoc = await oldCol.findOne({});
        if (oldDoc) {
          const items = [
            {
              key: 'facebook',
              name: 'Facebook',
              subtitle: 'Trang cộng đồng',
              value: oldDoc.facebook?.url || 'https://facebook.com/maisonatelier.vn',
              status: oldDoc.facebook?.visible !== false ? 'Hiển thị' : 'Ẩn',
              iconType: 'facebook',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              key: 'instagram',
              name: 'Instagram',
              subtitle: 'Bộ sưu tập hình ảnh',
              value: oldDoc.instagram?.url || 'https://instagram.com/maisonatelier.vn',
              status: oldDoc.instagram?.visible !== false ? 'Hiển thị' : 'Ẩn',
              iconType: 'instagram',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              key: 'zalo',
              name: 'Zalo Official',
              subtitle: 'Hỗ trợ khách hàng',
              value: oldDoc.zalo?.url || 'https://zalo.me/maisonatelier',
              status: oldDoc.zalo?.visible !== false ? 'Hiển thị' : 'Ẩn',
              iconType: 'zalo',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              key: 'phone',
              name: 'Số điện thoại',
              subtitle: 'Hotline showroom',
              value: oldDoc.phone?.number || '1900 6868 - 0918.421.xxx',
              status: oldDoc.phone?.visible !== false ? 'Hiển thị' : 'Ẩn',
              iconType: 'phone',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
          await targetCol.insertMany(items);
        }
      }
      await oldCol.drop().catch(() => {});
    }
  } catch (err) {
    console.error('syncCollections error:', err);
  }
};

// =========================================================================
// 1. MARQUEES (Collection: Marquees)
// =========================================================================
const defaultMarquees = [
  {
    code: '#MQ-081',
    title: 'Miễn phí vận chuyển và lắp đặt toàn quốc cho đơn hàng từ 5.000.000đ',
    iconType: 'truck',
    startDate: '01/10/2026',
    endDate: '31/12/2026',
    order: 1,
    status: 'Đang hoạt động',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: '#MQ-082',
    title: 'Trưng bày BST Thu Đông 2026 - Khám phá không gian sống đương đại',
    iconType: 'sparkle',
    startDate: '15/10/2026',
    endDate: '15/11/2026',
    order: 2,
    status: 'Đang hoạt động',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: '#MQ-083',
    title: 'Đặt lịch tư vấn không gian nội thất cùng chuyên gia kiến trúc sư Livora',
    iconType: 'user',
    startDate: '01/09/2026',
    endDate: '31/10/2026',
    order: 3,
    status: 'Đang hoạt động',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: '#MQ-084',
    title: 'Ra mắt dòng sofa mô-đun cao cấp phong cách Bắc Âu tối giản',
    iconType: 'sofa',
    startDate: '20/10/2026',
    endDate: '20/11/2026',
    order: 4,
    status: 'Đang hoạt động',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: '#MQ-079',
    title: 'Ưu đãi giảm 10% khi kết hợp bàn trà cùng dòng thảm len dệt thủ công',
    iconType: 'discount',
    startDate: '01/08/2026',
    endDate: '31/08/2026',
    order: 5,
    status: 'Đã ẩn',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const isActiveStatus = (st) => st === 'Đang hoạt động' || st === 'active';

const countActiveMarquees = async (excludeId = null) => {
  const col = mongoose.connection.db.collection('Marquees');
  const query = {
    status: { $in: ['active', 'Đang hoạt động'] },
  };
  if (excludeId) {
    if (ObjectId.isValid(excludeId)) {
      query._id = { $nin: [new ObjectId(excludeId), excludeId] };
    } else {
      query._id = { $ne: excludeId };
    }
  }
  return await col.countDocuments(query);
};

const getMarquees = async (req, res) => {
  try {
    await syncCollections();
    const col = mongoose.connection.db.collection('Marquees');
    const filter = {};
    if (req.query.activeOnly === 'true') {
      filter.status = { $in: ['active', 'Đang hoạt động'] };
    }

    let docs = await col.find(filter).sort({ order: 1, displayOrder: 1, createdAt: -1 }).toArray();

    if (docs.length === 0 && Object.keys(filter).length === 0) {
      await col.insertMany(defaultMarquees);
      docs = await col.find({}).sort({ order: 1, displayOrder: 1, createdAt: -1 }).toArray();
    }

    const items = docs.map((d) => ({
      id: d._id.toString(),
      code: d.code || `MQ-${d._id.toString().slice(-4).toUpperCase()}`,
      title: d.title || d.content || '',
      iconType: d.iconType || d.icon || 'truck',
      startDate: formatDate(d.startDate),
      endDate: formatDate(d.endDate),
      order: d.order !== undefined ? Number(d.order) : (d.displayOrder !== undefined ? Number(d.displayOrder) : 1),
      status: d.status === 'active' || d.status === 'Đang hoạt động' ? 'Đang hoạt động' : 'Đã ẩn',
    }));

    return sendSuccess(res, items, 'Lấy danh sách thông báo Marquee thành công.');
  } catch (err) {
    console.error('getMarquees error:', err);
    return sendError(res, 'Không thể tải danh sách Marquee.', 500);
  }
};

const createMarquee = async (req, res) => {
  try {
    const { code, title, iconType, startDate, endDate, order, status } = req.body;
    if (!title || !title.trim()) {
      return sendError(res, 'Vui lòng nhập thông điệp thông báo.', 400);
    }

    const itemStatus = status || 'Đang hoạt động';
    if (isActiveStatus(itemStatus)) {
      const activeCount = await countActiveMarquees();
      if (activeCount >= 5) {
        return sendError(
          res,
          'Chỉ được phép kích hoạt tối đa 5 thông báo Marquee cùng lúc. Vui lòng tắt/ẩn bớt thông báo đang hoạt động trước khi thêm mới hoặc chọn trạng thái "Đã ẩn".',
          400
        );
      }
    }

    const col = mongoose.connection.db.collection('Marquees');
    const newDoc = {
      code: code ? code.trim().toUpperCase() : `MQ-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      iconType: iconType || 'truck',
      startDate: startDate || '',
      endDate: endDate || '',
      order: Math.max(1, Number(order) || 1),
      status: isActiveStatus(itemStatus) ? 'Đang hoạt động' : 'Đã ẩn',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(newDoc);
    return sendSuccess(
      res,
      { id: result.insertedId.toString(), ...newDoc },
      'Thêm thông báo Marquee thành công.',
      201
    );
  } catch (err) {
    console.error('createMarquee error:', err);
    return sendError(res, 'Không thể tạo thông báo Marquee.', 500);
  }
};

const updateMarquee = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, iconType, startDate, endDate, order, status } = req.body;

    const col = mongoose.connection.db.collection('Marquees');
    const current = await col.findOne(buildIdQuery(id));
    if (!current) {
      return sendError(res, 'Không tìm thấy thông báo Marquee.', 404);
    }

    if (status !== undefined && isActiveStatus(status)) {
      const wasActive = isActiveStatus(current.status);
      if (!wasActive) {
        const activeCount = await countActiveMarquees(id);
        if (activeCount >= 5) {
          return sendError(
            res,
            'Chỉ được phép kích hoạt tối đa 5 thông báo Marquee cùng lúc. Vui lòng tắt/ẩn bớt thông báo khác trước khi bật thông báo này.',
            400
          );
        }
      }
    }

    const updateFields = { updatedAt: new Date() };
    if (code !== undefined) updateFields.code = code.trim().toUpperCase();
    if (title !== undefined) updateFields.title = title.trim();
    if (iconType !== undefined) updateFields.iconType = iconType;
    if (startDate !== undefined) updateFields.startDate = startDate;
    if (endDate !== undefined) updateFields.endDate = endDate;
    if (order !== undefined) updateFields.order = Math.max(1, Number(order));
    if (status !== undefined) {
      updateFields.status = isActiveStatus(status) ? 'Đang hoạt động' : 'Đã ẩn';
    }

    await col.updateOne(buildIdQuery(id), { $set: updateFields });
    const updated = await col.findOne(buildIdQuery(id));

    return sendSuccess(
      res,
      updated
        ? {
            id: updated._id.toString(),
            code: updated.code,
            title: updated.title || updated.content,
            iconType: updated.iconType || updated.icon,
            startDate: formatDate(updated.startDate),
            endDate: formatDate(updated.endDate),
            order: updated.order || updated.displayOrder || 1,
            status: updated.status,
          }
        : { id, ...updateFields },
      'Cập nhật thông báo Marquee thành công.'
    );
  } catch (err) {
    console.error('updateMarquee error:', err);
    return sendError(res, 'Không thể cập nhật thông báo Marquee.', 500);
  }
};

const toggleMarquee = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Marquees');
    const current = await col.findOne(buildIdQuery(id));

    if (!current) {
      return sendError(res, 'Không tìm thấy thông báo Marquee.', 404);
    }

    const currentStatus = isActiveStatus(current.status) ? 'Đang hoạt động' : 'Đã ẩn';
    const nextStatus = currentStatus === 'Đang hoạt động' ? 'Đã ẩn' : 'Đang hoạt động';

    if (nextStatus === 'Đang hoạt động') {
      const activeCount = await countActiveMarquees(id);
      if (activeCount >= 5) {
        return sendError(
          res,
          'Chỉ được phép kích hoạt tối đa 5 thông báo Marquee cùng lúc. Vui lòng tắt/ẩn bớt thông báo khác trước khi bật thông báo này.',
          400
        );
      }
    }

    await col.updateOne(buildIdQuery(id), { $set: { status: nextStatus, updatedAt: new Date() } });

    return sendSuccess(res, { id, status: nextStatus }, `Đã chuyển trạng thái sang "${nextStatus}".`);
  } catch (err) {
    console.error('toggleMarquee error:', err);
    return sendError(res, 'Không thể thay đổi trạng thái Marquee.', 500);
  }
};

const deleteMarquee = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Marquees');
    await col.deleteOne(buildIdQuery(id));
    return sendSuccess(res, { id }, 'Xóa thông báo Marquee thành công.');
  } catch (err) {
    console.error('deleteMarquee error:', err);
    return sendError(res, 'Không thể xóa thông báo Marquee.', 500);
  }
};

// =========================================================================
// 2. BANNERS (Collection: Banners - with Atlas validation)
// =========================================================================
const defaultBanners = [
  {
    title: 'Banner Bộ sưu tập Mùa Thu',
    description: 'Chiến dịch Autumn Heritage 2026 - Bản phát hành giới hạn',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&auto=format&fit=crop&q=85',
    linkUrl: '/products?collection=autumn-heritage-2026',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-11-30T23:59:59.000Z'),
    status: 'active',
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Banner Khuyến mãi Kiến trúc 2026',
    description: 'Ưu đãi mùa hoàn thiện công trình cho studio và KTS',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format&fit=crop&q=85',
    linkUrl: '/promotions/architecture-2026',
    startDate: new Date('2026-03-15T00:00:00.000Z'),
    endDate: new Date('2026-04-30T23:59:59.000Z'),
    status: 'active',
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Banner Không gian Phòng khách',
    description: 'Bộ sưu tập nội thất The Serene Living phong cách Wabi Sabi',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&auto=format&fit=crop&q=85',
    linkUrl: '/rooms/living-room',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T23:59:59.000Z'),
    status: 'active',
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Banner Tri ân Khách hàng VIP',
    description: 'Chương trình Private Salon & Quyền lợi đặc quyền gia chủ Maison',
    imageUrl: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&auto=format&fit=crop&q=85',
    linkUrl: '/vip-membership',
    startDate: new Date('2026-02-01T00:00:00.000Z'),
    endDate: new Date('2026-02-28T23:59:59.000Z'),
    status: 'active',
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Banner Khai xuân Phú Quý 2026',
    description: 'Chương trình mừng năm mới - Đã lưu trữ định kỳ',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920&auto=format&fit=crop&q=85',
    linkUrl: '/events/spring-2026',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-02-15T23:59:59.000Z'),
    status: 'hidden',
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const countActiveBanners = async (excludeId = null) => {
  const col = mongoose.connection.db.collection('Banners');
  const query = { status: 'active' };
  if (excludeId) {
    if (ObjectId.isValid(excludeId)) {
      query._id = { $nin: [new ObjectId(excludeId), excludeId] };
    } else {
      query._id = { $ne: excludeId };
    }
  }
  return await col.countDocuments(query);
};

const getBanners = async (req, res) => {
  try {
    const col = mongoose.connection.db.collection('Banners');
    const filter = {};
    if (req.query.activeOnly === 'true') {
      filter.status = 'active';
    }
    let docs = await col.find(filter).sort({ displayOrder: 1, createdAt: -1 }).toArray();

    if (docs.length === 0 && Object.keys(filter).length === 0) {
      await col.insertMany(defaultBanners);
      docs = await col.find({}).sort({ displayOrder: 1, createdAt: -1 }).toArray();
    }

    const items = docs.map((d) => ({
      id: d._id.toString(),
      title: d.title || '',
      subtitle: d.description || '',
      imageUrl: (d.imageUrl || '').replace('w=600', 'w=1920&q=85'),
      linkUrl: d.linkUrl || '',
      startDate: formatDate(d.startDate),
      endDate: formatDate(d.endDate),
      order: d.displayOrder !== undefined ? Number(d.displayOrder) : 1,
      status: d.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
    }));

    return sendSuccess(res, items, 'Lấy danh sách Banner thành công.');
  } catch (err) {
    console.error('getBanners error:', err);
    return sendError(res, 'Không thể tải danh sách Banner.', 500);
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, startDate, endDate, order, status } = req.body;
    if (!title || !imageUrl) {
      return sendError(res, 'Vui lòng nhập tiêu đề và chọn ảnh Banner.', 400);
    }

    const col = mongoose.connection.db.collection('Banners');
    const newDoc = {
      title: title.trim(),
      description: subtitle ? subtitle.trim() : '',
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl ? linkUrl.trim() : '',
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      status: status === 'Đã ẩn' ? 'hidden' : 'active',
      displayOrder: Math.max(1, Number(order) || 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(newDoc);
    return sendSuccess(
      res,
      {
        id: result.insertedId.toString(),
        title: newDoc.title,
        subtitle: newDoc.description,
        imageUrl: newDoc.imageUrl,
        linkUrl: newDoc.linkUrl,
        startDate: formatDate(newDoc.startDate),
        endDate: formatDate(newDoc.endDate),
        order: newDoc.displayOrder,
        status: newDoc.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
      },
      'Thêm Banner mới thành công.',
      201
    );
  } catch (err) {
    console.error('createBanner error:', err);
    return sendError(res, 'Không thể tạo Banner mới.', 500);
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, startDate, endDate, order, status } = req.body;

    const col = mongoose.connection.db.collection('Banners');
    const current = await col.findOne(buildIdQuery(id));
    if (!current) {
      return sendError(res, 'Không tìm thấy Banner cần cập nhật.', 404);
    }

    if (status !== undefined && (status === 'Đã ẩn' || status === 'hidden')) {
      const wasActive = current.status === 'active';
      if (wasActive) {
        const activeCount = await countActiveBanners();
        if (activeCount <= 3) {
          return sendError(
            res,
            'Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể chuyển sang trạng thái ẩn.',
            400
          );
        }
      }
    }

    const updateFields = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title.trim();
    if (subtitle !== undefined) updateFields.description = subtitle.trim();
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl.trim();
    if (linkUrl !== undefined) updateFields.linkUrl = linkUrl.trim();
    if (startDate !== undefined) updateFields.startDate = parseDate(startDate);
    if (endDate !== undefined) updateFields.endDate = parseDate(endDate);
    if (order !== undefined) updateFields.displayOrder = Math.max(1, Number(order));
    if (status !== undefined) updateFields.status = status === 'Đã ẩn' ? 'hidden' : 'active';

    await col.updateOne(buildIdQuery(id), { $set: updateFields });
    const updated = await col.findOne(buildIdQuery(id));

    return sendSuccess(
      res,
      updated
        ? {
            id: updated._id.toString(),
            title: updated.title,
            subtitle: updated.description,
            imageUrl: updated.imageUrl,
            linkUrl: updated.linkUrl,
            startDate: formatDate(updated.startDate),
            endDate: formatDate(updated.endDate),
            order: updated.displayOrder,
            status: updated.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
          }
        : { id },
      'Cập nhật Banner thành công.'
    );
  } catch (err) {
    console.error('updateBanner error:', err);
    return sendError(res, 'Không thể cập nhật Banner.', 500);
  }
};

const toggleBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Banners');
    const current = await col.findOne(buildIdQuery(id));

    if (!current) {
      return sendError(res, 'Không tìm thấy Banner.', 404);
    }

    const nextStatus = current.status === 'active' ? 'hidden' : 'active';
    if (nextStatus === 'hidden') {
      const activeCount = await countActiveBanners();
      if (activeCount <= 3) {
        return sendError(
          res,
          'Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể ẩn banner này.',
          400
        );
      }
    }

    await col.updateOne(buildIdQuery(id), { $set: { status: nextStatus, updatedAt: new Date() } });

    const uiStatus = nextStatus === 'active' ? 'Đang hiển thị' : 'Đã ẩn';
    return sendSuccess(res, { id, status: uiStatus }, `Đã chuyển trạng thái sang "${uiStatus}".`);
  } catch (err) {
    console.error('toggleBanner error:', err);
    return sendError(res, 'Không thể thay đổi trạng thái Banner.', 500);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Banners');
    const current = await col.findOne(buildIdQuery(id));

    if (current && current.status === 'active') {
      const activeCount = await countActiveBanners();
      if (activeCount <= 3) {
        return sendError(
          res,
          'Hệ thống yêu cầu duy trì tối thiểu 3 banner đang hiển thị trên trang chủ! Không thể xóa banner đang hiển thị này.',
          400
        );
      }
    }

    await col.deleteOne(buildIdQuery(id));
    return sendSuccess(res, { id }, 'Xóa Banner thành công.');
  } catch (err) {
    console.error('deleteBanner error:', err);
    return sendError(res, 'Không thể xóa Banner.', 500);
  }
};

// =========================================================================
// 3. BRANDS (Collection: Brands - with Atlas validation)
// =========================================================================
const defaultBrands = [
  {
    title: 'B&B Italia',
    origin: 'MEDA, LOMBARDY',
    content:
      'Biểu tượng di sản kiến trúc đương đại nước Ý từ năm 1966. Thiết kế đột phá bởi Antonio Citterio và Mario Bellini, tập trung vào kỹ thuật đúc bọt polyurethane và các cấu trúc module thư thái vượt thời gian.',
    logoUrl: '',
    websiteUrl: '',
    status: 'active',
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Minotti',
    origin: 'BRIANZA, Ý',
    content:
      'Đỉnh cao của sự cân bằng thị giác và nghệ thuật may đo thủ công tinh xảo dưới sự định hình của Rodolfo Dordoni. Nổi danh với các đường nét kiến trúc tinh giản, vải dệt cao cấp và bề mặt hoàn thiện tự nhiên.',
    logoUrl: '',
    websiteUrl: '',
    status: 'active',
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Poliform',
    origin: 'INVERIGO, COMO',
    content:
      'Chuẩn mực thiết kế không gian sống liền mạch với triết lý kiến trúc tổng thể. Nổi bật nhờ hệ thống tủ âm tường không tay nắm, mặt đá cẩm thạch chải mờ và hệ bàn tiệc gỗ sồi chưng cất phong vị tối giản ấm áp.',
    logoUrl: '',
    websiteUrl: '',
    status: 'active',
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Cassina',
    origin: 'MEDA, Ý',
    content:
      'Hãng sản xuất nắm giữ bản quyền bộ sưu tập kiệt tác "I Maestri" của Le Corbusier, Pierre Jeanneret và Charlotte Perriand. Giao thoa uyển chuyển giữa tính hợp lý của kết cấu công nghiệp và nghệ thuật mộc danh giá.',
    logoUrl: '',
    websiteUrl: '',
    status: 'hidden',
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Flexform',
    origin: 'LOMBARDY, Ý',
    content:
      'Chuyên sâu vào các thiết kế salon và sofa cao cấp tôn vinh cảm giác êm ái tự nhiên. Ngôn ngữ thiết kế nhấn mạnh vật liệu lanh thô, da thuộc cognac và khung gỗ tần bì tạo nên bầu không khí ấm cúng tĩnh lặng.',
    logoUrl: '',
    websiteUrl: '',
    status: 'active',
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const getBrands = async (req, res) => {
  try {
    const col = mongoose.connection.db.collection('Brands');
    let docs = await col.find({}).sort({ displayOrder: 1, createdAt: -1 }).toArray();

    if (docs.length === 0) {
      await col.insertMany(defaultBrands);
      docs = await col.find({}).sort({ displayOrder: 1, createdAt: -1 }).toArray();
    }

    const items = docs.map((d) => ({
      id: d._id.toString(),
      name: d.title || '',
      origin: d.origin || '',
      description: d.content || '',
      status: d.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
    }));

    return sendSuccess(res, items, 'Lấy danh sách thương hiệu thành công.');
  } catch (err) {
    console.error('getBrands error:', err);
    return sendError(res, 'Không thể tải danh sách thương hiệu.', 500);
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, origin, description, status } = req.body;
    if (!name) {
      return sendError(res, 'Vui lòng nhập tên thương hiệu.', 400);
    }

    const col = mongoose.connection.db.collection('Brands');
    const newDoc = {
      title: name.trim(),
      content: description ? description.trim() : name.trim(),
      origin: origin ? origin.trim() : 'Ý',
      logoUrl: '',
      websiteUrl: '',
      status: status === 'Đã ẩn' ? 'hidden' : 'active',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(newDoc);
    return sendSuccess(
      res,
      {
        id: result.insertedId.toString(),
        name: newDoc.title,
        origin: newDoc.origin,
        description: newDoc.content,
        status: newDoc.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
      },
      'Thêm thương hiệu mới thành công.',
      201
    );
  } catch (err) {
    console.error('createBrand error:', err);
    return sendError(res, 'Không thể tạo thương hiệu.', 500);
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, origin, description, status } = req.body;

    const col = mongoose.connection.db.collection('Brands');
    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.title = name.trim();
    if (origin !== undefined) updateFields.origin = origin.trim();
    if (description !== undefined) updateFields.content = description.trim();
    if (status !== undefined) updateFields.status = status === 'Đã ẩn' ? 'hidden' : 'active';

    await col.updateOne(buildIdQuery(id), { $set: updateFields });
    const updated = await col.findOne(buildIdQuery(id));

    return sendSuccess(
      res,
      updated
        ? {
            id: updated._id.toString(),
            name: updated.title,
            origin: updated.origin,
            description: updated.content,
            status: updated.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn',
          }
        : { id },
      'Cập nhật thương hiệu thành công.'
    );
  } catch (err) {
    console.error('updateBrand error:', err);
    return sendError(res, 'Không thể cập nhật thương hiệu.', 500);
  }
};

const toggleBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Brands');
    const current = await col.findOne(buildIdQuery(id));

    if (!current) {
      return sendError(res, 'Không tìm thấy thương hiệu.', 404);
    }

    const nextStatus = current.status === 'active' ? 'hidden' : 'active';
    await col.updateOne(buildIdQuery(id), { $set: { status: nextStatus, updatedAt: new Date() } });

    const uiStatus = nextStatus === 'active' ? 'Đang hiển thị' : 'Đã ẩn';
    return sendSuccess(res, { id, status: uiStatus }, `Đã chuyển trạng thái sang "${uiStatus}".`);
  } catch (err) {
    console.error('toggleBrand error:', err);
    return sendError(res, 'Không thể thay đổi trạng thái thương hiệu.', 500);
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Brands');
    await col.deleteOne(buildIdQuery(id));
    return sendSuccess(res, { id }, 'Xóa thương hiệu thành công.');
  } catch (err) {
    console.error('deleteBrand error:', err);
    return sendError(res, 'Không thể xóa thương hiệu.', 500);
  }
};

// =========================================================================
// 4. FOOTERS (Collection: Footers)
// =========================================================================
const defaultFooters = [
  {
    key: 'facebook',
    name: 'Facebook',
    subtitle: 'Trang cộng đồng',
    value: 'https://facebook.com/maisonatelier.vn',
    status: 'Hiển thị',
    iconType: 'facebook',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: 'instagram',
    name: 'Instagram',
    subtitle: 'Bộ sưu tập hình ảnh',
    value: 'https://instagram.com/maisonatelier.vn',
    status: 'Hiển thị',
    iconType: 'instagram',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: 'zalo',
    name: 'Zalo Official',
    subtitle: 'Hỗ trợ khách hàng',
    value: 'https://zalo.me/maisonatelier',
    status: 'Hiển thị',
    iconType: 'zalo',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: 'phone',
    name: 'Số điện thoại',
    subtitle: 'Hotline showroom',
    value: '1900 6868 - 0918.421.xxx',
    status: 'Hiển thị',
    iconType: 'phone',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const getFooters = async (req, res) => {
  try {
    await syncCollections();
    const col = mongoose.connection.db.collection('Footers');
    let docs = await col.find({}).toArray();

    if (docs.length === 0) {
      await col.insertMany(defaultFooters);
      docs = await col.find({}).toArray();
    }

    const items = docs.map((d) => ({
      id: d._id.toString(),
      key: d.key || 'facebook',
      name: d.name || '',
      subtitle: d.subtitle || '',
      value: d.value || '',
      status: d.status || 'Hiển thị',
      iconType: d.iconType || d.key || 'facebook',
    }));

    return sendSuccess(res, items, 'Lấy cấu hình chân trang thành công.');
  } catch (err) {
    console.error('getFooters error:', err);
    return sendError(res, 'Không thể tải cấu hình Footer.', 500);
  }
};

const createFooter = async (req, res) => {
  try {
    const { key, name, subtitle, value, status, iconType } = req.body;
    const col = mongoose.connection.db.collection('Footers');
    const newDoc = {
      key: key || 'facebook',
      name: name ? name.trim() : 'Kênh liên hệ',
      subtitle: subtitle ? subtitle.trim() : '',
      value: value ? value.trim() : '',
      status: status || 'Hiển thị',
      iconType: iconType || key || 'facebook',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await col.insertOne(newDoc);
    return sendSuccess(res, { id: result.insertedId.toString(), ...newDoc }, 'Thêm cấu hình Footer thành công.', 201);
  } catch (err) {
    console.error('createFooter error:', err);
    return sendError(res, 'Không thể tạo cấu hình Footer.', 500);
  }
};

const updateFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, name, subtitle, value, status, iconType } = req.body;
    const col = mongoose.connection.db.collection('Footers');

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name.trim();
    if (subtitle !== undefined) updateFields.subtitle = subtitle.trim();
    if (value !== undefined) updateFields.value = value.trim();
    if (status !== undefined) updateFields.status = status;
    if (iconType !== undefined) updateFields.iconType = iconType;

    let query = buildIdQuery(id);
    if (!ObjectId.isValid(id) && key) {
      query = { key };
    }

    await col.updateOne(query, { $set: updateFields });
    const updated = await col.findOne(query);

    return sendSuccess(res, updated ? { id: updated._id.toString(), ...updated } : { id, ...updateFields }, 'Cập nhật cấu hình Footer thành công.');
  } catch (err) {
    console.error('updateFooter error:', err);
    return sendError(res, 'Không thể cập nhật cấu hình Footer.', 500);
  }
};

const toggleFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Footers');
    const current = await col.findOne(buildIdQuery(id));

    if (!current) {
      return sendError(res, 'Không tìm thấy cấu hình Footer.', 404);
    }

    const nextStatus = current.status === 'Hiển thị' ? 'Ẩn' : 'Hiển thị';
    await col.updateOne(buildIdQuery(id), { $set: { status: nextStatus, updatedAt: new Date() } });

    return sendSuccess(res, { id, status: nextStatus }, `Đã chuyển trạng thái sang "${nextStatus}".`);
  } catch (err) {
    console.error('toggleFooter error:', err);
    return sendError(res, 'Không thể thay đổi trạng thái Footer.', 500);
  }
};

const deleteFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const col = mongoose.connection.db.collection('Footers');
    await col.deleteOne(buildIdQuery(id));
    return sendSuccess(res, { id }, 'Xóa cấu hình Footer thành công.');
  } catch (err) {
    console.error('deleteFooter error:', err);
    return sendError(res, 'Không thể xóa cấu hình Footer.', 500);
  }
};

module.exports = {
  getMarquees,
  createMarquee,
  updateMarquee,
  toggleMarquee,
  deleteMarquee,

  getBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,

  getBrands,
  createBrand,
  updateBrand,
  toggleBrand,
  deleteBrand,

  getFooters,
  createFooter,
  updateFooter,
  toggleFooter,
  deleteFooter,
};
