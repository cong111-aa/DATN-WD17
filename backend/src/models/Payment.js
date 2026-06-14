const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true }, // Hoa don
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thue
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
    paymentUrl: { type: String, default: "" }, // Link thanh toan online
    paidAt: { type: Date }, // Thoi gian thanh toan thanh cong
    requestPayload: { type: mongoose.Schema.Types.Mixed }, // Du lieu gui sang cong thanh toan
    responsePayload: { type: mongoose.Schema.Types.Mixed }, // Du lieu cong thanh toan tra ve
    note: { type: String, default: "", trim: true }, // Ghi chu
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
