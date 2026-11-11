const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleByCode,
  updateRole,
  resetRolesSeed,
} = require('../controllers/roleController');

router.get('/', getRoles);
router.get('/:code', getRoleByCode);
router.put('/:code', updateRole);
router.post('/seed', resetRolesSeed);

module.exports = router;

