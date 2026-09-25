const OccupantRequest = require("../models/OccupantRequest");
const Room = require("../models/Room");
const RoomOccupant = require("../models/RoomOccupant");
const Tenant = require("../models/Tenant");
const { createNotification, notifyAdmins } = require("../services/notificationService");

const populateRequest = (query) =>
  query
    .populate("requestedBy", "name email phone")
    .populate("processedBy", "name email")
    .populate("room", "roomNumber name capacity floor")
    .populate("occupant", "name phone identityNumber status");

const toRequestResponse = (request) => ({
  id: request._id,
  adminNote: request.adminNote,
  createdAt: request.createdAt,
  identityBackImage: request.identityBackImage,
  identityFrontImage: request.identityFrontImage,
  identityNumber: request.identityNumber,
  name: request.name,
  note: request.note,
  occupant: request.occupant?._id || request.occupant,
  phone: request.phone,
  processedAt: request.processedAt,
  processedBy: request.processedBy?._id || request.processedBy,
  processedByName: request.processedBy?.name,
  requestedBy: request.requestedBy?._id || request.requestedBy,
  requestedByEmail: request.requestedBy?.email,
  requestedByName: request.requestedBy?.name,
  requestedByPhone: request.requestedBy?.phone,
  room: request.room?._id || request.room,
  roomCapacity: request.room?.capacity,
  roomFloor: request.room?.floor,
  roomName: request.room?.name,
  roomNumber: request.room?.roomNumber,
  status: request.status,
  updatedAt: request.updatedAt,
});

const normalizeText = (value) => String(value || "").trim();

const countCurrentOccupants = async (roomId, { includePendingRequests = false } = {}) => {
  const [activeTenants, activeExtraOccupants, pendingRequests] = await Promise.all([
    Tenant.countDocuments({ room: roomId, status: "active" }),
    RoomOccupant.countDocuments({ room: roomId, status: "active" }),
    includePendingRequests
      ? OccupantRequest.countDocuments({ room: roomId, status: "pending" })
      : Promise.resolve(0),
  ]);

  return activeTenants + activeExtraOccupants + pendingRequests;
};

const ensureUserActiveInRoom = async (userId, roomId) => {
  const tenant = await Tenant.findOne({
    room: roomId,
    status: "active",
    user: userId,
  });

  if (!tenant) {
    throw new Error("You are not an active tenant of this room");
  }

  return tenant;
};

const validateCapacity = async (roomId, options) => {
  const room = await Room.findById(roomId).select("capacity roomNumber name");

  if (!room) {
    throw new Error("Room not found");
  }

  const currentCount = await countCurrentOccupants(roomId, options);

  if (currentCount + 1 > Number(room.capacity || 1)) {
    throw new Error(`Room capacity exceeded. This room allows ${room.capacity} people and currently has ${currentCount}.`);
  }

  return { currentCount, room };
};

const getMyOccupantRequests = async (req, res, next) => {
  try {
    const requests = await populateRequest(
      OccupantRequest.find({ requestedBy: req.user._id }).sort({ createdAt: -1 })
    );

    res.json(requests.map(toRequestResponse));
  } catch (error) {
    next(error);
  }
};

const createMyOccupantRequest = async (req, res, next) => {
  try {
    const payload = {
      identityBackImage: normalizeText(req.body.identityBackImage),
      identityFrontImage: normalizeText(req.body.identityFrontImage),
      identityNumber: normalizeText(req.body.identityNumber),
      name: normalizeText(req.body.name),
      note: normalizeText(req.body.note),
      phone: normalizeText(req.body.phone),
      room: req.body.room,
    };

    if (!payload.room || !payload.name || !payload.phone || !payload.identityNumber) {
      throw new Error("Room, name, phone and identity number are required");
    }

    if (!payload.identityFrontImage || !payload.identityBackImage) {
      throw new Error("Identity front and back images are required");
    }

    await ensureUserActiveInRoom(req.user._id, payload.room);
    const { room } = await validateCapacity(payload.room, { includePendingRequests: true });

    const existingApproved = await RoomOccupant.findOne({
      identityNumber: payload.identityNumber,
      room: payload.room,
      status: "active",
    });

    if (existingApproved) {
      throw new Error("This occupant is already active in this room");
    }

    const existingPending = await OccupantRequest.findOne({
      identityNumber: payload.identityNumber,
      room: payload.room,
      status: "pending",
    });

    if (existingPending) {
      throw new Error("This occupant already has a pending request for this room");
    }

    const request = await OccupantRequest.create({
      ...payload,
      requestedBy: req.user._id,
    });

    const populatedRequest = await populateRequest(OccupantRequest.findById(request._id));

    await notifyAdmins({
      link: "/admin/occupant-requests",
      message: `${req.user.name} vừa gửi yêu cầu thêm người ở ${payload.name} vào phòng ${room.roomNumber || room.name || "-"}.`,
      metadata: { occupantRequest: request._id, room: room._id, user: req.user._id },
      title: "Yêu cầu thêm người ở",
      type: "occupant_request_created",
    });

    res.status(201).json(toRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const getOccupantRequests = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.room) {
      filter.room = req.query.room;
    }

    const requests = await populateRequest(OccupantRequest.find(filter).sort({ createdAt: -1 }));
    res.json(requests.map(toRequestResponse));
  } catch (error) {
    next(error);
  }
};

const approveOccupantRequest = async (req, res, next) => {
  try {
    const request = await OccupantRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Occupant request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending occupant requests can be approved");
    }

    await validateCapacity(request.room);

    const occupant = await RoomOccupant.create({
      approvedBy: req.user._id,
      identityBackImage: request.identityBackImage,
      identityFrontImage: request.identityFrontImage,
      identityNumber: request.identityNumber,
      name: request.name,
      note: req.body.adminNote || request.note,
      phone: request.phone,
      request: request._id,
      requestedBy: request.requestedBy,
      room: request.room,
      status: "active",
    });

    request.adminNote = normalizeText(req.body.adminNote);
    request.occupant = occupant._id;
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.status = "approved";
    await request.save();

    const populatedRequest = await populateRequest(OccupantRequest.findById(request._id));
    await createNotification({
      link: "/user/my-rooms",
      message: `Yêu cầu thêm người ở ${request.name} đã được admin duyệt.`,
      metadata: { occupantRequest: request._id, occupant: occupant._id, room: request.room },
      recipient: request.requestedBy,
      recipientRole: "user",
      title: "Yêu cầu thêm người ở đã được duyệt",
      type: "occupant_request_approved",
    });

    res.json(toRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const rejectOccupantRequest = async (req, res, next) => {
  try {
    const request = await OccupantRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Occupant request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending occupant requests can be rejected");
    }

    request.adminNote = normalizeText(req.body.adminNote);
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.status = "rejected";
    await request.save();

    const populatedRequest = await populateRequest(OccupantRequest.findById(request._id));
    await createNotification({
      link: "/user/my-rooms",
      message: `Yêu cầu thêm người ở ${request.name} đã bị từ chối.${request.adminNote ? ` Lý do: ${request.adminNote}` : ""}`,
      metadata: { occupantRequest: request._id, room: request.room },
      recipient: request.requestedBy,
      recipientRole: "user",
      title: "Yêu cầu thêm người ở bị từ chối",
      type: "occupant_request_rejected",
    });

    res.json(toRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

module.exports = {
  approveOccupantRequest,
  createMyOccupantRequest,
  getMyOccupantRequests,
  getOccupantRequests,
  rejectOccupantRequest,
};
