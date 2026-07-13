const Contract = require("../models/Contract");
const Invoice = require("../models/Invoice");
const RepairRequest = require("../models/RepairRequest");
const Tenant = require("../models/Tenant");
const renderContractHtml = require("../utils/renderContractHtml");
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

    if (request.status !== "pending") {
      res.status(400);
      throw new Error("Only pending repair requests can be updated");
    }

    const { description, images, priority, requestedResolveDate, room, title } = req.body;

    if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
      throw new Error("Invalid priority");
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
  deleteMyRepairRequest,
  getMyContractFile,
  getMyContracts,
  getMyInvoiceById,
  getMyInvoices,
  createMyRepairRequest,
  getMyRepairRequestById,
  getMyRepairRequests,
  getMyTenancies,
  updateMyRepairRequest,
};
