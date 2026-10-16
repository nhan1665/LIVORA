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

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.patch('/:id/toggle', toggleProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
