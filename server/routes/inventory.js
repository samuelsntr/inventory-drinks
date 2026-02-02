const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { upload, compressImage } = require('../middleware/upload');

// All authenticated users can view inventory (Staff read-only)
router.get('/', isAuthenticated, inventoryController.getAllItems);
router.get('/:id', isAuthenticated, inventoryController.getItem);

// Only Admin and Super Admin can create, update, delete
router.post('/', isAuthenticated, isAdmin, upload.single('imageFile'), compressImage, inventoryController.createItem);
router.put('/:id', isAuthenticated, isAdmin, upload.single('imageFile'), compressImage, inventoryController.updateItem);
router.delete('/:id', isAuthenticated, isAdmin, inventoryController.deleteItem);

module.exports = router;
