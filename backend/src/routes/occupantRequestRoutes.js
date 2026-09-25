const express = require("express");
const {
  approveOccupantRequest,
  getOccupantRequests,
  rejectOccupantRequest,
} = require("../controllers/occupantRequestController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getOccupantRequests);
router.patch("/:id/approve", protect, adminOnly, approveOccupantRequest);
router.patch("/:id/reject", protect, adminOnly, rejectOccupantRequest);

module.exports = router;
