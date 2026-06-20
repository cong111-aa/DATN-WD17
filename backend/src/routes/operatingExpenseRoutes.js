const express = require("express");
const {
  createOperatingExpense,
  createOperatingExpensesBulk,
  deleteOperatingExpense,
  getOperatingExpenseById,
  getOperatingExpenses,
  updateOperatingExpense,
  updateOperatingExpenseStatus,
} = require("../controllers/operatingExpenseController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getOperatingExpenses);
router.post("/", protect, adminOnly, createOperatingExpense);
router.post("/bulk", protect, adminOnly, createOperatingExpensesBulk);
router.get("/:id", protect, adminOnly, getOperatingExpenseById);
router.put("/:id", protect, adminOnly, updateOperatingExpense);
router.patch("/:id/status", protect, adminOnly, updateOperatingExpenseStatus);
router.delete("/:id", protect, adminOnly, deleteOperatingExpense);

module.exports = router;
