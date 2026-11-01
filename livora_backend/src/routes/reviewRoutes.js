const express = require('express');
const router = express.Router();
const {
  getReviews,
  createReview,
  hideReview,
  updateReviewStatus,
} = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', createReview);
router.patch('/:id/hide', hideReview);
router.patch('/:id/status', updateReviewStatus);
router.patch('/:id/toggle', updateReviewStatus);

module.exports = router;
