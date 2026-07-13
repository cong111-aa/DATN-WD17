const express = require("express");
const {
  getMyContractFile,
  getMyContracts,
  getMyTenancies,
} = require("../controllers/meController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tenancies", protect, getMyTenancies);
router.get("/contracts", protect, getMyContracts);
router.get("/contracts/:id/file", protect, getMyContractFile);

module.exports = router;
