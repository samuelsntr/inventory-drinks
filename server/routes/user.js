const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isSuperAdmin, userController.getUsers);
router.post('/', isAuthenticated, isSuperAdmin, userController.createUser);
router.put('/:id', isAuthenticated, isSuperAdmin, userController.updateUser);
router.delete('/:id', isAuthenticated, isSuperAdmin, userController.deleteUser);

module.exports = router;
