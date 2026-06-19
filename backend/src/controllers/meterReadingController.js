const MeterReading = require("../models/MeterReading");
const Room = require("../models/Room");

const readingPopulate = {
  path: "room",
  select: "building roomNumber name electricityPrice waterPrice",
  populate: {
    path: "building",
    select: "name code",
  },
};

const toMeterReadingResponse = (reading) => {
  const electricityUsage = reading.electricityNew - reading.electricityOld;
  const waterUsage = reading.waterNew - reading.waterOld;

  return {
    id: reading._id,
    room: reading.room?._id || reading.room,
    roomNumber: reading.room?.roomNumber,
    roomName: reading.room?.name,
    building: reading.room?.building?._id || reading.room?.building,
    buildingName: reading.room?.building?.name,
    buildingCode: reading.room?.building?.code,
    month: reading.month,
    year: reading.year,
    electricityOld: reading.electricityOld,
    electricityNew: reading.electricityNew,
    electricityUsage,
    waterOld: reading.waterOld,
    waterNew: reading.waterNew,
    waterUsage,
    note: reading.note,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
  };
};

const validateNonNegativeNumber = (value, fieldName) => {
  if (value !== undefined && Number(value) < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }
};

const validateMeterReadingPayload = (
  { room, month, year, electricityOld, electricityNew, waterOld, waterNew },
  isCreate
) => {
  if (
    isCreate &&
    (!room ||
      month === undefined ||
      year === undefined ||
      electricityOld === undefined ||
      electricityNew === undefined ||
      waterOld === undefined ||
      waterNew === undefined)
  ) {
    throw new Error("Room, month, year, electricity and water readings are required");
  }

  if (month !== undefined && (Number(month) < 1 || Number(month) > 12)) {
    throw new Error("Month must be between 1 and 12");
  }

  if (year !== undefined && Number(year) < 2000) {
    throw new Error("Year must be greater than or equal to 2000");
  }

  validateNonNegativeNumber(electricityOld, "Electricity old reading");
  validateNonNegativeNumber(electricityNew, "Electricity new reading");
  validateNonNegativeNumber(waterOld, "Water old reading");
  validateNonNegativeNumber(waterNew, "Water new reading");

  if (
    electricityOld !== undefined &&
    electricityNew !== undefined &&
    Number(electricityNew) < Number(electricityOld)
  ) {
    throw new Error("Electricity new reading must be greater than or equal to old reading");
  }

  if (waterOld !== undefined && waterNew !== undefined && Number(waterNew) < Number(waterOld)) {
    throw new Error("Water new reading must be greater than or equal to old reading");
  }
};

const ensureRoomExists = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  return room;
};

const buildMeterReadingFilter = async (query) => {
  const filter = {};

  if (query.room) {
    filter.room = query.room;
  }

  if (query.building && !query.room) {
    const rooms = await Room.find({ building: query.building }).select("_id");
    filter.room = { $in: rooms.map((room) => room._id) };
  }

  if (query.month) {
    filter.month = Number(query.month);
  }

  if (query.year) {
    filter.year = Number(query.year);
  }

  return filter;
};

const getMeterReadings = async (req, res, next) => {
  try {
    const filter = await buildMeterReadingFilter(req.query);
    const readings = await MeterReading.find(filter)
      .populate(readingPopulate)
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json(readings.map(toMeterReadingResponse));
  } catch (error) {
    next(error);
  }
};

const getMeterReadingById = async (req, res, next) => {
  try {
    const reading = await MeterReading.findById(req.params.id).populate(readingPopulate);

    if (!reading) {
      res.status(404);
      throw new Error("Meter reading not found");
    }

    res.json(toMeterReadingResponse(reading));
  } catch (error) {
    next(error);
  }
};

const createMeterReading = async (req, res, next) => {
  try {
    const { room, month, year, electricityOld, electricityNew, waterOld, waterNew, note } =
      req.body;

    validateMeterReadingPayload(
      { room, month, year, electricityOld, electricityNew, waterOld, waterNew },
      true
    );

    await ensureRoomExists(room);

    const existingReading = await MeterReading.findOne({ room, month, year });

    if (existingReading) {
      res.status(400);
      throw new Error("Meter reading already exists for this room and month");
    }

    const reading = await MeterReading.create({
      room,
      month,
      year,
      electricityOld,
      electricityNew,
      waterOld,
      waterNew,
      note,
    });

    const populatedReading = await reading.populate(readingPopulate);
    res.status(201).json(toMeterReadingResponse(populatedReading));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateMeterReading = async (req, res, next) => {
  try {
    const reading = await MeterReading.findById(req.params.id);

    if (!reading) {
      res.status(404);
      throw new Error("Meter reading not found");
    }

    const { room, month, year, electricityOld, electricityNew, waterOld, waterNew, note } =
      req.body;

    validateMeterReadingPayload(
      { room, month, year, electricityOld, electricityNew, waterOld, waterNew },
      false
    );

    const nextRoom = room ?? reading.room;
    const nextMonth = month ?? reading.month;
    const nextYear = year ?? reading.year;

    if (room) {
      await ensureRoomExists(room);
    }

    if (
      String(nextRoom) !== String(reading.room) ||
      Number(nextMonth) !== Number(reading.month) ||
      Number(nextYear) !== Number(reading.year)
    ) {
      const existingReading = await MeterReading.findOne({
        _id: { $ne: reading._id },
        room: nextRoom,
        month: nextMonth,
        year: nextYear,
      });

      if (existingReading) {
        res.status(400);
        throw new Error("Meter reading already exists for this room and month");
      }
    }

    const nextElectricityOld = electricityOld ?? reading.electricityOld;
    const nextElectricityNew = electricityNew ?? reading.electricityNew;
    const nextWaterOld = waterOld ?? reading.waterOld;
    const nextWaterNew = waterNew ?? reading.waterNew;

    validateMeterReadingPayload(
      {
        room: nextRoom,
        month: nextMonth,
        year: nextYear,
        electricityOld: nextElectricityOld,
        electricityNew: nextElectricityNew,
        waterOld: nextWaterOld,
        waterNew: nextWaterNew,
      },
      false
    );

    reading.room = nextRoom;
    reading.month = nextMonth;
    reading.year = nextYear;
    reading.electricityOld = nextElectricityOld;
    reading.electricityNew = nextElectricityNew;
    reading.waterOld = nextWaterOld;
    reading.waterNew = nextWaterNew;
    reading.note = note ?? reading.note;

    const updatedReading = await reading.save();
    await updatedReading.populate(readingPopulate);
    res.json(toMeterReadingResponse(updatedReading));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const deleteMeterReading = async (req, res, next) => {
  try {
    const reading = await MeterReading.findById(req.params.id);

    if (!reading) {
      res.status(404);
      throw new Error("Meter reading not found");
    }

    await reading.deleteOne();
    res.json({ message: "Meter reading deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMeterReading,
  deleteMeterReading,
  getMeterReadingById,
  getMeterReadings,
  updateMeterReading,
};
