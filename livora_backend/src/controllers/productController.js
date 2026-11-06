const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Room = require('../models/Room');
const Order = require('../models/Order');
const { logActivityInternal } = require('./activityLogController');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

const isValidObjectId = (id) => {
  if (!id) return false;
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

const removeVietnameseTones = (str) => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const getCategoryCodePrefix = (cat) => {
  if (!cat) return 'SP';
  if (cat.code && !cat.code.toUpperCase().startsWith('CAT-')) {
    const cleaned = cat.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned) return cleaned;
  }
  if (cat.name) {
    const unsigned = removeVietnameseTones(cat.name).toUpperCase().trim();
    const firstWord = unsigned.split(/[\s,&-]+/)[0].replace(/[^A-Z0-9]/g, '');
    if (firstWord && firstWord.length >= 2) return firstWord;
  }
  if (cat.code) {
    const stripped = cat.code.toUpperCase().replace(/^CAT[-_]/, '').replace(/[^A-Z0-9]/g, '');
    if (stripped) return stripped;
  }
  if (cat.slug) {
    return cat.slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  return 'SP';
};

// Đồng bộ số lượng đã bán (soldQuantity) CHUẨN XÁC 100% từ CSDL Orders (không fake, chỉ có đơn mới có số lượng bán)
let isSyncedSoldQuantity = false;
const syncSoldQuantities = async (force = false) => {
  if (isSyncedSoldQuantity && !force) return;
  try {
    // 1. Tính tổng số lượng thực tế đã bán từ Orders (chỉ tính đơn chưa bị hủy)
    const salesAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          sku: { $first: '$items.sku' },
          totalSold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const salesById = new Map();
    const salesBySku = new Map();
    salesAgg.forEach((s) => {
      if (s._id) salesById.set(s._id.toString(), Number(s.totalSold) || 0);
      if (s.sku) salesBySku.set(s.sku.toUpperCase(), Number(s.totalSold) || 0);
    });

    // 2. Cập nhật chính xác số lượng đã bán cho toàn bộ sản phẩm:
    // Có đơn đặt hàng -> lấy đúng số lượng đã bán từ đơn; Chưa có đơn -> đúng 0, KHÔNG FAKE!
    const allProducts = await Product.find({}).select('_id sku soldQuantity').lean();
    const bulkOps = [];
    for (const prod of allProducts) {
      const pIdStr = prod._id.toString();
      const skuStr = prod.sku ? prod.sku.toUpperCase() : '';
      const realSold = salesById.get(pIdStr) || salesBySku.get(skuStr) || 0;

      if (prod.soldQuantity !== realSold) {
        bulkOps.push({
          updateOne: {
            filter: { _id: prod._id },
            update: { $set: { soldQuantity: realSold } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      console.log(`✅ [Product Sales] Đã đồng bộ số lượng đã bán thực tế từ CSDL đơn hàng cho ${bulkOps.length} sản phẩm.`);
    }

    isSyncedSoldQuantity = true;
  } catch (err) {
    console.error('syncSoldQuantities error:', err);
  }
};

// Đồng bộ điểm đánh giá (averageRating) và số lượng đánh giá (totalReviews) CHUẨN XÁC 100% từ CSDL Reviews (không fake)
let isSyncedRatingsAndReviews = false;
const syncProductRatingsAndReviews = async (force = false) => {
  if (isSyncedRatingsAndReviews && !force) return;
  try {
    const Review = require('../models/Review');
    const reviewAgg = await Review.aggregate([
      { $match: { status: 'visible' } },
      {
        $group: {
          _id: '$productId',
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const reviewMap = new Map();
    reviewAgg.forEach((r) => {
      if (r._id) {
        reviewMap.set(r._id.toString(), {
          totalReviews: r.totalReviews || 0,
          averageRating: Math.round((r.avgRating || 0) * 10) / 10,
        });
      }
    });

    const allProducts = await Product.find({}).select('_id averageRating totalReviews').lean();
    const bulkOps = [];
    for (const prod of allProducts) {
      const pIdStr = prod._id.toString();
      const realData = reviewMap.get(pIdStr) || { totalReviews: 0, averageRating: 0 };

      if (prod.totalReviews !== realData.totalReviews || prod.averageRating !== realData.averageRating) {
        bulkOps.push({
          updateOne: {
            filter: { _id: prod._id },
            update: {
              $set: {
                totalReviews: realData.totalReviews,
                averageRating: realData.averageRating,
              },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      console.log(`✅ [Product Reviews] Đã đồng bộ số lượng đánh giá thực tế từ CSDL Reviews cho ${bulkOps.length} sản phẩm.`);
    }

    isSyncedRatingsAndReviews = true;
  } catch (err) {
    console.error('syncProductRatingsAndReviews error:', err);
  }
};

let isSyncedCategoryAndRoomSlugs = false;
const syncProductCategoryAndRoomSlugs = async () => {
  if (isSyncedCategoryAndRoomSlugs) return;
  try {
    const unpopulated = await Product.find({
      $or: [
        { categorySlug: { $in: ['', null] } },
        { roomSlugs: { $size: 0 } },
        { roomSlugs: { $exists: false } },
      ],
    });
    for (const p of unpopulated) {
      let catSlug = p.categorySlug;
      if (!catSlug && p.categoryId) {
        const cat = await Category.findById(p.categoryId).lean();
        if (cat) catSlug = cat.slug;
      }
      let rmSlugs = p.roomSlugs || [];
      if (rmSlugs.length === 0 && p.roomIds && p.roomIds.length > 0) {
        const rms = await Room.find({ _id: { $in: p.roomIds } }).lean();
        if (rms) rmSlugs = rms.map((r) => r.slug);
      }
      await Product.updateOne(
        { _id: p._id },
        { $set: { categorySlug: catSlug || '', roomSlugs: rmSlugs } }
      );
    }
    isSyncedCategoryAndRoomSlugs = true;
  } catch (err) {
    console.error('syncProductCategoryAndRoomSlugs error:', err);
  }
};

/**
 * @desc    Get products (Filter by Room, Category, Keyword, Status, Sort, Pagination)
 * @route   GET /api/products
 */
const getProducts = async (req, res) => {
  try {
    await syncSoldQuantities();
    await syncProductRatingsAndReviews();
    await syncProductCategoryAndRoomSlugs();
    const {
      search = '',
      category = 'all',
      room = 'all',
      status = 'all',
      stockStatus = 'all',
      has3D = 'all',
      sort = 'newest',
      page = 1,
      pageSize = 10,
    } = req.query;

    const filter = {};
    const andConditions = [];

    // Search keyword
    if (search && search.trim()) {
      const term = search.trim();
      andConditions.push({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { sku: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
        ],
      });
    }

    // Category filter (slug or id)
    if (category && category !== 'all') {
      let catIds = [];
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        catIds.push(new mongoose.Types.ObjectId(category));
      } else {
        const foundCat = await Category.findOne({ $or: [{ slug: category }, { code: category.toUpperCase() }] }).lean();
        if (foundCat) catIds.push(foundCat._id);
      }
      andConditions.push({
        $or: [
          { categorySlug: category },
          ...(catIds.length > 0 ? [{ categoryId: { $in: catIds } }] : []),
        ],
      });
    }

    // Room filter (slug or id)
    if (room && room !== 'all') {
      let roomObjIds = [];
      if (room.match(/^[0-9a-fA-F]{24}$/)) {
        roomObjIds.push(new mongoose.Types.ObjectId(room));
      } else {
        const foundRoom = await Room.findOne({ $or: [{ slug: room }, { code: room.toUpperCase() }] }).lean();
        if (foundRoom) roomObjIds.push(foundRoom._id);
      }
      andConditions.push({
        $or: [
          { roomSlugs: room },
          ...(roomObjIds.length > 0 ? [{ roomIds: { $in: roomObjIds } }] : []),
        ],
      });
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'active' || status === 'Đang kinh doanh') {
        andConditions.push({
          $or: [{ status: 'active' }, { status: 'Đang kinh doanh' }, { isActive: true }],
        });
      } else if (status === 'paused' || status === 'inactive' || status === 'ngưng kinh doanh') {
        andConditions.push({
          $or: [{ status: 'inactive' }, { status: 'ngưng kinh doanh' }, { isActive: false }],
        });
      }
    }

    // Stock Status
    if (stockStatus !== 'all') {
      filter.stockStatus = stockStatus;
    }

    // 3D Model filter
    if (has3D === 'yes') {
      andConditions.push({
        $or: [
          { file3DUrl: { $exists: true, $ne: '' } },
          { model3DUrl: { $exists: true, $ne: null } },
        ],
      });
    } else if (has3D === 'no') {
      andConditions.push({
        $and: [
          { $or: [{ file3DUrl: { $exists: false } }, { file3DUrl: '' }] },
          { $or: [{ model3DUrl: { $exists: false } }, { model3DUrl: null }] },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort === 'best-seller' || sort === 'sold-desc') sortObj = { soldQuantity: -1, createdAt: -1 };
    else if (sort === 'price-asc') sortObj = { price: 1 };
    else if (sort === 'price-desc') sortObj = { price: -1 };
    else if (sort === 'stock-asc') sortObj = { stockQuantity: 1 };
    else if (sort === 'stock-desc') sortObj = { stockQuantity: -1 };
    else if (sort === 'oldest') sortObj = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, activeCount, outOfStockCount, with3DCount] = await Promise.all([
      Product.countDocuments(filter),
      Product.countDocuments({ $or: [{ status: 'active' }, { status: 'Đang kinh doanh' }], isActive: { $ne: false } }),
      Product.countDocuments({ stockStatus: 'out_of_stock' }),
      Product.countDocuments({
        $or: [
          { file3DUrl: { $exists: true, $ne: '' } },
          { model3DUrl: { $exists: true, $ne: null } },
        ],
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const products = await Product.find(filter)
      .populate('categoryId', 'name slug')
      .populate('roomIds', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const items = products.map((p) => {
      const isAct = p.status === 'active' || p.status === 'Đang kinh doanh';
      const file3D = p.file3DUrl || p.model3DUrl || '';
      return {
        _id: p._id.toString(),
        id: p._id.toString(),
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId?._id ? p.categoryId._id.toString() : p.categoryId,
        categoryName: p.categoryId?.name || p.categorySlug || 'Chung',
        categorySlug: p.categorySlug || p.categoryId?.slug || '',
        roomIds: p.roomIds?.map((r) => (r._id ? r._id.toString() : r)) || [],
        roomNames: p.roomIds?.map((r) => r.name || r) || p.roomSlugs || [],
        roomSlugs: p.roomSlugs || [],
        price: p.price,
        salePrice: p.salePrice,
        stockQuantity: p.stockQuantity,
        soldQuantity: p.soldQuantity || 0,
        thumbnail: p.thumbnail,
        images: p.images && p.images.length > 0 ? p.images : [p.thumbnail],
        description: p.description,
        dimensions: p.dimensions,
        materials: p.materials,
        colors: p.colors,
        averageRating: p.averageRating || 0,
        totalReviews: p.totalReviews || 0,
        stockStatus: p.stockStatus,
        status: isAct ? 'Đang kinh doanh' : 'ngưng kinh doanh',
        isActive: isAct,
        isFeatured: p.isFeatured,
        badge: p.badge,
        file3DUrl: file3D,
        model3DUrl: file3D || null,
        has3DModel: Boolean(file3D && file3D.trim()),
        createdAt: p.createdAt,
      };
    });

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      activeCount,
      outOfStockCount,
      with3DCount,
    });

  } catch (error) {
    console.error('getProducts error:', error);
    return sendError(res, 'Không thể tải danh sách sản phẩm.', 500);
  }
};

/**
 * @desc    Get single product by ID or Slug or SKU
 * @route   GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('categoryId').populate('roomIds').lean();
    }
    if (!product) {
      product = await Product.findOne({ $or: [{ slug: id }, { sku: id.toUpperCase() }] })
        .populate('categoryId')
        .populate('roomIds')
        .lean();
    }

    if (!product) {
      return sendError(res, 'Không tìm thấy sản phẩm.', 404);
    }

    return sendSuccess(res, {
      id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId?._id ? product.categoryId._id.toString() : product.categoryId,
      categoryName: product.categoryId?.name || product.categorySlug,
      categorySlug: product.categorySlug || product.categoryId?.slug,
      roomIds: product.roomIds?.map((r) => (r._id ? r._id.toString() : r)) || [],
      roomNames: product.roomIds?.map((r) => r.name || r) || product.roomSlugs,
      roomSlugs: product.roomSlugs || [],
      price: product.price,
      salePrice: product.salePrice,
      stockQuantity: product.stockQuantity,
      soldQuantity: product.soldQuantity || 0,
      thumbnail: product.thumbnail,
      images: product.images,
      description: product.description,
      dimensions: product.dimensions,
      materials: product.materials,
      colors: product.colors,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
      stockStatus: product.stockStatus,
      status: product.status,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      badge: product.badge,
      file3DUrl: product.file3DUrl,
      has3DModel: Boolean(product.file3DUrl),
      createdAt: product.createdAt,
    });
  } catch (error) {
    console.error('getProductById error:', error);
    return sendError(res, 'Không thể tải thông tin chi tiết sản phẩm.', 500);
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const {
      sku, name, slug, categoryId, categorySlug, roomIds, roomSlugs,
      price, salePrice, stockQuantity, thumbnail, images, description,
      dimensions, materials, colors, status, file3DUrl, isFeatured, badge,
    } = req.body;

    if (!name || !name.trim()) return sendError(res, 'Tên sản phẩm là bắt buộc.', 400);
    if (!price && price !== 0) return sendError(res, 'Giá sản phẩm là bắt buộc.', 400);

    let finalCategoryId = null;
    let finalCategorySlug = categorySlug || '';
    let foundCategoryDoc = null;
    if (categoryId) {
      if (isValidObjectId(categoryId)) {
        finalCategoryId = categoryId;
        foundCategoryDoc = await Category.findById(categoryId).lean();
        if (foundCategoryDoc && !finalCategorySlug) finalCategorySlug = foundCategoryDoc.slug;
      } else {
        foundCategoryDoc = await Category.findOne({
          $or: [{ slug: categoryId }, { code: String(categoryId).toUpperCase() }, { name: categoryId }],
        }).lean();
        if (foundCategoryDoc) {
          finalCategoryId = foundCategoryDoc._id;
          finalCategorySlug = foundCategoryDoc.slug;
        }
      }
    }

    let autoSku = sku && sku.trim() ? sku.trim().toUpperCase() : '';
    const prefix = getCategoryCodePrefix(foundCategoryDoc);

    // Nếu không nhập mã SKU, tự sinh theo công thức [mã loại sản phẩm]-SP-XXX (ví dụ GIUONG-SP001)
    if (!autoSku) {
      const existingSkus = await Product.find({
        sku: new RegExp('^' + prefix + '-SP', 'i'),
      }).select('sku').lean();

      let maxNum = 0;
      for (const p of existingSkus) {
        const match = p.sku.match(new RegExp('^' + prefix + '-SP-?(\\d+)', 'i'));
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      autoSku = `${prefix}-SP${String(maxNum + 1).padStart(3, '0')}`;
    }

    const existingSku = await Product.findOne({ sku: autoSku });
    if (existingSku) return sendError(res, `Mã SKU [${autoSku}] đã tồn tại. Vui lòng chọn mã khác.`, 400);

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const stock = Number(stockQuantity) || 0;
    const stockStatus = stock > 0 ? 'in_stock' : 'out_of_stock';
    const isAct = status !== 'ngưng kinh doanh' && status !== 'inactive';
    const finalFile3D = (file3DUrl || req.body.model3DUrl || '').trim();

    let finalRoomIds = [];
    let finalRoomSlugs = Array.isArray(roomSlugs) ? [...roomSlugs] : [];
    if (Array.isArray(roomIds) && roomIds.length > 0) {
      for (const rId of roomIds) {
        if (isValidObjectId(rId)) {
          finalRoomIds.push(rId);
        } else {
          const foundRoom = await Room.findOne({
            $or: [{ slug: rId }, { code: String(rId).toUpperCase() }, { name: rId }],
          }).lean();
          if (foundRoom) {
            finalRoomIds.push(foundRoom._id);
            if (!finalRoomSlugs.includes(foundRoom.slug)) {
              finalRoomSlugs.push(foundRoom.slug);
            }
          }
        }
      }
    }

    if (finalRoomIds.length > 0 && finalRoomSlugs.length === 0) {
      const foundRooms = await Room.find({ _id: { $in: finalRoomIds } }).lean();
      if (foundRooms && foundRooms.length > 0) {
        finalRoomSlugs = foundRooms.map((r) => r.slug);
      }
    }

    const product = new Product({
      sku: autoSku,
      name: name.trim(),
      slug: autoSlug,
      categoryId: finalCategoryId,
      categorySlug: finalCategorySlug,
      roomIds: finalRoomIds,
      roomSlugs: finalRoomSlugs,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : null,
      stockQuantity: stock,
      stockStatus,
      thumbnail: thumbnail || '/images/products/default.png',
      images: images && images.length ? images : [thumbnail || '/images/products/default.png'],
      description: description || '',
      dimensions: dimensions || { length: 0, width: 0, height: 0, weight: 0 },
      materials: materials || [],
      colors: colors || [],
      status: isAct ? 'active' : 'inactive',
      isActive: isAct,
      file3DUrl: finalFile3D,
      model3DUrl: finalFile3D || null,
      isFeatured: Boolean(isFeatured),
      badge: badge || '',
      soldQuantity: Number(req.body.soldQuantity) || 0,
    });

    await product.save();

    logActivityInternal({
      entityType: 'product',
      entityId: product._id.toString(),
      entityCode: product.sku,
      action: 'Thêm mới sản phẩm vào hệ thống',
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Tên: ${product.name}, Giá: ${product.price.toLocaleString('vi-VN')} đ, Tồn: ${product.stockQuantity}`,
    });

    return sendSuccess(res, {
      id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price,
      stockQuantity: product.stockQuantity,
      soldQuantity: product.soldQuantity,
      thumbnail: product.thumbnail,
      status: isAct ? 'Đang kinh doanh' : 'ngưng kinh doanh',
      isActive: isAct,
    }, 'Thêm mới sản phẩm thành công.', 201);
  } catch (error) {
    console.error('createProduct error:', error);
    return sendError(res, error.message || 'Không thể tạo sản phẩm.', 500);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Không tìm thấy sản phẩm.', 404);

    const body = req.body;
    if (body.name) product.name = body.name.trim();
    if (body.sku) product.sku = body.sku.trim().toUpperCase();
    if (body.slug) product.slug = body.slug.trim().toLowerCase();
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.salePrice !== undefined) product.salePrice = body.salePrice ? Number(body.salePrice) : null;
    if (body.stockQuantity !== undefined) {
      product.stockQuantity = Number(body.stockQuantity);
      product.stockStatus = product.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    }
    if (body.soldQuantity !== undefined) {
      product.soldQuantity = Math.max(0, Number(body.soldQuantity) || 0);
    }
    if (body.categoryId !== undefined) {
      if (body.categoryId && isValidObjectId(body.categoryId)) {
        product.categoryId = body.categoryId;
        const foundCat = await Category.findById(body.categoryId).lean();
        if (foundCat) product.categorySlug = foundCat.slug;
      } else if (body.categoryId) {
        const foundCat = await Category.findOne({
          $or: [{ slug: body.categoryId }, { code: String(body.categoryId).toUpperCase() }, { name: body.categoryId }],
        }).lean();
        if (foundCat) {
          product.categoryId = foundCat._id;
          product.categorySlug = foundCat.slug;
        } else {
          product.categoryId = null;
        }
      } else {
        product.categoryId = null;
      }
    }
    if (body.categorySlug !== undefined && !product.categorySlug) product.categorySlug = body.categorySlug;
    if (body.roomIds !== undefined) {
      const rIds = Array.isArray(body.roomIds) ? body.roomIds : [];
      const validRoomIds = [];
      const validRoomSlugs = [];
      for (const rId of rIds) {
        if (isValidObjectId(rId)) {
          validRoomIds.push(rId);
        } else {
          const foundRoom = await Room.findOne({
            $or: [{ slug: rId }, { code: String(rId).toUpperCase() }, { name: rId }],
          }).lean();
          if (foundRoom) {
            validRoomIds.push(foundRoom._id);
            if (!validRoomSlugs.includes(foundRoom.slug)) {
              validRoomSlugs.push(foundRoom.slug);
            }
          }
        }
      }
      product.roomIds = validRoomIds;
      if (validRoomIds.length > 0 && validRoomSlugs.length === 0) {
        const foundRooms = await Room.find({ _id: { $in: validRoomIds } }).lean();
        if (foundRooms && foundRooms.length > 0) {
          validRoomSlugs.push(...foundRooms.map((r) => r.slug));
        }
      }
      product.roomSlugs = validRoomSlugs;
    }
    if (body.roomSlugs !== undefined && (!product.roomSlugs || product.roomSlugs.length === 0)) {
      product.roomSlugs = body.roomSlugs;
    }
    if (body.thumbnail !== undefined) product.thumbnail = body.thumbnail;
    if (body.images !== undefined) product.images = body.images;
    if (body.description !== undefined) product.description = body.description;
    if (body.dimensions !== undefined) product.dimensions = body.dimensions;
    if (body.materials !== undefined) product.materials = body.materials;
    if (body.colors !== undefined) product.colors = body.colors;
    if (body.status !== undefined) {
      const isAct = body.status !== 'ngưng kinh doanh' && body.status !== 'inactive';
      product.status = isAct ? 'active' : 'inactive';
      product.isActive = isAct;
    }
    if (body.file3DUrl !== undefined) {
      product.file3DUrl = body.file3DUrl;
      product.model3DUrl = body.file3DUrl || null;
    }
    if (body.isFeatured !== undefined) product.isFeatured = Boolean(body.isFeatured);
    if (body.badge !== undefined) product.badge = body.badge;

    await product.save();

    logActivityInternal({
      entityType: 'product',
      entityId: product._id.toString(),
      entityCode: product.sku,
      action: 'Cập nhật thông tin sản phẩm',
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Cập nhật thông tin ${product.name}. Giá: ${product.price.toLocaleString('vi-VN')} đ, Tồn: ${product.stockQuantity}`,
    });

    const isAct = product.status === 'active' || product.status === 'Đang kinh doanh';
    return sendSuccess(res, {
      id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price,
      stockQuantity: product.stockQuantity,
      thumbnail: product.thumbnail,
      status: isAct ? 'Đang kinh doanh' : 'ngưng kinh doanh',
      isActive: isAct,
    }, 'Cập nhật thông tin sản phẩm thành công.');
  } catch (error) {
    console.error('updateProduct error:', error);
    return sendError(res, error.message || 'Không thể cập nhật sản phẩm.', 500);
  }
};

/**
 * @desc    Toggle product business status (Đang kinh doanh <-> ngưng kinh doanh)
 * @route   PATCH /api/products/:id/toggle
 */
const toggleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Không tìm thấy sản phẩm.', 404);

    const isCurrentlyActive = product.status === 'active' || product.status === 'Đang kinh doanh';
    product.status = isCurrentlyActive ? 'inactive' : 'active';
    product.isActive = !isCurrentlyActive;

    await product.save();

    const displayStatus = product.status === 'active' ? 'Đang kinh doanh' : 'ngưng kinh doanh';

    logActivityInternal({
      entityType: 'product',
      entityId: product._id.toString(),
      entityCode: product.sku,
      action: `Thay đổi trạng thái kinh doanh: ${displayStatus}`,
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Chuyển trạng thái sản phẩm ${product.name} sang ${displayStatus}`,
    });

    return sendSuccess(res, {
      id: product._id.toString(),
      status: displayStatus,
      isActive: product.isActive,
    }, `Đã chuyển trạng thái sản phẩm sang: ${displayStatus}`);

  } catch (error) {
    console.error('toggleProduct error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái sản phẩm.', 500);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Không tìm thấy sản phẩm.', 404);

    logActivityInternal({
      entityType: 'product',
      entityId: product._id.toString(),
      entityCode: product.sku,
      action: 'Xóa sản phẩm khỏi hệ thống',
      performedBy: 'Quản trị viên (Admin)',
      role: 'admin',
      details: `Đã xóa sản phẩm ${product.name} (SKU: ${product.sku})`,
    });

    await Product.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa sản phẩm thành công.');
  } catch (error) {
    console.error('deleteProduct error:', error);
    return sendError(res, 'Không thể xóa sản phẩm.', 500);
  }
};

/**
 * @desc    Bulk import products from parsed Excel/CSV data
 * @route   POST /api/products/import-excel
 */
const importProductsFromExcel = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return sendError(res, 'Danh sách sản phẩm trống hoặc không hợp lệ.', 400);
    }

    const createdItems = [];
    const errors = [];

    const rawCategories = await Category.find().lean();
    const allCategories = rawCategories.map((c) => ({
      ...c,
      code: c.code || (c.slug ? `CAT-${c.slug.toUpperCase()}` : 'CAT-SP'),
    }));

    const rawRooms = await Room.find().lean();
    const allRooms = rawRooms.map((r) => ({
      ...r,
      code: r.code || (r.slug ? `RM-${r.slug.toUpperCase()}` : 'RM-SPACE'),
    }));

    const matchRoomDoc = (roomDoc, input) => {
      if (!roomDoc || !input) return false;
      const target = String(input).trim().toLowerCase();
      const cleanTarget = target.replace(/^rm[-_]/, '').trim();
      const unsignedTarget = removeVietnameseTones(target).trim();
      const slugTarget = unsignedTarget.replace(/[\s_]+/g, '-');

      const idStr = (roomDoc._id || '').toString().toLowerCase();
      const codeStr = (roomDoc.code || '').toLowerCase();
      const cleanCode = codeStr.replace(/^rm[-_]/, '');
      const slugStr = (roomDoc.slug || '').toLowerCase();
      const nameStr = (roomDoc.name || '').toLowerCase();
      const unsignedName = removeVietnameseTones(nameStr);

      return (
        target === idStr ||
        target === codeStr ||
        cleanTarget === cleanCode ||
        target === slugStr ||
        cleanTarget === slugStr ||
        slugTarget === slugStr ||
        target === nameStr ||
        unsignedTarget === unsignedName ||
        slugTarget === cleanCode
      );
    };

    const matchCategoryDoc = (catDoc, input) => {
      if (!catDoc || !input) return false;
      const target = String(input).trim().toLowerCase();
      const cleanTarget = target.replace(/^cat[-_]/, '').trim();
      const unsignedTarget = removeVietnameseTones(target).trim();
      const slugTarget = unsignedTarget.replace(/[\s_]+/g, '-');

      const idStr = (catDoc._id || '').toString().toLowerCase();
      const codeStr = (catDoc.code || '').toLowerCase();
      const cleanCode = codeStr.replace(/^cat[-_]/, '');
      const slugStr = (catDoc.slug || '').toLowerCase();
      const nameStr = (catDoc.name || '').toLowerCase();
      const unsignedName = removeVietnameseTones(nameStr);

      return (
        target === idStr ||
        target === codeStr ||
        cleanTarget === cleanCode ||
        target === slugStr ||
        cleanTarget === slugStr ||
        slugTarget === slugStr ||
        target === nameStr ||
        unsignedTarget === unsignedName ||
        slugTarget === cleanCode
      );
    };

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNum = i + 1;

      if (!row.name || !String(row.name).trim()) {
        errors.push(`Dòng ${rowNum}: Thiếu tên sản phẩm.`);
        continue;
      }

      const price = Number(row.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Dòng ${rowNum}: Giá bán không hợp lệ.`);
        continue;
      }

      // 1. Kiểm tra Danh mục BẮT BUỘC: đối chiếu linh hoạt theo mã code, slug, id hoặc tên danh mục
      let finalCategoryId = null;
      let finalCategorySlug = '';
      const rawCat = String(row.category_code || row.category || row.categoryId || row.categoryName || '').trim();
      if (!rawCat) {
        errors.push(`Dòng ${rowNum} (${row.name}): Chưa điền thông tin danh mục.`);
        continue;
      }
      const foundCat = allCategories.find((c) => matchCategoryDoc(c, rawCat));
      if (!foundCat) {
        errors.push(`Dòng ${rowNum} (${row.name}): Mã/Tên danh mục "${rawCat}" KHÔNG TỒN TẠI trên hệ thống. Vui lòng đối chiếu mã danh mục tại tab "Danh_Muc".`);
        continue;
      }
      finalCategoryId = foundCat._id;
      finalCategorySlug = foundCat.slug || '';

      // 2. Kiểm tra Phòng BẮT BUỘC: đối chiếu linh hoạt theo mã code, slug, id hoặc tên phòng
      let finalRoomIds = [];
      let finalRoomSlugs = [];
      const rawRoom = String(row.room_code || row.room || row.rooms || row.roomNames || '').trim();
      if (!rawRoom) {
        errors.push(`Dòng ${rowNum} (${row.name}): Chưa điền thông tin không gian phòng.`);
        continue;
      }
      const roomSearchArr = rawRoom
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
      let invalidRooms = [];
      for (const rs of roomSearchArr) {
        const foundR = allRooms.find((r) => matchRoomDoc(r, rs));
        if (foundR) {
          if (!finalRoomIds.some((id) => id.toString() === foundR._id.toString())) {
            finalRoomIds.push(foundR._id);
            if (foundR.slug) finalRoomSlugs.push(foundR.slug);
          }
        } else {
          invalidRooms.push(rs);
        }
      }
      if (invalidRooms.length > 0 || finalRoomIds.length === 0) {
        errors.push(`Dòng ${rowNum} (${row.name}): Mã/Tên phòng "${invalidRooms.join(', ') || rawRoom}" KHÔNG TỒN TẠI trên hệ thống. Vui lòng đối chiếu mã phòng tại tab "Danh_Sach_Phong".`);
        continue;
      }

      let sku = row.sku ? String(row.sku).trim().toUpperCase() : '';
      if (!sku) {
        const catDoc = allCategories.find((c) => c._id.toString() === String(finalCategoryId));
        const prefix = getCategoryCodePrefix(catDoc);
        const rand = Math.floor(100 + Math.random() * 900);
        sku = `${prefix}-SP${rand}-${Date.now().toString().slice(-4)}`;
      }

      const dup = await Product.findOne({ sku });
      if (dup) {
        sku = `${sku}-${Math.floor(10 + Math.random() * 90)}`;
      }

      const name = String(row.name).trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4);
      const stock = Math.max(0, parseInt(row.stockQuantity ?? row.stock, 10) || 0);

      const materials = Array.isArray(row.materials) ? row.materials : (row.materials ? String(row.materials).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : []);
      const colors = Array.isArray(row.colors) ? row.colors : (row.colors ? String(row.colors).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : []);
      const images = Array.isArray(row.images) ? row.images : (row.images ? String(row.images).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : []);
      const thumbnail = row.thumbnail || (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500');

      const dimensions = {
        length: Number(row.length ?? row.dimensions?.length) || 0,
        width: Number(row.width ?? row.dimensions?.width) || 0,
        height: Number(row.height ?? row.dimensions?.height) || 0,
        weight: Number(row.weight ?? row.dimensions?.weight) || 0,
      };

      const newProd = new Product({
        sku,
        name,
        slug,
        categoryId: finalCategoryId,
        categorySlug: finalCategorySlug,
        roomIds: finalRoomIds,
        roomSlugs: finalRoomSlugs,
        price,
        salePrice: row.salePrice ? Number(row.salePrice) : null,
        stockQuantity: stock,
        stockStatus: stock > 0 ? 'in_stock' : 'out_of_stock',
        thumbnail,
        images: images.length > 0 ? images : [thumbnail],
        description: row.description || '',
        dimensions,
        materials,
        colors,
        status: 'active',
        isActive: true,
        file3DUrl: (row.file3DUrl || '').trim(),
        model3DUrl: (row.file3DUrl || '').trim() || null,
      });

      await newProd.save();
      createdItems.push({ id: newProd._id.toString(), sku: newProd.sku, name: newProd.name });
    }

    return sendSuccess(res, {
      totalReceived: products.length,
      importedCount: createdItems.length,
      errorsCount: errors.length,
      items: createdItems,
      errors,
    }, `Đã nhập thành công ${createdItems.length}/${products.length} sản phẩm.`);
  } catch (error) {
    console.error('importProductsFromExcel error:', error);
    return sendError(res, error.message || 'Không thể nhập sản phẩm từ Excel.', 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  importProductsFromExcel,
  syncSoldQuantities,
  syncProductRatingsAndReviews,
};
