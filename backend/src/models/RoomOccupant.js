const mongoose = require("mongoose");

const roomOccupantSchema = new mongoose.Schema(
  {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    identityBackImage: { type: String, default: "", trim: true },
    identityFrontImage: { type: String, default: "", trim: true },
    identityNumber: { type: String, required: true, trim: true },
    moveInDate: { type: Date, default: Date.now },
    name: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "OccupantRequest" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

roomOccupantSchema.index({ room: 1, status: 1 });
roomOccupantSchema.index({ room: 1, identityNumber: 1, status: 1 });

module.exports = mongoose.model("RoomOccupant", roomOccupantSchema);
