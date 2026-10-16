const Refund = require('../models/Refund');
const Order = require('../models/Order');
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
      Refund.countDocuments({ status: 'pending' }),
      Refund.countDocuments({ status: 'completed' }),
      Refund.aggregate([
        { $match: { status: 'completed' } },
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
      orderId: r.orderId.toString(),
      orderCode: r.orderCode,
      userId: r.userId ? r.userId.toString() : '',
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      amount: r.amount,
      reason: r.reason,
      refundType: r.refundType,
      status: r.status,
      rejectReason: r.rejectReason,
      processedBy: r.processedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      summary: {
        totalItems,
        pendingCount,
        completedCount,
        disbursedCapital,
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
    const { orderId, amount, reason, refundType = 'full' } = req.body;

    if (!orderId || !reason) {
      return sendError(res, 'ID đơn hàng và lý do hoàn tiền là bắt buộc.', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

    const refund = new Refund({
      orderId: order._id,
      orderCode: order.orderCode,
      userId: order.userId || null,
      customerName: order.customerInfo?.name || '',
      customerPhone: order.customerInfo?.phone || '',
      amount: Number(amount) || order.finalAmount,
      reason: reason.trim(),
      refundType,
      status: 'pending',
    });

    await refund.save();

    return sendSuccess(res, {
      id: refund._id.toString(),
      orderCode: refund.orderCode,
      amount: refund.amount,
      status: refund.status,
    }, 'Đã gửi yêu cầu hoàn tiền.', 201);
  } catch (error) {
    console.error('createRefund error:', error);
    return sendError(res, error.message || 'Không thể tạo yêu cầu hoàn tiền.', 500);
  }
};

/**
 * @desc    Update refund status (Duyệt / Từ chối)
 * @route   PATCH /api/refunds/:id/status
 */
const updateRefundStatus = async (req, res) => {
  try {
    const { status, rejectReason, processedBy = 'Kế toán Livora' } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return sendError(res, 'Trạng thái xử lý không hợp lệ.', 400);
    }

    const refund = await Refund.findById(req.params.id);
    if (!refund) return sendError(res, 'Không tìm thấy yêu cầu hoàn tiền.', 404);

    refund.status = status;
    refund.processedBy = processedBy;
    if (status === 'rejected') {
      refund.rejectReason = rejectReason || 'Không đủ điều kiện hoàn trả.';
    } else {
      // Khi hoàn tiền thành công, cập nhật trạng thái đơn hàng sang refunded
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

module.exports = {
  getRefunds,
  createRefund,
  updateRefundStatus,
};
