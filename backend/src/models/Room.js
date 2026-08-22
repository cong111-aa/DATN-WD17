const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true }, // So phong
    name: { type: String, required: true, trim: true }, // Ten phong
    floor: { type: Number, default: 1, min: 0 }, // Tang
    area: { type: Number, default: 0, min: 0 }, // Dien tich
    capacity: { type: Number, default: 1, min: 1 }, // So nguoi toi da
    price: { type: Number, required: true, min: 0 }, // Gia thue hang thang
    deposit: { type: Number, default: 0, min: 0 }, // Tien coc
    electricityPrice: { type: Number, default: 3500, min: 0 }, // Don gia dien
    waterPrice: { type: Number, default: 15000, min: 0 }, // Don gia nuoc
    serviceFee: { type: Number, default: 0, min: 0 }, // Phi dich vu
    address: { type: String, default: "", trim: true }, // Dia chi/vi tri phong
    latitude: { type: Number, default: null, min: -90, max: 90 }, // Vi do
    longitude: { type: Number, default: null, min: -180, max: 180 }, // Kinh do
    description: { type: String, default: "", trim: true }, // Mo ta
    images: [{ type: String, trim: true }], // Danh sach anh phong
    status: {
      type: String,
      enum: ["available", "payment_pending", "reserved", "occupied", "coming_available", "maintenance"],
      default: "available",
    }, // Trang thai phong
    availableFrom: { type: Date },
    paymentHoldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentHoldRequest: { type: mongoose.Schema.Types.ObjectId, ref: "RoomRequest" },
    paymentHoldExpiresAt: { type: Date },
  },
  { timestamps: true }
);

roomSchema.index({ roomNumber: 1 });
roomSchema.index({ status: 1, paymentHoldExpiresAt: 1 });

module.exports = mongoose.model("Room", roomSchema);
