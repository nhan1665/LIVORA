const express = require('express');
const router = express.Router();
const {
  getRoomDesigns,
  createRoomDesign,
  updateRoomDesign,
  toggleRoomDesign,
  deleteRoomDesign,
} = require('../controllers/spaceController');

router.get('/', getRoomDesigns);
router.post('/', createRoomDesign);
router.put('/:id', updateRoomDesign);
router.patch('/:id/toggle', toggleRoomDesign);
router.delete('/:id', deleteRoomDesign);

module.exports = router;
