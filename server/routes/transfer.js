const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All authenticated users (including Staff) can transfer stock
router.post('/', isAuthenticated, transferController.transferStock);
router.get('/history', isAuthenticated, transferController.getTransferHistory);
router.delete('/:id', isAuthenticated, isAdmin, transferController.deleteTransfer);

module.exports = router;
