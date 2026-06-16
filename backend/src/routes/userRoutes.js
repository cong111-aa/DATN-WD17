const express = require("express");
const { createUser, getUsers } = require("../controllers/userController");
const { adminOnly, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.post("/", protect, adminOnly, createUser);

module.exports = router;
