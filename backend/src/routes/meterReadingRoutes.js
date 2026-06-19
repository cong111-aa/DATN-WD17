const express = require("express");
const {
  createMeterReading,
  deleteMeterReading,
  getMeterReadingById,
  getMeterReadings,
  updateMeterReading,
} = require("../controllers/meterReadingController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getMeterReadings);
router.post("/", protect, adminOnly, createMeterReading);
router.get("/:id", protect, adminOnly, getMeterReadingById);
router.put("/:id", protect, adminOnly, updateMeterReading);
router.delete("/:id", protect, adminOnly, deleteMeterReading);

module.exports = router;
