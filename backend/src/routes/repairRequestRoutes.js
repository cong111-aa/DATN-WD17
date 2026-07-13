const express = require("express");
const {
  createRepairRequest,
  deleteRepairRequest,
  getRepairRequestById,
  getRepairRequests,
  updateRepairRequest,
} = require("../controllers/repairRequestController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getRepairRequests);
router.post("/", protect, adminOnly, createRepairRequest);
router.get("/:id", protect, adminOnly, getRepairRequestById);
router.put("/:id", protect, adminOnly, updateRepairRequest);
router.delete("/:id", protect, adminOnly, deleteRepairRequest);

module.exports = router;
