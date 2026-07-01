const Building = require("../models/Building");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");

const roomStatuses = ["available", "occupied", "maintenance"];

const toRoomResponse = (room) => ({
  id: room._id,
  building: room.building?._id || room.building,
  buildingName: room.building?.name,
  buildingCode: room.building?.code,
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
    building,
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
  if (isCreate && (!building || !roomNumber || !name || price === undefined)) {
    throw new Error("Building, room number, name and price are required");
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

const ensureBuildingExists = async (buildingId) => {
  const building = await Building.findById(buildingId);

  if (!building) {
    throw new Error("Building not found");
  }

  return building;
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
};

const getRooms = async (req, res, next) => {
  try {
    const filter = req.query.building ? { building: req.query.building } : {};
    const rooms = await Room.find(filter)
      .populate("building", "name code")
      .sort({ createdAt: -1 });

    res.json(rooms.map(toRoomResponse));
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("building", "name code");

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
      building,
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
        building,
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

    await ensureBuildingExists(building);

    const existingRoom = await Room.findOne({ building, roomNumber });

    if (existingRoom) {
      res.status(400);
      throw new Error("Room number already exists in this building");
    }

    const room = await Room.create({
      building,
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

    const populatedRoom = await room.populate("building", "name code");
    res.status(201).json(toRoomResponse(populatedRoom));
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
      building,
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
        building,
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

    const nextBuilding = building ?? room.building;
    const nextRoomNumber = roomNumber ?? room.roomNumber;

    if (building) {
      await ensureBuildingExists(building);
    }

    if (String(nextBuilding) !== String(room.building) || nextRoomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        _id: { $ne: room._id },
        building: nextBuilding,
        roomNumber: nextRoomNumber,
      });

      if (existingRoom) {
        res.status(400);
        throw new Error("Room number already exists in this building");
      }
    }

    if (status === "available") {
      await ensureRoomCanBeMarkedAvailable(room, res);
    }

    room.building = nextBuilding;
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
    await updatedRoom.populate("building", "name code");
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
    await updatedRoom.populate("building", "name code");
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
