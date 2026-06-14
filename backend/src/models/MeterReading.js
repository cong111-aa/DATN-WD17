const mongoose = require("mongoose");

const meterReadingSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    month: { type: Number, required: true, min: 1, max: 12 }, // Thang
    year: { type: Number, required: true, min: 2000 }, // Nam
    electricityOld: { type: Number, default: 0, min: 0 }, // Chi so dien cu
    electricityNew: { type: Number, default: 0, min: 0 }, // Chi so dien moi
    waterOld: { type: Number, default: 0, min: 0 }, // Chi so nuoc cu
    waterNew: { type: Number, default: 0, min: 0 }, // Chi so nuoc moi
    note: { type: String, default: "", trim: true }, // Ghi chu
  },
  { timestamps: true }
);

meterReadingSchema.index({ room: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("MeterReading", meterReadingSchema);
