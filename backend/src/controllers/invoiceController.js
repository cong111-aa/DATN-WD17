const Invoice = require("../models/Invoice");
const MeterReading = require("../models/MeterReading");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { activateContractAfterInitialPaymentIfNeeded } = require("../services/contractInitialPaymentService");
const { createNotification } = require("../services/notificationService");

const invoiceStatuses = ["draft", "unpaid", "partial", "paid", "overdue"];
const moneyFields = [
  "rentAmount",
  "electricityAmount",
  "waterAmount",
  "serviceAmount",
  "otherAmount",
  "discountAmount",
  "paidAmount",
];

const populateInvoice = (query) =>
  query
    .populate("tenant", "name email phone identityNumber")
    .populate({
      path: "room",
      select: "name roomNumber price serviceFee electricityPrice waterPrice",
    })
    .populate("meterReading", "electricityOld electricityNew waterOld waterNew");

const toInvoiceResponse = (invoice) => ({
  id: invoice._id,
  invoiceCode: invoice.invoiceCode,
  room: invoice.room?._id || invoice.room,
  roomName: invoice.room?.name,
  roomNumber: invoice.room?.roomNumber,
  roomPrice: invoice.room?.price,
  roomServiceFee: invoice.room?.serviceFee,
  electricityPrice: invoice.room?.electricityPrice,
  waterPrice: invoice.room?.waterPrice,
  tenant: invoice.tenant?._id || invoice.tenant,
  tenantName: invoice.tenant?.name,
  tenantEmail: invoice.tenant?.email,
  tenantPhone: invoice.tenant?.phone,
  tenantIdentityNumber: invoice.tenant?.identityNumber,
  contract: invoice.contract,
  invoiceType: invoice.invoiceType,
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
  rentPeriodMonth: invoice.rentPeriodMonth,
  rentPeriodYear: invoice.rentPeriodYear,
  servicePeriodMonth: invoice.servicePeriodMonth,
  servicePeriodYear: invoice.servicePeriodYear,
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

const toNumber = (value, fallback = 0) => Number(value ?? fallback);

const meterReadingFields = ["electricityOld", "electricityNew", "waterOld", "waterNew"];

const getNextPeriod = (month, year) => {
  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  if (selectedMonth === 12) {
    return { month: 1, year: selectedYear + 1 };
  }

  return { month: selectedMonth + 1, year: selectedYear };
};

const applyDefaultBillingPeriods = (payload) => {
  if (!payload.month || !payload.year) {
    return payload;
  }

  if ((payload.invoiceType || "monthly") !== "monthly") {
    return payload;
  }

  const nextPeriod = getNextPeriod(payload.month, payload.year);

  payload.rentPeriodMonth = payload.rentPeriodMonth ?? nextPeriod.month;
  payload.rentPeriodYear = payload.rentPeriodYear ?? nextPeriod.year;
  payload.servicePeriodMonth = payload.servicePeriodMonth ?? nextPeriod.month;
  payload.servicePeriodYear = payload.servicePeriodYear ?? nextPeriod.year;

  return payload;
};

const calculateTotalAmount = (payload) => {
  const subtotal =
    toNumber(payload.rentAmount) +
    toNumber(payload.electricityAmount) +
    toNumber(payload.waterAmount) +
    toNumber(payload.serviceAmount) +
    toNumber(payload.otherAmount);
  const total = subtotal - toNumber(payload.discountAmount);

  if (total < 0) {
    throw new Error("Discount amount cannot be greater than subtotal");
  }

  return total;
};

const deriveStatus = (paidAmount, totalAmount, requestedStatus) => {
  paidAmount = Number(paidAmount || 0);
  totalAmount = Number(totalAmount || 0);

  if (requestedStatus === "draft") {
    return "draft";
  }

  if (requestedStatus === "overdue" && paidAmount < totalAmount) {
    return "overdue";
  }

  if (paidAmount <= 0) {
    return "unpaid";
  }

  if (paidAmount < totalAmount) {
    return "partial";
  }

  return "paid";
};

const applyMeterReadingAmounts = async (payload) => {
  if (!payload.room || !payload.month || !payload.year) {
    return payload;
  }

  const [room, existingMeterReading] = await Promise.all([
    Room.findById(payload.room).select("electricityPrice waterPrice"),
    MeterReading.findOne({
      room: payload.room,
      month: payload.month,
      year: payload.year,
    }),
  ]);

  if (!room) {
    payload.meterReading = undefined;
    return payload;
  }

  const hasInlineReading = meterReadingFields.some((field) => payload[field] !== undefined);
  let meterReading = existingMeterReading;

  if (hasInlineReading) {
    const seed = existingMeterReading
      ? {
          electricityOld: existingMeterReading.electricityOld,
          waterOld: existingMeterReading.waterOld,
        }
      : await getPreviousMeterReadingForPeriod(payload.room, payload.month, payload.year);
    const electricityOld = toNumber(payload.electricityOld, seed.electricityOld ?? 0);
    const electricityNew = toNumber(payload.electricityNew, existingMeterReading?.electricityNew ?? electricityOld);
    const waterOld = toNumber(payload.waterOld, seed.waterOld ?? 0);
    const waterNew = toNumber(payload.waterNew, existingMeterReading?.waterNew ?? waterOld);

    if (electricityNew < electricityOld) {
      throw new Error("Electricity new reading must be greater than or equal to old reading");
    }

    if (waterNew < waterOld) {
      throw new Error("Water new reading must be greater than or equal to old reading");
    }

    meterReading = existingMeterReading || new MeterReading({ room: payload.room, month: payload.month, year: payload.year });
    meterReading.room = payload.room;
    meterReading.month = payload.month;
    meterReading.year = payload.year;
    meterReading.electricityOld = electricityOld;
    meterReading.electricityNew = electricityNew;
    meterReading.waterOld = waterOld;
    meterReading.waterNew = waterNew;
    meterReading.note = payload.note ?? meterReading.note;
    await meterReading.save();
  }

  if (!meterReading) {
    payload.meterReading = undefined;
    return payload;
  }

  const electricityUsage = Math.max(meterReading.electricityNew - meterReading.electricityOld, 0);
  const waterUsage = Math.max(meterReading.waterNew - meterReading.waterOld, 0);

  payload.meterReading = meterReading._id;
  payload.electricityAmount = electricityUsage * Number(room.electricityPrice || 0);
  payload.waterAmount = waterUsage * Number(room.waterPrice || 0);

  return payload;
};

const getPreviousMeterReadingForPeriod = async (room, month, year) => {
  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  const currentReading = await MeterReading.findOne({
    room,
    month: selectedMonth,
    year: selectedYear,
  });

  if (currentReading) {
    return {
      electricityNew: currentReading.electricityNew,
      electricityOld: currentReading.electricityOld,
      source: "current",
      waterNew: currentReading.waterNew,
      waterOld: currentReading.waterOld,
    };
  }

  const previousReading = await MeterReading.findOne({
    room,
    $or: [
      { year: { $lt: selectedYear } },
      { year: selectedYear, month: { $lt: selectedMonth } },
    ],
  }).sort({ year: -1, month: -1 });

  return {
    electricityNew: previousReading?.electricityNew ?? 0,
    electricityOld: previousReading?.electricityNew ?? 0,
    source: previousReading ? "previous" : "empty",
    waterNew: previousReading?.waterNew ?? 0,
    waterOld: previousReading?.waterNew ?? 0,
  };
};

const findActiveRoomRepresentative = async (room) => {
  const representative = await Tenant.findOne({
    room,
    status: "active",
    roomRole: "representative",
  }).populate("user", "name email phone role");

  if (!representative?.user || representative.user.role !== "user") {
    throw new Error("Room does not have an active representative tenant");
  }

  return representative;
};

const ensureInvoiceRepresentative = async (tenant, room) => {
  const representative = await Tenant.findOne({
    user: tenant,
    room,
    status: "active",
    roomRole: "representative",
  });

  if (!representative) {
    throw new Error("Invoice tenant must be the active room representative");
  }
};

const validatePaidAmount = (paidAmount, totalAmount) => {
  if (Number(paidAmount) > Number(totalAmount)) {
    throw new Error("Paid amount cannot exceed total amount");
  }
};

const validateInvoicePayload = async (payload, isCreate) => {
  const { invoiceCode, room, tenant, month, year, status } = payload;

  if (isCreate && (!invoiceCode || !room || !month || !year)) {
    throw new Error("Invoice code, room, month and year are required");
  }

  if (month !== undefined && (Number(month) < 1 || Number(month) > 12)) {
    throw new Error("Month must be between 1 and 12");
  }

  if (year !== undefined && Number(year) < 2000) {
    throw new Error("Year must be greater than or equal to 2000");
  }

  ["rentPeriodMonth", "servicePeriodMonth"].forEach((field) => {
    if (payload[field] !== undefined && (Number(payload[field]) < 1 || Number(payload[field]) > 12)) {
      throw new Error(`${field} must be between 1 and 12`);
    }
  });

  ["rentPeriodYear", "servicePeriodYear"].forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 2000) {
      throw new Error(`${field} must be greater than or equal to 2000`);
    }
  });

  if (status && !invoiceStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  if (payload.paidAmount !== undefined && Number(payload.paidAmount) < 0) {
    throw new Error("Paid amount must be greater than or equal to 0");
  }

  meterReadingFields.forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 0) {
      throw new Error(`${field} must be greater than or equal to 0`);
    }
  });

  moneyFields.forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 0) {
      throw new Error(`${field} must be greater than or equal to 0`);
    }
  });

  if (room) {
    const existingRoom = await Room.findById(room).select("_id");

    if (!existingRoom) {
      throw new Error("Room not found");
    }
  }

  if (tenant) {
    const existingTenant = await User.findById(tenant).select("_id role");

    if (!existingTenant || existingTenant.role !== "user") {
      throw new Error("Tenant user not found");
    }
  }

  if (isCreate && room && tenant) {
    await ensureInvoiceRepresentative(tenant, room);
  }
};

const notifyInvoiceCreated = async (invoice) => {
  await invoice.populate([
    { path: "tenant", select: "name" },
    { path: "room", select: "roomNumber name" },
  ]);

  const roomLabel = invoice.room?.roomNumber || invoice.room?.name || "-";

  await createNotification({
    link: "/user/invoices",
    message: `Ban co hoa don thang ${invoice.month}/${invoice.year} cho phong ${roomLabel}, tong tien ${Number(
      invoice.totalAmount || 0
    ).toLocaleString("vi-VN")} VND.`,
    metadata: { invoice: invoice._id, room: invoice.room?._id },
    recipient: invoice.tenant?._id || invoice.tenant,
    recipientRole: "user",
    title: "Hoa don moi",
    type: "invoice_created",
  });
};

const getInvoices = async (req, res, next) => {
  try {
    const filter = {};
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (req.query.room) {
      filter.room = req.query.room;
    }

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.month) {
      filter.month = Number(req.query.month);
    }

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 20), 1);
    const skip = (page - 1) * limit;
    const query = Invoice.find(filter).sort({ createdAt: -1 });

    if (hasPagination) {
      query.skip(skip).limit(limit);
    }

    const [invoices, total] = await Promise.all([
      populateInvoice(query),
      hasPagination ? Invoice.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (hasPagination) {
      return res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: invoices.map(toInvoiceResponse),
      });
    }

    res.json(invoices.map(toInvoiceResponse));
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await populateInvoice(Invoice.findById(req.params.id));

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    res.json(toInvoiceResponse(invoice));
  } catch (error) {
    next(error);
  }
};

const getInvoiceMeterReadingSeed = async (req, res, next) => {
  try {
    const { room, month, year } = req.query;

    if (!room || !month || !year) {
      res.status(400);
      throw new Error("Room, month and year are required");
    }

    const existingRoom = await Room.findById(room).select("_id");

    if (!existingRoom) {
      res.status(404);
      throw new Error("Room not found");
    }

    const seed = await getPreviousMeterReadingForPeriod(room, month, year);

    res.json(seed);
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const payload = req.body;

    await validateInvoicePayload(payload, true);
    payload.invoiceType = payload.invoiceType || "monthly";
    applyDefaultBillingPeriods(payload);
    const representative = await findActiveRoomRepresentative(payload.room);
    payload.tenant = representative.user._id;

    const existingCode = await Invoice.findOne({ invoiceCode: payload.invoiceCode });

    if (existingCode) {
      res.status(400);
      throw new Error("Invoice code already exists");
    }

    const existingInvoice = await Invoice.findOne({
      invoiceType: payload.invoiceType,
      tenant: payload.tenant,
      room: payload.room,
      month: payload.month,
      year: payload.year,
    });

    if (existingInvoice) {
      res.status(400);
      throw new Error("Invoice already exists for this tenant, room, period and invoice type");
    }

    await applyMeterReadingAmounts(payload);

    const totalAmount = calculateTotalAmount(payload);
    const paidAmount = payload.status === "paid" ? totalAmount : toNumber(payload.paidAmount);

    validatePaidAmount(paidAmount, totalAmount);

    const status = deriveStatus(paidAmount, totalAmount, payload.status);
    if (payload.invoiceType === "monthly" && !payload.note) {
      payload.note = `UTILITY_PERIOD:${payload.month}/${payload.year} | RENT_SERVICE_PERIOD:${payload.rentPeriodMonth}/${payload.rentPeriodYear}`;
    }

    const invoice = await Invoice.create({
      ...payload,
      totalAmount,
      paidAmount,
      status,
    });

    const populatedInvoice = await populateInvoice(Invoice.findById(invoice._id));
    if (populatedInvoice.status !== "draft") {
      await notifyInvoiceCreated(populatedInvoice);
    }
    res.status(201).json(toInvoiceResponse(populatedInvoice));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const payload = req.body;
    const previousStatus = invoice.status;
    await validateInvoicePayload(payload, false);

    if (payload.invoiceCode && payload.invoiceCode !== invoice.invoiceCode) {
      const existingCode = await Invoice.findOne({ invoiceCode: payload.invoiceCode });

      if (existingCode) {
        res.status(400);
        throw new Error("Invoice code already exists");
      }

      invoice.invoiceCode = payload.invoiceCode;
    }

    const nextRoom = payload.room ?? invoice.room;
    const nextRepresentative =
      String(nextRoom) !== String(invoice.room)
        ? await findActiveRoomRepresentative(nextRoom)
        : null;
    const nextTenant = nextRepresentative?.user?._id || payload.tenant || invoice.tenant;
    const nextMonth = payload.month ?? invoice.month;
    const nextYear = payload.year ?? invoice.year;
    const nextInvoiceType = payload.invoiceType || invoice.invoiceType || "monthly";
    const nextBillingPayload = applyDefaultBillingPeriods({
      invoiceType: nextInvoiceType,
      month: nextMonth,
      rentPeriodMonth: payload.rentPeriodMonth ?? invoice.rentPeriodMonth,
      rentPeriodYear: payload.rentPeriodYear ?? invoice.rentPeriodYear,
      servicePeriodMonth: payload.servicePeriodMonth ?? invoice.servicePeriodMonth,
      servicePeriodYear: payload.servicePeriodYear ?? invoice.servicePeriodYear,
      year: nextYear,
    });

    const periodChanged =
      String(nextInvoiceType) !== String(invoice.invoiceType || "monthly") ||
      String(nextTenant) !== String(invoice.tenant) ||
      String(nextRoom) !== String(invoice.room) ||
      Number(nextMonth) !== Number(invoice.month) ||
      Number(nextYear) !== Number(invoice.year);

    if (periodChanged) {
      await ensureInvoiceRepresentative(nextTenant, nextRoom);

      const existingInvoice = await Invoice.findOne({
        _id: { $ne: invoice._id },
        invoiceType: nextInvoiceType,
        tenant: nextTenant,
        room: nextRoom,
        month: nextMonth,
        year: nextYear,
      });

      if (existingInvoice) {
        res.status(400);
        throw new Error("Invoice already exists for this tenant, room, period and invoice type");
      }
    }

    invoice.invoiceType = nextInvoiceType;
    invoice.tenant = nextTenant;
    invoice.room = nextRoom;
    invoice.month = nextMonth;
    invoice.year = nextYear;
    invoice.rentPeriodMonth = nextBillingPayload.rentPeriodMonth;
    invoice.rentPeriodYear = nextBillingPayload.rentPeriodYear;
    invoice.servicePeriodMonth = nextBillingPayload.servicePeriodMonth;
    invoice.servicePeriodYear = nextBillingPayload.servicePeriodYear;
    invoice.rentAmount = payload.rentAmount ?? invoice.rentAmount;
    invoice.electricityAmount = payload.electricityAmount ?? invoice.electricityAmount;
    invoice.waterAmount = payload.waterAmount ?? invoice.waterAmount;
    invoice.serviceAmount = payload.serviceAmount ?? invoice.serviceAmount;
    invoice.otherAmount = payload.otherAmount ?? invoice.otherAmount;
    invoice.discountAmount = payload.discountAmount ?? invoice.discountAmount;
    if (payload.dueDate && String(new Date(payload.dueDate)) !== String(invoice.dueDate)) {
      invoice.dueSoonNotifiedAt = undefined;
    }
    invoice.dueDate = payload.dueDate ?? invoice.dueDate;
    invoice.note = payload.note ?? invoice.note;

    await applyMeterReadingAmounts(invoice);

    const totalAmount = calculateTotalAmount(invoice);
    const nextPaidAmount =
      payload.status === "paid"
        ? totalAmount
        : payload.paidAmount ?? invoice.paidAmount;

    invoice.paidAmount = nextPaidAmount;
    validatePaidAmount(invoice.paidAmount, totalAmount);

    invoice.totalAmount = totalAmount;
    invoice.status =
      previousStatus === "draft" && payload.status === undefined
        ? deriveStatus(invoice.paidAmount, totalAmount)
        : payload.status === "paid"
          ? "paid"
          : deriveStatus(invoice.paidAmount, totalAmount, payload.status ?? invoice.status);

    const updatedInvoice = await invoice.save();
    await activateContractAfterInitialPaymentIfNeeded(updatedInvoice._id);
    const populatedInvoice = await populateInvoice(Invoice.findById(updatedInvoice._id));
    if (previousStatus === "draft" && populatedInvoice.status !== "draft") {
      await notifyInvoiceCreated(populatedInvoice);
    }
    res.json(toInvoiceResponse(populatedInvoice));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!invoiceStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const previousStatus = invoice.status;

    if (status === "paid") {
      invoice.paidAmount = invoice.totalAmount;
      invoice.status = "paid";
    } else if (status === "unpaid") {
      invoice.paidAmount = 0;
      invoice.status = "unpaid";
    } else {
      invoice.status = deriveStatus(invoice.paidAmount, invoice.totalAmount, status);
    }
    const updatedInvoice = await invoice.save();
    await activateContractAfterInitialPaymentIfNeeded(updatedInvoice._id);
    const populatedInvoice = await populateInvoice(Invoice.findById(updatedInvoice._id));
    if (previousStatus === "draft" && populatedInvoice.status !== "draft") {
      await notifyInvoiceCreated(populatedInvoice);
    }
    res.json(toInvoiceResponse(populatedInvoice));
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    if (Number(invoice.paidAmount || 0) > 0) {
      res.status(400);
      throw new Error("Cannot delete invoice with payment amount");
    }

    await invoice.deleteOne();
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoiceMeterReadingSeed,
  getInvoices,
  updateInvoice,
  updateInvoiceStatus,
};
