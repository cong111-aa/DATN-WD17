const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

const tenantStatuses = ["active", "inactive"];
const roomRoles = ["representative", "member"];

const toTenantResponse = (tenant) => ({
  id: tenant._id,
  user: tenant.user?._id || tenant.user,
  userName: tenant.user?.name,
  userEmail: tenant.user?.email,
  userPhone: tenant.user?.phone,
  userIdentityNumber: tenant.user?.identityNumber,
  room: tenant.room?._id || tenant.room,
  roomRole: tenant.roomRole || "member",
  roomName: tenant.room?.name,
  roomNumber: tenant.room?.roomNumber,
  moveInDate: tenant.moveInDate,
  moveOutDate: tenant.moveOutDate,
  status: tenant.status,
  note: tenant.note,
  createdAt: tenant.createdAt,
  updatedAt: tenant.updatedAt,
});

const populateTenant = (query) =>
  query.populate("user", "name email phone identityNumber role").populate({
    path: "room",
    select: "name roomNumber status",
  });

const validateTenantPayload = ({ user, room, roomRole, status }, isCreate) => {
  if (isCreate && (!user || !room)) {
    throw new Error("User and room are required");
  }

  if (roomRole && !roomRoles.includes(roomRole)) {
    throw new Error("Invalid room role");
  }

  if (status && !tenantStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
};

const ensureUserCanBeTenant = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "user") {
    throw new Error("Admin account cannot be a tenant");
  }

  return user;
};

const ensureRoomExists = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  return room;
};

const updateRoomOccupancy = async (roomId) => {
  if (!roomId) {
    return;
  }

  const activeTenantCount = await Tenant.countDocuments({
    room: roomId,
    status: "active",
  });

  const nextStatus = activeTenantCount > 0 ? "occupied" : "available";
  await Room.findByIdAndUpdate(roomId, { status: nextStatus });
};

const ensureSingleRepresentative = async (roomId, exceptTenantId) => {
  if (!roomId) {
    return;
  }

  const filter = {
    room: roomId,
    roomRole: "representative",
    status: "active",
  };

  if (exceptTenantId) {
    filter._id = { $ne: exceptTenantId };
  }

  await Tenant.updateMany(filter, { roomRole: "member" });
};

const getTenants = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.room) {
      filter.room = req.query.room;
    }

    if (req.query.user) {
      filter.user = req.query.user;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tenants = await populateTenant(Tenant.find(filter).sort({ createdAt: -1 }));
    res.json(tenants.map(toTenantResponse));
  } catch (error) {
    next(error);
  }
};

const getTenantById = async (req, res, next) => {
  try {
    const tenant = await populateTenant(Tenant.findById(req.params.id));

    if (!tenant) {
      res.status(404);
      throw new Error("Tenant not found");
    }

    res.json(toTenantResponse(tenant));
  } catch (error) {
    next(error);
  }
};

const createTenant = async (req, res, next) => {
  try {
    const {
      user,
      room,
      roomRole = "member",
      moveInDate = new Date(),
      moveOutDate,
      status = "active",
      note,
    } = req.body;

    validateTenantPayload({ user, room, roomRole, status }, true);
    await ensureUserCanBeTenant(user);
    await ensureRoomExists(room);

    if (status === "active") {
      const activeTenantForUser = await Tenant.findOne({ user, status: "active" });

      if (activeTenantForUser) {
        res.status(400);
        throw new Error("User already has an active tenancy");
      }
    }

    if (status === "active" && roomRole === "representative") {
      await ensureSingleRepresentative(room);
    }

    const tenant = await Tenant.create({
      user,
      room,
      roomRole,
      moveInDate,
      moveOutDate,
      status,
      note,
    });

    await updateRoomOccupancy(room);

    const populatedTenant = await populateTenant(Tenant.findById(tenant._id));
    res.status(201).json(toTenantResponse(populatedTenant));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404);
      throw new Error("Tenant not found");
    }

    const { user, room, roomRole, moveInDate, moveOutDate, status, note } = req.body;

    validateTenantPayload({ user, room, roomRole, status }, false);

    if (user) {
      await ensureUserCanBeTenant(user);
    }

    if (room) {
      await ensureRoomExists(room);
    }

    const nextUser = user ?? tenant.user;
    const nextStatus = status ?? tenant.status;
    const nextRoom = room ?? tenant.room;
    const nextRoomRole = roomRole ?? tenant.roomRole;

    if (nextStatus === "active") {
      const activeTenantForUser = await Tenant.findOne({
        _id: { $ne: tenant._id },
        user: nextUser,
        status: "active",
      });

      if (activeTenantForUser) {
        res.status(400);
        throw new Error("User already has an active tenancy");
      }
    }

    if (nextStatus === "active" && nextRoomRole === "representative") {
      await ensureSingleRepresentative(nextRoom, tenant._id);
    }

    const previousRoom = tenant.room;

    tenant.user = nextUser;
    tenant.room = nextRoom;
    tenant.roomRole = nextRoomRole;
    tenant.moveInDate = moveInDate ?? tenant.moveInDate;
    tenant.moveOutDate = moveOutDate ?? tenant.moveOutDate;
    tenant.status = nextStatus;
    tenant.note = note ?? tenant.note;

    const updatedTenant = await tenant.save();
    await updateRoomOccupancy(previousRoom);
    await updateRoomOccupancy(updatedTenant.room);

    const populatedTenant = await populateTenant(Tenant.findById(updatedTenant._id));
    res.json(toTenantResponse(populatedTenant));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateTenantStatus = async (req, res, next) => {
  try {
    const { status, moveOutDate } = req.body;

    if (!tenantStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404);
      throw new Error("Tenant not found");
    }

    if (status === "active") {
      const activeTenantForUser = await Tenant.findOne({
        _id: { $ne: tenant._id },
        user: tenant.user,
        status: "active",
      });

      if (activeTenantForUser) {
        res.status(400);
        throw new Error("User already has an active tenancy");
      }
    }

    tenant.status = status;

    if (status === "active" && tenant.roomRole === "representative") {
      await ensureSingleRepresentative(tenant.room, tenant._id);
    }

    if (status === "inactive") {
      tenant.moveOutDate = moveOutDate || tenant.moveOutDate || new Date();
    }

    const updatedTenant = await tenant.save();
    await updateRoomOccupancy(updatedTenant.room);

    const populatedTenant = await populateTenant(Tenant.findById(updatedTenant._id));
    res.json(toTenantResponse(populatedTenant));
  } catch (error) {
    next(error);
  }
};

const deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404);
      throw new Error("Tenant not found");
    }

    if (tenant.status === "active") {
      res.status(400);
      throw new Error("Cannot delete active tenant");
    }

    const room = tenant.room;
    await tenant.deleteOne();
    await updateRoomOccupancy(room);

    res.json({ message: "Tenant deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTenant,
  deleteTenant,
  getTenantById,
  getTenants,
  updateTenant,
  updateTenantStatus,
};
