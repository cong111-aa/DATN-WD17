const mongoose = require("mongoose");

const occupantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    identityNumber: { type: String, required: true, trim: true },
    identityFrontImage: { type: String, required: true, trim: true },
    identityBackImage: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const roomRequestSchema = new mongoose.Schema(
  {
    requestCode: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    type: {
      type: String,
      enum: ["hold_deposit", "rent"],
      required: true,
    },
    durationMonths: { type: Number, min: 1 },
    occupantCount: { type: Number, default: 1, min: 1 },
    occupants: [occupantSchema],
    amount: { type: Number, required: true, min: 0 },
    holdExpiresAt: { type: Date },
    paymentProvider: {
      type: String,
      enum: ["vietqr", "payos"],
      default: "vietqr",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "cancelled"],
      default: "unpaid",
    },
    paymentOrderCode: { type: String, default: "", trim: true },
    paymentLinkId: { type: String, default: "", trim: true },
    paymentCheckoutUrl: { type: String, default: "", trim: true },
    paymentQrCode: { type: String, default: "", trim: true },
    paidAt: { type: Date },
    tenantRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "expired"],
      default: "pending",
    },
    message: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

roomRequestSchema.index({ requestCode: 1 }, { unique: true });
roomRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
roomRequestSchema.index({ room: 1, status: 1 });
roomRequestSchema.index({ paymentOrderCode: 1 });

module.exports = mongoose.model("RoomRequest", roomRequestSchema);
