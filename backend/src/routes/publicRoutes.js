const express = require("express");
const { getPublicRoomById, getPublicRooms } = require("../controllers/publicController");

const router = express.Router();

router.get("/rooms", getPublicRooms);
router.get("/rooms/:id", getPublicRoomById);

module.exports = router;
