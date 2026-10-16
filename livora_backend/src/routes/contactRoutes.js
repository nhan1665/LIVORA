const express = require('express');
const router = express.Router();
const { getContacts, createContact, resolveContact } = require('../controllers/contactController');

router.get('/', getContacts);
router.post('/', createContact);
router.patch('/:id/resolve', resolveContact);

module.exports = router;
