const express = require("express");
const {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserStatus,
} = require("../controllers/userController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.post("/", protect, adminOnly, createUser);
router.get("/:id", protect, adminOnly, getUserById);
router.put("/:id", protect, adminOnly, updateUser);
router.patch("/:id/status", protect, adminOnly, updateUserStatus);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
