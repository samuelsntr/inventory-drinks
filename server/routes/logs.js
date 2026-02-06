const express = require("express");
const router = express.Router();
const logsController = require("../controllers/logsController");
const { isAdmin } = require("../middleware/auth");

router.get("/", isAdmin, logsController.getLogs);

module.exports = router;
