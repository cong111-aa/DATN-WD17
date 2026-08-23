const Contract = require("../models/Contract");
const ContractLifecycleRequest = require("../models/ContractLifecycleRequest");
const Invoice = require("../models/Invoice");
const Tenant = require("../models/Tenant");
const { createNotification, notifyAdmins } = require("./notificationService");

const DAY_MS = 24 * 60 * 60 * 1000;

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

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

const daysUntil = (endDate, now = new Date()) =>
  Math.ceil((startOfDay(endDate).getTime() - startOfDay(now).getTime()) / DAY_MS);

const getRoomLabel = (contract) => contract.room?.roomNumber || contract.room?.name || "-";

const getTenantName = (contract) => contract.tenant?.name || "Khach thue";

const getDailyRent = (contract) => {
  if (contract.dailyRentPolicy?.method === "fixed") {
    return Number(contract.dailyRentPolicy.fixedDailyRent || 0);
  }

  return Math.ceil(Number(contract.monthlyRent || 0) / 30);
};

const hasPendingLifecycleRequest = (contractId) =>
  ContractLifecycleRequest.exists({
    contract: contractId,
    status: "pending",
    type: { $in: ["renewal", "checkout"] },
  });

const notifyUser = (contract, payload) =>
  createNotification({
    ...payload,
    metadata: {
      ...(payload.metadata || {}),
      contract: contract._id,
      room: contract.room?._id || contract.room,
    },
    recipient: contract.tenant?._id || contract.tenant,
    recipientRole: "user",
  });

const notifyContractExpiry = async ({ contract, daysLeft, type }) => {
  const roomLabel = getRoomLabel(contract);
  const tenantName = getTenantName(contract);
  const message = `Hop dong phong ${roomLabel} se het han trong ${daysLeft} ngay. Vui long chon gia han hoac dang ky tra phong.`;

  await Promise.all([
    notifyUser(contract, {
      link: "/user/contracts",
      message,
      title: "Hop dong sap het han",
      type,
    }),
    notifyAdmins({
      link: "/admin/contracts",
      message: `${tenantName} - ${message}`,
      metadata: { contract: contract._id, room: contract.room?._id || contract.room, tenant: contract.tenant?._id || contract.tenant },
      title: daysLeft <= 7 ? "Can xu ly gap hop dong sap het han" : "Hop dong sap het han",
      type: daysLeft <= 7 ? "contract_urgent" : type,
    }),
  ]);
};

const markExpiredPending = async (contract) => {
  const pendingRequest = await hasPendingLifecycleRequest(contract._id);

  if (pendingRequest || contract.status !== "active") {
    return;
  }

  contract.status = "expired_pending";
  contract.lifecycleHistory.push({
    action: "expired_pending",
    note: "Hop dong da qua han nhung chua co phuong an gia han hoac tra phong.",
    performedByRole: "system",
  });

  if (!contract.expiredPendingNotifiedAt) {
    contract.expiredPendingNotifiedAt = new Date();
    await Promise.all([
      notifyUser(contract, {
        link: "/user/contracts",
        message: `Hop dong phong ${getRoomLabel(contract)} da het han. Vui long lien he admin de xu ly.`,
        title: "Hop dong da qua han",
        type: "contract_expired_pending",
      }),
      notifyAdmins({
        link: "/admin/contracts",
        message: `${getTenantName(contract)} - Hop dong phong ${getRoomLabel(contract)} da qua han va can xu ly.`,
        metadata: { contract: contract._id, room: contract.room?._id || contract.room, tenant: contract.tenant?._id || contract.tenant },
        title: "Hop dong qua han can xu ly",
        type: "contract_expired_pending",
      }),
    ]);
  }

  await contract.save();
};

const createOverstayInvoiceIfNeeded = async (contract, now = new Date()) => {
  if (contract.status !== "expired_pending") {
    return;
  }

  const activeTenant = await Tenant.exists({
    room: contract.room?._id || contract.room,
    user: contract.tenant?._id || contract.tenant,
    status: "active",
  });

  if (!activeTenant) {
    return;
  }

  const fromDate = addDays(startOfDay(contract.endDate), 1);
  const toDate = startOfDay(now);
  const overstayDays = Math.max(Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1, 0);

  if (overstayDays <= 0) {
    return;
  }

  const existingInvoice = await Invoice.findOne({
    $or: [
      { contract: contract._id, note: { $regex: `OVERSTAY:${contract._id}` } },
      {
        month: now.getMonth() + 1,
        room: contract.room?._id || contract.room,
        tenant: contract.tenant?._id || contract.tenant,
        year: now.getFullYear(),
      },
    ],
  });

  if (existingInvoice || contract.overstayInvoiceCreatedAt) {
    return;
  }

  const dailyRent = getDailyRent(contract);
  const totalAmount = overstayDays * dailyRent;
  const invoiceCode = `OVS-${contract.contractCode}-${Date.now()}`;

  await Invoice.create({
    contract: contract._id,
    dueDate: addDays(now, 3),
    invoiceCode,
    invoiceType: "overstay",
    month: now.getMonth() + 1,
    note: `OVERSTAY:${contract._id} | ${overstayDays} ngay x ${dailyRent.toLocaleString("vi-VN")} VND/ngay`,
    otherAmount: totalAmount,
    paidAmount: 0,
    rentAmount: 0,
    room: contract.room?._id || contract.room,
    status: "unpaid",
    tenant: contract.tenant?._id || contract.tenant,
    totalAmount,
    year: now.getFullYear(),
  });

  contract.overstayInvoiceCreatedAt = new Date();
  contract.lifecycleHistory.push({
    action: "overstay_invoice_created",
    note: `Da tao hoa don overstay ${overstayDays} ngay.`,
    performedByRole: "system",
  });
  await contract.save();
};

const checkContractExpirations = async () => {
  const now = new Date();
  const contracts = await Contract.find({
    status: { $in: ["active", "expired_pending"] },
    $or: [
      { endDate: { $lte: endOfDay(addDays(startOfDay(now), 30)) } },
      { durationMonths: { $lte: 1 } },
    ],
  })
    .populate("tenant", "name email phone")
    .populate("room", "roomNumber name");

  for (const contract of contracts) {
    const left = daysUntil(contract.endDate, now);

    if (
      contract.status === "active" &&
      (left <= 30 || Number(contract.durationMonths || 0) <= 1) &&
      left > 15 &&
      !contract.expiryNotice30SentAt
    ) {
      await notifyContractExpiry({ contract, daysLeft: left, type: "contract_expiry_30" });
      contract.expiryNotice30SentAt = new Date();
      await contract.save();
      continue;
    }

    if (contract.status === "active" && left <= 15 && left > 7 && !contract.expiryNotice15SentAt) {
      await notifyContractExpiry({ contract, daysLeft: left, type: "contract_expiry_15" });
      contract.expiryNotice15SentAt = new Date();
      await contract.save();
      continue;
    }

    if (contract.status === "active" && left <= 7 && left >= 0 && !contract.urgentNoticeSentAt) {
      await notifyContractExpiry({ contract, daysLeft: left, type: "contract_urgent" });
      contract.urgentNoticeSentAt = new Date();
      await contract.save();
      continue;
    }

    if (contract.status === "active" && left < 0) {
      await markExpiredPending(contract);
      continue;
    }

    if (contract.status === "expired_pending") {
      await createOverstayInvoiceIfNeeded(contract, now);
    }
  }
};

const startContractExpiryChecker = () => {
  checkContractExpirations().catch((error) => {
    console.error("Failed to check contract expirations:", error);
  });

  return setInterval(() => {
    checkContractExpirations().catch((error) => {
      console.error("Failed to check contract expirations:", error);
    });
  }, DAY_MS);
};

module.exports = {
  checkContractExpirations,
  createOverstayInvoiceIfNeeded,
  daysUntil,
  getDailyRent,
  startContractExpiryChecker,
};
