const express = require("express");
const { uploadAvatarImage, uploadIdentityImages, uploadPaymentProofImages, uploadRepairRequestImages, uploadRoomImages } = require("../controllers/uploadController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { createImageUploader } = require("../middlewares/uploadMiddleware");

const router = express.Router();
const identityImageUpload = createImageUploader("identity");
const roomImageUpload = createImageUploader("rooms");
const repairRequestImageUpload = createImageUploader("repair-requests");
const paymentProofImageUpload = createImageUploader("payment-proofs");

const avatarImageUpload = createImageUploader("avatars");

router.post("/avatar", protect, avatarImageUpload.single("avatar"), uploadAvatarImage);
router.post("/identity", protect, identityImageUpload.fields([{ name: "images", maxCount: 2 }, { name: "identity", maxCount: 2 }]), (req, res, next) => {
  // Normalize req.files to array
  if (!req.files) return uploadIdentityImages(req, res);
  const files = [...(req.files.images || []), ...(req.files.identity || [])];
  req.files = files;
  uploadIdentityImages(req, res);
});
router.post("/payment-proofs", protect, paymentProofImageUpload.array("images", 5), uploadPaymentProofImages);
router.post("/rooms", protect, adminOnly, roomImageUpload.array("images", 10), uploadRoomImages);
router.post(
  "/repair-requests",
  protect,
  repairRequestImageUpload.array("images", 10),
  uploadRepairRequestImages
);

module.exports = router;
