const Contract = require("../models/Contract");
const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");
const Tenant = require("../models/Tenant");

const PAYMENT_LOCK_DURATION_MINUTES = 15;

const markExpiredPaymentRequestFailed = async (requestId) => {
  if (!requestId) {
    return;
  }

  await RoomRequest.updateOne(
    {
      _id: requestId,
      status: "pending",
      paymentStatus: { $in: ["unpaid", "pending"] },
    },
    {
      $set: { paymentStatus: "failed" },
      $unset: { holdExpiresAt: "" },
    }
  );
};

const clearExpiredRoomPaymentLocks = async () => {
  const now = new Date();
  const rooms = await Room.find({
    status: "payment_pending",
    paymentHoldExpiresAt: { $lte: now },
  }).select("_id paymentHoldRequest");

  let modifiedCount = 0;

  for (const room of rooms) {
    const request = room.paymentHoldRequest
      ? await RoomRequest.findById(room.paymentHoldRequest).select("paymentProvider paymentProofImages")
      : null;

    if (request?.paymentProvider === "manual_qr" && request.paymentProofImages?.length) {
      continue;
    }

    await markExpiredPaymentRequestFailed(room.paymentHoldRequest);

    const result = await Room.updateOne(
      { _id: room._id, status: "payment_pending" },
      {
        $set: { status: "available" },
        $unset: {
          paymentHoldBy: "",
          paymentHoldExpiresAt: "",
          paymentHoldRequest: "",
        },
      }
    );
    modifiedCount += result.modifiedCount || 0;
  }

  return { modifiedCount };
};

const clearExpiredRoomPaymentLock = async (roomId) => {
  const now = new Date();
  const room = await Room.findOne({
    _id: roomId,
    status: "payment_pending",
    paymentHoldExpiresAt: { $lte: now },
  }).select("_id paymentHoldRequest");

  if (!room) {
    return null;
  }

  const request = room.paymentHoldRequest
    ? await RoomRequest.findById(room.paymentHoldRequest).select("paymentProvider paymentProofImages")
    : null;

  if (request?.paymentProvider === "manual_qr" && request.paymentProofImages?.length) {
    return null;
  }

  await markExpiredPaymentRequestFailed(room.paymentHoldRequest);

  return Room.findOneAndUpdate(
    {
      _id: roomId,
      status: "payment_pending",
      paymentHoldExpiresAt: { $lte: now },
    },
    {
      $set: { status: "available" },
      $unset: {
        paymentHoldBy: "",
        paymentHoldExpiresAt: "",
        paymentHoldRequest: "",
      },
    },
    { new: true }
  );
};

const clearExpiredHoldDeposits = async () => {
  const now = new Date();
  const expiredHoldRequests = await RoomRequest.find({
    type: "hold_deposit",
    paymentStatus: "paid",
    status: { $in: ["pending", "approved", "expired"] },
    holdExpiresAt: { $lte: now },
  }).select("_id room");

  let expiredRequestCount = 0;
  let releasedRoomCount = 0;

  for (const request of expiredHoldRequests) {
    const expiredRequestResult = await RoomRequest.updateOne(
      { _id: request._id, status: { $in: ["pending", "approved"] } },
      { $set: { status: "expired" } }
    );
    expiredRequestCount += expiredRequestResult.modifiedCount || 0;

    const [activeTenant, activeContract, activeRentRequest, activeHoldRequest] =
      await Promise.all([
        Tenant.exists({ room: request.room, status: "active" }),
        Contract.exists({
          room: request.room,
          status: {
            $in: [
              "pending_user_signature",
              "revision_requested",
              "signed_pending_payment",
              "active",
              "renewal_requested",
              "checkout_requested",
              "expired_pending",
            ],
          },
        }),
        RoomRequest.exists({
          room: request.room,
          type: "rent",
          status: { $in: ["pending", "approved"] },
          paymentStatus: { $in: ["unpaid", "pending", "paid"] },
        }),
        RoomRequest.exists({
          _id: { $ne: request._id },
          room: request.room,
          type: "hold_deposit",
          paymentStatus: "paid",
          status: { $in: ["pending", "approved"] },
          holdExpiresAt: { $gt: now },
        }),
      ]);

    if (activeTenant || activeContract || activeRentRequest || activeHoldRequest) {
      continue;
    }

    const result = await Room.updateOne(
      { _id: request.room, status: "reserved" },
      {
        $set: { status: "available" },
        $unset: {
          paymentHoldBy: "",
          paymentHoldExpiresAt: "",
          paymentHoldRequest: "",
        },
      }
    );
    releasedRoomCount += result.modifiedCount || 0;
  }

  return { expiredRequestCount, releasedRoomCount };
};

const acquireRoomPaymentLock = async ({ requestId, roomId, userId }) => {
  await clearExpiredRoomPaymentLock(roomId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PAYMENT_LOCK_DURATION_MINUTES * 60 * 1000);
  const room = await Room.findOneAndUpdate(
    {
      _id: roomId,
      $or: [
        { status: "available" },
        {
          status: "payment_pending",
          paymentHoldBy: userId,
          paymentHoldRequest: requestId,
          paymentHoldExpiresAt: { $gt: now },
        },
      ],
    },
    {
      $set: {
        status: "payment_pending",
        paymentHoldBy: userId,
        paymentHoldExpiresAt: expiresAt,
        paymentHoldRequest: requestId,
      },
    },
    { new: true }
  );

  if (room) {
    return room;
  }

  const lockedRoom = await Room.findById(roomId)
    .populate("paymentHoldBy", "name")
    .select("status paymentHoldBy paymentHoldExpiresAt");

  if (
    lockedRoom?.status === "payment_pending" &&
    lockedRoom.paymentHoldExpiresAt &&
    lockedRoom.paymentHoldExpiresAt > now
  ) {
    const holderName = lockedRoom.paymentHoldBy?.name;
    const suffix = holderName
      ? ` bởi khách hàng ${holderName}`
      : " bởi khách hàng khác";
    throw new Error(`Phòng này đang được giữ thanh toán${suffix}. Vui lòng thử lại sau ít phút.`);
  }

  throw new Error("Room is not available for payment");
};

const releaseRoomPaymentLock = async ({ requestId, roomId }) =>
  Room.findOneAndUpdate(
    {
      _id: roomId,
      status: "payment_pending",
      paymentHoldRequest: requestId,
    },
    {
      $set: { status: "available" },
      $unset: {
        paymentHoldBy: "",
        paymentHoldExpiresAt: "",
        paymentHoldRequest: "",
      },
    },
    { new: true }
  );

const markRoomReservedFromPaymentLock = async ({ requestId, roomId }) =>
  Room.findOneAndUpdate(
    {
      _id: roomId,
      $or: [
        { status: "available" },
        { status: "payment_pending", paymentHoldRequest: requestId },
      ],
    },
    {
      $set: { status: "reserved" },
      $unset: {
        paymentHoldBy: "",
        paymentHoldExpiresAt: "",
        paymentHoldRequest: "",
      },
    },
    { new: true }
  );

const startExpiredPaymentLockReleaser = () => {
  const clearExpiredRoomStates = async () => {
    await clearExpiredRoomPaymentLocks();
    await clearExpiredHoldDeposits();
  };

  clearExpiredRoomStates().catch((error) => {
    console.error("Failed to clear expired room states:", error);
  });

  return setInterval(() => {
    clearExpiredRoomStates().catch((error) => {
      console.error("Failed to clear expired room states:", error);
    });
  }, 60 * 1000);
};

module.exports = {
  PAYMENT_LOCK_DURATION_MINUTES,
  acquireRoomPaymentLock,
  clearExpiredHoldDeposits,
  clearExpiredRoomPaymentLock,
  clearExpiredRoomPaymentLocks,
  markRoomReservedFromPaymentLock,
  releaseRoomPaymentLock,
  startExpiredPaymentLockReleaser,
};
