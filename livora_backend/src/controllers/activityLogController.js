const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getModelForType = (type) => {
  switch (type) {
    case 'order': return require('../models/Order');
    case 'customer': return require('../models/Customer');
    case 'product': return require('../models/Product');
    case 'category': return require('../models/Category');
    case 'room': return require('../models/Room');
    case 'space': return require('../models/RoomDesign');
    case 'inspiration': return require('../models/Inspiration');
    case 'shipping': return require('../models/Shipping');
    case 'voucher': return require('../models/Voucher');
    case 'contact': return require('../models/Contact');
    case 'review': return require('../models/Review');
    case 'refund': return require('../models/Refund');
    default: return null;
  }
};

/**
 * @desc Get activity logs for an entity directly from MongoDB database
 * @route GET /api/activity-logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId, entityCode, limit = 100 } = req.query;

    if (!entityType && !entityId && !entityCode) {
      return sendError(res, 'Vui lòng cung cấp entityType hoặc entityId/entityCode.', 400);
    }

    const query = {};
    if (entityType) {
      query.entityType = String(entityType).trim();
    }

    const cleanId = entityId ? String(entityId).trim() : '';
    const cleanCode = entityCode ? String(entityCode).trim() : '';

    if (cleanId && cleanCode) {
      query.$or = [{ entityId: cleanId }, { entityCode: cleanCode }];
    } else if (cleanId) {
      query.entityId = cleanId;
    } else if (cleanCode) {
      query.entityCode = cleanCode;
    }

    let logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    // Nếu chưa có dòng lịch sử nào được ghi trong ActivityLog:
    // Tự động truy vấn bản ghi thực tế từ CSDL để lấy đúng createdAt và vai trò tạo ban đầu
    if (!logs || logs.length === 0) {
      const Model = getModelForType(entityType);
      if (Model) {
        let doc = null;
        if (cleanId && mongoose.isValidObjectId(cleanId)) {
          doc = await Model.findById(cleanId).lean();
        }
        if (!doc && cleanCode) {
          const codeField = entityType === 'shipping' ? 'province'
            : entityType === 'product' ? 'sku'
            : entityType === 'order' ? 'orderCode'
            : entityType === 'refund' ? 'refundCode'
            : 'code';
          doc = await Model.findOne({ [codeField]: cleanCode }).lean();
        }

        if (doc) {
          let performedBy = 'Quản trị viên (Admin)';
          let role = 'admin';
          let action = 'Khởi tạo bản ghi trên hệ thống';

          if (entityType === 'order') {
            performedBy = doc.customerInfo?.fullName || 'Khách hàng';
            role = 'customer';
            action = 'Khách hàng tạo mới đơn hàng qua Website';
          } else if (entityType === 'customer') {
            performedBy = doc.fullName || 'Khách hàng';
            role = 'customer';
            action = 'Đăng ký tài khoản thành viên';
          } else if (entityType === 'review') {
            performedBy = doc.customerName || 'Khách hàng';
            role = 'customer';
            action = 'Khách hàng gửi đánh giá sản phẩm';
          } else if (entityType === 'contact') {
            performedBy = doc.fullName || 'Khách hàng';
            role = 'customer';
            action = 'Khách hàng gửi liên hệ tư vấn';
          } else if (entityType === 'refund') {
            performedBy = doc.customerName || 'Khách hàng';
            role = 'customer';
            action = 'Khách hàng gửi yêu cầu hoàn tiền';
          } else if (entityType === 'space' && !doc.isTemplate) {
            performedBy = doc.customerName || 'Khách hàng';
            role = 'customer';
            action = 'Khách hàng lưu bản thiết kế 3D';
          } else if (entityType === 'product') {
            action = `Khởi tạo sản phẩm: ${doc.name || cleanCode}`;
          } else if (entityType === 'category') {
            action = `Khởi tạo loại sản phẩm: ${doc.name || cleanCode}`;
          } else if (entityType === 'room') {
            action = `Khởi tạo phòng kiến trúc: ${doc.name || cleanCode}`;
          } else if (entityType === 'space') {
            action = `Khởi tạo không gian mẫu: ${doc.name || cleanCode}`;
          } else if (entityType === 'inspiration') {
            action = `Khởi tạo phối cảnh cảm hứng: ${doc.title || cleanCode}`;
          } else if (entityType === 'shipping') {
            action = `Khởi tạo cấu hình vận chuyển tỉnh: ${doc.province || cleanCode}`;
          } else if (entityType === 'voucher') {
            action = `Phát hành mã voucher: ${doc.code || cleanCode}`;
          }

          const initialLog = new ActivityLog({
            entityType,
            entityId: doc._id ? doc._id.toString() : cleanId,
            entityCode: cleanCode || (doc.code || doc.sku || doc.orderCode || ''),
            action,
            performedBy,
            role,
            details: 'Ghi nhận thời điểm tạo ban đầu lấy từ trường createdAt trong cơ sở dữ liệu.',
            createdAt: doc.createdAt || new Date(),
          });
          await initialLog.save();
          logs = [initialLog.toObject()];
        }
      } else if (['permission', 'system_config'].includes(entityType)) {
        let initialAction = `Khởi tạo thiết lập cấu hình: ${cleanCode || cleanId || 'Hệ thống'}`;
        if (entityType === 'permission') {
          initialAction = `Khởi tạo phân bổ quyền hệ thống cho: ${cleanCode || cleanId || 'Vai trò'}`;
        }
        const initialLog = new ActivityLog({
          entityType,
          entityId: cleanId || 'sys-default',
          entityCode: cleanCode || cleanId || 'LIVORA',
          action: initialAction,
          performedBy: 'SUPER ADMIN (Hệ thống)',
          role: 'SUPER_ADMIN',
          details: 'Thiết lập thông số phân quyền và cấu hình vận hành cốt lõi của LIVORA.',
          createdAt: new Date('2026-10-15T08:00:00Z'),
        });
        await initialLog.save();
        logs = [initialLog.toObject()];
      }
    }

    return sendSuccess(res, logs || [], 'Lấy lịch sử thao tác từ cơ sở dữ liệu thành công.');
  } catch (error) {
    console.error('getActivityLogs error:', error);
    return sendError(res, 'Lỗi hệ thống khi tải lịch sử thao tác từ database.', 500);
  }
};

/**
 * Internal helper to record activity logs from any controller into MongoDB
 */
const logActivityInternal = async ({
  entityType,
  entityId,
  entityCode = '',
  action,
  performedBy = 'Hệ thống',
  role = 'system',
  details = '',
}) => {
  try {
    if (!entityType || !entityId || !action) return null;
    const log = new ActivityLog({
      entityType: String(entityType).trim(),
      entityId: String(entityId).trim(),
      entityCode: String(entityCode).trim(),
      action: String(action).trim(),
      performedBy: String(performedBy).trim(),
      role: role || 'system',
      details: String(details).trim(),
      createdAt: new Date(),
    });
    return await log.save();
  } catch (err) {
    console.error('logActivityInternal error:', err.message);
    return null;
  }
};

module.exports = {
  getActivityLogs,
  logActivityInternal,
};
