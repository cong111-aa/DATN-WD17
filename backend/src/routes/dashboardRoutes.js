const express = require("express");
const { getAdminDashboard } = require("../controllers/dashboardController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/admin", protect, adminOnly, getAdminDashboard);

module.exports = router;
