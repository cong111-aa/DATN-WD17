const Contract = require("../models/Contract");
const Invoice = require("../models/Invoice");
const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");
const Tenant = require("../models/Tenant");
const { clearExpiredHoldDeposits } = require("../utils/roomPaymentLock");

const roomStatuses = ["available", "payment_pending", "reserved", "occupied", "coming_available", "maintenance"];

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
  address: room.address,
  latitude: room.latitude,
  longitude: room.longitude,
  description: room.description,
  images: room.images || [],
  status: room.status,
  availableFrom: room.availableFrom,
  paymentHoldBy: room.paymentHoldBy,
  paymentHoldRequest: room.paymentHoldRequest,
  paymentHoldExpiresAt: room.paymentHoldExpiresAt,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const toTenantDetailResponse = (tenant) => ({
  id: tenant._id,
  user: tenant.user?._id || tenant.user,
  userName: tenant.user?.name,
  userEmail: tenant.user?.email,
  userPhone: tenant.user?.phone,
  userIdentityNumber: tenant.user?.identityNumber,
  roomRole: tenant.roomRole,
  moveInDate: tenant.moveInDate,
  moveOutDate: tenant.moveOutDate,
  status: tenant.status,
  note: tenant.note,
});

const toContractDetailResponse = (contract) =>
  contract
    ? {
        id: contract._id,
        contractCode: contract.contractCode,
        tenant: contract.tenant?._id || contract.tenant,
        tenantName: contract.tenant?.name,
        tenantEmail: contract.tenant?.email,
        tenantPhone: contract.tenant?.phone,
        tenantIdentityNumber: contract.tenant?.identityNumber,
        memberCount: contract.memberCount,
        monthlyRent: contract.monthlyRent,
        deposit: contract.deposit,
        moveInDate: contract.moveInDate,
        durationMonths: contract.durationMonths,
        startDate: contract.startDate,
        endDate: contract.endDate,
        signedAt: contract.signedAt,
        status: contract.status,
      }
    : null;

const toHoldRequestDetailResponse = (request) =>
  request
    ? {
        id: request._id,
        requestCode: request.requestCode,
        user: request.user?._id || request.user,
        userName: request.user?.name,
        userEmail: request.user?.email,
        userPhone: request.user?.phone,
        userIdentityNumber: request.user?.identityNumber,
        amount: request.amount,
        holdExpiresAt: request.holdExpiresAt,
        paymentProvider: request.paymentProvider,
        paymentStatus: request.paymentStatus,
        paidAt: request.paidAt,
        status: request.status,
        createdAt: request.createdAt,
      }
    : null;

const toInvoiceDetailResponse = (invoice) => ({
  id: invoice._id,
  invoiceCode: invoice.invoiceCode,
  tenant: invoice.tenant?._id || invoice.tenant,
  tenantName: invoice.tenant?.name,
  tenantEmail: invoice.tenant?.email,
  tenantPhone: invoice.tenant?.phone,
  month: invoice.month,
  year: invoice.year,
  totalAmount: invoice.totalAmount,
  paidAmount: invoice.paidAmount,
  dueDate: invoice.dueDate,
  status: invoice.status,
  createdAt: invoice.createdAt,
});

const validateNonNegativeNumber = (value, fieldName) => {
  if (value !== undefined && Number(value) < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }
};

const normalizeCoordinate = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Number(value);
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
    latitude,
    longitude,
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

  const nextLatitude = normalizeCoordinate(latitude);
  const nextLongitude = normalizeCoordinate(longitude);

  if (nextLatitude !== null && (Number.isNaN(nextLatitude) || nextLatitude < -90 || nextLatitude > 90)) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (nextLongitude !== null && (Number.isNaN(nextLongitude) || nextLongitude < -180 || nextLongitude > 180)) {
    throw new Error("Longitude must be between -180 and 180");
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

  await clearExpiredHoldDeposits();

  const paidHoldRequest = await RoomRequest.findOne({
    room: room._id,
    type: "hold_deposit",
    paymentStatus: "paid",
    status: { $in: ["pending", "approved"] },
    holdExpiresAt: { $gt: new Date() },
  });

  if (paidHoldRequest) {
    res.status(400);
    throw new Error("Cannot mark reserved room as available while it has paid hold request");
  }
};

const getRooms = async (req, res, next) => {
  try {
    await clearExpiredHoldDeposits();

    const rooms = await Room.find().sort({ createdAt: -1 });

    res.json(rooms.map(toRoomResponse));
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    await clearExpiredHoldDeposits();

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

const getRoomDetail = async (req, res, next) => {
  try {
    await clearExpiredHoldDeposits();

    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    const [tenants, activeContract, recentInvoices] = await Promise.all([
      Tenant.find({ room: room._id, status: "active" })
        .populate("user", "name email phone identityNumber")
        .sort({ roomRole: -1, moveInDate: 1 }),
      Contract.findOne({
        room: room._id,
        status: {
          $in: [
            "pending_user_signature",
            "revision_requested",
            "active",
            "renewal_requested",
            "checkout_requested",
            "expired_pending",
          ],
        },
      })
        .populate("tenant", "name email phone identityNumber")
        .sort({ createdAt: -1 }),
      Invoice.find({ room: room._id })
        .populate("tenant", "name email phone")
        .sort({ year: -1, month: -1, createdAt: -1 })
        .limit(6),
    ]);
    const canShowHoldRequest =
      room.status === "reserved" && tenants.length === 0 && !activeContract;
    const holdRequest = canShowHoldRequest
      ? await RoomRequest.findOne({
          room: room._id,
          type: "hold_deposit",
          paymentStatus: "paid",
          status: "pending",
          holdExpiresAt: { $gt: new Date() },
        })
          .populate("user", "name email phone identityNumber")
          .sort({ createdAt: -1 })
      : null;

    res.json({
      activeContract: toContractDetailResponse(activeContract),
      holdRequest: toHoldRequestDetailResponse(holdRequest),
      recentInvoices: recentInvoices.map(toInvoiceDetailResponse),
      room: toRoomResponse(room),
      tenants: tenants.map(toTenantDetailResponse),
    });
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
      address = "",
      latitude,
      longitude,
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
        latitude,
        longitude,
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
      address,
      latitude: normalizeCoordinate(latitude),
      longitude: normalizeCoordinate(longitude),
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
      address,
      latitude,
      longitude,
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
        latitude,
        longitude,
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
    room.address = address ?? room.address;
    room.latitude = latitude !== undefined ? normalizeCoordinate(latitude) : room.latitude;
    room.longitude = longitude !== undefined ? normalizeCoordinate(longitude) : room.longitude;
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
  getRoomDetail,
  getRooms,
  toRoomResponse,
  updateRoom,
  updateRoomStatus,
};
