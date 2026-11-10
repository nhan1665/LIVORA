const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Helper tạo thông báo mới
 */
const createNotification = async ({ title, message, type = 'system', targetRoles = [], link = '', entityId = null, entityCode = '' }) => {
  try {
    const roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    // Đảm bảo Super Admin luôn có quyền xem
    if (!roles.includes('SUPER_ADMIN') && !roles.includes('ALL')) {
      roles.push('SUPER_ADMIN');
    }
    const notif = await Notification.create({
      title,
      message,
      type,
      targetRoles: roles,
      link,
      entityId: entityId ? entityId.toString() : null,
      entityCode,
    });
    return notif;
  } catch (err) {
    console.error('Lỗi khi tạo thông báo:', err.message);
    return null;
  }
};

/**
 * Tự động đồng bộ các thông báo ban đầu từ CSDL thực tế nếu chưa có
 */
const seedInitialNotificationsIfEmpty = async () => {
  try {
    const count = await Notification.countDocuments();
    if (count > 0) return;

    console.log('🔄 Đang đồng bộ thông báo ban đầu theo vai trò...');

    // 1. Kế toán: Các yêu cầu hoàn tiền đang chờ duyệt (Pending)
    const pendingRefunds = await Refund.find({ status: 'pending' }).limit(5).lean();
    for (const ref of pendingRefunds) {
      await Notification.create({
        title: `Yêu cầu hoàn tiền mới: ${ref.orderCode || 'Đơn hàng'}`,
        message: `Khách hàng ${ref.customerName || 'ẩn danh'} yêu cầu hoàn ${Number(ref.amount || 0).toLocaleString('vi-VN')} đ (Lý do: ${ref.reason || 'Sản phẩm lỗi'}). Cần kế toán kiểm tra và xử lý.`,
        type: 'refund',
        targetRoles: ['KE_TOAN', 'SUPER_ADMIN'],
        link: '/orders/refunds',
        entityId: ref._id.toString(),
        entityCode: ref.orderCode || '',
        createdAt: ref.createdAt || new Date(),
      });
    }

    // 2. CSKH: Các liên hệ / hỗ trợ mới (New)
    const newContacts = await Contact.find({ status: 'new' }).limit(5).lean();
    for (const c of newContacts) {
      await Notification.create({
        title: `Liên hệ tư vấn mới: ${c.fullName}`,
        message: `Khách hàng ${c.fullName} (${c.phone}) vừa gửi yêu cầu: "${(c.message || '').slice(0, 70)}...". Cần CSKH liên hệ phản hồi.`,
        type: 'contact',
        targetRoles: ['CSKH', 'SUPER_ADMIN'],
        link: '/interactions/contact',
        entityId: c._id.toString(),
        entityCode: c.code || '',
        createdAt: c.createdAt || new Date(),
      });
    }

    // 3. CSKH: Đánh giá mới từ khách hàng
    const pendingReviews = await Review.find().sort({ createdAt: -1 }).limit(3).lean();
    for (const rev of pendingReviews) {
      await Notification.create({
        title: `Đánh giá mới ${rev.rating || 5}⭐ từ khách hàng`,
        message: `${rev.customerName || 'Khách hàng'} vừa đánh giá: "${(rev.comment || 'Sản phẩm rất đẹp').slice(0, 60)}...".`,
        type: 'review',
        targetRoles: ['CSKH', 'SUPER_ADMIN'],
        link: '/interactions/reviews',
        entityId: rev._id.toString(),
        createdAt: rev.createdAt || new Date(),
      });
    }

    // 4. Vận hành: Đơn hàng mới cần xử lý
    const newOrders = await Order.find().sort({ createdAt: -1 }).limit(4).lean();
    for (const ord of newOrders) {
      const code = ord.orderNumber || ord.code || 'LIV-ORD';
      await Notification.create({
        title: `Đơn hàng mới #${code}`,
        message: `Đơn hàng trị giá ${Number(ord.totalAmount || 0).toLocaleString('vi-VN')} đ đang chờ bộ phận vận hành đóng gói và điều phối vận chuyển.`,
        type: 'order',
        targetRoles: ['NV_VAN_HANH', 'SUPER_ADMIN'],
        link: '/orders/list',
        entityId: ord._id.toString(),
        entityCode: code,
        createdAt: ord.createdAt || new Date(),
      });
    }

    // 5. Nhân viên nội dung: Cảnh báo cập nhật không gian & trang chủ
    await Notification.create({
      title: 'Chiến dịch nội dung & Trang chủ',
      message: 'Đã sẵn sàng cập nhật bộ sưu tập không gian mẫu và danh sách banner mới cho mùa khuyến mãi.',
      type: 'content',
      targetRoles: ['NV_NOI_DUNG', 'SUPER_ADMIN'],
      link: '/home-management',
      createdAt: new Date(),
    });

    console.log('✅ Đã đồng bộ thông báo ban đầu cho 5 vai trò.');
  } catch (err) {
    console.warn('Lỗi khi seed initial notifications:', err.message);
  }
};

/**
 * @desc    Lấy danh sách thông báo theo vai trò của người dùng
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    await seedInitialNotificationsIfEmpty();

    const roleParam = (req.query.role || '').toUpperCase();
    const userId = (req.query.userId || req.query.username || 'user').trim();

    // Chuẩn hóa vai trò
    let normalizedRole = roleParam;
    if (['ADMIN', 'QUAN_TRI_VIEN', 'QUANTRIVIEN', 'QUẢN TRỊ VIÊN', ''].includes(normalizedRole)) {
      normalizedRole = 'SUPER_ADMIN';
    }

    let filter = {};
    if (normalizedRole !== 'SUPER_ADMIN') {
      filter = {
        $or: [
          { targetRoles: normalizedRole },
          { targetRoles: 'ALL' },
        ],
      };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Map trạng thái đã đọc theo userId
    const mapped = notifications.map((n) => {
      const isRead = Array.isArray(n.readBy) && (n.readBy.includes(userId) || n.readBy.includes(normalizedRole));
      return {
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        targetRoles: n.targetRoles,
        link: n.link,
        entityId: n.entityId,
        entityCode: n.entityCode,
        isRead,
        createdAt: n.createdAt,
      };
    });

    const unreadCount = mapped.filter((n) => !n.isRead).length;

    return sendSuccess(
      res,
      {
        unreadCount,
        notifications: mapped,
        role: normalizedRole,
      },
      'Lấy danh sách thông báo thành công.'
    );
  } catch (error) {
    console.error('getNotifications error:', error);
    return sendError(res, 'Lỗi khi tải thông báo hệ thống.', 500);
  }
};

/**
 * @desc    Đánh dấu 1 thông báo đã đọc
 * @route   PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.body.userId || req.body.username || 'user').trim();

    await Notification.findByIdAndUpdate(
      id,
      {
        $addToSet: { readBy: userId },
      },
      { new: true }
    );

    return sendSuccess(res, { id, isRead: true }, 'Đã đánh dấu thông báo là đã đọc.');
  } catch (error) {
    console.error('markAsRead error:', error);
    return sendError(res, 'Lỗi khi cập nhật trạng thái thông báo.', 500);
  }
};

/**
 * @desc    Đánh dấu tất cả thông báo thuộc vai trò là đã đọc
 * @route   PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const roleParam = (req.body.role || '').toUpperCase();
    const userId = (req.body.userId || req.body.username || 'user').trim();

    let normalizedRole = roleParam;
    if (['ADMIN', 'QUAN_TRI_VIEN', 'QUANTRIVIEN', ''].includes(normalizedRole)) {
      normalizedRole = 'SUPER_ADMIN';
    }

    let filter = {};
    if (normalizedRole !== 'SUPER_ADMIN') {
      filter = {
        $or: [
          { targetRoles: normalizedRole },
          { targetRoles: 'ALL' },
        ],
      };
    }

    await Notification.updateMany(filter, {
      $addToSet: { readBy: userId },
    });

    return sendSuccess(res, { success: true }, 'Đã đánh dấu tất cả thông báo là đã đọc.');
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return sendError(res, 'Lỗi khi cập nhật tất cả thông báo.', 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  seedInitialNotificationsIfEmpty,
};

