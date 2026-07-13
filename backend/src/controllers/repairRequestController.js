const RepairRequest = require("../models/RepairRequest");
const Room = require("../models/Room");

const requestPriorities = ["low", "medium", "high", "urgent"];
const requestStatuses = ["pending", "processing", "resolved", "cancelled"];

const requestPopulate = [
  { path: "room", select: "roomNumber name floor" },
  { path: "tenant", select: "name email phone" },
  { path: "createdBy", select: "name email phone role" },
];

const populateRepairRequest = (query) => query.populate(requestPopulate);

const normalizeStatus = (status) => (status === "completed" ? "resolved" : status);

const toRepairRequestResponse = (request) => ({
  id: request._id,
  room: request.room?._id || request.room,
  roomNumber: request.room?.roomNumber,
  roomName: request.room?.name,
  roomFloor: request.room?.floor,
  tenant: request.tenant?._id || request.tenant,
  tenantName: request.tenant?.name,
  tenantEmail: request.tenant?.email,
  tenantPhone: request.tenant?.phone,
  createdBy: request.createdBy?._id || request.createdBy,
  createdByName: request.createdBy?.name,
  createdByEmail: request.createdBy?.email,
  createdByPhone: request.createdBy?.phone,
  createdByRole: request.createdByRole,
  title: request.title,
  description: request.description,
  images: request.images || [],
  requestedResolveDate: request.requestedResolveDate,
  priority: request.priority,
  status: normalizeStatus(request.status),
  adminNote: request.adminNote,
  resolvedAt: request.resolvedAt || request.completedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const validateRepairRequestPayload = ({ room, title, description, priority, status }, isCreate) => {
  if (isCreate && (!room || !title || !description)) {
    throw new Error("Room, title and description are required");
  }

  if (priority && !requestPriorities.includes(priority)) {
    throw new Error("Invalid priority");
  }

  if (status && !requestStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
};

const ensureRoomExists = async (roomId) => {
  const room = await Room.findById(roomId).select("_id");

  if (!room) {
    throw new Error("Room not found");
  }
};

const applyResolvedAt = (request, status, resolvedAt) => {
  if (resolvedAt === null) {
    request.resolvedAt = undefined;
    request.completedAt = undefined;
    return;
  }

  if (resolvedAt) {
    request.resolvedAt = new Date(resolvedAt);
    request.completedAt = request.resolvedAt;
    return;
  }

  if (status === "resolved" && !request.resolvedAt) {
    request.resolvedAt = new Date();
    request.completedAt = request.resolvedAt;
  }
};

const buildRepairRequestFilter = (query) => {
  const filter = {};

  if (query.room) {
    filter.room = query.room;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.createdByRole) {
    filter.createdByRole = query.createdByRole;
  }

  return filter;
};

const getRepairRequests = async (req, res, next) => {
  try {
    const filter = buildRepairRequestFilter(req.query);
    const requests = await populateRepairRequest(
      RepairRequest.find(filter).sort({ createdAt: -1 })
    );

    res.json(requests.map(toRepairRequestResponse));
  } catch (error) {
    next(error);
  }
};

const getRepairRequestById = async (req, res, next) => {
  try {
    const request = await populateRepairRequest(RepairRequest.findById(req.params.id));

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    res.json(toRepairRequestResponse(request));
  } catch (error) {
    next(error);
  }
};

const createRepairRequest = async (req, res, next) => {
  try {
    const {
      adminNote,
      description,
      priority = "medium",
      room,
      status = "pending",
      title,
    } = req.body;

    validateRepairRequestPayload({ room, title, description, priority, status }, true);
    await ensureRoomExists(room);

    const request = await RepairRequest.create({
      adminNote,
      createdBy: req.user._id,
      createdByRole: "admin",
      description,
      priority,
      room,
      status,
      title,
      resolvedAt: status === "resolved" ? new Date() : undefined,
    });

    const populatedRequest = await populateRepairRequest(RepairRequest.findById(request._id));
    res.status(201).json(toRepairRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateRepairRequest = async (req, res, next) => {
  try {
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    const { adminNote, description, priority, resolvedAt, room, status, title } = req.body;
    validateRepairRequestPayload({ room, title, description, priority, status }, false);

    if (room && String(room) !== String(request.room)) {
      await ensureRoomExists(room);
    }

    applyResolvedAt(request, status, resolvedAt);

    request.adminNote = adminNote ?? request.adminNote;
    request.description = description ?? request.description;
    request.priority = priority ?? request.priority;
    request.room = room ?? request.room;
    request.status = status ?? request.status;
    request.title = title ?? request.title;

    const updatedRequest = await request.save();
    const populatedRequest = await populateRepairRequest(RepairRequest.findById(updatedRequest._id));
    res.json(toRepairRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const deleteRepairRequest = async (req, res, next) => {
  try {
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    await request.deleteOne();
    res.json({ message: "Repair request deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRepairRequest,
  deleteRepairRequest,
  getRepairRequestById,
  getRepairRequests,
  requestPriorities,
  requestStatuses,
  toRepairRequestResponse,
  updateRepairRequest,
};
