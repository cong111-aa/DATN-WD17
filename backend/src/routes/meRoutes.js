const express = require("express");
const {
  addMyInterestedRoom,
  cancelMyRoomRequest,
  createMyHoldDepositRequest,
  createMyRentRequest,
  createMyRentRequestFromHoldDeposit,
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
  getMyRoomRequestById,
  getMyRoomRequests,
  getMyTenancies,
  removeMyInterestedRoom,
  requestMyContractRevision,
  signMyContract,
  updateMyRepairRequest,
  updateMyRoomRequestPaymentProof,
} = require("../controllers/meController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tenancies", protect, getMyTenancies);
router.get("/available-rooms", protect, getAvailableRooms);
router.get("/available-rooms/:id", protect, getAvailableRoomById);
router.get("/interested-rooms", protect, getMyInterestedRooms);
router.post("/interested-rooms", protect, addMyInterestedRoom);
router.delete("/interested-rooms/:roomId", protect, removeMyInterestedRoom);
router.get("/room-requests", protect, getMyRoomRequests);
router.get("/room-requests/:id", protect, getMyRoomRequestById);
router.post("/room-requests/hold-deposit", protect, createMyHoldDepositRequest);
router.post("/room-requests/rent", protect, createMyRentRequest);
router.post("/room-requests/:id/rent", protect, createMyRentRequestFromHoldDeposit);
router.patch("/room-requests/:id/payment-proof", protect, updateMyRoomRequestPaymentProof);
router.patch("/room-requests/:id/cancel", protect, cancelMyRoomRequest);
router.get("/contracts", protect, getMyContracts);
router.patch("/contracts/:id/revision-request", protect, requestMyContractRevision);
router.patch("/contracts/:id/sign", protect, signMyContract);
router.get("/contracts/:id/file", protect, getMyContractFile);
router.get("/invoices", protect, getMyInvoices);
router.get("/invoices/:id", protect, getMyInvoiceById);
router.get("/repair-requests", protect, getMyRepairRequests);
router.post("/repair-requests", protect, createMyRepairRequest);
router.get("/repair-requests/:id", protect, getMyRepairRequestById);
router.put("/repair-requests/:id", protect, updateMyRepairRequest);
router.delete("/repair-requests/:id", protect, deleteMyRepairRequest);

module.exports = router;
