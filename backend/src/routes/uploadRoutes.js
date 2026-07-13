const express = require("express");
const { uploadRepairRequestImages, uploadRoomImages } = require("../controllers/uploadController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { createImageUploader } = require("../middlewares/uploadMiddleware");

const router = express.Router();
const roomImageUpload = createImageUploader("rooms");
const repairRequestImageUpload = createImageUploader("repair-requests");

router.post("/rooms", protect, adminOnly, roomImageUpload.array("images", 10), uploadRoomImages);
router.post(
  "/repair-requests",
  protect,
  repairRequestImageUpload.array("images", 10),
  uploadRepairRequestImages
);

module.exports = router;
