const Invoice = require("../models/Invoice");
const { createNotification, notifyAdmins } = require("./notificationService");

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

const startInvoiceOverdueChecker = () => {
  markOverdueInvoices().catch((error) => {
    console.error("Failed to mark overdue invoices:", error);
  });

  return setInterval(() => {
    markOverdueInvoices().catch((error) => {
      console.error("Failed to mark overdue invoices:", error);
    });
  }, 60 * 60 * 1000);
};

module.exports = {
  markOverdueInvoices,
  startInvoiceOverdueChecker,
};
