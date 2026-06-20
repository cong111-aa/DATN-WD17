const mongoose = require("mongoose");

const operatingExpenseSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "internet",
        "cleaning",
        "maintenance",
        "security",
        "common_electricity",
        "common_water",
        "garbage",
        "management",
        "other",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, default: Date.now },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "paid",
    },
    note: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

operatingExpenseSchema.index({ building: 1, month: 1, year: 1, category: 1 });

module.exports = mongoose.model("OperatingExpense", operatingExpenseSchema);
