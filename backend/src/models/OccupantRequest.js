const mongoose = require("mongoose");

const occupantRequestSchema = new mongoose.Schema(
  {
    adminNote: { type: String, default: "", trim: true },
    identityBackImage: { type: String, required: true, trim: true },
    identityFrontImage: { type: String, required: true, trim: true },
    identityNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    occupant: { type: mongoose.Schema.Types.ObjectId, ref: "RoomOccupant" },
    phone: { type: String, required: true, trim: true },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

occupantRequestSchema.index({ room: 1, status: 1 });
occupantRequestSchema.index({ requestedBy: 1, createdAt: -1 });
occupantRequestSchema.index({ room: 1, identityNumber: 1, status: 1 });

module.exports = mongoose.model("OccupantRequest", occupantRequestSchema);
