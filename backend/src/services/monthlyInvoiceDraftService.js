const Contract = require("../models/Contract");
const Invoice = require("../models/Invoice");
const MeterReading = require("../models/MeterReading");
const Room = require("../models/Room");
const { notifyAdmins } = require("./notificationService");

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const TARGET_BILLING_DAY = 30;

const getNextPeriod = (month, year) => {
  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  return selectedMonth === 12
    ? { month: 1, year: selectedYear + 1 }
    : { month: selectedMonth + 1, year: selectedYear };
};

const getDefaultDueDate = (month, year) => new Date(Number(year), Number(month) - 1, 5, 23, 59, 59, 999);

const getLastDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const shouldRunToday = (date = new Date()) => {
  const billingDay = Math.min(TARGET_BILLING_DAY, getLastDayOfMonth(date));
  return date.getDate() === billingDay;
};

const buildMonthlyInvoiceCode = ({ roomNumber, month, year }) =>
  `AUTO-MONTHLY-${year}${String(month).padStart(2, "0")}-${roomNumber || "ROOM"}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

const getPreviousMeterReadingForPeriod = async (room, month, year) => {
  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  const currentReading = await MeterReading.findOne({
    room,
    month: selectedMonth,
    year: selectedYear,
  });

  if (currentReading) {
    return currentReading;
  }

  const previousReading = await MeterReading.findOne({
    room,
    $or: [{ year: { $lt: selectedYear } }, { year: selectedYear, month: { $lt: selectedMonth } }],
  }).sort({ year: -1, month: -1 });

  return {
    electricityNew: previousReading?.electricityNew ?? 0,
    waterNew: previousReading?.waterNew ?? 0,
  };
};

const getOrCreateDraftMeterReading = async ({ room, month, year }) => {
  const existingReading = await MeterReading.findOne({ room, month, year });

  if (existingReading) {
    return existingReading;
  }

  const previousReading = await getPreviousMeterReadingForPeriod(room, month, year);
  const electricityOld = Number(previousReading?.electricityNew || 0);
  const waterOld = Number(previousReading?.waterNew || 0);

  return MeterReading.create({
    electricityNew: electricityOld,
    electricityOld,
    month,
    note: "AUTO_MONTHLY_DRAFT",
    room,
    waterNew: waterOld,
    waterOld,
    year,
  });
};

const getActiveContractsForMonthlyBilling = () =>
  Contract.find({ status: "active" })
    .populate("tenant", "name email")
    .populate("room", "roomNumber name price serviceFee electricityPrice waterPrice status");

const createMonthlyInvoiceDrafts = async (date = new Date()) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const nextPeriod = getNextPeriod(month, year);
  const dueDate = getDefaultDueDate(nextPeriod.month, nextPeriod.year);
  const contracts = await getActiveContractsForMonthlyBilling();
  const createdInvoices = [];
  const skipped = [];

  for (const contract of contracts) {
    const room = contract.room;
    const tenant = contract.tenant;

    if (!room || !tenant) {
      skipped.push({ contract: contract._id, reason: "missing_room_or_tenant" });
      continue;
    }

    const existingInvoice = await Invoice.findOne({
      invoiceType: "monthly",
      room: room._id,
      tenant: tenant._id,
      month,
      year,
    });

    if (existingInvoice) {
      skipped.push({ contract: contract._id, invoice: existingInvoice._id, reason: "invoice_exists" });
      continue;
    }

    const meterReading = await getOrCreateDraftMeterReading({ month, room: room._id, year });
    const invoice = await Invoice.create({
      contract: contract._id,
      dueDate,
      invoiceCode: buildMonthlyInvoiceCode({ month, roomNumber: room.roomNumber, year }),
      invoiceType: "monthly",
      meterReading: meterReading._id,
      month,
      note: `AUTO_MONTHLY_DRAFT | UTILITY_PERIOD:${month}/${year} | RENT_SERVICE_PERIOD:${nextPeriod.month}/${nextPeriod.year}`,
      rentAmount: Number(contract.monthlyRent ?? room.price ?? 0),
      rentPeriodMonth: nextPeriod.month,
      rentPeriodYear: nextPeriod.year,
      room: room._id,
      serviceAmount: Number(room.serviceFee || 0),
      servicePeriodMonth: nextPeriod.month,
      servicePeriodYear: nextPeriod.year,
      status: "draft",
      tenant: tenant._id,
      totalAmount: Number(contract.monthlyRent ?? room.price ?? 0) + Number(room.serviceFee || 0),
      year,
    });

    createdInvoices.push(invoice);
  }

  if (createdInvoices.length > 0) {
    await notifyAdmins({
      link: "/admin/invoices",
      message: `He thong da tao ${createdInvoices.length} hoa don nhap thang ${month}/${year}. Vui long nhap chi so dien nuoc moi de chot hoa don.`,
      metadata: {
        count: createdInvoices.length,
        month,
        year,
      },
      title: "Hoa don hang thang cho nhap chi so",
      type: "invoice_created",
    });
  }

  return {
    created: createdInvoices.length,
    month,
    skipped,
    year,
  };
};

const checkMonthlyInvoiceDrafts = async (date = new Date()) => {
  if (!shouldRunToday(date)) {
    return { created: 0, skipped: [], shouldRun: false };
  }

  const result = await createMonthlyInvoiceDrafts(date);
  return { ...result, shouldRun: true };
};

const startMonthlyInvoiceDraftScheduler = () => {
  checkMonthlyInvoiceDrafts().catch((error) => {
    console.error("Failed to create monthly invoice drafts:", error);
  });

  return setInterval(() => {
    checkMonthlyInvoiceDrafts().catch((error) => {
      console.error("Failed to create monthly invoice drafts:", error);
    });
  }, CHECK_INTERVAL_MS);
};

module.exports = {
  checkMonthlyInvoiceDrafts,
  createMonthlyInvoiceDrafts,
  shouldRunToday,
  startMonthlyInvoiceDraftScheduler,
};
