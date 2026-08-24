const Contract = require("../models/Contract");
const Invoice = require("../models/Invoice");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const { createNotification, notifyAdmins } = require("./notificationService");

const addDays = (date, days) => new Date(date.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);

const generateInitialInvoiceCode = (contractCode) =>
  `INIT-${String(contractCode || Date.now()).replace(/^HD-/, "")}-${Date.now()}`;

const createInitialContractInvoiceIfNeeded = async (contractId) => {
  const contract = await Contract.findById(contractId).populate("room", "roomNumber name price deposit serviceFee");

  if (!contract) {
    throw new Error("Contract not found");
  }

  if (contract.status !== "signed_pending_payment") {
    return null;
  }

  const existingInvoice = await Invoice.findOne({
    contract: contract._id,
    invoiceType: "initial_contract",
  });

  if (existingInvoice) {
    if (!contract.initialInvoice) {
      contract.initialInvoice = existingInvoice._id;
      await contract.save();
    }

    return existingInvoice;
  }

  const now = new Date();
  const room = contract.room;
  const depositDue = Math.max(Number(contract.deposit || 0) - Number(contract.depositCreditAmount || 0), 0);
  const rentAmount = Number(contract.monthlyRent || room?.price || 0);
  const serviceAmount = Number(room?.serviceFee || 0);
  const totalAmount = depositDue + rentAmount + serviceAmount;

  const invoice = await Invoice.create({
    contract: contract._id,
    dueDate: addDays(now, 3),
    invoiceCode: generateInitialInvoiceCode(contract.contractCode),
    invoiceType: "initial_contract",
    month: now.getMonth() + 1,
    note: `INITIAL_CONTRACT:${contract._id} | Tien coc con phai dong: ${depositDue.toLocaleString(
      "vi-VN"
    )} VND. Tien phong va dich vu thang dau.`,
    otherAmount: depositDue,
    paidAmount: 0,
    rentAmount,
    rentPeriodMonth: now.getMonth() + 1,
    rentPeriodYear: now.getFullYear(),
    room: room?._id || contract.room,
    serviceAmount,
    servicePeriodMonth: now.getMonth() + 1,
    servicePeriodYear: now.getFullYear(),
    status: "unpaid",
    tenant: contract.tenant,
    totalAmount,
    year: now.getFullYear(),
  });

  contract.initialInvoice = invoice._id;
  await contract.save();

  await createNotification({
    link: "/user/invoices",
    message: `Hop dong ${contract.contractCode} da duoc ky. Vui long thanh toan tien coc, tien phong va phi dich vu thang dau.`,
    metadata: { contract: contract._id, invoice: invoice._id, room: room?._id || contract.room },
    recipient: contract.tenant,
    recipientRole: "user",
    title: "Can thanh toan dau ky hop dong",
    type: "invoice_created",
  });

  return invoice;
};

const activateContractAfterInitialPaymentIfNeeded = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);

  if (
    !invoice ||
    invoice.invoiceType !== "initial_contract" ||
    invoice.status !== "paid" ||
    Number(invoice.paidAmount || 0) < Number(invoice.totalAmount || 0)
  ) {
    return null;
  }

  const contract = await Contract.findById(invoice.contract).populate("room", "roomNumber name");

  if (!contract || contract.status !== "signed_pending_payment") {
    return contract;
  }

  const activeContract = await Contract.findOne({
    _id: { $ne: contract._id },
    room: contract.room?._id || contract.room,
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
  }).select("_id contractCode");

  if (activeContract) {
    throw new Error("Room already has another active contract");
  }

  let tenantRecord = contract.tenantRecord
    ? await Tenant.findById(contract.tenantRecord)
    : await Tenant.findOne({
        room: contract.room?._id || contract.room,
        status: "active",
        user: contract.tenant,
      });

  if (!tenantRecord) {
    await Tenant.updateMany(
      { room: contract.room?._id || contract.room, roomRole: "representative", status: "active" },
      { roomRole: "member" }
    );

    tenantRecord = await Tenant.create({
      moveInDate: contract.startDate || new Date(),
      note: `Kich hoat tu hop dong ${contract.contractCode}`,
      room: contract.room?._id || contract.room,
      roomRole: "representative",
      status: "active",
      user: contract.tenant,
    });
  }

  contract.tenantRecord = tenantRecord._id;
  contract.status = "active";
  contract.lifecycleHistory.push({
    action: "initial_payment_paid_contract_activated",
    note: `Da thanh toan hoa don dau ky ${invoice.invoiceCode}.`,
    performedByRole: "system",
  });
  await contract.save();

  await Room.findByIdAndUpdate(contract.room?._id || contract.room, {
    status: "occupied",
  });

  await Promise.all([
    notifyAdmins({
      link: "/admin/contracts",
      message: `Khach hang da thanh toan dau ky hop dong ${contract.contractCode}. Hop dong phong ${
        contract.room?.roomNumber || contract.room?.name || "-"
      } da co hieu luc.`,
      metadata: { contract: contract._id, invoice: invoice._id, room: contract.room?._id || contract.room, user: contract.tenant },
      title: "Hop dong da duoc kich hoat",
      type: "invoice_paid",
    }),
    createNotification({
      link: "/user/contracts",
      message: `Hop dong ${contract.contractCode} da co hieu luc. Phong da duoc chuyen sang trang thai dang thue.`,
      metadata: { contract: contract._id, invoice: invoice._id, room: contract.room?._id || contract.room },
      recipient: contract.tenant,
      recipientRole: "user",
      title: "Hop dong co hieu luc",
      type: "contract_waiting_signature",
    }),
  ]);

  return contract;
};

module.exports = {
  activateContractAfterInitialPaymentIfNeeded,
  createInitialContractInvoiceIfNeeded,
};
