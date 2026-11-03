const fs = require('fs');
const path = require('path');
const Policy = require('../models/Policy');

// @desc    Lấy thông tin chính sách đang áp dụng
// @route   GET /api/policy
// @access  Public
exports.getPolicy = async (req, res) => {
  try {
    let policy = await Policy.findOne({ isActive: true }).sort({ updatedAt: -1 });
    
    // Nếu chưa có, tạo chính sách mặc định
    if (!policy) {
      policy = await Policy.create({
        title: 'Chính sách Bán hàng & Hoàn tiền LIVORA',
        summary: 'Quy định về bảo hành, đổi trả, hoàn tiền và các điều khoản giao dịch chung khi mua sắm tại nội thất LIVORA.',
        fileName: 'Chinh_Sach_Ban_Hang_Va_Hoan_Tien_Livora.pdf',
        fileType: 'application/pdf',
        fileSize: '350 KB',
        version: '1.0',
        isActive: true
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin chính sách',
      error: error.message
    });
  }
};

// @desc    Cập nhật / tải lên tài liệu chính sách mới (Admin)
// @route   POST /api/policy
// @access  Admin
exports.updatePolicy = async (req, res) => {
  try {
    const { title, fileName, fileType, fileSize, fileData, summary, content, version, updatedBy } = req.body;

    console.log(`[POLICY] Nhận yêu cầu cập nhật chính sách: "${title || 'Không tiêu đề'}", fileName: "${fileName || 'Không file'}"`);

    let savedFileUrl = '';
    let finalFileData = fileData || '';

    // Nếu có fileData Base64 (vd: data:application/pdf;base64,...)
    if (fileData && fileData.startsWith('data:')) {
      try {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanName = (fileName || 'policy_document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
          const targetDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'policy');
          fs.mkdirSync(targetDir, { recursive: true });

          const diskFileName = `${Date.now()}_${cleanName}`;
          const filePath = path.join(targetDir, diskFileName);
          fs.writeFileSync(filePath, buffer);

          savedFileUrl = `/uploads/policy/${diskFileName}`;
          console.log(`[POLICY] Đã lưu file vật lý thành công: ${savedFileUrl}`);
          
          // Để tránh vượt quá giới hạn 16MB của MongoDB BSON, chỉ lưu Base64 nếu file nhỏ (< 2MB)
          if (buffer.length > 2 * 1024 * 1024) {
            finalFileData = savedFileUrl; // Dùng URL thay cho base64 khổng lồ
          }
        }
      } catch (fileErr) {
        console.warn('[POLICY] Không thể ghi file ra đĩa, sẽ lưu trực tiếp vào cơ sở dữ liệu:', fileErr.message);
      }
    }

    let policy = await Policy.findOne({ isActive: true });

    if (policy) {
      if (title !== undefined) policy.title = title;
      if (fileName !== undefined) policy.fileName = fileName;
      if (fileType !== undefined) policy.fileType = fileType;
      if (fileSize !== undefined) policy.fileSize = fileSize;
      if (finalFileData !== undefined) policy.fileData = finalFileData;
      if (savedFileUrl) policy.fileUrl = savedFileUrl;
      if (summary !== undefined) policy.summary = summary;
      if (content !== undefined) policy.content = content;
      if (version !== undefined) policy.version = version;
      if (updatedBy !== undefined) policy.updatedBy = updatedBy;

      await policy.save();
    } else {
      policy = await Policy.create({
        title: title || 'Chính sách Bán hàng & Hoàn tiền LIVORA',
        fileName: fileName || '',
        fileType: fileType || '',
        fileSize: fileSize || '',
        fileUrl: savedFileUrl || '',
        fileData: finalFileData || '',
        summary: summary || '',
        content: content || '',
        version: version || '1.0',
        updatedBy: updatedBy || 'Quản trị viên',
        isActive: true
      });
    }

    console.log('[POLICY] Lưu chính sách thành công vào MongoDB Atlas.');

    res.status(200).json({
      success: true,
      message: 'Cập nhật chính sách thành công',
      data: policy
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật chính sách',
      error: error.message
    });
  }
};
