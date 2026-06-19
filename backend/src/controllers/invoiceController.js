const Invoice = require("../models/Invoice");
const MeterReading = require("../models/MeterReading");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

const invoiceStatuses = ["unpaid", "partial", "paid", "overdue"];
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
      select: "name roomNumber building electricityPrice waterPrice",
      populate: { path: "building", select: "name code" },
    })
    .populate("meterReading", "electricityOld electricityNew waterOld waterNew");

const toInvoiceResponse = (invoice) => ({
  id: invoice._id,
  invoiceCode: invoice.invoiceCode,
  room: invoice.room?._id || invoice.room,
  roomName: invoice.room?.name,
  roomNumber: invoice.room?.roomNumber,
  building: invoice.room?.building?._id || invoice.room?.building,
  buildingName: invoice.room?.building?.name,
  buildingCode: invoice.room?.building?.code,
  tenant: invoice.tenant?._id || invoice.tenant,
  tenantName: invoice.tenant?.name,
  tenantEmail: invoice.tenant?.email,
  tenantPhone: invoice.tenant?.phone,
  tenantIdentityNumber: invoice.tenant?.identityNumber,
  contract: invoice.contract,
  meterReading: invoice.meterReading?._id || invoice.meterReading,
  electricityOld: invoice.meterReading?.electricityOld,
  electricityNew: invoice.meterReading?.electricityNew,
  electricityUsage:
    invoice.meterReading?.electricityNew !== undefined
      ? invoice.meterReading.electricityNew - invoice.meterReading.electricityOld
      : undefined,
  waterOld: invoice.meterReading?.waterOld,
  waterNew: invoice.meterReading?.waterNew,
  waterUsage:
    invoice.meterReading?.waterNew !== undefined
      ? invoice.meterReading.waterNew - invoice.meterReading.waterOld
      : undefined,
  month: invoice.month,
  year: invoice.year,
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
  if (requestedStatus === "overdue") {
    return "overdue";
  }

  if (Number(paidAmount) <= 0) {
    return "unpaid";
  }

  if (Number(paidAmount) < Number(totalAmount)) {
    return "partial";
  }

  return "paid";
};

const applyMeterReadingAmounts = async (payload) => {
  if (!payload.room || !payload.month || !payload.year) {
    return payload;
  }

  const [room, meterReading] = await Promise.all([
    Room.findById(payload.room).select("electricityPrice waterPrice"),
    MeterReading.findOne({
      room: payload.room,
      month: payload.month,
      year: payload.year,
    }),
  ]);

  if (!room || !meterReading) {
    payload.meterReading = undefined;
    return payload;
  }

  const electricityUsage = meterReading.electricityNew - meterReading.electricityOld;
  const waterUsage = meterReading.waterNew - meterReading.waterOld;

  payload.meterReading = meterReading._id;
  payload.electricityAmount = electricityUsage * Number(room.electricityPrice || 0);
  payload.waterAmount = waterUsage * Number(room.waterPrice || 0);

  return payload;
};

const validateInvoicePayload = async (payload, isCreate) => {
  const { invoiceCode, room, tenant, month, year, status } = payload;

  if (isCreate && (!invoiceCode || !room || !tenant || !month || !year)) {
    throw new Error("Invoice code, room, tenant, month and year are required");
  }

  if (month !== undefined && (Number(month) < 1 || Number(month) > 12)) {
    throw new Error("Month must be between 1 and 12");
  }

  if (year !== undefined && Number(year) < 2000) {
    throw new Error("Year must be greater than or equal to 2000");
  }

  if (status && !invoiceStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  moneyFields.forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 0) {
      throw new Error(`${field} must be greater than or equal to 0`);
    }
  });

  if (room) {
    const existingRoom = await Room.findById(room);

    if (!existingRoom) {
      throw new Error("Room not found");
    }
  }

  if (tenant) {
    const existingTenant = await User.findById(tenant);

    if (!existingTenant || existingTenant.role !== "user") {
      throw new Error("Tenant user not found");
    }
  }

  if (room && tenant) {
    const representative = await Tenant.findOne({
      user: tenant,
      room,
      status: "active",
      roomRole: "representative",
    });

    if (!representative) {
      throw new Error("Invoice tenant must be the active room representative");
    }
  }
};

const getInvoices = async (req, res, next) => {
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

    const invoices = await populateInvoice(Invoice.find(filter).sort({ createdAt: -1 }));
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

const createInvoice = async (req, res, next) => {
  try {
    const payload = req.body;

    await validateInvoicePayload(payload, true);

    const existingCode = await Invoice.findOne({ invoiceCode: payload.invoiceCode });

    if (existingCode) {
      res.status(400);
      throw new Error("Invoice code already exists");
    }

    const existingInvoice = await Invoice.findOne({
      tenant: payload.tenant,
      room: payload.room,
      month: payload.month,
      year: payload.year,
    });

    if (existingInvoice) {
      res.status(400);
      throw new Error("Invoice already exists for this tenant, room and period");
    }

    await applyMeterReadingAmounts(payload);

    const totalAmount = calculateTotalAmount(payload);
    const paidAmount = toNumber(payload.paidAmount);
    const status = deriveStatus(paidAmount, totalAmount, payload.status);

    const invoice = await Invoice.create({
      ...payload,
      totalAmount,
      paidAmount,
      status,
    });

    const populatedInvoice = await populateInvoice(Invoice.findById(invoice._id));
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
    await validateInvoicePayload(payload, false);

    if (payload.invoiceCode && payload.invoiceCode !== invoice.invoiceCode) {
      const existingCode = await Invoice.findOne({ invoiceCode: payload.invoiceCode });

      if (existingCode) {
        res.status(400);
        throw new Error("Invoice code already exists");
      }

      invoice.invoiceCode = payload.invoiceCode;
    }

    const nextTenant = payload.tenant ?? invoice.tenant;
    const nextRoom = payload.room ?? invoice.room;
    const nextMonth = payload.month ?? invoice.month;
    const nextYear = payload.year ?? invoice.year;

    if (
      String(nextTenant) !== String(invoice.tenant) ||
      String(nextRoom) !== String(invoice.room) ||
      Number(nextMonth) !== Number(invoice.month) ||
      Number(nextYear) !== Number(invoice.year)
    ) {
      const existingInvoice = await Invoice.findOne({
        _id: { $ne: invoice._id },
        tenant: nextTenant,
        room: nextRoom,
        month: nextMonth,
        year: nextYear,
      });

      if (existingInvoice) {
        res.status(400);
        throw new Error("Invoice already exists for this tenant, room and period");
      }
    }

    invoice.tenant = nextTenant;
    invoice.room = nextRoom;
    invoice.month = nextMonth;
    invoice.year = nextYear;
    invoice.rentAmount = payload.rentAmount ?? invoice.rentAmount;
    invoice.electricityAmount = payload.electricityAmount ?? invoice.electricityAmount;
    invoice.waterAmount = payload.waterAmount ?? invoice.waterAmount;
    invoice.serviceAmount = payload.serviceAmount ?? invoice.serviceAmount;
    invoice.otherAmount = payload.otherAmount ?? invoice.otherAmount;
    invoice.discountAmount = payload.discountAmount ?? invoice.discountAmount;
    invoice.paidAmount = payload.paidAmount ?? invoice.paidAmount;
    invoice.dueDate = payload.dueDate ?? invoice.dueDate;
    invoice.note = payload.note ?? invoice.note;

    await applyMeterReadingAmounts(invoice);

    const totalAmount = calculateTotalAmount(invoice);
    invoice.totalAmount = totalAmount;
    invoice.status = deriveStatus(invoice.paidAmount, totalAmount, payload.status ?? invoice.status);

    const updatedInvoice = await invoice.save();
    const populatedInvoice = await populateInvoice(Invoice.findById(updatedInvoice._id));
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

    invoice.status = status === "overdue" ? "overdue" : deriveStatus(invoice.paidAmount, invoice.totalAmount, status);
    const updatedInvoice = await invoice.save();
    const populatedInvoice = await populateInvoice(Invoice.findById(updatedInvoice._id));
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
  getInvoices,
  updateInvoice,
  updateInvoiceStatus,
};
