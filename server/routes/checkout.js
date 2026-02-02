const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/', isAuthenticated, checkoutController.checkoutItem);
router.get('/history', isAuthenticated, checkoutController.getCheckoutHistory);
router.delete('/:id', isAuthenticated, isAdmin, checkoutController.deleteCheckout);

module.exports = router;
