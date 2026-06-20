const Building = require("../models/Building");
const OperatingExpense = require("../models/OperatingExpense");

const expenseCategories = [
  "internet",
  "cleaning",
  "maintenance",
  "security",
  "common_electricity",
  "common_water",
  "garbage",
  "management",
  "other",
];

const expenseStatuses = ["pending", "paid", "cancelled"];

const populateExpense = (query) =>
  query.populate("building", "name code").populate("createdBy", "name email");

const toExpenseResponse = (expense) => ({
  id: expense._id,
  building: expense.building?._id || expense.building,
  buildingName: expense.building?.name,
  buildingCode: expense.building?.code,
  category: expense.category,
  title: expense.title,
  amount: expense.amount,
  expenseDate: expense.expenseDate,
  month: expense.month,
  year: expense.year,
  status: expense.status,
  note: expense.note,
  createdBy: expense.createdBy?._id || expense.createdBy,
  createdByName: expense.createdBy?.name,
  createdByEmail: expense.createdBy?.email,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

const validateExpensePayload = ({ building, category, title, amount, month, year, status }, isCreate) => {
  if (isCreate && (!building || !category || !title || amount === undefined || month === undefined || year === undefined)) {
    throw new Error("Building, category, title, amount, month and year are required");
  }

  if (category && !expenseCategories.includes(category)) {
    throw new Error("Invalid expense category");
  }

  if (status && !expenseStatuses.includes(status)) {
    throw new Error("Invalid expense status");
  }

  if (amount !== undefined && Number(amount) < 0) {
    throw new Error("Amount must be greater than or equal to 0");
  }

  if (month !== undefined && (Number(month) < 1 || Number(month) > 12)) {
    throw new Error("Month must be between 1 and 12");
  }

  if (year !== undefined && Number(year) < 2000) {
    throw new Error("Year must be greater than or equal to 2000");
  }
};

const ensureBuildingExists = async (buildingId) => {
  const building = await Building.findById(buildingId);

  if (!building) {
    throw new Error("Building not found");
  }

  return building;
};

const buildExpenseFilter = (query) => {
  const filter = {};

  if (query.building) {
    filter.building = query.building;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.month) {
    filter.month = Number(query.month);
  }

  if (query.year) {
    filter.year = Number(query.year);
  }

  return filter;
};

const getOperatingExpenses = async (req, res, next) => {
  try {
    const filter = buildExpenseFilter(req.query);
    const expenses = await populateExpense(
      OperatingExpense.find(filter).sort({ year: -1, month: -1, expenseDate: -1, createdAt: -1 })
    );

    res.json(expenses.map(toExpenseResponse));
  } catch (error) {
    next(error);
  }
};

const getOperatingExpenseById = async (req, res, next) => {
  try {
    const expense = await populateExpense(OperatingExpense.findById(req.params.id));

    if (!expense) {
      res.status(404);
      throw new Error("Operating expense not found");
    }

    res.json(toExpenseResponse(expense));
  } catch (error) {
    next(error);
  }
};

const createOperatingExpense = async (req, res, next) => {
  try {
    const {
      building,
      category,
      title,
      amount,
      expenseDate = new Date(),
      month,
      year,
      status = "paid",
      note,
    } = req.body;

    validateExpensePayload({ building, category, title, amount, month, year, status }, true);
    await ensureBuildingExists(building);

    const expense = await OperatingExpense.create({
      building,
      category,
      title,
      amount,
      expenseDate,
      month,
      year,
      status,
      note,
      createdBy: req.user?._id,
    });

    const populatedExpense = await populateExpense(OperatingExpense.findById(expense._id));
    res.status(201).json(toExpenseResponse(populatedExpense));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const createOperatingExpensesBulk = async (req, res, next) => {
  try {
    const {
      building,
      expenseDate = new Date(),
      items = [],
      month,
      status = "paid",
      year,
    } = req.body;

    validateExpensePayload(
      {
        building,
        category: "other",
        title: "bulk",
        amount: 0,
        month,
        year,
        status,
      },
      true
    );
    await ensureBuildingExists(building);

    if (!Array.isArray(items)) {
      res.status(400);
      throw new Error("Items must be an array");
    }

    const validItems = items.filter(
      (item) => item?.category && item?.title && Number(item?.amount || 0) > 0
    );

    if (validItems.length === 0) {
      res.status(400);
      throw new Error("At least one expense item with title and amount is required");
    }

    validItems.forEach((item) => {
      validateExpensePayload(
        {
          building,
          category: item.category,
          title: item.title,
          amount: item.amount,
          month,
          year,
          status,
        },
        true
      );
    });

    const expenses = await OperatingExpense.insertMany(
      validItems.map((item) => ({
        building,
        category: item.category,
        title: item.title,
        amount: item.amount,
        expenseDate,
        month,
        year,
        status,
        note: item.note,
        createdBy: req.user?._id,
      }))
    );

    const populatedExpenses = await populateExpense(
      OperatingExpense.find({ _id: { $in: expenses.map((expense) => expense._id) } })
    );

    res.status(201).json(populatedExpenses.map(toExpenseResponse));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateOperatingExpense = async (req, res, next) => {
  try {
    const expense = await OperatingExpense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error("Operating expense not found");
    }

    const { building, category, title, amount, expenseDate, month, year, status, note } = req.body;

    validateExpensePayload({ building, category, title, amount, month, year, status }, false);

    if (building) {
      await ensureBuildingExists(building);
    }

    expense.building = building ?? expense.building;
    expense.category = category ?? expense.category;
    expense.title = title ?? expense.title;
    expense.amount = amount ?? expense.amount;
    expense.expenseDate = expenseDate ?? expense.expenseDate;
    expense.month = month ?? expense.month;
    expense.year = year ?? expense.year;
    expense.status = status ?? expense.status;
    expense.note = note ?? expense.note;

    const updatedExpense = await expense.save();
    const populatedExpense = await populateExpense(OperatingExpense.findById(updatedExpense._id));
    res.json(toExpenseResponse(populatedExpense));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateOperatingExpenseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!expenseStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid expense status");
    }

    const expense = await OperatingExpense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error("Operating expense not found");
    }

    expense.status = status;
    const updatedExpense = await expense.save();
    const populatedExpense = await populateExpense(OperatingExpense.findById(updatedExpense._id));
    res.json(toExpenseResponse(populatedExpense));
  } catch (error) {
    next(error);
  }
};

const deleteOperatingExpense = async (req, res, next) => {
  try {
    const expense = await OperatingExpense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error("Operating expense not found");
    }

    if (expense.status === "paid") {
      res.status(400);
      throw new Error("Cannot delete paid operating expense");
    }

    await expense.deleteOne();
    res.json({ message: "Operating expense deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOperatingExpense,
  createOperatingExpensesBulk,
  deleteOperatingExpense,
  getOperatingExpenseById,
  getOperatingExpenses,
  updateOperatingExpense,
  updateOperatingExpenseStatus,
};
