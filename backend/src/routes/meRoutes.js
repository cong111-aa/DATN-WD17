const express = require("express");
const {
  getMyContractFile,
  getMyContracts,
  getMyInvoiceById,
  getMyInvoices,
  getMyTenancies,
} = require("../controllers/meController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tenancies", protect, getMyTenancies);
router.get("/contracts", protect, getMyContracts);
router.get("/contracts/:id/file", protect, getMyContractFile);
router.get("/invoices", protect, getMyInvoices);
router.get("/invoices/:id", protect, getMyInvoiceById);

module.exports = router;
