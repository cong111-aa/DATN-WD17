const express = require("express");
const {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
  updateInvoiceStatus,
} = require("../controllers/invoiceController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getInvoices);
router.post("/", protect, adminOnly, createInvoice);
router.get("/:id", protect, adminOnly, getInvoiceById);
router.put("/:id", protect, adminOnly, updateInvoice);
router.patch("/:id/status", protect, adminOnly, updateInvoiceStatus);
router.delete("/:id", protect, adminOnly, deleteInvoice);

module.exports = router;
