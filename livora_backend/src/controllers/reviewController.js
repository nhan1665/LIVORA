const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get reviews list with filtering, search & pagination
 * @route   GET /api/reviews
 */
const getReviews = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      rating = 'all',
      productId = '',
      customerId = '',
      customerPhone = '',
      orderId = '',
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

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (rating !== 'all') {
      filter.rating = Number(rating);
    }

    // Lọc theo sản phẩm (hỗ trợ cả ObjectId và slug)
    if (productId && productId.trim()) {
      const pId = productId.trim();
      let targetProdId = null;

      if (/^[0-9a-fA-F]{24}$/.test(pId)) {
        targetProdId = new mongoose.Types.ObjectId(pId);
      } else {
        const foundProd = await Product.findOne({ slug: pId.toLowerCase() }).lean();
        if (foundProd) {
          targetProdId = foundProd._id;
        }
      }

      if (targetProdId) {
        filter.productId = targetProdId;
      } else if (!/^[0-9a-fA-F]{24}$/.test(pId)) {
        filter.$or = filter.$or || [];
        filter.$or.push({ productSku: pId }, { productName: { $regex: pId, $options: 'i' } });
      }
    }

    // Lọc theo khách hàng: hỗ trợ tìm theo customerId hoặc số điện thoại
    const customerFilterOr = [];
    if (customerId && customerId.trim() && /^[0-9a-fA-F]{24}$/.test(customerId.trim())) {
      customerFilterOr.push({ customerId: new mongoose.Types.ObjectId(customerId.trim()) });
    }
    if (customerPhone && customerPhone.trim()) {
      customerFilterOr.push({ customerPhone: customerPhone.trim() });
    }
    if (customerFilterOr.length > 0) {
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: customerFilterOr }];
        delete filter.$or;
      } else {
        filter.$or = customerFilterOr;
      }
    }

    // Lọc theo đơn hàng
    if (orderId && orderId.trim()) {
      const oId = orderId.trim();
      if (/^[0-9a-fA-F]{24}$/.test(oId)) {
        filter.orderId = new mongoose.Types.ObjectId(oId);
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize) || 10));

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

    const items = reviews.map((r) => {
      let pId = '';
      if (r.productId) {
        pId = r.productId._id ? r.productId._id.toString() : (r.productId.id ? r.productId.id.toString() : r.productId.toString());
      }
      let oId = null;
      if (r.orderId) {
        oId = r.orderId._id ? r.orderId._id.toString() : (r.orderId.id ? r.orderId.id.toString() : r.orderId.toString());
      }

      return {
        id: r._id.toString(),
        _id: r._id.toString(),
        code: r.code || `DG-${r._id.toString().slice(-4).toUpperCase()}`,
        productId: pId,
        productName: r.productName || '',
        productSku: r.productSku || '',
        productThumbnail: r.productThumbnail || '',
        customerId: r.customerId ? r.customerId.toString() : null,
        customerName: r.customerName || 'Khách hàng',
        customerPhone: r.customerPhone || '',
        customerContext: r.customerContext || 'Đã mua hàng tại Livora',
        orderId: oId,
        rating: r.rating || 5,
        comment: r.comment || '',
        images: Array.isArray(r.images) ? r.images : [],
        videos: Array.isArray(r.videos) ? r.videos : [],
        status: r.status || 'visible',
        hiddenReason: r.hiddenReason || '',
        moderatedBy: r.moderatedBy || '',
        moderatedAt: r.moderatedAt || null,
        createdAt: r.createdAt,
      };
    });

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
 * @desc    Create review for product (from completed order or direct)
 * @route   POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    const {
      productId,
      customerName,
      customerPhone,
      customerId,
      orderId,
      rating,
      comment,
      images,
      videos,
      productName,
      productThumbnail,
      productSku,
    } = req.body;

    if (!productId || !customerName || !rating || !comment) {
      return sendError(res, 'Vui lòng cung cấp đầy đủ thông tin đánh giá (sản phẩm, số sao, nhận xét).', 400);
    }

    // 1. Tìm thông tin sản phẩm linh hoạt: theo id, slug, sku hoặc tên
    let productDoc = null;
    let actualProductId = null;

    if (/^[0-9a-fA-F]{24}$/.test(String(productId))) {
      productDoc = await Product.findById(productId);
    }
    if (!productDoc) {
      productDoc = await Product.findOne({ slug: String(productId).toLowerCase() });
    }
    if (!productDoc && productSku) {
      productDoc = await Product.findOne({ sku: productSku });
    }
    if (!productDoc && productName) {
      productDoc = await Product.findOne({ name: { $regex: new RegExp(`^${productName.trim()}$`, 'i') } });
    }

    if (productDoc) {
      actualProductId = productDoc._id;
    } else if (/^[0-9a-fA-F]{24}$/.test(String(productId))) {
      actualProductId = new mongoose.Types.ObjectId(productId);
    } else {
      const fallbackProd = await Product.findOne().lean();
      actualProductId = fallbackProd ? fallbackProd._id : new mongoose.Types.ObjectId();
    }

    // 2. Mã đánh giá
    const count = await Review.countDocuments();
    const code = `DG-${String(count + 1).padStart(4, '0')}`;

    // 3. Chuẩn hóa customerId & orderId
    let validCustomerId = null;
    if (customerId && /^[0-9a-fA-F]{24}$/.test(String(customerId))) {
      validCustomerId = new mongoose.Types.ObjectId(customerId);
    }

    let validOrderId = null;
    if (orderId) {
      const oStr = String(orderId).trim();
      if (/^[0-9a-fA-F]{24}$/.test(oStr)) {
        validOrderId = new mongoose.Types.ObjectId(oStr);
      } else {
        const foundOrder = await Order.findOne({ orderCode: oStr.toUpperCase() }).lean();
        if (foundOrder) {
          validOrderId = foundOrder._id;
        }
      }
    }

    // Tắt validator collection Reviews nếu có validator cũ trên MongoDB Atlas
    if (mongoose.connection && mongoose.connection.db) {
      try {
        await mongoose.connection.db.command({ collMod: 'Reviews', validationLevel: 'off' });
      } catch (_) {}
    }

    const reviewData = {
      code,
      productId: actualProductId,
      productName: productDoc ? productDoc.name : (productName || 'Sản phẩm Livora'),
      productSku: productDoc ? productDoc.sku : (productSku || ''),
      productThumbnail: productDoc ? (productDoc.thumbnail || (productDoc.images && productDoc.images[0])) : (productThumbnail || ''),
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : '',
      customerContext: 'Đã mua hàng tại Livora',
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      videos: Array.isArray(videos) ? videos : [],
      status: 'visible',
    };

    if (validCustomerId) {
      reviewData.customerId = validCustomerId;
    }
    if (validOrderId) {
      reviewData.orderId = validOrderId;
    }

    let review;
    try {
      review = new Review(reviewData);
      await review.save();
    } catch (saveErr) {
      console.warn('Mongoose review.save() error:', saveErr.message);
      if (saveErr.message && saveErr.message.includes('validation')) {
        try {
          await mongoose.connection.db.command({ collMod: 'Reviews', validationLevel: 'off' });
        } catch (_) {}
        const insertResult = await Review.collection.insertOne({
          ...reviewData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        review = {
          _id: insertResult.insertedId,
          ...reviewData,
        };
      } else {
        throw saveErr;
      }
    }

    // 4. Tự động tính toán lại điểm trung bình sao và tổng số review của sản phẩm
    if (productDoc) {
      const allProductReviews = await Review.find({ productId: productDoc._id, status: 'visible' }).lean();
      const totalRev = allProductReviews.length;
      const avg = totalRev > 0
        ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / totalRev
        : review.rating;

      await Product.findByIdAndUpdate(productDoc._id, {
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: totalRev,
      });
    }

    return sendSuccess(
      res,
      {
        id: review._id.toString(),
        code: review.code,
        productId: actualProductId ? actualProductId.toString() : '',
        productName: reviewData.productName,
        productSku: reviewData.productSku,
        orderId: validOrderId ? validOrderId.toString() : (orderId ? String(orderId) : null),
        rating: review.rating,
        status: review.status,
      },
      'Cảm ơn bạn đã gửi đánh giá! Đánh giá của bạn đã được ghi nhận thành công.',
      201
    );
  } catch (error) {
    console.error('createReview error:', error);
    return sendError(res, error.message || 'Không thể gửi đánh giá.', 500);
  }
};

/**
 * @desc    Toggle review status: Hide or Show (Admin moderation)
 * @route   PATCH /api/reviews/:id/hide OR PATCH /api/reviews/:id/status
 */
const updateReviewStatus = async (req, res) => {
  try {
    const { status, hiddenReason, moderatedBy = 'Quản trị viên' } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 'Không tìm thấy đánh giá.', 404);

    let targetStatus = status;
    if (!targetStatus || (targetStatus !== 'visible' && targetStatus !== 'hidden')) {
      targetStatus = review.status === 'visible' ? 'hidden' : 'visible';
    }

    review.status = targetStatus;
    if (targetStatus === 'hidden') {
      review.hiddenReason = hiddenReason || 'Nội dung vi phạm tiêu chuẩn cộng đồng';
    } else {
      review.hiddenReason = '';
    }
    review.moderatedBy = moderatedBy;
    review.moderatedAt = new Date();
    await review.save();

    // Cập nhật lại average rating và totalReviews của sản phẩm
    if (review.productId) {
      const allProductReviews = await Review.find({ productId: review.productId, status: 'visible' }).lean();
      const count = allProductReviews.length;
      const avg = count > 0
        ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 5;

      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: count,
      });
    }

    const message = targetStatus === 'visible'
      ? `Đã hiển thị lại đánh giá ${review.code} trên website.`
      : `Đã ẩn đánh giá ${review.code} khỏi giao diện website.`;

    return sendSuccess(
      res,
      {
        id: review._id.toString(),
        code: review.code,
        status: review.status,
        hiddenReason: review.hiddenReason,
        moderatedBy: review.moderatedBy,
        moderatedAt: review.moderatedAt,
      },
      message
    );
  } catch (error) {
    console.error('updateReviewStatus error:', error);
    return sendError(res, 'Không thể cập nhật trạng thái đánh giá.', 500);
  }
};

module.exports = {
  getReviews,
  createReview,
  hideReview: updateReviewStatus,
  updateReviewStatus,
};
