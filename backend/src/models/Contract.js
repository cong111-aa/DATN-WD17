const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contractCode: { type: String, required: true, unique: true, trim: true }, // Ma hop dong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thue
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
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

module.exports = mongoose.model("Contract", contractSchema);
