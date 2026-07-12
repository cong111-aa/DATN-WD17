const Contract = require("../models/Contract");
const Invoice = require("../models/Invoice");
const OperatingExpense = require("../models/OperatingExpense");
const Room = require("../models/Room");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

const sumField = (items, field) => items.reduce((sum, item) => sum + Number(item[field] || 0), 0);

const getMonthlyRange = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return { end, month, start, year };
};

const getValidYear = (value, fallback) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 ? year : fallback;
};

const toInvoiceItem = (invoice) => ({
  id: invoice._id,
  invoiceCode: invoice.invoiceCode,
  roomNumber: invoice.room?.roomNumber,
  roomName: invoice.room?.name,
  tenantName: invoice.tenant?.name,
  totalAmount: invoice.totalAmount,
  paidAmount: invoice.paidAmount,
  remainingAmount: Math.max(Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0), 0),
  dueDate: invoice.dueDate,
  status: invoice.status,
});

const toContractItem = (contract) => ({
  id: contract._id,
  contractCode: contract.contractCode,
  roomNumber: contract.room?.roomNumber,
  roomName: contract.room?.name,
  tenantName: contract.tenant?.name,
  endDate: contract.endDate,
  status: contract.status,
});

const toRoomItem = (room) => ({
  id: room._id,
  roomNumber: room.roomNumber,
  name: room.name,
  floor: room.floor,
  price: room.price,
  status: room.status,
});

const getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const { month, year } = getMonthlyRange(now);
    const selectedYear = getValidYear(req.query.year, year);
    const soonDate = new Date(now);
    soonDate.setDate(soonDate.getDate() + 30);

    const invoiceOutstandingFilter = {
      status: { $in: ["unpaid", "partial", "overdue"] },
    };
    const overdueFilter = {
      $or: [
        { status: "overdue" },
        {
          dueDate: { $lt: now },
          status: { $in: ["unpaid", "partial"] },
        },
      ],
    };

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      activeTenants,
      totalUsers,
      activeContracts,
      expiringContracts,
      invoiceCounts,
      monthlyInvoices,
      outstandingInvoices,
      monthlyExpenses,
      yearlyRevenue,
      yearlyExpenses,
      recentOverdueInvoices,
      recentExpiringContracts,
      recentAvailableRooms,
    ] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: "available" }),
      Room.countDocuments({ status: "occupied" }),
      Room.countDocuments({ status: "maintenance" }),
      Tenant.countDocuments({ status: "active" }),
      User.countDocuments({ role: "user" }),
      Contract.countDocuments({ status: "active" }),
      Contract.countDocuments({ status: "active", endDate: { $gte: now, $lte: soonDate } }),
      Invoice.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Invoice.find({ month, year }).select("totalAmount paidAmount status"),
      Invoice.find(invoiceOutstandingFilter).select("totalAmount paidAmount status"),
      OperatingExpense.find({ month, year }).select("amount status"),
      Invoice.aggregate([
        { $match: { year: selectedYear } },
        {
          $group: {
            _id: "$month",
            billedAmount: { $sum: "$totalAmount" },
            collectedAmount: { $sum: "$paidAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      OperatingExpense.aggregate([
        { $match: { year: selectedYear, status: "paid" } },
        {
          $group: {
            _id: "$month",
            paidExpenseAmount: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Invoice.find(overdueFilter)
        .populate("room", "roomNumber name")
        .populate("tenant", "name")
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(5),
      Contract.find({ status: "active", endDate: { $gte: now, $lte: soonDate } })
        .populate("room", "roomNumber name")
        .populate("tenant", "name")
        .sort({ endDate: 1 })
        .limit(5),
      Room.find({ status: "available" }).sort({ createdAt: -1 }).limit(5),
    ]);

    const invoiceStatusCounts = invoiceCounts.reduce(
      (result, item) => ({
        ...result,
        [item._id]: item.count,
      }),
      { overdue: 0, paid: 0, partial: 0, unpaid: 0 }
    );

    const collectedThisMonth = sumField(monthlyInvoices, "paidAmount");
    const billedThisMonth = sumField(monthlyInvoices, "totalAmount");
    const outstandingAmount = outstandingInvoices.reduce(
      (sum, invoice) => sum + Math.max(Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0), 0),
      0
    );
    const paidExpenseThisMonth = monthlyExpenses
      .filter((expense) => expense.status === "paid")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const pendingExpenseThisMonth = monthlyExpenses
      .filter((expense) => expense.status === "pending")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const revenueByMonth = Array.from({ length: 12 }, (_, index) => {
      const revenue = yearlyRevenue.find((item) => Number(item._id) === index + 1);
      const expense = yearlyExpenses.find((item) => Number(item._id) === index + 1);
      const collectedAmount = Number(revenue?.collectedAmount || 0);
      const paidExpenseAmount = Number(expense?.paidExpenseAmount || 0);
      const profitAmount = collectedAmount - paidExpenseAmount;
      const previousRevenue = index === 0 ? undefined : yearlyRevenue.find((item) => Number(item._id) === index);
      const previousCollectedAmount = Number(previousRevenue?.collectedAmount || 0);
      const growthRate =
        index === 0 || previousCollectedAmount === 0
          ? null
          : Math.round(((collectedAmount - previousCollectedAmount) / previousCollectedAmount) * 1000) / 10;

      return {
        billedAmount: Number(revenue?.billedAmount || 0),
        collectedAmount,
        growthRate,
        month: index + 1,
        paidExpenseAmount,
        profitAmount,
      };
    });
    const yearlyCollectedAmount = sumField(revenueByMonth, "collectedAmount");
    const yearlyPaidExpenseAmount = sumField(revenueByMonth, "paidExpenseAmount");
    const yearlyProfitAmount = sumField(revenueByMonth, "profitAmount");

    res.json({
      period: { month, revenueYear: selectedYear, year },
      rooms: {
        available: availableRooms,
        maintenance: maintenanceRooms,
        occupied: occupiedRooms,
        total: totalRooms,
      },
      tenants: {
        active: activeTenants,
        totalUsers,
      },
      contracts: {
        active: activeContracts,
        expiringSoon: expiringContracts,
      },
      invoices: {
        ...invoiceStatusCounts,
        billedThisMonth,
        collectedThisMonth,
        outstandingAmount,
      },
      revenue: {
        byMonth: revenueByMonth,
        calculation: "sum_paid_amount",
        yearlyCollectedAmount,
        yearlyPaidExpenseAmount,
        yearlyProfitAmount,
      },
      expenses: {
        paidThisMonth: paidExpenseThisMonth,
        pendingThisMonth: pendingExpenseThisMonth,
      },
      profit: {
        currentMonth: collectedThisMonth - paidExpenseThisMonth,
      },
      recent: {
        availableRooms: recentAvailableRooms.map(toRoomItem),
        expiringContracts: recentExpiringContracts.map(toContractItem),
        overdueInvoices: recentOverdueInvoices.map(toInvoiceItem),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard };
