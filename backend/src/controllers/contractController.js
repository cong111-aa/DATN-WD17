const Contract = require("../models/Contract");
const ContractLifecycleRequest = require("../models/ContractLifecycleRequest");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const { createNotification } = require("../services/notificationService");
const { daysUntil } = require("../services/contractExpiryService");
const renderContractHtml = require("../utils/renderContractHtml");

const contractStatuses = [
  "pending_user_signature",
  "revision_requested",
  "signed_pending_payment",
  "active",
  "renewal_requested",
  "renewed",
  "checkout_requested",
  "expired_pending",
  "expired",
  "terminated",
];

const contractPopulate = [
  { path: "tenant", select: "name email phone identityNumber address" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee status" },
];

const populateContract = (query) => query.populate(contractPopulate);

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));
  return nextDate;
};

const addDays = (date, days) => new Date(date.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const generateRenewalContractCode = (contractCode) =>
  `HD-RENEW-${String(contractCode || Date.now()).replace(/^HD-/, "")}-${Math.floor(Math.random() * 900 + 100)}`;

const getExpiryBucket = (contract) => {
  if (contract.status === "expired_pending") {
    return "overdue";
  }

  const daysLeft = daysUntil(contract.endDate);

  if (daysLeft < 0) {
    return "overdue";
  }

  if (daysLeft <= 7) {
    return "urgent";
  }

  if (daysLeft <= 15) {
    return contract.status === "active" ? "no_response" : "expiring";
  }

  return "expiring";
};

const getPendingLifecycleRequest = (contractId) =>
  ContractLifecycleRequest.findOne({
    contract: contractId,
    status: "pending",
    type: { $in: ["renewal", "checkout"] },
  });

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
  initialInvoice: contract.initialInvoice?._id || contract.initialInvoice,
  depositCreditAmount: contract.depositCreditAmount || 0,
  contentHash: contract.contentHash,
  lockedAt: contract.lockedAt,
  version: contract.version,
  revisionRequests: contract.revisionRequests || [],
  previousContract: contract.previousContract,
  renewalContract: contract.renewalContract,
  expiryNotice30SentAt: contract.expiryNotice30SentAt,
  expiryNotice15SentAt: contract.expiryNotice15SentAt,
  urgentNoticeSentAt: contract.urgentNoticeSentAt,
  expiredPendingNotifiedAt: contract.expiredPendingNotifiedAt,
  overstayInvoiceCreatedAt: contract.overstayInvoiceCreatedAt,
  checkoutRequestedAt: contract.checkoutRequestedAt,
  checkoutDate: contract.checkoutDate,
  checkoutCompletedAt: contract.checkoutCompletedAt,
  lifecycleHistory: contract.lifecycleHistory || [],
  daysUntilEnd: contract.endDate ? daysUntil(contract.endDate) : null,
  expiryBucket: contract.endDate ? getExpiryBucket(contract) : null,
  status: contract.status,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
});

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

const getExpiringContracts = async (req, res, next) => {
  try {
    const now = new Date();
    const limit = endOfDay(addDays(startOfDay(now), Number(req.query.days || 30)));
    const contracts = await populateContract(
      Contract.find({
        status: { $in: ["active", "renewal_requested", "checkout_requested", "expired_pending"] },
        $or: [{ endDate: { $lte: limit } }, { durationMonths: { $lte: 1 } }],
      }).sort({ endDate: 1 })
    );

    const data = await Promise.all(
      contracts.map(async (contract) => {
        const pendingRequest = await getPendingLifecycleRequest(contract._id).populate("requestedBy", "name email role");

        return {
          ...toContractResponse(contract),
          pendingLifecycleRequest: pendingRequest
            ? {
                id: pendingRequest._id,
                type: pendingRequest.type,
                status: pendingRequest.status,
                requestedDurationMonths: pendingRequest.requestedDurationMonths,
                requestedCheckoutDate: pendingRequest.requestedCheckoutDate,
                requestedByName: pendingRequest.requestedBy?.name,
                requestedByRole: pendingRequest.requestedByRole,
                note: pendingRequest.note,
                createdAt: pendingRequest.createdAt,
              }
            : null,
        };
      })
    );

    res.json(data);
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
      status: {
        $in: [
          "pending_user_signature",
          "signed_pending_payment",
          "active",
          "renewal_requested",
          "checkout_requested",
          "expired_pending",
        ],
      },
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
        status: {
          $in: [
            "pending_user_signature",
            "signed_pending_payment",
            "active",
            "renewal_requested",
            "checkout_requested",
            "expired_pending",
          ],
        },
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

const sendExpiryReminder = async (req, res, next) => {
  try {
    const contract = await populateContract(Contract.findById(req.params.id));

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (!["active", "renewal_requested", "checkout_requested", "expired_pending"].includes(contract.status)) {
      res.status(400);
      throw new Error("Only active or pending-expiry contracts can be reminded");
    }

    const note = String(req.body.note || "").trim();
    contract.lifecycleHistory.push({
      action: "admin_reminder_sent",
      note,
      performedAt: new Date(),
      performedBy: req.user._id,
      performedByRole: "admin",
    });
    await contract.save();

    await createNotification({
      link: "/user/contracts",
      message:
        note ||
        `Hop dong phong ${contract.room?.roomNumber || "-"} sap het han. Vui long chon gia han hoac dang ky tra phong.`,
      metadata: { contract: contract._id, room: contract.room?._id || contract.room },
      recipient: contract.tenant?._id || contract.tenant,
      recipientRole: "user",
      title: "Admin nhac xu ly hop dong sap het han",
      type: "contract_urgent",
    });

    const populatedContract = await populateContract(Contract.findById(contract._id));
    res.json(toContractResponse(populatedContract));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const processContractRenewal = async (req, res, next) => {
  try {
    const oldContract = await Contract.findById(req.params.id);

    if (!oldContract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (!["active", "renewal_requested", "expired_pending"].includes(oldContract.status)) {
      res.status(400);
      throw new Error("Cannot renew this contract status");
    }

    if (oldContract.status === "renewed" || oldContract.renewalContract) {
      res.status(400);
      throw new Error("Contract was already renewed");
    }

    const existingActiveContract = await Contract.findOne({
      _id: { $ne: oldContract._id },
      room: oldContract.room,
      status: "active",
    });

    if (existingActiveContract) {
      res.status(400);
      throw new Error("Room already has another active contract");
    }

    const durationMonths = Number(req.body.durationMonths || oldContract.durationMonths || 1);

    if (!durationMonths || durationMonths < 1) {
      throw new Error("Duration months must be greater than or equal to 1");
    }

    const startDate = req.body.startDate ? new Date(req.body.startDate) : addDays(new Date(oldContract.endDate), 1);
    const endDate = req.body.endDate ? new Date(req.body.endDate) : addMonths(startDate, durationMonths);
    const contractCode = req.body.contractCode || generateRenewalContractCode(oldContract.contractCode);
    const existingCode = await Contract.findOne({ contractCode }).select("_id");

    if (existingCode) {
      res.status(400);
      throw new Error("Contract code already exists");
    }

    const newContract = await Contract.create({
      contractCode,
      deposit: req.body.deposit ?? oldContract.deposit,
      durationMonths,
      endDate,
      memberCount: oldContract.memberCount,
      monthlyRent: req.body.monthlyRent ?? oldContract.monthlyRent,
      moveInDate: startDate,
      previousContract: oldContract._id,
      room: oldContract.room,
      startDate,
      status: "active",
      tenant: oldContract.tenant,
      tenantRecord: oldContract.tenantRecord,
      terms: req.body.terms ?? `Phu luc gia han tu hop dong ${oldContract.contractCode}.`,
    });

    oldContract.status = "renewed";
    oldContract.renewalContract = newContract._id;
    oldContract.lifecycleHistory.push({
      action: "renewed",
      note: req.body.note || `Da tao hop dong gia han ${newContract.contractCode}.`,
      performedAt: new Date(),
      performedBy: req.user._id,
      performedByRole: "admin",
    });
    await oldContract.save();

    await ContractLifecycleRequest.updateMany(
      { contract: oldContract._id, type: "renewal", status: "pending" },
      {
        $set: {
          adminNote: req.body.note || "",
          processedAt: new Date(),
          processedBy: req.user._id,
          renewalContract: newContract._id,
          status: "approved",
        },
        $push: {
          history: {
            action: "approved",
            note: req.body.note || "Admin da xu ly gia han.",
            performedAt: new Date(),
            performedBy: req.user._id,
            performedByRole: "admin",
          },
        },
      }
    );

    await createNotification({
      link: "/user/contracts",
      message: `Hop dong phong ${oldContract.room?.roomNumber || ""} da duoc gia han. Hop dong moi: ${newContract.contractCode}.`,
      metadata: { contract: newContract._id, previousContract: oldContract._id, room: oldContract.room },
      recipient: oldContract.tenant,
      recipientRole: "user",
      title: "Hop dong da duoc gia han",
      type: "contract_renewed",
    });

    const populatedContract = await populateContract(Contract.findById(newContract._id));
    res.status(201).json(toContractResponse(populatedContract));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const createCheckoutProcedure = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id).populate(contractPopulate);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (["terminated", "renewed"].includes(contract.status)) {
      res.status(400);
      throw new Error("Cannot checkout a completed contract");
    }

    if (contract.checkoutCompletedAt) {
      res.status(400);
      throw new Error("Checkout was already completed");
    }

    const checkoutDate = req.body.checkoutDate ? new Date(req.body.checkoutDate) : new Date(contract.endDate);

    contract.status = "checkout_requested";
    contract.checkoutDate = checkoutDate;
    contract.checkoutRequestedAt = contract.checkoutRequestedAt || new Date();
    contract.lifecycleHistory.push({
      action: "checkout_procedure_created",
      note: req.body.note || "",
      performedAt: new Date(),
      performedBy: req.user._id,
      performedByRole: "admin",
    });
    await contract.save();

    await Room.findByIdAndUpdate(contract.room?._id || contract.room, {
      availableFrom: checkoutDate,
      status: "coming_available",
    });

    await ContractLifecycleRequest.updateMany(
      { contract: contract._id, type: "checkout", status: "pending" },
      {
        $set: {
          adminNote: req.body.note || "",
          processedAt: new Date(),
          processedBy: req.user._id,
          status: "approved",
        },
        $push: {
          history: {
            action: "approved",
            note: req.body.note || "Admin da tao thu tuc tra phong.",
            performedAt: new Date(),
            performedBy: req.user._id,
            performedByRole: "admin",
          },
        },
      }
    );

    await createNotification({
      link: "/user/contracts",
      message: `Thu tuc tra phong ${contract.room?.roomNumber || "-"} da duoc ghi nhan. Ngay tra phong: ${checkoutDate.toLocaleDateString("vi-VN")}.`,
      metadata: { contract: contract._id, room: contract.room?._id || contract.room },
      recipient: contract.tenant?._id || contract.tenant,
      recipientRole: "user",
      title: "Da tao thu tuc tra phong",
      type: "contract_checkout_requested",
    });

    const populatedContract = await populateContract(Contract.findById(contract._id));
    res.json(toContractResponse(populatedContract));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const completeCheckout = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (contract.checkoutCompletedAt || contract.status === "terminated") {
      res.status(400);
      throw new Error("Checkout was already completed");
    }

    if (!["checkout_requested", "expired_pending", "active"].includes(contract.status)) {
      res.status(400);
      throw new Error("Cannot complete checkout for this contract status");
    }

    const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();

    await Tenant.updateMany(
      { room: contract.room, user: contract.tenant, status: "active" },
      { moveOutDate: completedAt, status: "inactive" }
    );

    contract.status = "terminated";
    contract.checkoutCompletedAt = completedAt;
    contract.checkoutDate = contract.checkoutDate || completedAt;
    contract.lifecycleHistory.push({
      action: "checkout_completed",
      note: req.body.note || "",
      performedAt: new Date(),
      performedBy: req.user._id,
      performedByRole: "admin",
    });
    await contract.save();

    await Room.findByIdAndUpdate(contract.room, {
      $unset: { availableFrom: "" },
      status: "available",
    });

    await ContractLifecycleRequest.updateMany(
      { contract: contract._id, type: "checkout", status: { $in: ["pending", "approved"] } },
      {
        $set: {
          adminNote: req.body.note || "",
          processedAt: new Date(),
          processedBy: req.user._id,
          status: "completed",
        },
      }
    );

    await createNotification({
      link: "/user/contracts",
      message: "Thu tuc tra phong da hoan tat.",
      metadata: { contract: contract._id, room: contract.room },
      recipient: contract.tenant,
      recipientRole: "user",
      title: "Da hoan tat checkout",
      type: "contract_checkout_completed",
    });

    const populatedContract = await populateContract(Contract.findById(contract._id));
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
  completeCheckout,
  createContract,
  createCheckoutProcedure,
  deleteContract,
  getContractById,
  getContractFile,
  getContracts,
  getExpiringContracts,
  processContractRenewal,
  sendExpiryReminder,
  updateContract,
};
