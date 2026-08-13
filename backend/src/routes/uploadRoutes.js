const express = require("express");
const { uploadIdentityImages, uploadPaymentProofImages, uploadRepairRequestImages, uploadRoomImages } = require("../controllers/uploadController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { createImageUploader } = require("../middlewares/uploadMiddleware");

const router = express.Router();
const identityImageUpload = createImageUploader("identity");
const roomImageUpload = createImageUploader("rooms");
const repairRequestImageUpload = createImageUploader("repair-requests");
const paymentProofImageUpload = createImageUploader("payment-proofs");

router.post("/identity", protect, identityImageUpload.array("images", 2), uploadIdentityImages);
router.post("/payment-proofs", protect, paymentProofImageUpload.array("images", 5), uploadPaymentProofImages);
router.post("/rooms", protect, adminOnly, roomImageUpload.array("images", 10), uploadRoomImages);
router.post(
  "/repair-requests",
  protect,
  repairRequestImageUpload.array("images", 10),
  uploadRepairRequestImages
);

module.exports = router;
