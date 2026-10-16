const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get dashboard revenue and business performance metrics
 * @route   GET /api/dashboard/revenue
 */
const getRevenueReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear().toString() } = req.query;

    const [
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      deliveredRevenueAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
      Customer.countDocuments(),
      Product.countDocuments({ status: 'Đang kinh doanh' }),
      Order.aggregate([
        { $match: { orderStatus: 'delivered', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
    ]);

    const totalRevenue = deliveredRevenueAgg.length > 0 ? deliveredRevenueAgg[0].total : 0;

    // Doanh thu theo 12 tháng của năm được chọn
    const monthlyData = [];
    for (let m = 0; m < 12; m++) {
      const startOfMonth = new Date(Number(year), m, 1);
      const endOfMonth = new Date(Number(year), m + 1, 0, 23, 59, 59);

      const monthAgg = await Order.aggregate([
        {
          $match: {
            orderStatus: 'delivered',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, revenue: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      ]);

      monthlyData.push({
        month: `T${m + 1}`,
        revenue: monthAgg.length > 0 ? monthAgg[0].revenue : 0,
        orders: monthAgg.length > 0 ? monthAgg[0].count : 0,
      });
    }

    return sendSuccess(res, {
      summary: {
        totalRevenue,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
      },
      monthlyData,
      year: Number(year),
    });
  } catch (error) {
    console.error('getRevenueReport error:', error);
    return sendError(res, 'Không thể tải báo cáo doanh thu.', 500);
  }
};

module.exports = {
  getRevenueReport,
};
