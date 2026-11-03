const fs = require('fs');
const path = require('path');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Policy = require('../models/Policy');
const Footer = require('../models/Footer');
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

    const items = refunds.map((r) => ({
      id: r._id.toString(),
      orderId: r.orderId ? r.orderId.toString() : '',
      orderCode: r.orderCode || '',
      userId: r.userId ? r.userId.toString() : '',
      customerName: r.customerName || '',
      customerPhone: r.customerPhone || '',
      amount: r.amount || 0,
      reason: r.reason || '',
      refundType: r.refundType || 'full',
      status: r.status,
      rejectReason: r.rejectReason || '',
      processedBy: r.processedBy || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return sendPaginated(res, items, {
      total: totalItems,
      page: currentPage,
      limit,
      totalPages,
    }, {
      pending: pendingCount,
      completed: completedCount,
      totalRefundedAmount: disbursedCapital,
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

    const orderPhone = order.shippingAddress?.phone || order.customerPhone || '';
    if (orderPhone.replace(/\D/g, '') !== phone.replace(/\D/g, '')) {
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

    const refundAmount = refundType === 'full' ? order.finalAmount : Math.round(order.finalAmount * 0.5);

    const refund = new Refund({
      orderId: order._id,
      orderCode: order.orderCode,
      userId: order.customerId || null,
      customerName: order.shippingAddress?.fullName || 'Khách hàng',
      customerPhone: phone,
      amount: refundAmount,
      reason: reason.trim(),
      refundType,
      status: 'pending',
    });

    await refund.save();

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

    const refund = await Refund.findById(req.params.id);
    if (!refund) return sendError(res, 'Không tìm thấy yêu cầu hoàn tiền.', 404);

    refund.status = status;
    refund.processedBy = processedBy;
    if (status === 'rejected') {
      refund.rejectReason = rejectReason || 'Không đủ điều kiện hoàn trả.';
    } else {
      await Order.findByIdAndUpdate(refund.orderId, {
        $set: { paymentStatus: 'refunded' },
        $push: {
          statusHistory: {
            status: 'refunded',
            timestamp: new Date(),
            note: `Đã hoàn tiền: ${refund.amount.toLocaleString()} VNĐ`,
            actor: processedBy,
          },
        },
      });
    }

    await refund.save();

    return sendSuccess(res, {
      id: refund._id.toString(),
      status: refund.status,
      rejectReason: refund.rejectReason,
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
