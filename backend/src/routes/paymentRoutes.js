const express = require("express");
const {
  createVnpayPayment,
  handleVnpayIpn,
  handleVnpayReturn,
} = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/vnpay/create", protect, createVnpayPayment);
router.get("/vnpay/return", handleVnpayReturn);
router.get("/vnpay/ipn", handleVnpayIpn);

module.exports = router;
