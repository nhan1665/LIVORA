const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const publicProfile = (customer) => {
  const address = customer.addresses?.find((item) => item.isDefault) || customer.addresses?.[0];
  return {
    id: customer._id.toString(),
    code: customer.code || '',
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || '',
    birthDate: customer.birthDate || null,
    gender: customer.gender || '',
    avatar: customer.avatar || '',
    address: address?.addressLine || address?.street || '',
    province: address?.province || '',
    addresses: customer.addresses || [],
  };
};

const getMyProfile = (req, res) => sendSuccess(res, publicProfile(req.customer));

const updateMyProfile = async (req, res) => {
  try {
    const customer = req.customer;
    const body = req.body || {};

    if ('fullName' in body) {
      if (typeof body.fullName !== 'string' || body.fullName.trim().length > 120) {
        return sendError(res, 'Họ tên không được vượt quá 120 ký tự.', 400);
      }
      customer.fullName = body.fullName.trim();
    }

    if ('phone' in body) {
      const phone = (body.phone || '').trim();
      if (phone && !/^0\d{9,10}$/.test(phone)) {
        return sendError(res, 'Số điện thoại không hợp lệ.', 400);
      }
      if (phone) {
        const duplicate = await Customer.exists({ _id: { $ne: customer._id }, phone });
        if (duplicate) return sendError(res, 'Số điện thoại đã được tài khoản khác sử dụng.', 409);
      }
      customer.phone = phone;
    }

    if ('birthDate' in body) {
      const input = body.birthDate;
      const parsed = input === null || input === '' ? null : new Date(input);
      if (parsed && (Number.isNaN(parsed.valueOf()) || parsed > new Date())) {
        return sendError(res, 'Ngày sinh không hợp lệ.', 400);
      }
      customer.birthDate = parsed;
    }

    if ('gender' in body) {
      const g = (body.gender || '').trim();
      if (!['', 'Nam', 'Nữ', 'Khác', 'male', 'female', 'other'].includes(g)) {
        return sendError(res, 'Giới tính không hợp lệ.', 400);
      }
      customer.gender = g;
    }

    if ('avatar' in body) {
      customer.avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
    }

    // Cập nhật hoặc bổ sung địa chỉ
    if (Array.isArray(body.addresses)) {
      customer.addresses = body.addresses;
    } else if (body.newAddress && typeof body.newAddress === 'object') {
      const na = body.newAddress;
      const newAddr = {
        addressId: 'addr-' + Date.now(),
        recipientName: na.recipientName || customer.fullName,
        recipientPhone: na.recipientPhone || customer.phone,
        fullName: na.recipientName || customer.fullName,
        phone: na.recipientPhone || customer.phone,
        street: na.street || na.addressLine || '',
        addressLine: na.addressLine || na.street || '',
        ward: na.ward || '',
        district: na.district || '',
        province: na.province || '',
        isDefault: Boolean(na.isDefault || customer.addresses.length === 0),
        label: na.label || 'Địa chỉ nhận hàng',
      };
      if (newAddr.isDefault) {
        customer.addresses.forEach((a) => (a.isDefault = false));
      }
      customer.addresses.push(newAddr);
    } else if (body.address || body.province) {
      // Cập nhật vào địa chỉ mặc định đầu tiên
      if (!customer.addresses || customer.addresses.length === 0) {
        customer.addresses = [{
          addressId: 'addr-' + Date.now(),
          recipientName: customer.fullName,
          recipientPhone: customer.phone,
          fullName: customer.fullName,
          phone: customer.phone,
          addressLine: (body.address || '').trim(),
          province: (body.province || '').trim(),
          isDefault: true,
          label: 'Mặc định',
        }];
      } else {
        const def = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
        if (body.address !== undefined) def.addressLine = body.address.trim();
        if (body.province !== undefined) def.province = body.province.trim();
      }
    }

    customer.lastActiveAt = new Date();
    await customer.save();

    return sendSuccess(res, publicProfile(customer), 'Cập nhật hồ sơ thành công.');
  } catch (error) {
    console.error('updateMyProfile error:', error);
    if (error.code === 11000) return sendError(res, 'Thông tin liên hệ đã được sử dụng.', 409);
    return sendError(res, 'Không thể cập nhật hồ sơ.', 500);
  }
};

module.exports = { getMyProfile, updateMyProfile };
