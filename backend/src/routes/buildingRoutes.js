const express = require("express");
const {
  createBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildings,
  updateBuilding,
  updateBuildingStatus,
} = require("../controllers/buildingController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getBuildings);
router.post("/", protect, adminOnly, createBuilding);
router.get("/:id", protect, adminOnly, getBuildingById);
router.put("/:id", protect, adminOnly, updateBuilding);
router.patch("/:id/status", protect, adminOnly, updateBuildingStatus);
router.delete("/:id", protect, adminOnly, deleteBuilding);

module.exports = router;
