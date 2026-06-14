const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi thue
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong thue
    moveInDate: { type: Date, default: Date.now }, // Ngay vao o
    moveOutDate: { type: Date }, // Ngay roi di
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    }, // Trang thai thue
    note: { type: String, default: "", trim: true }, // Ghi chu
  },
  { timestamps: true }
);

tenantSchema.index({ user: 1, room: 1, status: 1 });

module.exports = mongoose.model("Tenant", tenantSchema);
