const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["invoice", "room_request"],
      default: "invoice",
      required: true,
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }, // Hoa don
    roomRequest: { type: mongoose.Schema.Types.ObjectId, ref: "RoomRequest" }, // Yeu cau phong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thanh toan
    amount: { type: Number, required: true, min: 0 }, // So tien thanh toan
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "vnpay", "momo", "zalopay", "other"],
      default: "cash",
    }, // Phuong thuc thanh toan
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "refunded"],
      default: "pending",
    }, // Trang thai giao dich
    provider: {
      type: String,
      enum: ["vnpay", "momo", "zalopay", "bank", "cash", "other", ""],
      default: "",
    }, // Cong thanh toan
    providerTransactionId: { type: String, default: "", trim: true }, // Ma giao dich cong thanh toan
    providerTxnRef: { type: String, trim: true }, // Ma don hang gui sang cong
    providerResponseCode: { type: String, default: "", trim: true },
    providerTransactionStatus: { type: String, default: "", trim: true },
    paymentUrl: { type: String, default: "" }, // Link thanh toan online
    paidAt: { type: Date }, // Thoi gian thanh toan thanh cong
    requestPayload: { type: mongoose.Schema.Types.Mixed }, // Du lieu gui sang cong thanh toan
    responsePayload: { type: mongoose.Schema.Types.Mixed }, // Du lieu cong thanh toan tra ve
    note: { type: String, default: "", trim: true }, // Ghi chu
  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, providerTxnRef: 1 }, { unique: true, sparse: true });
paymentSchema.index({ targetType: 1, invoice: 1, status: 1 });
paymentSchema.index({ targetType: 1, roomRequest: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
