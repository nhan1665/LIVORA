const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleRoom,
  deleteRoom,
} = require('../controllers/roomController');

router.get('/', getRooms);
router.post('/', createRoom);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.patch('/:id/toggle', toggleRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
