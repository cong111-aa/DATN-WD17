const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Ten toa nha
    code: { type: String, required: true, unique: true, trim: true }, // Ma toa nha
    address: { type: String, required: true, trim: true }, // Dia chi toa nha
    description: { type: String, default: "", trim: true }, // Mo ta them
    totalFloors: { type: Number, default: 1, min: 1 }, // Tong so tang
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    }, // Trang thai toa nha
  },
  { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
