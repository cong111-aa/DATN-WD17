const express = require("express");
const { uploadRoomImages } = require("../controllers/uploadController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { createImageUploader } = require("../middlewares/uploadMiddleware");

const router = express.Router();
const roomImageUpload = createImageUploader("rooms");

router.post("/rooms", protect, adminOnly, roomImageUpload.array("images", 10), uploadRoomImages);

module.exports = router;
