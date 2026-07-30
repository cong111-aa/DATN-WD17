const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");
const Tenant = require("../models/Tenant");

const roomStatuses = ["available", "reserved", "occupied", "maintenance"];

const toRoomResponse = (room) => ({
  id: room._id,
  roomNumber: room.roomNumber,
  name: room.name,
  floor: room.floor,
  area: room.area,
  capacity: room.capacity,
  price: room.price,
  deposit: room.deposit,
  electricityPrice: room.electricityPrice,
  waterPrice: room.waterPrice,
  serviceFee: room.serviceFee,
  description: room.description,
  images: room.images || [],
  status: room.status,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const validateNonNegativeNumber = (value, fieldName) => {
  if (value !== undefined && Number(value) < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }
};

const validateRoomPayload = (
  {
    roomNumber,
    name,
    floor,
    area,
    capacity,
    price,
    deposit,
    electricityPrice,
    waterPrice,
    serviceFee,
    status,
  },
  isCreate
) => {
  if (isCreate && (!roomNumber || !name || price === undefined)) {
    throw new Error("Room number, name and price are required");
  }

  validateNonNegativeNumber(floor, "Floor");
  validateNonNegativeNumber(area, "Area");
  validateNonNegativeNumber(price, "Price");
  validateNonNegativeNumber(deposit, "Deposit");
  validateNonNegativeNumber(electricityPrice, "Electricity price");
  validateNonNegativeNumber(waterPrice, "Water price");
  validateNonNegativeNumber(serviceFee, "Service fee");

  if (capacity !== undefined && Number(capacity) < 1) {
    throw new Error("Capacity must be greater than or equal to 1");
  }

  if (status && !roomStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
};

const ensureRoomCanBeMarkedAvailable = async (room, res) => {
  if (room.status === "occupied") {
    res.status(400);
    throw new Error("Cannot mark occupied room as available");
  }

  const activeTenant = await Tenant.findOne({
    room: room._id,
    status: "active",
  });

  if (activeTenant) {
    res.status(400);
    throw new Error("Cannot mark room as available while it has active tenant");
  }

  const paidHoldRequest = await RoomRequest.findOne({
    room: room._id,
    type: "hold_deposit",
    paymentStatus: "paid",
    status: { $in: ["pending", "approved"] },
  });

  if (paidHoldRequest) {
    res.status(400);
    throw new Error("Cannot mark reserved room as available while it has paid hold request");
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });

    res.json(rooms.map(toRoomResponse));
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    res.json(toRoomResponse(room));
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const {
      roomNumber,
      name,
      floor = 1,
      area = 0,
      capacity = 1,
      price,
      deposit = 0,
      electricityPrice = 3500,
      waterPrice = 15000,
      serviceFee = 0,
      description,
      images = [],
      status = "available",
    } = req.body;

    validateRoomPayload(
      {
        roomNumber,
        name,
        floor,
        area,
        capacity,
        price,
        deposit,
        electricityPrice,
        waterPrice,
        serviceFee,
        status,
      },
      true
    );

    const existingRoom = await Room.findOne({ roomNumber });

    if (existingRoom) {
      res.status(400);
      throw new Error("Room number already exists");
    }

    const room = await Room.create({
      roomNumber,
      name,
      floor,
      area,
      capacity,
      price,
      deposit,
      electricityPrice,
      waterPrice,
      serviceFee,
      description,
      images,
      status,
    });

    res.status(201).json(toRoomResponse(room));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    const {
      roomNumber,
      name,
      floor,
      area,
      capacity,
      price,
      deposit,
      electricityPrice,
      waterPrice,
      serviceFee,
      description,
      images,
      status,
    } = req.body;

    validateRoomPayload(
      {
        roomNumber,
        name,
        floor,
        area,
        capacity,
        price,
        deposit,
        electricityPrice,
        waterPrice,
        serviceFee,
        status,
      },
      false
    );

    const nextRoomNumber = roomNumber ?? room.roomNumber;

    if (nextRoomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        _id: { $ne: room._id },
        roomNumber: nextRoomNumber,
      });

      if (existingRoom) {
        res.status(400);
        throw new Error("Room number already exists");
      }
    }

    if (status === "available") {
      await ensureRoomCanBeMarkedAvailable(room, res);
    }

    room.roomNumber = nextRoomNumber;
    room.name = name ?? room.name;
    room.floor = floor ?? room.floor;
    room.area = area ?? room.area;
    room.capacity = capacity ?? room.capacity;
    room.price = price ?? room.price;
    room.deposit = deposit ?? room.deposit;
    room.electricityPrice = electricityPrice ?? room.electricityPrice;
    room.waterPrice = waterPrice ?? room.waterPrice;
    room.serviceFee = serviceFee ?? room.serviceFee;
    room.description = description ?? room.description;
    room.images = images ?? room.images;
    room.status = status ?? room.status;

    const updatedRoom = await room.save();
    res.json(toRoomResponse(updatedRoom));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!roomStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    if (status === "available") {
      await ensureRoomCanBeMarkedAvailable(room, res);
    }

    room.status = status;
    const updatedRoom = await room.save();
    res.json(toRoomResponse(updatedRoom));
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    if (room.status === "occupied") {
      res.status(400);
      throw new Error("Cannot delete occupied room");
    }

    await room.deleteOne();
    res.json({ message: "Room deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  deleteRoom,
  getRoomById,
  getRooms,
  updateRoom,
  updateRoomStatus,
};
