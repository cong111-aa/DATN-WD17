const mongoose = require("mongoose");

const lifecycleHistorySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    performedAt: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    performedByRole: {
      type: String,
      enum: ["admin", "user", "system"],
      default: "system",
    },
  },
  { _id: false }
);

const contractLifecycleRequestSchema = new mongoose.Schema(
  {
    contract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["renewal", "checkout"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    requestedDurationMonths: { type: Number, min: 1 },
    requestedCheckoutDate: { type: Date },
    refundBankName: { type: String, default: "", trim: true },
    refundBankAccountNumber: { type: String, default: "", trim: true },
    refundBankAccountName: { type: String, default: "", trim: true },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundDeductionAmount: { type: Number, default: 0, min: 0 },
    refundExtraChargeAmount: { type: Number, default: 0, min: 0 },
    refundStatus: {
      type: String,
      enum: ["not_required", "pending", "refunded", "deducted", "extra_charge_required"],
      default: "pending",
    },
    refundProofImages: [{ type: String, trim: true }],
    refundedAt: { type: Date },
    proposedStartDate: { type: Date },
    proposedEndDate: { type: Date },
    proposedDurationMonths: { type: Number, min: 1 },
    proposedMonthlyRent: { type: Number, min: 0 },
    proposedDeposit: { type: Number, min: 0 },
    note: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedByRole: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    renewalContract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
    history: [lifecycleHistorySchema],
  },
  { timestamps: true }
);

contractLifecycleRequestSchema.index({ contract: 1, type: 1, status: 1 });
contractLifecycleRequestSchema.index({ tenant: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ContractLifecycleRequest", contractLifecycleRequestSchema);
