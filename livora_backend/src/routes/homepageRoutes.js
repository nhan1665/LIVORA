const express = require('express');
const router = express.Router();
const {
  getMarquees,
  createMarquee,
  updateMarquee,
  toggleMarquee,
  deleteMarquee,

  getBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,

  getBrands,
  createBrand,
  updateBrand,
  toggleBrand,
  deleteBrand,

  getFooters,
  createFooter,
  updateFooter,
  toggleFooter,
  deleteFooter,
} = require('../controllers/homepageController');

// Marquee Routes
router.get('/marquees', getMarquees);
router.post('/marquees', createMarquee);
router.put('/marquees/:id', updateMarquee);
router.patch('/marquees/:id/toggle', toggleMarquee);
router.delete('/marquees/:id', deleteMarquee);

// Banner Routes
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.patch('/banners/:id/toggle', toggleBanner);
router.delete('/banners/:id', deleteBanner);

// Brand Routes
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.patch('/brands/:id/toggle', toggleBrand);
router.delete('/brands/:id', deleteBrand);

// Footer Routes
router.get('/footers', getFooters);
router.post('/footers', createFooter);
router.put('/footers/:id', updateFooter);
router.patch('/footers/:id/toggle', toggleFooter);
router.delete('/footers/:id', deleteFooter);

module.exports = router;
