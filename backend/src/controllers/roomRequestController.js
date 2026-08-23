const Contract = require("../models/Contract");
const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");
const Tenant = require("../models/Tenant");
const { createNotification, notifyAdmins } = require("../services/notificationService");
const { buildBankTransferPayment } = require("../utils/paymentQr");
const { markRoomReservedFromPaymentLock } = require("../utils/roomPaymentLock");

const roomRequestPopulate = [
  { path: "user", select: "name email phone identityNumber address" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images" },
  { path: "processedBy", select: "name email role" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "contract", select: "contractCode status startDate endDate" },
];

const roomRequestStatuses = ["pending", "approved", "rejected", "cancelled", "expired"];
const roomRequestTypes = ["hold_deposit", "rent"];

const populateRoomRequest = (query) => query.populate(roomRequestPopulate);

const toRoomRequestResponse = (request) => ({
  id: request._id,
  requestCode: request.requestCode,
  user: request.user?._id || request.user,
  userName: request.user?.name,
  userEmail: request.user?.email,
  userPhone: request.user?.phone,
  userIdentityNumber: request.user?.identityNumber,
  userAddress: request.user?.address,
  room: request.room?._id || request.room,
  roomNumber: request.room?.roomNumber,
  roomName: request.room?.name,
  roomFloor: request.room?.floor,
  roomArea: request.room?.area,
  roomCapacity: request.room?.capacity,
  roomPrice: request.room?.price,
  roomDeposit: request.room?.deposit,
  roomServiceFee: request.room?.serviceFee,
  roomStatus: request.room?.status,
  roomImages: request.room?.images || [],
  type: request.type,
  durationMonths: request.durationMonths,
  occupantCount: request.occupantCount,
  occupants: request.occupants || [],
  amount: request.amount,
  holdExpiresAt: request.holdExpiresAt,
  paymentProvider: request.paymentProvider,
  paymentStatus: request.paymentStatus,
  paymentOrderCode: request.paymentOrderCode,
  paymentLinkId: request.paymentLinkId,
  paymentCheckoutUrl: request.paymentCheckoutUrl,
  paymentProofImages: request.paymentProofImages || [],
  paymentConfirmedBy: request.paymentConfirmedBy,
  paymentConfirmedAt: request.paymentConfirmedAt,
  ...buildBankTransferPayment(request),
  paidAt: request.paidAt,
  tenantRecord: request.tenantRecord?._id || request.tenantRecord,
  contract: request.contract?._id || request.contract,
  contractCode: request.contract?.contractCode,
  contractStatus: request.contract?.status,
  contractStartDate: request.contract?.startDate,
  contractEndDate: request.contract?.endDate,
  status: request.status,
  message: request.message,
  adminNote: request.adminNote,
  processedBy: request.processedBy?._id || request.processedBy,
  processedByName: request.processedBy?.name,
  processedAt: request.processedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const buildRoomRequestFilter = (query) => {
  const filter = {};

  if (query.status && roomRequestStatuses.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.type && roomRequestTypes.includes(query.type)) {
    filter.type = query.type;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.room) {
    filter.room = query.room;
  }

  if (query.user) {
    filter.user = query.user;
  }

  return filter;
};

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));
  return nextDate;
};

const generateContractCode = (requestCode) =>
  `HD-${String(requestCode || Date.now()).replace(/^RQ-/, "")}-${Math.floor(Math.random() * 900 + 100)}`;

const contractBlockingStatuses = [
  "pending_user_signature",
  "revision_requested",
  "signed_pending_payment",
  "active",
  "renewal_requested",
  "checkout_requested",
  "expired_pending",
];

const canReusePendingContractForRequest = async ({ contract, request }) => {
  if (!["pending_user_signature", "revision_requested", "signed_pending_payment"].includes(contract.status)) {
    return false;
  }

  if (String(contract.tenant) !== String(request.user)) {
    return false;
  }

  const linkedRequest = await RoomRequest.findOne({
    _id: { $ne: request._id },
    contract: contract._id,
  }).select("_id requestCode");

  if (linkedRequest) {
    return false;
  }

  return !contract.terms || contract.terms.includes(request.requestCode);
};

const createContractFromRentRequest = async (request) => {
  if (request.type !== "rent") {
    return {};
  }

  if (request.contract) {
    const existingContract = await Contract.findById(request.contract);

    if (existingContract) {
      return { contract: existingContract, tenantRecord: request.tenantRecord };
    }

    throw new Error("This request already created a contract");
  }

  const room = await Room.findById(request.room);

  if (!room) {
    throw new Error("Room not found");
  }

  const activeContract = await Contract.findOne({
    room: request.room,
    status: { $in: contractBlockingStatuses },
  });

  if (activeContract) {
    if (await canReusePendingContractForRequest({ contract: activeContract, request })) {
      const tenantRecord =
        activeContract.tenantRecord ||
        (await Tenant.findOne({
          room: request.room,
          status: "active",
          user: request.user,
        }).select("_id"));

      await Room.findByIdAndUpdate(request.room, { status: "reserved" });
      return { contract: activeContract, tenantRecord };
    }

    throw new Error("Room already has active contract");
  }

  if (!["available", "reserved"].includes(room.status)) {
    throw new Error("Room is not available for rent");
  }

  const activeTenantForUser = await Tenant.findOne({ user: request.user, status: "active" });

  if (activeTenantForUser) {
    throw new Error("User already has an active tenancy");
  }

  const moveInDate = new Date();
  let contractCode = generateContractCode(request.requestCode);
  const existingCode = await Contract.findOne({ contractCode }).select("_id");

  if (existingCode) {
    contractCode = `${contractCode}-${Date.now()}`;
  }

  const durationMonths = Number(request.durationMonths || 1);
  const endDate = addMonths(moveInDate, durationMonths);
  const contract = await Contract.create({
    contractCode,
    tenant: request.user,
    roomRequest: request._id,
    room: request.room,
    memberCount: Math.max(Number(request.occupantCount || 0), (request.occupants || []).length, 1),
    moveInDate,
    durationMonths,
    startDate: moveInDate,
    endDate,
    monthlyRent: Number(room.price || 0),
    deposit: Number(room.deposit || room.price || 0),
    depositCreditAmount: Number(request.depositCreditAmount || 0),
    terms: `Hop dong duoc tao tu yeu cau thue phong ${request.requestCode}.`,
    status: "pending_user_signature",
  });

  await Room.findByIdAndUpdate(request.room, { status: "reserved" });

  return { contract };
};

const getRoomRequests = async (req, res, next) => {
  try {
    const filter = buildRoomRequestFilter(req.query);
    const requests = await populateRoomRequest(
      RoomRequest.find(filter).sort({ status: 1, createdAt: -1 })
    );

    res.json(requests.map(toRoomRequestResponse));
  } catch (error) {
    next(error);
  }
};

const getRoomRequestById = async (req, res, next) => {
  try {
    const request = await populateRoomRequest(RoomRequest.findById(req.params.id));

    if (!request) {
      res.status(404);
      throw new Error("Room request not found");
    }

    res.json(toRoomRequestResponse(request));
  } catch (error) {
    next(error);
  }
};

const processRoomRequest = async (req, res, next, status) => {
  try {
    const request = await RoomRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Room request not found");
    }

    if (request.status !== "pending") {
      res.status(400);
      throw new Error("Only pending requests can be processed");
    }

    if (status === "approved" && request.type !== "rent" && request.paymentStatus !== "paid") {
      res.status(400);
      throw new Error("Payment must be confirmed before approving this request");
    }

    const createdRecords =
      status === "approved" ? await createContractFromRentRequest(request) : {};

    request.status = status;
    request.adminNote = req.body.adminNote ?? request.adminNote;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.tenantRecord = createdRecords.tenantRecord?._id || request.tenantRecord;
    request.contract = createdRecords.contract?._id || request.contract;

    const updatedRequest = await request.save();

    if (status === "approved" && request.type === "rent" && request.sourceHoldRequest) {
      await RoomRequest.updateOne(
        {
          _id: request.sourceHoldRequest,
          type: "hold_deposit",
          status: "pending",
        },
        {
          $set: {
            adminNote: "Da chuyen sang yeu cau thue phong",
            processedAt: new Date(),
            processedBy: req.user._id,
            status: "approved",
          },
          $unset: { holdExpiresAt: "" },
        }
      );
    }

    const populatedRequest = await populateRoomRequest(RoomRequest.findById(updatedRequest._id));

    if (status === "approved" && createdRecords.contract) {
      await createNotification({
        link: "/user/contracts",
        message: `Hop dong phong ${populatedRequest.room?.roomNumber || "-"} da duoc tao. Vui long kiem tra va ky xac nhan.`,
        metadata: {
          contract: createdRecords.contract._id,
          room: populatedRequest.room?._id,
          roomRequest: populatedRequest._id,
        },
        recipient: populatedRequest.user?._id || populatedRequest.user,
        recipientRole: "user",
        title: "Hop dong dang cho ban ky",
        type: "contract_waiting_signature",
      });
    }

    res.json(toRoomRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const approveRoomRequest = (req, res, next) => processRoomRequest(req, res, next, "approved");
const rejectRoomRequest = (req, res, next) => processRoomRequest(req, res, next, "rejected");

const markRoomRequestPaid = async (req, res, next) => {
  try {
    const request = await RoomRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Room request not found");
    }

    if (request.status !== "pending") {
      res.status(400);
      throw new Error("Only pending requests can be marked as paid");
    }

    if (request.paymentProvider !== "manual_qr") {
      res.status(400);
      throw new Error("Only manual QR payments can be confirmed by admin");
    }

    if (!request.paymentProofImages?.length) {
      res.status(400);
      throw new Error("Payment proof image is required before confirming payment");
    }

    request.paymentStatus = "paid";
    request.paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    request.paymentConfirmedBy = req.user._id;
    request.paymentConfirmedAt = new Date();
    request.adminNote = req.body.adminNote ?? request.adminNote;

    const updatedRequest = await request.save();

    await markRoomReservedFromPaymentLock({
      requestId: request._id,
      roomId: request.room,
    });

    const populatedRequest = await populateRoomRequest(RoomRequest.findById(updatedRequest._id));
    const roomLabel = populatedRequest.room?.roomNumber || populatedRequest.room?.name || "-";
    const userName = populatedRequest.user?.name || "Khach hang";
    const paidAmount = Number(populatedRequest.amount || 0).toLocaleString("vi-VN");

    await notifyAdmins({
      link: "/admin/room-requests",
      message:
        populatedRequest.type === "rent"
          ? `${userName} da thanh toan tien thue phong ${roomLabel} (${paidAmount} d). Vui long tao hop dong.`
          : `${userName} da thanh toan giu phong ${roomLabel} (${paidAmount} d). Han giu phong den ${
              populatedRequest.holdExpiresAt
                ? new Date(populatedRequest.holdExpiresAt).toLocaleDateString("vi-VN")
                : "-"
            }.`,
      metadata: {
        amount: populatedRequest.amount,
        room: populatedRequest.room?._id,
        roomRequest: populatedRequest._id,
        user: populatedRequest.user?._id,
      },
      title:
        populatedRequest.type === "rent"
          ? "Khach da thanh toan tien thue phong"
          : "Thanh toan giu phong thanh cong",
      type: "room_request_paid",
    });

    res.json(toRoomRequestResponse(populatedRequest));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

module.exports = {
  approveRoomRequest,
  getRoomRequestById,
  getRoomRequests,
  markRoomRequestPaid,
  rejectRoomRequest,
  roomRequestStatuses,
  roomRequestTypes,
  toRoomRequestResponse,
};
