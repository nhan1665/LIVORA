const express = require('express');
const router = express.Router();
const {
  getInspirations,
  createInspiration,
  updateInspiration,
  toggleInspiration,
  deleteInspiration,
} = require('../controllers/inspirationController');

router.get('/', getInspirations);
router.post('/', createInspiration);
router.put('/:id', updateInspiration);
router.patch('/:id/toggle', toggleInspiration);
router.delete('/:id', deleteInspiration);

module.exports = router;
