const Inspiration = require('../models/Inspiration');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get inspirations
 * @route   GET /api/inspirations
 */
const getInspirations = async (req, res) => {
  try {
    const { search = '', status = 'all', roomId = '', page = 1, pageSize = 10, all = 'false' } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { style: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (status !== 'all') {
      filter.status = status;
    }
    if (roomId) {
      filter.roomId = roomId;
    }

    if (all === 'true') {
      const items = await Inspiration.find(filter)
        .populate('roomId', 'name slug')
        .populate('taggedProducts.productId', 'name sku price thumbnail')
        .sort({ createdAt: -1 })
        .lean();
      return sendSuccess(res, items.map((i) => ({
        id: i._id.toString(),
        code: i.code || `INS-${i._id.toString().slice(-4).toUpperCase()}`,
        title: i.title,
        slug: i.slug,
        roomId: i.roomId?._id ? i.roomId._id.toString() : i.roomId,
        roomName: i.roomId?.name || 'Không gian chung',
        style: i.style,
        thumbnail: i.thumbnail,
        content: i.content,
        taggedProducts: (i.taggedProducts || []).map((tp) => ({
          productId: tp.productId?._id ? tp.productId._id.toString() : tp.productId,
          name: tp.productId?.name || '',
          sku: tp.productId?.sku || '',
          price: tp.productId?.price || 0,
          thumbnail: tp.productId?.thumbnail || '',
          xPercent: tp.xPercent,
          yPercent: tp.yPercent,
        })),
        status: i.status,
        viewsCount: i.viewsCount,
        createdAt: i.createdAt,
      })));
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, publishedCount] = await Promise.all([
      Inspiration.countDocuments(filter),
      Inspiration.countDocuments({ status: 'published' }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const inspirations = await Inspiration.find(filter)
      .populate('roomId', 'name slug')
      .populate('taggedProducts.productId', 'name sku price thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = inspirations.map((i) => ({
      id: i._id.toString(),
      code: i.code || `INS-${i._id.toString().slice(-4).toUpperCase()}`,
      title: i.title,
      slug: i.slug,
      roomId: i.roomId?._id ? i.roomId._id.toString() : i.roomId,
      roomName: i.roomId?.name || 'Không gian chung',
      style: i.style,
      thumbnail: i.thumbnail,
      content: i.content,
      taggedProducts: (i.taggedProducts || []).map((tp) => ({
        productId: tp.productId?._id ? tp.productId._id.toString() : tp.productId,
        name: tp.productId?.name || '',
        sku: tp.productId?.sku || '',
        price: tp.productId?.price || 0,
        thumbnail: tp.productId?.thumbnail || '',
        xPercent: tp.xPercent,
        yPercent: tp.yPercent,
      })),
      status: i.status,
      viewsCount: i.viewsCount,
      createdAt: i.createdAt,
    }));


    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      publishedCount,
    });
  } catch (error) {
    console.error('getInspirations error:', error);
    return sendError(res, 'Không thể tải danh sách cảm hứng.', 500);
  }
};

/**
 * @desc    Create inspiration
 * @route   POST /api/inspirations
 */
const createInspiration = async (req, res) => {
  try {
    const { title, slug, roomId, style, thumbnail, content, taggedProducts, status } = req.body;

    if (!title || !title.trim() || !thumbnail) {
      return sendError(res, 'Tiêu đề và ảnh cảm hứng là bắt buộc.', 400);
    }

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase()
      : title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const count = await Inspiration.countDocuments();
    const code = `INS-${String(count + 1).padStart(4, '0')}`;

    const inspiration = new Inspiration({
      code,
      title: title.trim(),
      slug: autoSlug,
      roomId: roomId || null,
      style: style || 'Hiện đại',
      thumbnail: thumbnail.trim(),
      content: content || '',
      taggedProducts: taggedProducts || [],
      status: status || 'published',
    });

    await inspiration.save();

    return sendSuccess(res, {
      id: inspiration._id.toString(),
      code: inspiration.code,
      title: inspiration.title,
    }, 'Thêm mới cảm hứng thành công.', 201);
  } catch (error) {
    console.error('createInspiration error:', error);
    return sendError(res, error.message || 'Không thể tạo cảm hứng.', 500);
  }
};

/**
 * @desc    Update inspiration
 * @route   PUT /api/inspirations/:id
 */
const updateInspiration = async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return sendError(res, 'Không tìm thấy cảm hứng.', 404);

    const b = req.body;
    if (b.title) inspiration.title = b.title.trim();
    if (b.slug) inspiration.slug = b.slug.trim().toLowerCase();
    if (b.roomId !== undefined) inspiration.roomId = b.roomId || null;
    if (b.style) inspiration.style = b.style.trim();
    if (b.thumbnail) inspiration.thumbnail = b.thumbnail.trim();
    if (b.content !== undefined) inspiration.content = b.content;
    if (b.taggedProducts !== undefined) inspiration.taggedProducts = b.taggedProducts;
    if (b.status) inspiration.status = b.status;

    await inspiration.save();

    return sendSuccess(res, {
      id: inspiration._id.toString(),
      title: inspiration.title,
      status: inspiration.status,
    }, 'Cập nhật cảm hứng thành công.');
  } catch (error) {
    console.error('updateInspiration error:', error);
    return sendError(res, error.message || 'Không thể cập nhật cảm hứng.', 500);
  }
};

/**
 * @desc    Toggle inspiration status (published <-> hidden)
 * @route   PATCH /api/inspirations/:id/toggle
 */
const toggleInspiration = async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return sendError(res, 'Không tìm thấy cảm hứng.', 404);

    inspiration.status = inspiration.status === 'published' ? 'hidden' : 'published';
    await inspiration.save();

    return sendSuccess(res, {
      id: inspiration._id.toString(),
      status: inspiration.status,
    }, `Đã chuyển trạng thái cảm hứng sang: ${inspiration.status}`);
  } catch (error) {
    console.error('toggleInspiration error:', error);
    return sendError(res, 'Không thể thay đổi trạng thái cảm hứng.', 500);
  }
};

/**
 * @desc    Delete inspiration
 * @route   DELETE /api/inspirations/:id
 */
const deleteInspiration = async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return sendError(res, 'Không tìm thấy cảm hứng.', 404);

    await Inspiration.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Xóa cảm hứng thành công.');
  } catch (error) {
    console.error('deleteInspiration error:', error);
    return sendError(res, 'Không thể xóa cảm hứng.', 500);
  }
};

module.exports = {
  getInspirations,
  createInspiration,
  updateInspiration,
  toggleInspiration,
  deleteInspiration,
};
