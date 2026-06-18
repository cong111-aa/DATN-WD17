const express = require("express");
const {
  createTenant,
  deleteTenant,
  getTenantById,
  getTenants,
  updateTenant,
  updateTenantStatus,
} = require("../controllers/tenantController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getTenants);
router.post("/", protect, adminOnly, createTenant);
router.get("/:id", protect, adminOnly, getTenantById);
router.put("/:id", protect, adminOnly, updateTenant);
router.patch("/:id/status", protect, adminOnly, updateTenantStatus);
router.delete("/:id", protect, adminOnly, deleteTenant);

module.exports = router;
