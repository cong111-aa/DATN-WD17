const express = require("express");
const {
  completeCheckout,
  createContract,
  createCheckoutProcedure,
  createCheckoutFinalInvoice,
  deleteContract,
  getContractById,
  getContractFile,
  getContracts,
  getExpiringContracts,
  processContractRenewal,
  sendExpiryReminder,
  updateContract,
} = require("../controllers/contractController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getContracts);
router.post("/", protect, adminOnly, createContract);
router.get("/expiring", protect, adminOnly, getExpiringContracts);
router.patch("/:id/remind-expiry", protect, adminOnly, sendExpiryReminder);
router.post("/:id/renew", protect, adminOnly, processContractRenewal);
router.post("/:id/checkout", protect, adminOnly, createCheckoutProcedure);
router.post("/:id/checkout-final-invoice", protect, adminOnly, createCheckoutFinalInvoice);
router.post("/:id/complete-checkout", protect, adminOnly, completeCheckout);
router.get("/:id", protect, adminOnly, getContractById);
router.get("/:id/file", protect, adminOnly, getContractFile);
router.put("/:id", protect, adminOnly, updateContract);
router.delete("/:id", protect, adminOnly, deleteContract);

module.exports = router;
