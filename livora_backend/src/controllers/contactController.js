const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseHelper');

/**
 * @desc    Get contacts list
 * @route   GET /api/contacts
 */
const getContacts = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, pageSize = 10 } = req.query;

    const filter = {};
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { fullName: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { message: { $regex: term, $options: 'i' } },
      ];
    }
    if (status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.max(1, Math.min(100, parseInt(pageSize)));

    const [totalItems, newCount] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.countDocuments({ status: 'new' }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limit;

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = contacts.map((c) => ({
      id: c._id.toString(),
      code: c.code || `LH-${c._id.toString().slice(-4).toUpperCase()}`,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      subject: c.subject,
      message: c.message,
      customerContext: c.customerContext,
      status: c.status,
      respondedBy: c.respondedBy,
      resolvedAt: c.resolvedAt,
      createdAt: c.createdAt,
    }));

    return sendPaginated(res, {
      items,
      page: currentPage,
      pageSize: limit,
      totalItems,
      totalPages,
      newCount,
    });
  } catch (error) {
    console.error('getContacts error:', error);
    return sendError(res, 'Không thể tải danh sách liên hệ.', 500);
  }
};

/**
 * @desc    Create new contact (From User Contact Form)
 * @route   POST /api/contacts
 */
const createContact = async (req, res) => {
  try {
    const { fullName = '', email = '', phone = '', subject = '', message = '', customerContext = '' } = req.body || {};

    const cleanName = (typeof fullName === 'string' ? fullName : '').trim();
    const cleanPhone = (typeof phone === 'string' ? phone : '').replace(/[\s.-]/g, '').replace(/^\+84/, '0');
    const cleanMsg = (typeof message === 'string' ? message : '').trim();
    const cleanEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();

    if (!cleanName) {
      return sendError(res, 'Vui lòng nhập họ và tên của bạn.', 400);
    }
    if (!cleanPhone || !/^0\d{9,10}$/.test(cleanPhone)) {
      return sendError(res, 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0).', 400);
    }
    if (!cleanMsg) {
      return sendError(res, 'Vui lòng nhập nội dung hoặc nhu cầu tư vấn.', 400);
    }

    const count = await Contact.countDocuments();
    const code = `LH-${Date.now().toString().slice(-4)}-${String(count + 1).padStart(3, '0')}`;

    const contact = new Contact({
      code,
      fullName: cleanName,
      email: cleanEmail || `${cleanPhone}@customer.livora.vn`,
      phone: cleanPhone,
      subject: (typeof subject === 'string' && subject.trim()) ? subject.trim() : 'Tư vấn không gian & sản phẩm',
      message: cleanMsg,
      customerContext: (typeof customerContext === 'string' ? customerContext.trim() : '') || 'Khách hàng liên hệ qua Trang chủ',
      status: 'new',
      respondedBy: null,
      resolvedAt: null,
      createdAt: new Date(),
    });

    await contact.save();

    return sendSuccess(res, {
      id: contact._id.toString(),
      code: contact.code,
    }, 'Gửi thông tin liên hệ thành công. LIVORA sẽ liên hệ với bạn trong thời gian sớm nhất!', 201);
  } catch (error) {
    if (error.errInfo?.details) {
      console.error('Atlas validation details:', JSON.stringify(error.errInfo.details, null, 2));
    }
    console.error('createContact error:', error);
    return sendError(res, error.message || 'Không thể gửi liên hệ. Vui lòng thử lại.', 500);
  }
};

/**
 * @desc    Resolve contact status ("Đã liên hệ")
 * @route   PATCH /api/contacts/:id/resolve
 */
const resolveContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return sendError(res, 'Không tìm thấy liên hệ.', 404);

    contact.status = 'resolved';
    const adminId = req.body?.employeeId || req.user?.id;
    if (adminId && mongoose.isValidObjectId(adminId)) {
      contact.respondedBy = new mongoose.Types.ObjectId(adminId);
    } else {
      contact.respondedBy = null;
    }
    contact.resolvedAt = new Date();
    await contact.save();

    return sendSuccess(res, {
      id: contact._id.toString(),
      status: contact.status,
      resolvedAt: contact.resolvedAt,
    }, 'Đã cập nhật trạng thái "Đã liên hệ" thành công.');
  } catch (error) {
    if (error.errInfo?.details) {
      console.error('Atlas resolve validation details:', JSON.stringify(error.errInfo.details, null, 2));
    }
    console.error('resolveContact error:', error);
    return sendError(res, 'Không thể cập nhật liên hệ.', 500);
  }
};

module.exports = {
  getContacts,
  createContact,
  resolveContact,
};
