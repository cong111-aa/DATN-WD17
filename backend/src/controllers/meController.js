const Contract = require("../models/Contract");
const InterestedRoom = require("../models/InterestedRoom");
const Invoice = require("../models/Invoice");
const RepairRequest = require("../models/RepairRequest");
const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");
const Tenant = require("../models/Tenant");
const renderContractHtml = require("../utils/renderContractHtml");
const { buildBankTransferPayment, buildPaymentContent, buildVietQrUrl } = require("../utils/paymentQr");
const { toRepairRequestResponse } = require("./repairRequestController");

const tenantPopulate = [
  { path: "user", select: "name email phone identityNumber" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images" },
];

const contractPopulate = [
  { path: "tenant", select: "name email phone identityNumber address" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee status" },
];

const invoicePopulate = [
  { path: "tenant", select: "name email phone identityNumber" },
  { path: "room", select: "roomNumber name price serviceFee electricityPrice waterPrice" },
  { path: "meterReading", select: "electricityOld electricityNew waterOld waterNew" },
  { path: "contract", select: "contractCode status startDate endDate" },
];

const repairRequestPopulate = [
  { path: "room", select: "roomNumber name floor" },
  { path: "tenant", select: "name email phone" },
  { path: "createdBy", select: "name email phone role" },
];

const roomRequestPopulate = [
  { path: "user", select: "name email phone identityNumber" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images" },
  { path: "processedBy", select: "name email role" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "contract", select: "contractCode status startDate endDate" },
];

const toTenantResponse = (tenant) => ({
  id: tenant._id,
  roomRole: tenant.roomRole,
  moveInDate: tenant.moveInDate,
  moveOutDate: tenant.moveOutDate,
  status: tenant.status,
  note: tenant.note,
  room: tenant.room?._id || tenant.room,
  roomNumber: tenant.room?.roomNumber,
  roomName: tenant.room?.name,
  roomFloor: tenant.room?.floor,
  roomArea: tenant.room?.area,
  roomCapacity: tenant.room?.capacity,
  roomPrice: tenant.room?.price,
  roomDeposit: tenant.room?.deposit,
  roomElectricityPrice: tenant.room?.electricityPrice,
  roomWaterPrice: tenant.room?.waterPrice,
  roomServiceFee: tenant.room?.serviceFee,
  roomDescription: tenant.room?.description,
  roomStatus: tenant.room?.status,
  roomImages: tenant.room?.images || [],
});

const toAvailableRoomResponse = (room) => ({
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
});

const toInterestedRoomResponse = (interest) => ({
  id: interest._id,
  room: interest.room?._id || interest.room,
  roomNumber: interest.room?.roomNumber,
  name: interest.room?.name,
  floor: interest.room?.floor,
  area: interest.room?.area,
  capacity: interest.room?.capacity,
  price: interest.room?.price,
  deposit: interest.room?.deposit,
  electricityPrice: interest.room?.electricityPrice,
  waterPrice: interest.room?.waterPrice,
  serviceFee: interest.room?.serviceFee,
  description: interest.room?.description,
  images: interest.room?.images || [],
  roomStatus: interest.room?.status,
  note: interest.note,
  status: interest.status,
  createdAt: interest.createdAt,
  updatedAt: interest.updatedAt,
});

const toRoomRequestResponse = (roomRequest) => ({
  id: roomRequest._id,
  requestCode: roomRequest.requestCode,
  user: roomRequest.user?._id || roomRequest.user,
  userName: roomRequest.user?.name,
  userEmail: roomRequest.user?.email,
  userPhone: roomRequest.user?.phone,
  room: roomRequest.room?._id || roomRequest.room,
  roomNumber: roomRequest.room?.roomNumber,
  roomName: roomRequest.room?.name,
  roomFloor: roomRequest.room?.floor,
  roomArea: roomRequest.room?.area,
  roomCapacity: roomRequest.room?.capacity,
  roomPrice: roomRequest.room?.price,
  roomDeposit: roomRequest.room?.deposit,
  roomStatus: roomRequest.room?.status,
  roomImages: roomRequest.room?.images || [],
  type: roomRequest.type,
  durationMonths: roomRequest.durationMonths,
  occupantCount: roomRequest.occupantCount,
  occupants: roomRequest.occupants || [],
  amount: roomRequest.amount,
  holdExpiresAt: roomRequest.holdExpiresAt,
  paymentProvider: roomRequest.paymentProvider,
  paymentStatus: roomRequest.paymentStatus,
  paymentOrderCode: roomRequest.paymentOrderCode,
  paymentCheckoutUrl: roomRequest.paymentCheckoutUrl,
  ...buildBankTransferPayment(roomRequest),
  paidAt: roomRequest.paidAt,
  tenantRecord: roomRequest.tenantRecord?._id || roomRequest.tenantRecord,
  contract: roomRequest.contract?._id || roomRequest.contract,
  contractCode: roomRequest.contract?.contractCode,
  contractStatus: roomRequest.contract?.status,
  contractStartDate: roomRequest.contract?.startDate,
  contractEndDate: roomRequest.contract?.endDate,
  status: roomRequest.status,
  message: roomRequest.message,
  adminNote: roomRequest.adminNote,
  processedBy: roomRequest.processedBy?._id || roomRequest.processedBy,
  processedByName: roomRequest.processedBy?.name,
  processedAt: roomRequest.processedAt,
  createdAt: roomRequest.createdAt,
  updatedAt: roomRequest.updatedAt,
});

const toContractResponse = (contract) => ({
  id: contract._id,
  contractCode: contract.contractCode,
  tenant: contract.tenant?._id || contract.tenant,
  tenantName: contract.tenant?.name,
  tenantEmail: contract.tenant?.email,
  tenantPhone: contract.tenant?.phone,
  tenantIdentityNumber: contract.tenant?.identityNumber,
  room: contract.room?._id || contract.room,
  roomNumber: contract.room?.roomNumber,
  roomName: contract.room?.name,
  roomFloor: contract.room?.floor,
  memberCount: contract.memberCount,
  monthlyRent: contract.monthlyRent,
  deposit: contract.deposit,
  moveInDate: contract.moveInDate,
  durationMonths: contract.durationMonths,
  startDate: contract.startDate,
  endDate: contract.endDate,
  terms: contract.terms,
  status: contract.status,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
});

const toInvoiceResponse = (invoice) => ({
  id: invoice._id,
  invoiceCode: invoice.invoiceCode,
  room: invoice.room?._id || invoice.room,
  roomNumber: invoice.room?.roomNumber,
  roomName: invoice.room?.name,
  roomPrice: invoice.room?.price,
  roomServiceFee: invoice.room?.serviceFee,
  electricityPrice: invoice.room?.electricityPrice,
  waterPrice: invoice.room?.waterPrice,
  tenant: invoice.tenant?._id || invoice.tenant,
  tenantName: invoice.tenant?.name,
  tenantEmail: invoice.tenant?.email,
  tenantPhone: invoice.tenant?.phone,
  contract: invoice.contract?._id || invoice.contract,
  contractCode: invoice.contract?.contractCode,
  meterReading: invoice.meterReading?._id || invoice.meterReading,
  electricityOld: invoice.meterReading?.electricityOld,
  electricityNew: invoice.meterReading?.electricityNew,
  electricityUsage:
    invoice.meterReading?.electricityNew !== undefined
      ? Math.max(invoice.meterReading.electricityNew - invoice.meterReading.electricityOld, 0)
      : undefined,
  waterOld: invoice.meterReading?.waterOld,
  waterNew: invoice.meterReading?.waterNew,
  waterUsage:
    invoice.meterReading?.waterNew !== undefined
      ? Math.max(invoice.meterReading.waterNew - invoice.meterReading.waterOld, 0)
      : undefined,
  month: invoice.month,
  year: invoice.year,
  rentAmount: invoice.rentAmount,
  electricityAmount: invoice.electricityAmount,
  waterAmount: invoice.waterAmount,
  serviceAmount: invoice.serviceAmount,
  otherAmount: invoice.otherAmount,
  discountAmount: invoice.discountAmount,
  totalAmount: invoice.totalAmount,
  paidAmount: invoice.paidAmount,
  remainingAmount: Math.max(Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0), 0),
  dueDate: invoice.dueDate,
  status: invoice.status,
  note: invoice.note,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
});

const getActiveMembers = (roomId) =>
  Tenant.find({ room: roomId, status: "active" }).populate("user", "name email phone identityNumber");

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const generateRoomRequestCode = (type) => {
  const prefix = type === "hold_deposit" ? "HOLD" : "RENT";
  return `RQ-${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
};

const buildPaymentFields = (requestCode, amount) => {
  const content = buildPaymentContent(requestCode);

  return {
    paymentOrderCode: content,
    paymentProvider: "vietqr",
    paymentQrCode: buildVietQrUrl({ amount, content }),
    paymentStatus: "unpaid",
  };
};

const normalizeOccupants = (occupants = []) =>
  occupants.map((occupant) => ({
    name: String(occupant.name || "").trim(),
    phone: String(occupant.phone || "").trim(),
    identityNumber: String(occupant.identityNumber || "").trim(),
    identityFrontImage: String(occupant.identityFrontImage || "").trim(),
    identityBackImage: String(occupant.identityBackImage || "").trim(),
  }));

const getMyTenancies = async (req, res, next) => {
  try {
    const tenancies = await Tenant.find({ user: req.user._id })
      .populate(tenantPopulate)
      .sort({ status: 1, moveInDate: -1, createdAt: -1 });

    res.json(tenancies.map(toTenantResponse));
  } catch (error) {
    next(error);
  }
};

const getAvailableRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: "available" }).sort({ createdAt: -1 });
    res.json(rooms.map(toAvailableRoomResponse));
  } catch (error) {
    next(error);
  }
};

const getAvailableRoomById = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, status: "available" });

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    res.json(toAvailableRoomResponse(room));
  } catch (error) {
    next(error);
  }
};

const getMyInterestedRooms = async (req, res, next) => {
  try {
    const interestedRooms = await InterestedRoom.find({
      user: req.user._id,
      status: "active",
    })
      .populate("room", "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images")
      .sort({ createdAt: -1 });

    res.json(interestedRooms.map(toInterestedRoomResponse));
  } catch (error) {
    next(error);
  }
};

const addMyInterestedRoom = async (req, res, next) => {
  try {
    const { note = "", room } = req.body;

    if (!room) {
      throw new Error("Room is required");
    }

    const availableRoom = await Room.findOne({ _id: room, status: "available" });

    if (!availableRoom) {
      res.status(400);
      throw new Error("Room is not available");
    }

    const interestedRoom = await InterestedRoom.findOneAndUpdate(
      { user: req.user._id, room },
      { note, status: "active" },
      { new: true, setDefaultsOnInsert: true, upsert: true }
    ).populate("room", "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images");

    res.status(201).json(toInterestedRoomResponse(interestedRoom));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const removeMyInterestedRoom = async (req, res, next) => {
  try {
    const interestedRoom = await InterestedRoom.findOne({
      room: req.params.roomId,
      user: req.user._id,
      status: "active",
    });

    if (!interestedRoom) {
      res.status(404);
      throw new Error("Interested room not found");
    }

    interestedRoom.status = "removed";
    await interestedRoom.save();

    res.json({ message: "Interested room removed" });
  } catch (error) {
    next(error);
  }
};

const getMyRoomRequests = async (req, res, next) => {
  try {
    const roomRequests = await RoomRequest.find({ user: req.user._id })
      .populate(roomRequestPopulate)
      .sort({ createdAt: -1 });

    res.json(roomRequests.map(toRoomRequestResponse));
  } catch (error) {
    next(error);
  }
};

const ensureRoomCanBeRequested = async (userId, roomId) => {
  if (!roomId) {
    throw new Error("Room is required");
  }

  const room = await Room.findOne({ _id: roomId, status: "available" });

  if (!room) {
    throw new Error("Room is not available");
  }

  const existingRequest = await RoomRequest.findOne({
    user: userId,
    room: roomId,
    status: "pending",
  });

  if (existingRequest) {
    throw new Error("You already have a pending request for this room");
  }

  return room;
};

const createMyHoldDepositRequest = async (req, res, next) => {
  try {
    const { message = "", room: roomId } = req.body;
    const room = await ensureRoomCanBeRequested(req.user._id, roomId);
    const requestCode = generateRoomRequestCode("hold_deposit");
    const amount = Math.ceil(Number(room.price || 0) / 3);

    const roomRequest = await RoomRequest.create({
      requestCode,
      user: req.user._id,
      room: room._id,
      type: "hold_deposit",
      occupantCount: 1,
      occupants: [],
      amount,
      holdExpiresAt: addDays(new Date(), 7),
      ...buildPaymentFields(requestCode, amount),
      status: "pending",
      message,
    });

    const populatedRequest = await roomRequest.populate(roomRequestPopulate);
    res.status(201).json(toRoomRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const createMyRentRequest = async (req, res, next) => {
  try {
    const { durationMonths, message = "", occupants = [], room: roomId } = req.body;
    const room = await ensureRoomCanBeRequested(req.user._id, roomId);
    const normalizedOccupants = normalizeOccupants(occupants);

    if (!Number(durationMonths) || Number(durationMonths) < 1) {
      throw new Error("Duration months must be greater than 0");
    }

    if (normalizedOccupants.length === 0) {
      throw new Error("At least one occupant is required");
    }

    const missingOccupantInfo = normalizedOccupants.some(
      (occupant) =>
        !occupant.name ||
        !occupant.phone ||
        !occupant.identityNumber ||
        !occupant.identityFrontImage ||
        !occupant.identityBackImage
    );

    if (missingOccupantInfo) {
      throw new Error("Occupant information is incomplete");
    }

    const requestCode = generateRoomRequestCode("rent");
    const amount = Number(room.price || 0);

    const roomRequest = await RoomRequest.create({
      requestCode,
      user: req.user._id,
      room: room._id,
      type: "rent",
      durationMonths: Number(durationMonths),
      occupantCount: Math.max(Number(req.body.occupantCount || 0), normalizedOccupants.length),
      occupants: normalizedOccupants,
      amount,
      ...buildPaymentFields(requestCode, amount),
      status: "pending",
      message,
    });

    const populatedRequest = await roomRequest.populate(roomRequestPopulate);
    res.status(201).json(toRoomRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const cancelMyRoomRequest = async (req, res, next) => {
  try {
    const roomRequest = await RoomRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roomRequest) {
      res.status(404);
      throw new Error("Room request not found");
    }

    if (roomRequest.status !== "pending") {
      res.status(400);
      throw new Error("Only pending requests can be cancelled");
    }

    if (roomRequest.paymentStatus === "paid") {
      res.status(400);
      throw new Error("Paid requests must be processed by admin");
    }

    roomRequest.status = "cancelled";
    roomRequest.paymentStatus =
      roomRequest.paymentStatus === "pending" ? "cancelled" : roomRequest.paymentStatus;
    await roomRequest.save();
    await roomRequest.populate(roomRequestPopulate);

    res.json(toRoomRequestResponse(roomRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const getMyContracts = async (req, res, next) => {
  try {
    const contracts = await Contract.find({ tenant: req.user._id })
      .populate(contractPopulate)
      .sort({ status: 1, endDate: -1, createdAt: -1 });

    res.json(contracts.map(toContractResponse));
  } catch (error) {
    next(error);
  }
};

const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ tenant: req.user._id })
      .populate(invoicePopulate)
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json(invoices.map(toInvoiceResponse));
  } catch (error) {
    next(error);
  }
};

const getMyInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user._id,
    }).populate(invoicePopulate);

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    res.json(toInvoiceResponse(invoice));
  } catch (error) {
    next(error);
  }
};

const ensureMyActiveRoom = async (userId, roomId) => {
  const tenancy = await Tenant.findOne({
    user: userId,
    room: roomId,
    status: "active",
  }).select("_id");

  if (!tenancy) {
    throw new Error("Room must be one of your active tenancies");
  }
};

const getMyRepairRequests = async (req, res, next) => {
  try {
    const requests = await RepairRequest.find({ createdBy: req.user._id })
      .populate(repairRequestPopulate)
      .sort({ createdAt: -1 });

    res.json(requests.map(toRepairRequestResponse));
  } catch (error) {
    next(error);
  }
};

const getMyRepairRequestById = async (req, res, next) => {
  try {
    const request = await RepairRequest.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate(repairRequestPopulate);

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    res.json(toRepairRequestResponse(request));
  } catch (error) {
    next(error);
  }
};

const createMyRepairRequest = async (req, res, next) => {
  try {
    const { description, images = [], priority = "medium", requestedResolveDate, room, title } = req.body;

    if (!room || !title || !description) {
      throw new Error("Room, title and description are required");
    }

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      throw new Error("Invalid priority");
    }

    if (!Array.isArray(images)) {
      throw new Error("Images must be an array");
    }

    await ensureMyActiveRoom(req.user._id, room);

    const request = await RepairRequest.create({
      createdBy: req.user._id,
      createdByRole: "user",
      description,
      images,
      priority,
      requestedResolveDate,
      room,
      status: "pending",
      tenant: req.user._id,
      title,
    });

    const populatedRequest = await RepairRequest.findById(request._id).populate(repairRequestPopulate);
    res.status(201).json(toRepairRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateMyRepairRequest = async (req, res, next) => {
  try {
    const request = await RepairRequest.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    const { description, images, priority, requestedResolveDate, room, status, title } = req.body;

    if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
      throw new Error("Invalid priority");
    }

    if (status && !["pending", "processing", "resolved", "cancelled"].includes(status)) {
      throw new Error("Invalid status");
    }

    if (images !== undefined && !Array.isArray(images)) {
      throw new Error("Images must be an array");
    }

    if (room) {
      await ensureMyActiveRoom(req.user._id, room);
    }

    request.description = description ?? request.description;
    request.images = images ?? request.images;
    request.priority = priority ?? request.priority;
    request.requestedResolveDate =
      requestedResolveDate === null
        ? undefined
        : requestedResolveDate ?? request.requestedResolveDate;
    request.room = room ?? request.room;
    request.status = status ?? request.status;
    request.title = title ?? request.title;

    const updatedRequest = await request.save();
    const populatedRequest = await RepairRequest.findById(updatedRequest._id).populate(repairRequestPopulate);
    res.json(toRepairRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const deleteMyRepairRequest = async (req, res, next) => {
  try {
    const request = await RepairRequest.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!request) {
      res.status(404);
      throw new Error("Repair request not found");
    }

    if (request.status !== "pending") {
      res.status(400);
      throw new Error("Only pending repair requests can be deleted");
    }

    await request.deleteOne();
    res.json({ message: "Repair request deleted" });
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const getMyContractFile = async (req, res, next) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      tenant: req.user._id,
    }).populate(contractPopulate);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    const members = await getActiveMembers(contract.room?._id || contract.room);
    const html = renderContractHtml({ contract, members });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMyInterestedRoom,
  cancelMyRoomRequest,
  createMyHoldDepositRequest,
  createMyRentRequest,
  createMyRepairRequest,
  deleteMyRepairRequest,
  getAvailableRoomById,
  getAvailableRooms,
  getMyContractFile,
  getMyContracts,
  getMyInterestedRooms,
  getMyInvoiceById,
  getMyInvoices,
  getMyRepairRequestById,
  getMyRepairRequests,
  getMyRoomRequests,
  getMyTenancies,
  removeMyInterestedRoom,
  updateMyRepairRequest,
};
