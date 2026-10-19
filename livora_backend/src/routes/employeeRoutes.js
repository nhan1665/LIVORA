const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeByIdOrCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

router.get('/', getAllEmployees);
router.get('/:idOrCode', getEmployeeByIdOrCode);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
