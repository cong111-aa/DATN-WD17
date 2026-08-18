const Invoice = require("../models/Invoice");
const { createNotification, notifyAdmins } = require("./notificationService");

const DUE_SOON_DAYS = 3;

const formatDate = (value) => new Date(value).toLocaleDateString("vi-VN");

const notifyInvoiceOverdue = async (invoice) => {
  await invoice.populate([
    { path: "tenant", select: "name" },
    { path: "room", select: "roomNumber name" },
  ]);

  const roomLabel = invoice.room?.roomNumber || invoice.room?.name || "-";
  const tenantName = invoice.tenant?.name || "Khách thuê";
  const title = "Hóa đơn quá hạn";
  const message = `Phòng ${roomLabel} đã quá hạn thanh toán hóa đơn tháng ${invoice.month}/${invoice.year}.`;

  await Promise.all([
    notifyAdmins({
      link: "/admin/invoices",
      message: `${tenantName} - ${message}`,
      metadata: { invoice: invoice._id, room: invoice.room?._id, tenant: invoice.tenant?._id },
      title,
      type: "invoice_overdue",
    }),
    createNotification({
      link: "/user/invoices",
      message,
      metadata: { invoice: invoice._id, room: invoice.room?._id },
      recipient: invoice.tenant?._id || invoice.tenant,
      recipientRole: "user",
      title,
      type: "invoice_overdue",
    }),
  ]);
};

const notifyInvoiceDueSoon = async (invoice) => {
  await invoice.populate([
    { path: "tenant", select: "name" },
    { path: "room", select: "roomNumber name" },
  ]);

  const roomLabel = invoice.room?.roomNumber || invoice.room?.name || "-";
  const tenantName = invoice.tenant?.name || "Khach thue";
  const dueDateText = formatDate(invoice.dueDate);
  const title = "Hoa don sap het han";
  const message = `Hoa don phong ${roomLabel} thang ${invoice.month}/${invoice.year} sap den han thanh toan vao ngay ${dueDateText}.`;

  await Promise.all([
    notifyAdmins({
      link: "/admin/invoices",
      message: `${tenantName} - ${message}`,
      metadata: { invoice: invoice._id, room: invoice.room?._id, tenant: invoice.tenant?._id },
      title,
      type: "invoice_due_soon",
    }),
    createNotification({
      link: "/user/invoices",
      message,
      metadata: { invoice: invoice._id, room: invoice.room?._id },
      recipient: invoice.tenant?._id || invoice.tenant,
      recipientRole: "user",
      title,
      type: "invoice_due_soon",
    }),
  ]);
};

const notifyDueSoonInvoices = async () => {
  const now = new Date();
  const dueSoonLimit = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const invoices = await Invoice.find({
    dueDate: { $gte: now, $lte: dueSoonLimit },
    $or: [{ dueSoonNotifiedAt: { $exists: false } }, { dueSoonNotifiedAt: null }],
    status: { $in: ["unpaid", "partial"] },
  });

  for (const invoice of invoices) {
    await notifyInvoiceDueSoon(invoice);
    invoice.dueSoonNotifiedAt = new Date();
    await invoice.save();
  }
};

const markOverdueInvoices = async () => {
  const now = new Date();
  const invoices = await Invoice.find({
    dueDate: { $lt: now },
    status: { $in: ["unpaid", "partial"] },
  });

  for (const invoice of invoices) {
    invoice.status = "overdue";
    await invoice.save();
    await notifyInvoiceOverdue(invoice);
  }
};

const checkInvoiceDeadlines = async () => {
  await notifyDueSoonInvoices();
  await markOverdueInvoices();
};

const startInvoiceOverdueChecker = () => {
  checkInvoiceDeadlines().catch((error) => {
    console.error("Failed to check invoice deadlines:", error);
  });

  return setInterval(() => {
    checkInvoiceDeadlines().catch((error) => {
      console.error("Failed to check invoice deadlines:", error);
    });
  }, 60 * 60 * 1000);
};

module.exports = {
  checkInvoiceDeadlines,
  markOverdueInvoices,
  notifyDueSoonInvoices,
  startInvoiceOverdueChecker,
};
