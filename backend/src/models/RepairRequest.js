const mongoose = require("mongoose");

const repairRequestSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thue
    title: { type: String, required: true, trim: true }, // Tieu de
    description: { type: String, required: true, trim: true }, // Mo ta su co
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    }, // Muc do uu tien
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    }, // Trang thai xu ly
    adminNote: { type: String, default: "", trim: true }, // Ghi chu cua admin
    completedAt: { type: Date }, // Ngay hoan thanh
  },
  { timestamps: true }
);

module.exports = mongoose.model("RepairRequest", repairRequestSchema);
