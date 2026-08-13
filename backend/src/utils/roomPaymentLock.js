const Room = require("../models/Room");
const RoomRequest = require("../models/RoomRequest");

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
  clearExpiredRoomPaymentLocks().catch((error) => {
    console.error("Failed to clear expired room payment locks:", error);
  });

  return setInterval(() => {
    clearExpiredRoomPaymentLocks().catch((error) => {
      console.error("Failed to clear expired room payment locks:", error);
    });
  }, 60 * 1000);
};

module.exports = {
  PAYMENT_LOCK_DURATION_MINUTES,
  acquireRoomPaymentLock,
  clearExpiredRoomPaymentLock,
  clearExpiredRoomPaymentLocks,
  markRoomReservedFromPaymentLock,
  releaseRoomPaymentLock,
  startExpiredPaymentLockReleaser,
};
