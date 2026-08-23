const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const RoomRequest = require("../models/RoomRequest");
const { activateContractAfterInitialPaymentIfNeeded } = require("../services/contractInitialPaymentService");
const { createNotification, notifyAdmins } = require("../services/notificationService");
const {
  acquireRoomPaymentLock,
  markRoomReservedFromPaymentLock,
  releaseRoomPaymentLock,
} = require("../utils/roomPaymentLock");
const { buildVnpayPaymentUrl, getClientIp, verifyVnpayParams } = require("../utils/vnpay");

const successStatuses = ["00"];

const generateTxnRef = (targetType) =>
  `VNP-${targetType === "invoice" ? "INV" : "REQ"}-${Date.now()}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

const markRoomRequestPaid = async (roomRequest, paidAt = new Date()) => {
  roomRequest.paymentStatus = "paid";
  roomRequest.paidAt = paidAt;
  roomRequest.paymentProvider = "vnpay";
  await roomRequest.save();

  if (["hold_deposit", "rent"].includes(roomRequest.type)) {
    await markRoomReservedFromPaymentLock({
      requestId: roomRequest._id,
      roomId: roomRequest.room,
    });
  }

  await roomRequest.populate([
    { path: "user", select: "name" },
    { path: "room", select: "roomNumber name" },
  ]);

  const roomLabel = roomRequest.room?.roomNumber || roomRequest.room?.name || "-";
  const userName = roomRequest.user?.name || "Khách hàng";
  const isHoldDeposit = roomRequest.type === "hold_deposit";
  const paidAmount = Number(roomRequest.amount || 0).toLocaleString("vi-VN");
  const adminMessage = isHoldDeposit
    ? `${userName} vừa thanh toán giữ phòng ${roomLabel} thành công. Hạn giữ đến ${
        roomRequest.holdExpiresAt ? new Date(roomRequest.holdExpiresAt).toLocaleDateString("vi-VN") : "-"
      }.`
    : `${userName} đã thanh toán tiền thuê phòng ${roomLabel} (${paidAmount} đ). Vui lòng tạo hợp đồng.`;
  const userMessage = isHoldDeposit
    ? `Bạn đã thanh toán giữ phòng ${roomLabel} thành công. Hạn giữ đến ${
        roomRequest.holdExpiresAt ? new Date(roomRequest.holdExpiresAt).toLocaleDateString("vi-VN") : "-"
      }.`
    : `Bạn đã thanh toán cọc thuê phòng ${roomLabel} thành công. Chủ trọ sẽ kiểm tra và gửi hợp đồng.`;

  await Promise.all([
    notifyAdmins({
      link: "/admin/room-requests",
      message: adminMessage,
      metadata: {
        amount: roomRequest.amount,
        room: roomRequest.room?._id,
        roomRequest: roomRequest._id,
        user: roomRequest.user?._id,
      },
      title: isHoldDeposit ? "Thanh toán giữ phòng thành công" : "Khách đã thanh toán tiền thuê phòng",
      type: "room_request_paid",
    }),
    createNotification({
      link: "/user/room-requests",
      message: userMessage,
      metadata: { room: roomRequest.room?._id, roomRequest: roomRequest._id },
      recipient: roomRequest.user?._id || roomRequest.user,
      recipientRole: "user",
      title: isHoldDeposit ? "Giữ phòng thành công" : "Thanh toán cọc thành công",
      type: "room_request_paid",
    }),
  ]);

};

const markInvoicePaid = async (invoice, amount) => {
  const nextPaidAmount = Math.min(
    Number(invoice.totalAmount || 0),
    Number(invoice.paidAmount || 0) + Number(amount || 0)
  );

  invoice.paidAmount = nextPaidAmount;
  invoice.status = nextPaidAmount >= Number(invoice.totalAmount || 0) ? "paid" : "partial";
  await invoice.save();
  await invoice.populate([
    { path: "tenant", select: "name" },
    { path: "room", select: "roomNumber name" },
  ]);

  const roomLabel = invoice.room?.roomNumber || invoice.room?.name || "-";
  const tenantName = invoice.tenant?.name || "Khách hàng";
  const paidMessage = `${tenantName} phòng ${roomLabel} vừa thanh toán hóa đơn tháng ${invoice.month}/${invoice.year}.`;

  await Promise.all([
    notifyAdmins({
      link: "/admin/invoices",
      message: paidMessage,
      metadata: { invoice: invoice._id, room: invoice.room?._id, tenant: invoice.tenant?._id },
      title: "Thanh toán hóa đơn thành công",
      type: "invoice_paid",
    }),
    createNotification({
      link: "/user/invoices",
      message: `Bạn đã thanh toán hóa đơn tháng ${invoice.month}/${invoice.year} thành công.`,
      metadata: { invoice: invoice._id, room: invoice.room?._id },
      recipient: invoice.tenant?._id || invoice.tenant,
      recipientRole: "user",
      title: "Thanh toán hóa đơn thành công",
      type: "invoice_paid",
    }),
  ]);

  if (invoice.invoiceType === "initial_contract") {
    await activateContractAfterInitialPaymentIfNeeded(invoice._id);
  }
};

const findPayableTarget = async ({ targetId, targetType, userId }) => {
  if (targetType === "room_request") {
    const roomRequest = await RoomRequest.findOne({ _id: targetId, user: userId });

    if (!roomRequest) {
      throw new Error("Room request not found");
    }

    if (roomRequest.status !== "pending") {
      throw new Error("Only pending room requests can be paid");
    }

    if (roomRequest.paymentStatus === "paid") {
      throw new Error("This room request is already paid");
    }

    if (roomRequest.paymentProvider !== "vnpay") {
      throw new Error("This room request is not configured for VNPay payment");
    }

    return {
      amount: Number(roomRequest.amount || 0),
      code: roomRequest.requestCode,
      doc: roomRequest,
      targetType,
      user: roomRequest.user,
    };
  }

  if (targetType === "invoice") {
    const invoice = await Invoice.findOne({ _id: targetId, tenant: userId });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const remainingAmount = Math.max(
      Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0),
      0
    );

    if (remainingAmount <= 0 || invoice.status === "paid") {
      throw new Error("This invoice is already paid");
    }

    return {
      amount: remainingAmount,
      code: invoice.invoiceCode,
      doc: invoice,
      targetType,
      user: invoice.tenant,
    };
  }

  throw new Error("Invalid payment target type");
};

const createVnpayPayment = async (req, res, next) => {
  let lockedTarget = null;

  try {
    const { targetId, targetType } = req.body;
    const target = await findPayableTarget({ targetId, targetType, userId: req.user._id });
    const txnRef = generateTxnRef(targetType);
    const orderInfo =
      targetType === "invoice"
        ? `Thanh toan hoa don ${target.code}`
        : `Thanh toan yeu cau phong ${target.code}`;
    const { params, paymentUrl } = buildVnpayPaymentUrl({
      amount: target.amount,
      ipAddress: getClientIp(req),
      orderInfo,
      txnRef,
    });

    if (targetType === "room_request" && !target.doc.sourceHoldRequest) {
      await acquireRoomPaymentLock({
        requestId: target.doc._id,
        roomId: target.doc.room,
        userId: req.user._id,
      });
      lockedTarget = target;
    }

    const payment = await Payment.create({
      amount: target.amount,
      invoice: targetType === "invoice" ? target.doc._id : undefined,
      method: "vnpay",
      provider: "vnpay",
      providerTxnRef: txnRef,
      paymentUrl,
      requestPayload: params,
      roomRequest: targetType === "room_request" ? target.doc._id : undefined,
      status: "pending",
      targetType,
      tenant: target.user,
    });

    if (targetType === "room_request") {
      target.doc.paymentStatus = "pending";
      target.doc.paymentProvider = "vnpay";
      target.doc.paymentOrderCode = txnRef;
      target.doc.paymentCheckoutUrl = paymentUrl;
      await target.doc.save();
    }

    res.status(201).json({
      amount: payment.amount,
      id: payment._id,
      paymentUrl,
      providerTxnRef: txnRef,
      status: payment.status,
      targetId,
      targetType,
    });
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    if (lockedTarget) {
      try {
        await releaseRoomPaymentLock({
          requestId: lockedTarget.doc._id,
          roomId: lockedTarget.doc.room,
        });
      } catch (releaseError) {
        console.error("Failed to release room payment lock:", releaseError);
      }
    }

    next(error);
  }
};

const completeVnpayPayment = async (query) => {
  const { isValid, params } = verifyVnpayParams(query);

  if (!isValid) {
    return { code: "97", message: "Invalid checksum", payment: null, success: false };
  }

  const payment = await Payment.findOne({
    provider: "vnpay",
    providerTxnRef: params.vnp_TxnRef,
  });

  if (!payment) {
    return { code: "01", message: "Order not found", payment: null, success: false };
  }

  const paidAmount = Number(params.vnp_Amount || 0) / 100;

  if (Math.round(paidAmount) !== Math.round(Number(payment.amount || 0))) {
    return { code: "04", message: "Invalid amount", payment, success: false };
  }

  const isPaid =
    successStatuses.includes(params.vnp_ResponseCode) &&
    successStatuses.includes(params.vnp_TransactionStatus);

  payment.providerTransactionId = params.vnp_TransactionNo || payment.providerTransactionId;
  payment.providerResponseCode = params.vnp_ResponseCode || payment.providerResponseCode;
  payment.providerTransactionStatus =
    params.vnp_TransactionStatus || payment.providerTransactionStatus;
  payment.responsePayload = params;

  if (payment.status === "success") {
    await payment.save();
    return { code: "02", message: "Order already confirmed", payment, success: true };
  }

  if (!isPaid) {
    payment.status = "failed";
    await payment.save();

    if (payment.targetType === "room_request" && payment.roomRequest) {
      const roomRequest = await RoomRequest.findByIdAndUpdate(
        payment.roomRequest,
        {
          $set: { paymentStatus: "failed" },
          $unset: { holdExpiresAt: "" },
        },
        { new: true }
      );

      if (roomRequest) {
        await releaseRoomPaymentLock({
          requestId: roomRequest._id,
          roomId: roomRequest.room,
        });
      }
    }

    return { code: "00", message: "Payment failed", payment, success: false };
  }

  payment.status = "success";
  payment.paidAt = params.vnp_PayDate
    ? new Date(
        `${params.vnp_PayDate.slice(0, 4)}-${params.vnp_PayDate.slice(4, 6)}-${params.vnp_PayDate.slice(
          6,
          8
        )}T${params.vnp_PayDate.slice(8, 10)}:${params.vnp_PayDate.slice(10, 12)}:${params.vnp_PayDate.slice(
          12,
          14
        )}+07:00`
      )
    : new Date();
  await payment.save();

  if (payment.targetType === "room_request" && payment.roomRequest) {
    const roomRequest = await RoomRequest.findById(payment.roomRequest);

    if (roomRequest) {
      await markRoomRequestPaid(roomRequest, payment.paidAt);
    }
  }

  if (payment.targetType === "invoice" && payment.invoice) {
    const invoice = await Invoice.findById(payment.invoice);

    if (invoice) {
      await markInvoicePaid(invoice, payment.amount);
    }
  }

  return { code: "00", message: "Confirm success", payment, success: true };
};

const handleVnpayReturn = async (req, res, next) => {
  try {
    const result = await completeVnpayPayment(req.query);

    res.json({
      message: result.message,
      paymentId: result.payment?._id,
      status: result.payment?.status || "failed",
      success: result.success,
      targetType: result.payment?.targetType,
    });
  } catch (error) {
    next(error);
  }
};

const handleVnpayIpn = async (req, res) => {
  try {
    const result = await completeVnpayPayment(req.query);

    res.json({
      Message: result.message,
      RspCode: result.code,
    });
  } catch (error) {
    res.json({
      Message: error.message || "Unknown error",
      RspCode: "99",
    });
  }
};

module.exports = {
  createVnpayPayment,
  handleVnpayIpn,
  handleVnpayReturn,
};
