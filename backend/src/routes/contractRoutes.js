const express = require("express");
const {
  createContract,
  deleteContract,
  getContractById,
  getContractFile,
  getContracts,
  updateContract,
} = require("../controllers/contractController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getContracts);
router.post("/", protect, adminOnly, createContract);
router.get("/:id", protect, adminOnly, getContractById);
router.get("/:id/file", protect, adminOnly, getContractFile);
router.put("/:id", protect, adminOnly, updateContract);
router.delete("/:id", protect, adminOnly, deleteContract);

module.exports = router;
