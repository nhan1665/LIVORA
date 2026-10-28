const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
} = require('../controllers/productController');

const mongoose = require('mongoose');

router.get('/debug/force-sync-sold', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Tìm collection chứa Products (có thể là 'Products' hoặc 'products')
    const targetColName = collectionNames.includes('Products') ? 'Products' : 'products';
    const col = db.collection(targetColName);

    const products = await col.find({}).toArray();
    const ordersCol = collectionNames.includes('Orders') ? db.collection('Orders') : (collectionNames.includes('orders') ? db.collection('orders') : null);

    let orders = [];
    if (ordersCol) {
      orders = await ordersCol.find({}).toArray();
    }

    // Tính tổng lượt mua từ Orders
    const salesMap = new Map();
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (item.productId) {
          const pid = item.productId.toString();
          const curr = salesMap.get(pid) || 0;
          salesMap.set(pid, curr + (Number(item.quantity) || 1));
        }
      });
    });

    const updateResults = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let sold = salesMap.get(p._id.toString()) || 0;
      if (sold === 0) {
        // Khởi tạo lượt mua hấp dẫn dựa trên badge, rating, thứ tự
        const isBest =
          p.badge?.toLowerCase().includes('bán chạy') ||
          p.badge?.toLowerCase().includes('best') ||
          p.isFeatured;
        if (isBest) {
          sold = 75 + ((i * 17) % 45); // 75-120
        } else if (p.totalReviews > 0) {
          sold = p.totalReviews * 4 + ((i * 7) % 15);
        } else {
          sold = 25 + ((i * 9) % 30); // 25-55
        }
      }

      await col.updateOne({ _id: p._id }, { $set: { soldQuantity: sold } });
      updateResults.push({ id: p._id, name: p.name, soldQuantity: sold });
    }

    // Lấy lại 1 sample document sau khi update
    const sampleAfter = await col.findOne({});

    return res.json({
      success: true,
      targetCollection: targetColName,
      allCollections: collectionNames,
      totalProducts: products.length,
      sampleDocKeys: Object.keys(sampleAfter || {}),
      sampleSoldQuantity: sampleAfter ? sampleAfter.soldQuantity : null,
      updatedProducts: updateResults,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.patch('/:id/toggle', toggleProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
