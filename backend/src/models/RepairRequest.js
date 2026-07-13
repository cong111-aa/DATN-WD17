const mongoose = require("mongoose");

const repairRequestSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nguoi thue bao cao, neu co
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nguoi tao su co
    createdByRole: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    }, // Vai tro nguoi tao
    title: { type: String, required: true, trim: true }, // Tieu de
    description: { type: String, required: true, trim: true }, // Mo ta su co
    images: [{ type: String, trim: true }], // Anh su co
    requestedResolveDate: { type: Date }, // Ngay nguoi dung mong muon xu ly
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    }, // Muc do uu tien
    status: {
      type: String,
      enum: ["pending", "processing", "resolved", "completed", "cancelled"],
      default: "pending",
    }, // Trang thai xu ly
    adminNote: { type: String, default: "", trim: true }, // Ghi chu cua admin
    resolvedAt: { type: Date }, // Ngay xu ly xong
    completedAt: { type: Date }, // Du lieu cu: ngay hoan thanh
  },
  { timestamps: true }
);

repairRequestSchema.index({ room: 1, status: 1 });
repairRequestSchema.index({ createdBy: 1, createdAt: -1 });
repairRequestSchema.index({ status: 1 });

module.exports = mongoose.model("RepairRequest", repairRequestSchema);
