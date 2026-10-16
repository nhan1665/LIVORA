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
    const { fullName, email, phone, subject, message, customerContext } = req.body;

    if (!fullName || !phone || !message) {
      return sendError(res, 'Họ tên, số điện thoại và nội dung tin nhắn là bắt buộc.', 400);
    }

    const count = await Contact.countDocuments();
    const code = `LH-${Date.now().toString().slice(-4)}-${String(count + 1).padStart(3, '0')}`;

    const contact = new Contact({
      code,
      fullName: fullName.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      subject: subject || 'Tư vấn sản phẩm & dịch vụ',
      message: message.trim(),
      customerContext: customerContext || '',
      status: 'new',
    });

    await contact.save();

    return sendSuccess(res, {
      id: contact._id.toString(),
      code: contact.code,
    }, 'Gửi thông tin liên hệ thành công. LIVORA sẽ phản hồi sớm nhất!', 201);
  } catch (error) {
    console.error('createContact error:', error);
    return sendError(res, 'Không thể gửi liên hệ.', 500);
  }
};

/**
 * @desc    Resolve contact status ("Duyệt xử lý")
 * @route   PATCH /api/contacts/:id/resolve
 */
const resolveContact = async (req, res) => {
  try {
    const { respondedBy = 'CSKH Livora' } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) return sendError(res, 'Không tìm thấy liên hệ.', 404);

    contact.status = 'resolved';
    contact.respondedBy = respondedBy;
    contact.resolvedAt = new Date();
    await contact.save();

    return sendSuccess(res, {
      id: contact._id.toString(),
      status: contact.status,
      resolvedAt: contact.resolvedAt,
    }, 'Đã duyệt xử lý liên hệ thành công.');
  } catch (error) {
    console.error('resolveContact error:', error);
    return sendError(res, 'Không thể cập nhật liên hệ.', 500);
  }
};

module.exports = {
  getContacts,
  createContact,
  resolveContact,
};
