const express = require("express");
const {
  createMyRepairRequest,
  deleteMyRepairRequest,
  getAvailableRooms,
  getMyContractFile,
  getMyContracts,
  getMyInvoiceById,
  getMyInvoices,
  getMyRepairRequestById,
  getMyRepairRequests,
  getMyTenancies,
  updateMyRepairRequest,
} = require("../controllers/meController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tenancies", protect, getMyTenancies);
router.get("/available-rooms", protect, getAvailableRooms);
router.get("/contracts", protect, getMyContracts);
router.get("/contracts/:id/file", protect, getMyContractFile);
router.get("/invoices", protect, getMyInvoices);
router.get("/invoices/:id", protect, getMyInvoiceById);
router.get("/repair-requests", protect, getMyRepairRequests);
router.post("/repair-requests", protect, createMyRepairRequest);
router.get("/repair-requests/:id", protect, getMyRepairRequestById);
router.put("/repair-requests/:id", protect, updateMyRepairRequest);
router.delete("/repair-requests/:id", protect, deleteMyRepairRequest);

module.exports = router;
