const Contract = require("../models/Contract");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const { createNotification } = require("../services/notificationService");
const renderContractHtml = require("../utils/renderContractHtml");

const contractStatuses = ["pending_user_signature", "revision_requested", "active", "expired", "terminated"];

const contractPopulate = [
  { path: "tenant", select: "name email phone identityNumber address" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee status" },
];

const populateContract = (query) => query.populate(contractPopulate);

const toContractResponse = (contract) => ({
  id: contract._id,
  contractCode: contract.contractCode,
  tenant: contract.tenant?._id || contract.tenant,
  tenantName: contract.tenant?.name,
  tenantEmail: contract.tenant?.email,
  tenantPhone: contract.tenant?.phone,
  tenantIdentityNumber: contract.tenant?.identityNumber,
  tenantRecord: contract.tenantRecord?._id || contract.tenantRecord,
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
  signatureMethod: contract.signatureMethod,
  signedAt: contract.signedAt,
  contentHash: contract.contentHash,
  lockedAt: contract.lockedAt,
  version: contract.version,
  revisionRequests: contract.revisionRequests || [],
  status: contract.status,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
});

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));
  return nextDate;
};

const getRepresentativeTenant = async (tenantId, roomId) => {
  const tenant = await Tenant.findOne({
    user: tenantId,
    room: roomId,
    roomRole: "representative",
    status: "active",
  })
    .populate("user", "name email phone identityNumber address")
    .populate("room");

  if (!tenant) {
    throw new Error("Tenant must be active room representative");
  }

  return tenant;
};

const getActiveMembers = (roomId) =>
  Tenant.find({ room: roomId, status: "active" }).populate("user", "name email phone identityNumber");

const validateContractPayload = ({ contractCode, tenant, room, monthlyRent, deposit, durationMonths, status }, isCreate) => {
  if (isCreate && (!contractCode || !tenant || !room || monthlyRent === undefined || durationMonths === undefined)) {
    throw new Error("Contract code, representative, room, rent and duration are required");
  }

  if (monthlyRent !== undefined && Number(monthlyRent) < 0) {
    throw new Error("Monthly rent must be greater than or equal to 0");
  }

  if (deposit !== undefined && Number(deposit) < 0) {
    throw new Error("Deposit must be greater than or equal to 0");
  }

  if (durationMonths !== undefined && Number(durationMonths) < 1) {
    throw new Error("Duration must be greater than or equal to 1");
  }

  if (status && !contractStatuses.includes(status)) {
    throw new Error("Invalid contract status");
  }
};

const buildContractFromPayload = async (payload, existingContract) => {
  const roomId = payload.room ?? existingContract?.room;
  const tenantId = payload.tenant ?? existingContract?.tenant;
  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  const representativeTenant = await getRepresentativeTenant(tenantId, roomId);
  const members = await getActiveMembers(roomId);
  const moveInDate = payload.moveInDate ?? existingContract?.moveInDate ?? representativeTenant.moveInDate ?? new Date();
  const durationMonths = payload.durationMonths ?? existingContract?.durationMonths;
  const endDate = payload.endDate ?? addMonths(moveInDate, durationMonths);

  return {
    room,
    representativeTenant,
    members,
    data: {
      tenant: tenantId,
      tenantRecord: representativeTenant._id,
      room: roomId,
      memberCount: members.length || 1,
      moveInDate,
      durationMonths,
      startDate: payload.startDate ?? existingContract?.startDate ?? moveInDate,
      endDate,
      monthlyRent: payload.monthlyRent ?? existingContract?.monthlyRent ?? room.price,
      deposit: payload.deposit ?? existingContract?.deposit ?? room.deposit,
      terms: payload.terms ?? existingContract?.terms,
      status: payload.status ?? existingContract?.status ?? "pending_user_signature",
    },
  };
};

const getContracts = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.room) {
      filter.room = req.query.room;
    }

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const contracts = await populateContract(Contract.find(filter).sort({ createdAt: -1 }));
    res.json(contracts.map(toContractResponse));
  } catch (error) {
    next(error);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const contract = await populateContract(Contract.findById(req.params.id));

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    res.json(toContractResponse(contract));
  } catch (error) {
    next(error);
  }
};

const createContract = async (req, res, next) => {
  try {
    validateContractPayload(req.body, true);

    const existingCode = await Contract.findOne({ contractCode: req.body.contractCode });

    if (existingCode) {
      res.status(400);
      throw new Error("Contract code already exists");
    }

    const activeContract = await Contract.findOne({
      room: req.body.room,
      status: { $in: ["pending_user_signature", "active"] },
    });

    if (activeContract) {
      res.status(400);
      throw new Error("Room already has active contract");
    }

    const { data } = await buildContractFromPayload(req.body);
    const contract = await Contract.create({ contractCode: req.body.contractCode, ...data });
    const populatedContract = await populateContract(Contract.findById(contract._id));

    res.status(201).json(toContractResponse(populatedContract));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    validateContractPayload(req.body, false);

    if (req.body.contractCode && req.body.contractCode !== contract.contractCode) {
      const existingCode = await Contract.findOne({ contractCode: req.body.contractCode });

      if (existingCode) {
        res.status(400);
        throw new Error("Contract code already exists");
      }

      contract.contractCode = req.body.contractCode;
    }

    const nextRoom = req.body.room ?? contract.room;

    if (String(nextRoom) !== String(contract.room) || req.body.status === "active") {
      const activeContract = await Contract.findOne({
        _id: { $ne: contract._id },
        room: nextRoom,
        status: { $in: ["pending_user_signature", "active"] },
      });

      if (activeContract) {
        res.status(400);
        throw new Error("Room already has active contract");
      }
    }

    const { data } = await buildContractFromPayload(req.body, contract);
    const wasRevisionRequested = contract.status === "revision_requested";
    Object.assign(contract, data);

    if (wasRevisionRequested) {
      contract.status = "pending_user_signature";
      contract.version = Number(contract.version || 1) + 1;
      contract.contractHtmlSnapshot = "";
      contract.contentHash = "";
      contract.lockedAt = undefined;
      contract.signatureImage = "";
      contract.signatureMethod = "";
      contract.signedAt = undefined;
      contract.revisionRequests = (contract.revisionRequests || []).map((revision) => {
        if (revision.status !== "pending") {
          return revision;
        }

        revision.status = "resolved";
        revision.resolvedAt = new Date();
        revision.adminResponse = req.body.revisionResponse || "Hop dong da duoc cap nhat theo yeu cau.";
        return revision;
      });
    }

    const updatedContract = await contract.save();
    const populatedContract = await populateContract(Contract.findById(updatedContract._id));

    if (wasRevisionRequested) {
      await createNotification({
        link: "/user/contracts",
        message: `Hop dong ${populatedContract.contractCode} da duoc cap nhat. Vui long kiem tra va ky xac nhan.`,
        metadata: { contract: populatedContract._id, room: populatedContract.room?._id || populatedContract.room },
        recipient: populatedContract.tenant?._id || populatedContract.tenant,
        recipientRole: "user",
        title: "Hop dong da duoc cap nhat",
        type: "contract_revision_resolved",
      });
    }

    res.json(toContractResponse(populatedContract));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const deleteContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (contract.status === "active") {
      res.status(400);
      throw new Error("Cannot delete active contract");
    }

    await contract.deleteOne();
    res.json({ message: "Contract deleted" });
  } catch (error) {
    next(error);
  }
};

const getContractFile = async (req, res, next) => {
  try {
    const contract = await populateContract(Contract.findById(req.params.id));

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    const members = await getActiveMembers(contract.room?._id || contract.room);
    const html = contract.contractHtmlSnapshot || renderContractHtml({ contract, members });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContract,
  deleteContract,
  getContractById,
  getContractFile,
  getContracts,
  updateContract,
};
