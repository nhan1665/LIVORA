/**
 * Standardized API response helpers for LIVORA Backend.
 */

const sendSuccess = (res, data, message = 'Thành công.', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendPaginated = (res, { items, page, pageSize, totalItems, totalPages, ...extra }) => {
  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    ...extra,
  });
};

const sendError = (res, message = 'Đã xảy ra lỗi.', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendPaginated, sendError };
