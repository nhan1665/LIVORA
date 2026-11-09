const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Policy = require('../models/Policy');
const Footer = require('../models/Footer');
const { logActivityInternal } = require('./activityLogController');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get refund requests
 * @route   GET /api/refunds
 */
const getRefunds = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, pageSize = 10 } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { orderCode: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { customerPhone: { $regex: term, $options: 'i' } },
        { reason: { $regex: term, $options: 'i' } },
      ];
    }

    if (status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, pendingCount, completedCount, totalRefundAmount] = await Promise.all([
      Refund.countDocuments(filter),
      Refund.countDocuments({ ...filter, status: 'pending' }),
      Refund.countDocuments({ ...filter, status: 'completed' }),
      Refund.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const disbursedCapital = totalRefundAmount.length > 0 ? totalRefundAmount[0].total : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const refunds = await Refund.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const orderIds = refunds.map((r) => r.orderId).filter(Boolean);
    const linkedOrders = orderIds.length
      ? await Order.find({ _id: { $in: orderIds } }).select('_id totalAmount orderStatus paymentStatus').lean()
      : [];
    const orderById = new Map(linkedOrders.map((o) => [o._id.toString(), o]));

    const items = refunds.map((r) => ({
      id: r._id.toString(),
      orderId: r.orderId ? r.orderId.toString() : '',
      orderCode: r.orderCode || '',
      userId: r.userId ? r.userId.toString() : '',
      customerName: r.customerName || '',
      customerPhone: r.customerPhone || '',
      amount: r.amount || 0,
      orderTotalAmount: orderById.get(r.orderId?.toString())?.totalAmount ?? null,
      orderExists: orderById.has(r.orderId?.toString()),
      reason: r.reason || '',
      refundType: r.refundType || 'full',
      status: r.status,
      rejectReason: r.rejectReason || '',
      processedBy: r.processedBy || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // sendPaginated takes a single object: { items, page, pageSize, totalItems, totalPages, ...extra }.
    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      stats: {
        pending: pendingCount,
        completed: completedCount,
        totalRefundedAmount: disbursedCapital,
      },
    });
  } catch (error) {
    console.error('getRefunds error:', error);
    return sendError(res, 'Không thể tải danh sách hoàn tiền.', 500);
  }
};

/**
 * @desc    Create refund request
 * @route   POST /api/refunds
 */
const createRefund = async (req, res) => {
  try {
    const { orderCode, phone, reason, refundType = 'full' } = req.body;

    if (!orderCode || !phone || !reason) {
      return sendError(res, 'Vui lòng cung cấp mã đơn hàng, số điện thoại và lý do hoàn tiền.', 400);
    }

    const order = await Order.findOne({ orderCode: orderCode.trim() });
    if (!order) {
      return sendError(res, 'Không tìm thấy đơn hàng với mã đã cung cấp.', 404);
    }

    // Order stores the buyer's contact under customerInfo (see models/Order.js).
    const orderPhone = order.customerInfo?.phone || '';
    if (!orderPhone || orderPhone.replace(/\D/g, '') !== String(phone).replace(/\D/g, '')) {
      return sendError(res, 'Số điện thoại không khớp với thông tin đơn hàng.', 400);
    }

    const eligibleStatuses = ['confirmed', 'processing', 'delivered'];
    if (!eligibleStatuses.includes(order.orderStatus)) {
      return sendError(res, `Đơn hàng ở trạng thái "${order.orderStatus}" không thể yêu cầu hoàn tiền.`, 400);
    }

    const existingPending = await Refund.findOne({
      orderId: order._id,
      status: 'pending',
    });
    if (existingPending) {
      return sendError(res, 'Đơn hàng này đang có một yêu cầu hoàn tiền chờ xử lý.', 400);
    }

    if (!['full', 'partial'].includes(refundType)) {
      return sendError(res, 'Loại hoàn tiền không hợp lệ.', 400);
    }
    const orderTotal = Number(order.totalAmount) || 0;
    const refundAmount = refundType === 'full' ? orderTotal : Math.round(orderTotal * 0.5);

    const refund = new Refund({
      orderId: order._id,
      orderCode: order.orderCode,
      userId: order.customerId || null,
      customerName: order.customerInfo?.fullName || 'Khách hàng',
      customerPhone: phone,
      amount: refundAmount,
      reason: reason.trim(),
      refundType,
      status: 'pending',
    });

    await refund.save();

    logActivityInternal({
      entityType: 'refund',
      entityId: refund._id.toString(),
      entityCode: refund.orderCode,
      action: 'Khách hàng gửi yêu cầu hoàn tiền',
      performedBy: refund.customerName,
      role: 'customer',
      details: `Yêu cầu hoàn ${refund.amount.toLocaleString('vi-VN')} đ cho đơn ${refund.orderCode}. Lý do: ${refund.reason}`,
    });

    await Order.findByIdAndUpdate(order._id, {
      $push: {
        statusHistory: {
          status: order.orderStatus,
          timestamp: new Date(),
          note: `Khách hàng gửi yêu cầu hoàn tiền: ${reason.trim()}`,
          actor: 'Customer',
        },
      },
    });

    return sendSuccess(res, {
      id: refund._id.toString(),
      orderCode: refund.orderCode,
      amount: refund.amount,
      status: refund.status,
      createdAt: refund.createdAt,
    }, 'Gửi yêu cầu hoàn tiền thành công.', 201);
  } catch (error) {
    console.error('createRefund error:', error);
    return sendError(res, 'Không thể tạo yêu cầu hoàn tiền.', 500);
  }
};

/**
 * @desc    Process/Update refund status (Admin)
 * @route   PATCH /api/refunds/:id/status
 */
const updateRefundStatus = async (req, res) => {
  try {
    const { status, rejectReason, processedBy = 'Admin' } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return sendError(res, 'Trạng thái hoàn tiền không hợp lệ.', 400);
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 'Không tìm thấy yêu cầu hoàn tiền.', 404);
    }
    const refund = await Refund.findById(req.params.id);
    if (!refund) return sendError(res, 'Không tìm thấy yêu cầu hoàn tiền.', 404);
    if (refund.status !== 'pending') {
      return sendError(res, 'Yêu cầu hoàn tiền này đã được xử lý trước đó.', 409);
    }

    if (status === 'rejected') {
      if (!rejectReason || !String(rejectReason).trim()) {
        return sendError(res, 'Vui lòng cung cấp lý do từ chối yêu cầu hoàn tiền.', 400);
      }
      refund.rejectReason = String(rejectReason).trim();
    } else {
      const order = await Order.findById(refund.orderId);
      if (!order) {
        return sendError(res, 'Đơn hàng liên kết không tồn tại trong hệ thống.', 404);
      }
      if (refund.amount > (Number(order.totalAmount) || 0)) {
        return sendError(res, 'Số tiền hoàn vượt quá giá trị đơn hàng.', 400);
      }
      order.paymentStatus = 'refunded';
      await order.save();
    }

    refund.status = status;
    refund.processedBy = processedBy;
    await refund.save();

    logActivityInternal({
      entityType: 'refund',
      entityId: refund._id.toString(),
      entityCode: refund.orderCode,
      action: status === 'completed' ? 'Phê duyệt & Hoàn tiền' : 'Từ chối yêu cầu hoàn tiền',
      performedBy: processedBy || 'Quản trị viên (Admin)',
      role: 'admin',
      details: status === 'completed'
        ? `Đã hoàn trả số tiền ${refund.amount.toLocaleString('vi-VN')} đ cho đơn ${refund.orderCode}`
        : `Lý do từ chối: ${refund.rejectReason}`,
    });

    return sendSuccess(res, {
      id: refund._id.toString(),
      status: refund.status,
      rejectReason: refund.rejectReason,
      processedBy: refund.processedBy,
      updatedAt: refund.updatedAt,
    }, `Đã ${status === 'completed' ? 'chấp thuận' : 'từ chối'} hoàn tiền.`);
  } catch (error) {
    console.error('updateRefundStatus error:', error);
    return sendError(res, 'Không thể cập nhật trạng thái hoàn tiền.', 500);
  }
};

/**
 * @desc    Lấy file chính sách hoàn tiền đang lưu trong database
 * @route   GET /api/refunds/policy
 */
const getRefundPolicy = async (req, res) => {
  try {
    let policyDoc = await Policy.findOne().sort({ updatedAt: -1 });
    if (!policyDoc || !policyDoc.fileName) {
      // Thử tìm trong Footers
      const footerDoc = await Footer.findOne({ key: 'policy' });
      if (footerDoc && (footerDoc.fileName || footerDoc.value)) {
        return res.status(200).json({
          success: true,
          data: {
            fileName: footerDoc.fileName || footerDoc.value,
            fileSize: footerDoc.fileSize || '',
            fileUrl: footerDoc.fileUrl || (footerDoc.value && footerDoc.value.startsWith('/uploads') ? footerDoc.value : ''),
            fileData: footerDoc.fileData || '',
            updatedAt: footerDoc.updatedAt,
          },
        });
      }
      return res.status(200).json({
        success: true,
        data: null // Chưa có file nào tải lên, không để default
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        fileName: policyDoc.fileName,
        fileSize: policyDoc.fileSize,
        fileUrl: policyDoc.fileUrl,
        fileData: policyDoc.fileData,
        updatedAt: policyDoc.updatedAt
      }
    });
  } catch (error) {
    console.error('getRefundPolicy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chính sách hoàn tiền: ' + error.message
    });
  }
};

/**
 * @desc    Tải lên / cập nhật file chính sách hoàn tiền vào database
 * @route   POST /api/refunds/policy
 */
const updateRefundPolicy = async (req, res) => {
  try {
    const { fileName, fileSize, fileData, updatedBy } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên file chính sách.'
      });
    }

    let savedFileUrl = '';
    let finalFileData = fileData || '';

    // Lưu file vào thư mục tĩnh public/uploads/policy
    if (fileData && fileData.startsWith('data:')) {
      try {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanName = (fileName || 'chinh_sach_hoan_tien.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
          const targetDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'policy');
          fs.mkdirSync(targetDir, { recursive: true });

          const diskFileName = `${Date.now()}_${cleanName}`;
          const filePath = path.join(targetDir, diskFileName);
          fs.writeFileSync(filePath, buffer);

          savedFileUrl = `/uploads/policy/${diskFileName}`;
        }
      } catch (fErr) {
        console.warn('Lỗi ghi file chính sách:', fErr.message);
      }
    }

    let policyDoc = await Policy.findOne();
    if (policyDoc) {
      policyDoc.fileName = fileName;
      policyDoc.fileSize = fileSize || '';
      policyDoc.fileUrl = savedFileUrl || policyDoc.fileUrl || '';
      policyDoc.fileData = finalFileData || policyDoc.fileData || '';
      policyDoc.updatedBy = updatedBy || 'Admin';
      await policyDoc.save();
    } else {
      policyDoc = await Policy.create({
        fileName,
        fileSize: fileSize || '',
        fileUrl: savedFileUrl || '',
        fileData: finalFileData || '',
        updatedBy: updatedBy || 'Admin'
      });
    }

    // Đồng thời đồng bộ vào Footer
    try {
      await Footer.findOneAndUpdate(
        { key: 'policy' },
        {
          key: 'policy',
          name: 'Chính sách mua hàng',
          subtitle: 'Tài liệu quy định chính sách mua hàng',
          value: savedFileUrl || fileName || '',
          fileName: policyDoc.fileName,
          fileUrl: policyDoc.fileUrl,
          fileSize: policyDoc.fileSize,
          fileData: policyDoc.fileData,
          status: 'Hiển thị',
          iconType: 'policy'
        },
        { upsert: true, new: true }
      );
    } catch (footerErr) {
      console.warn('Lỗi đồng bộ vào Footer:', footerErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật file chính sách mua hàng thành công.',
      data: {
        fileName: policyDoc.fileName,
        fileSize: policyDoc.fileSize,
        fileUrl: policyDoc.fileUrl,
        fileData: policyDoc.fileData,
        updatedAt: policyDoc.updatedAt
      }
    });
  } catch (error) {
    console.error('updateRefundPolicy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu file chính sách: ' + error.message
    });
  }
};

module.exports = {
  getRefunds,
  createRefund,
  updateRefundStatus,
  getRefundPolicy,
  updateRefundPolicy,
};
