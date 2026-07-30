const express = require("express");
const {
  addMyInterestedRoom,
  createMyRepairRequest,
  deleteMyRepairRequest,
  getAvailableRoomById,
  getAvailableRooms,
  getMyContractFile,
  getMyContracts,
  getMyInterestedRooms,
  getMyInvoiceById,
  getMyInvoices,
  getMyRepairRequestById,
  getMyRepairRequests,
  getMyTenancies,
  removeMyInterestedRoom,
  updateMyRepairRequest,
} = require("../controllers/meController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tenancies", protect, getMyTenancies);
router.get("/available-rooms", protect, getAvailableRooms);
router.get("/available-rooms/:id", protect, getAvailableRoomById);
router.get("/interested-rooms", protect, getMyInterestedRooms);
router.post("/interested-rooms", protect, addMyInterestedRoom);
router.delete("/interested-rooms/:roomId", protect, removeMyInterestedRoom);
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
