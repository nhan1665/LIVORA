const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get categories (with filter/search/pagination)
 * @route   GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      page = 1,
      pageSize = 10,
      all = 'false',
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { slug: { $regex: term, $options: 'i' } },
      ];
    }

    if (status !== 'all') {
      filter.isActive = status === 'active' || status === 'true';
    }

    // Nếu frontend yêu cầu all=true (dành cho dropdown/menu)
    if (all === 'true') {
      const items = await Category.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
      return sendSuccess(res, items.map(c => ({
        id: c._id.toString(),
        code: c.code || `CAT-${c.slug.toUpperCase()}`,
        name: c.name,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
      })));
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, activeCount] = await Promise.all([
      Category.countDocuments(filter),
      Category.countDocuments({ isActive: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const categories = await Category.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Đếm số lượng sản phẩm thuộc mỗi category
    const items = await Promise.all(
      categories.map(async (c) => {
        const productCount = await Product.countDocuments({
          $or: [{ categoryId: c._id }, { categorySlug: c.slug }],
        });
        return {
          id: c._id.toString(),
          code: c.code || `CAT-${c.slug.toUpperCase()}`,
          name: c.name,
          slug: c.slug,
          description: c.description,
          thumbnail: c.thumbnail,
          displayOrder: c.displayOrder,
          isActive: c.isActive,
          productCount,
        };
      })
    );

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      activeCount,
    });
  } catch (error) {
    console.error('getCategories error:', error);
    return sendError(res, 'Không thể tải danh sách loại sản phẩm.', 500);
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      return sendError(res, 'Không tìm thấy loại sản phẩm.', 404);
    }
    return sendSuccess(res, {
      id: category._id.toString(),
      code: category.code,
      name: category.name,
      slug: category.slug,
      description: category.description,
      thumbnail: category.thumbnail,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
  } catch (error) {
    console.error('getCategoryById error:', error);
    return sendError(res, 'Không thể tải thông tin loại sản phẩm.', 500);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { code, name, slug, description, thumbnail, displayOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Vui lòng nhập tên loại sản phẩm.', 400);
    }

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existing = await Category.findOne({ slug: autoSlug });
    if (existing) {
      return sendError(res, `Slug [${autoSlug}] đã tồn tại. Vui lòng chọn slug khác.`, 400);
    }

    const category = new Category({
      code: code ? code.trim().toUpperCase() : `CAT-${autoSlug.toUpperCase()}`,
      name: name.trim(),
      slug: autoSlug,
      description: description || '',
      thumbnail: thumbnail || '',
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await category.save();

    return sendSuccess(res, {
      id: category._id.toString(),
      code: category.code,
      name: category.name,
      slug: category.slug,
      description: category.description,
      thumbnail: category.thumbnail,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    }, 'Thêm mới loại sản phẩm thành công.', 201);
  } catch (error) {
    console.error('createCategory error:', error);
    return sendError(res, error.message || 'Không thể tạo loại sản phẩm.', 500);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { code, name, slug, description, thumbnail, displayOrder, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Không tìm thấy loại sản phẩm.', 404);
    }

    if (name) category.name = name.trim();
    if (code) category.code = code.trim().toUpperCase();
    if (slug) category.slug = slug.trim().toLowerCase();
    if (description !== undefined) category.description = description;
    if (thumbnail !== undefined) category.thumbnail = thumbnail;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return sendSuccess(res, {
      id: category._id.toString(),
      code: category.code,
      name: category.name,
      slug: category.slug,
      description: category.description,
      thumbnail: category.thumbnail,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    }, 'Cập nhật loại sản phẩm thành công.');
  } catch (error) {
    console.error('updateCategory error:', error);
    return sendError(res, error.message || 'Không thể cập nhật loại sản phẩm.', 500);
  }
};

/**
 * @desc    Toggle category status (Ẩn / Hiện)
 * @route   PATCH /api/categories/:id/toggle
 */
const toggleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Không tìm thấy loại sản phẩm.', 404);
    }

    category.isActive = !category.isActive;
    await category.save();

    return sendSuccess(res, {
      id: category._id.toString(),
      isActive: category.isActive,
    }, `Đã ${category.isActive ? 'kích hoạt' : 'tạm dừng'} loại sản phẩm thành công.`);
  } catch (error) {
    console.error('toggleCategory error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái loại sản phẩm.', 500);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Không tìm thấy loại sản phẩm.', 404);
    }

    await Category.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa loại sản phẩm thành công.');
  } catch (error) {
    console.error('deleteCategory error:', error);
    return sendError(res, 'Không thể xóa loại sản phẩm.', 500);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
};
