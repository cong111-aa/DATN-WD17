const express = require("express");
const {
  createRoom,
  deleteRoom,
  getRoomById,
  getRoomDetail,
  getRooms,
  updateRoom,
  updateRoomStatus,
} = require("../controllers/roomController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getRooms);
router.post("/", protect, adminOnly, createRoom);
router.get("/:id/detail", protect, adminOnly, getRoomDetail);
router.get("/:id", protect, adminOnly, getRoomById);
router.put("/:id", protect, adminOnly, updateRoom);
router.patch("/:id/status", protect, adminOnly, updateRoomStatus);
router.delete("/:id", protect, adminOnly, deleteRoom);

module.exports = router;
