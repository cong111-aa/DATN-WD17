const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contractCode: { type: String, required: true, unique: true, trim: true }, // Ma hop dong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi dai dien
    tenantRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // Ban ghi thue cua nguoi dai dien
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    memberCount: { type: Number, default: 1, min: 1 }, // Tong thanh vien
    moveInDate: { type: Date, required: true }, // Ngay vao o
    durationMonths: { type: Number, required: true, min: 1 }, // Thoi han hop dong
    startDate: { type: Date, required: true }, // Ngay bat dau
    endDate: { type: Date, required: true }, // Ngay ket thuc
    monthlyRent: { type: Number, required: true, min: 0 }, // Gia thue
    deposit: { type: Number, default: 0, min: 0 }, // Tien coc
    terms: { type: String, default: "", trim: true }, // Dieu khoan
    status: {
      type: String,
      enum: ["active", "expired", "terminated"],
      default: "active",
    }, // Trang thai hop dong
  },
  { timestamps: true }
);

contractSchema.index({ room: 1, status: 1 });
contractSchema.index({ contractCode: 1 }, { unique: true });

module.exports = mongoose.model("Contract", contractSchema);
