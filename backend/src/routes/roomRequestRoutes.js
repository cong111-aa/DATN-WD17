const express = require("express");
const {
  approveRoomRequest,
  getRoomRequestById,
  getRoomRequests,
  markRoomRequestPaid,
  rejectRoomRequest,
} = require("../controllers/roomRequestController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getRoomRequests);
router.get("/:id", protect, adminOnly, getRoomRequestById);
router.patch("/:id/payment/paid", protect, adminOnly, markRoomRequestPaid);
router.patch("/:id/approve", protect, adminOnly, approveRoomRequest);
router.patch("/:id/reject", protect, adminOnly, rejectRoomRequest);

module.exports = router;
