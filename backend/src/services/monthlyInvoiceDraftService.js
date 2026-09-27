const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const { notifyAdmins } = require("./notificationService");

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const TARGET_BILLING_DAY = 28;

const getLastDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const shouldRunToday = (date = new Date()) => {
  const billingDay = Math.min(TARGET_BILLING_DAY, getLastDayOfMonth(date));
  return date.getDate() === billingDay;
};

const remindMonthlyInvoiceCreation = async (date = new Date()) => {
  if (!shouldRunToday(date)) {
    return { reminded: false, shouldRun: false };
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const alreadyReminded = await Notification.exists({
    type: "monthly_invoice_reminder",
    "metadata.month": month,
    "metadata.year": year,
  });

  if (alreadyReminded) {
    return { month, reminded: false, shouldRun: true, year };
  }

  const activeContractCount = await Contract.countDocuments({ status: "active" });
  await notifyAdmins({
    link: "/admin/invoices",
    message: `Da den ky tao hoa don thang ${month}/${year}. Hien co ${activeContractCount} phong dang thue can nhap chi so dien nuoc va tao hoa don.`,
    metadata: { activeContractCount, month, year },
    title: "Nhac tao hoa don hang thang",
    type: "monthly_invoice_reminder",
  });

  return { activeContractCount, month, reminded: true, shouldRun: true, year };
};

const startMonthlyInvoiceDraftScheduler = () => {
  remindMonthlyInvoiceCreation().catch((error) => {
    console.error("Failed to send monthly invoice reminder:", error);
  });

  return setInterval(() => {
    remindMonthlyInvoiceCreation().catch((error) => {
      console.error("Failed to send monthly invoice reminder:", error);
    });
  }, CHECK_INTERVAL_MS);
};

module.exports = {
  checkMonthlyInvoiceDrafts: remindMonthlyInvoiceCreation,
  shouldRunToday,
  startMonthlyInvoiceDraftScheduler,
};
