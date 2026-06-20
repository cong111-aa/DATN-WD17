const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: { type: String, required: true, unique: true, trim: true }, // Ma hoa don
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thue
    contract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" }, // Hop dong giay, khong bat buoc tren he thong
    meterReading: { type: mongoose.Schema.Types.ObjectId, ref: "MeterReading" }, // Chi so dien nuoc
    month: { type: Number, required: true, min: 1, max: 12 }, // Thang
    year: { type: Number, required: true, min: 2000 }, // Nam
    rentAmount: { type: Number, default: 0, min: 0 }, // Tien phong
    electricityAmount: { type: Number, default: 0, min: 0 }, // Tien dien
    waterAmount: { type: Number, default: 0, min: 0 }, // Tien nuoc
    serviceAmount: { type: Number, default: 0, min: 0 }, // Phi dich vu
    otherAmount: { type: Number, default: 0, min: 0 }, // Chi phi phat sinh
    discountAmount: { type: Number, default: 0, min: 0 }, // Giam tru
    totalAmount: { type: Number, default: 0, min: 0 }, // Tong tien
    paidAmount: { type: Number, default: 0, min: 0 }, // Da thanh toan
    dueDate: { type: Date }, // Han thanh toan
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    }, // Trang thai hoa don
    note: { type: String, default: "", trim: true }, // Ghi chu
  },
  { timestamps: true }
);

invoiceSchema.index({ tenant: 1, room: 1, month: 1, year: 1 }, { unique: true });
invoiceSchema.index({ invoiceCode: 1 }, { unique: true });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
