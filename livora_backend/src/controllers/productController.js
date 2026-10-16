const Product = require('../models/Product');
const Category = require('../models/Category');
const Room = require('../models/Room');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get products (Filter by Room, Category, Keyword, Status, Sort, Pagination)
 * @route   GET /api/products
 */
const getProducts = async (req, res) => {
  try {
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

    // Search keyword
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    // Category filter (slug or id)
    if (category && category !== 'all') {
      filter.$or = [
        { categorySlug: category },
        ...(category.match(/^[0-9a-fA-F]{24}$/) ? [{ categoryId: category }] : []),
      ];
    }

    // Room filter (slug or id)
    if (room && room !== 'all') {
      filter.$or = [
        { roomSlugs: room },
        ...(room.match(/^[0-9a-fA-F]{24}$/) ? [{ roomIds: room }] : []),
      ];
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'active' || status === 'Đang kinh doanh') {
        filter.$or = [{ status: 'active' }, { status: 'Đang kinh doanh' }];
      } else if (status === 'paused' || status === 'inactive' || status === 'ngưng kinh doanh') {
        filter.$or = [{ status: 'inactive' }, { status: 'ngưng kinh doanh' }, { isActive: false }];
      }
    }

    // Stock Status
    if (stockStatus !== 'all') {
      filter.stockStatus = stockStatus;
    }

    // 3D Model filter
    if (has3D === 'yes') {
      filter.$or = [
        { file3DUrl: { $exists: true, $ne: '' } },
        { model3DUrl: { $exists: true, $ne: null } },
      ];
    } else if (has3D === 'no') {
      filter.$and = [
        { $or: [{ file3DUrl: { $exists: false } }, { file3DUrl: '' }] },
        { $or: [{ model3DUrl: { $exists: false } }, { model3DUrl: null }] },
      ];
    }

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort === 'price-asc') sortObj = { price: 1 };
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
        thumbnail: p.thumbnail,
        images: p.images && p.images.length > 0 ? p.images : [p.thumbnail],
        description: p.description,
        dimensions: p.dimensions,
        materials: p.materials,
        colors: p.colors,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
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
      thumbnail: product.thumbnail,
      images: product.images,
      description: product.description,
      dimensions: product.dimensions,
      materials: product.materials,
      colors: product.colors,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
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

    const autoSku = sku && sku.trim()
      ? sku.trim().toUpperCase()
      : `SKU-${Date.now().toString().slice(-6)}`;

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existingSku = await Product.findOne({ sku: autoSku });
    if (existingSku) return sendError(res, `Mã SKU [${autoSku}] đã tồn tại.`, 400);

    const stock = Number(stockQuantity) || 0;
    const stockStatus = stock > 0 ? 'in_stock' : 'out_of_stock';
    const isAct = status !== 'ngưng kinh doanh' && status !== 'inactive';
    const finalFile3D = file3DUrl || req.body.model3DUrl || '';

    const product = new Product({
      sku: autoSku,
      name: name.trim(),
      slug: autoSlug,
      categoryId: categoryId || null,
      categorySlug: categorySlug || '',
      roomIds: roomIds || [],
      roomSlugs: roomSlugs || [],
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
    });

    await product.save();

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
    if (body.categoryId !== undefined) product.categoryId = body.categoryId || null;
    if (body.categorySlug !== undefined) product.categorySlug = body.categorySlug;
    if (body.roomIds !== undefined) product.roomIds = body.roomIds;
    if (body.roomSlugs !== undefined) product.roomSlugs = body.roomSlugs;
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

    await Product.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa sản phẩm thành công.');
  } catch (error) {
    console.error('deleteProduct error:', error);
    return sendError(res, 'Không thể xóa sản phẩm.', 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
};
