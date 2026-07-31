const Room = require("../models/Room");
const { toRoomResponse } = require("./roomController");

const getPublicRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: "available" }).sort({ createdAt: -1 });
    res.json(rooms.map(toRoomResponse));
  } catch (error) {
    next(error);
  }
};

const getPublicRoomById = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, status: "available" });

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    res.json(toRoomResponse(room));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicRoomById,
  getPublicRooms,
};
