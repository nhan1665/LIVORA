const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const publicProfile = (customer) => {
  const address = customer.addresses?.find((item) => item.isDefault) || customer.addresses?.[0];
  return {
    id: customer._id.toString(),
    code: customer.code || '',
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    birthDate: customer.birthDate || null,
    gender: customer.gender || '',
    address: address?.addressLine || '',
    province: address?.province || '',
    addresses: customer.addresses || [],
  };
};

const getMyProfile = (req, res) => sendSuccess(res, publicProfile(req.customer));

const updateMyProfile = async (req, res) => {
  const allowed = new Set(['fullName', 'phone', 'birthDate', 'gender']);
  const keys = Object.keys(req.body || {});
  if (!keys.length || keys.some((key) => !allowed.has(key))) {
    return sendError(res, 'Chỉ có thể cập nhật họ tên, số điện thoại, ngày sinh và giới tính.', 400);
  }
  const customer = req.customer;
  if ('fullName' in req.body) {
    if (typeof req.body.fullName !== 'string' || !req.body.fullName.trim() || req.body.fullName.trim().length > 120) {
      return sendError(res, 'Họ tên phải có từ 1 đến 120 ký tự.', 400);
    }
    customer.fullName = req.body.fullName.trim();
  }
  if ('phone' in req.body) {
    const phone = req.body.phone;
    if (typeof phone !== 'string' || !/^0\d{9,10}$/.test(phone.trim())) {
      return sendError(res, 'Số điện thoại không hợp lệ.', 400);
    }
    const duplicate = await Customer.exists({ _id: { $ne: customer._id }, phone: phone.trim() });
    if (duplicate) return sendError(res, 'Số điện thoại đã được sử dụng.', 409);
    customer.phone = phone.trim();
  }
  if ('birthDate' in req.body) {
    const input = req.body.birthDate;
    const parsed = input === null || input === '' ? null : new Date(input);
    if (parsed && (Number.isNaN(parsed.valueOf()) || parsed > new Date())) {
      return sendError(res, 'Ngày sinh không hợp lệ.', 400);
    }
    customer.birthDate = parsed;
  }
  if ('gender' in req.body) {
    if (!['', 'Nam', 'Nữ', 'Khác'].includes(req.body.gender)) {
      return sendError(res, 'Giới tính không hợp lệ.', 400);
    }
    customer.gender = req.body.gender;
  }
  try {
    await customer.save();
    return sendSuccess(res, publicProfile(customer), 'Cập nhật hồ sơ thành công.');
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'Thông tin liên hệ đã được sử dụng.', 409);
    return sendError(res, 'Không thể cập nhật hồ sơ.', 500);
  }
};

module.exports = { getMyProfile, updateMyProfile };
