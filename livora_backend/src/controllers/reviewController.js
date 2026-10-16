const Review = require('../models/Review');
const Product = require('../models/Product');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get reviews list
 * @route   GET /api/reviews
 */
const getReviews = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      rating = 'all',
      productId = '',
      page = 1,
      pageSize = 10,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { productName: { $regex: term, $options: 'i' } },
        { comment: { $regex: term, $options: 'i' } },
      ];
    }

    if (status !== 'all') {
      filter.status = status;
    }

    if (rating !== 'all') {
      filter.rating = Number(rating);
    }

    if (productId) {
      filter.productId = productId;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, visibleCount, hiddenCount] = await Promise.all([
      Review.countDocuments(filter),
      Review.countDocuments({ status: 'visible' }),
      Review.countDocuments({ status: 'hidden' }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = reviews.map((r) => ({
      id: r._id.toString(),
      code: r.code || `DG-${r._id.toString().slice(-4).toUpperCase()}`,
      productId: r.productId ? r.productId.toString() : '',
      productName: r.productName,
      productSku: r.productSku,
      productThumbnail: r.productThumbnail,
      customerId: r.customerId ? r.customerId.toString() : null,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      customerContext: r.customerContext,
      rating: r.rating,
      comment: r.comment,
      images: r.images,
      status: r.status,
      hiddenReason: r.hiddenReason,
      moderatedBy: r.moderatedBy,
      moderatedAt: r.moderatedAt,
      createdAt: r.createdAt,
    }));

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      visibleCount,
      hiddenCount,
    });
  } catch (error) {
    console.error('getReviews error:', error);
    return sendError(res, 'Không thể tải danh sách đánh giá.', 500);
  }
};

/**
 * @desc    Create review
 * @route   POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    const { productId, customerName, customerPhone, rating, comment, images, orderId } = req.body;

    if (!productId || !customerName || !rating || !comment) {
      return sendError(res, 'Vui lòng cung cấp đầy đủ thông tin đánh giá.', 400);
    }

    const product = await Product.findById(productId);
    const count = await Review.countDocuments();
    const code = `DG-${String(count + 1).padStart(4, '0')}`;

    const review = new Review({
      code,
      productId,
      productName: product ? product.name : '',
      productSku: product ? product.sku : '',
      productThumbnail: product ? product.thumbnail : '',
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : '',
      rating: Number(rating),
      comment: comment.trim(),
      images: images || [],
      orderId: orderId || null,
      status: 'visible',
    });

    await review.save();

    // Cập nhật lại average rating của sản phẩm
    if (product) {
      const allProductReviews = await Review.find({ productId, status: 'visible' });
      const avg = allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;
      product.averageRating = Math.round(avg * 10) / 10;
      product.totalReviews = allProductReviews.length;
      await product.save();
    }

    return sendSuccess(res, {
      id: review._id.toString(),
      code: review.code,
    }, 'Đánh giá sản phẩm thành công.', 201);
  } catch (error) {
    console.error('createReview error:', error);
    return sendError(res, 'Không thể gửi đánh giá.', 500);
  }
};

/**
 * @desc    Hide review (Admin moderation)
 * @route   PATCH /api/reviews/:id/hide
 */
const hideReview = async (req, res) => {
  try {
    const { hiddenReason = 'Nội dung vi phạm tiêu chuẩn cộng đồng', moderatedBy = 'Kiểm duyệt viên' } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 'Không tìm thấy đánh giá.', 404);

    review.status = 'hidden';
    review.hiddenReason = hiddenReason;
    review.moderatedBy = moderatedBy;
    review.moderatedAt = new Date();
    await review.save();

    return sendSuccess(res, {
      id: review._id.toString(),
      status: review.status,
      hiddenReason: review.hiddenReason,
    }, 'Đã ẩn đánh giá khỏi giao diện website.');
  } catch (error) {
    console.error('hideReview error:', error);
    return sendError(res, 'Không thể ẩn đánh giá.', 500);
  }
};

module.exports = {
  getReviews,
  createReview,
  hideReview,
};
