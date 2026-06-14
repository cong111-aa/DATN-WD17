const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true }, // So phong
    name: { type: String, required: true, trim: true }, // Ten phong
    floor: { type: Number, default: 1, min: 0 }, // Tang
    area: { type: Number, default: 0, min: 0 }, // Dien tich
    capacity: { type: Number, default: 1, min: 1 }, // So nguoi toi da
    price: { type: Number, required: true, min: 0 }, // Gia thue hang thang
    deposit: { type: Number, default: 0, min: 0 }, // Tien coc
    electricityPrice: { type: Number, default: 3500, min: 0 }, // Don gia dien
    waterPrice: { type: Number, default: 15000, min: 0 }, // Don gia nuoc
    serviceFee: { type: Number, default: 0, min: 0 }, // Phi dich vu
    description: { type: String, default: "", trim: true }, // Mo ta
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    }, // Trang thai phong
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
