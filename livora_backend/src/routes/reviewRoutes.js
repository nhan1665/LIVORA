const express = require('express');
const router = express.Router();
const { getReviews, createReview, hideReview } = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', createReview);
router.patch('/:id/hide', hideReview);

module.exports = router;
