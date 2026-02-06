const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { isAuthenticated } = require("../middleware/auth");

router.get("/stats", isAuthenticated, dashboardController.getDashboardStats);

module.exports = router;
