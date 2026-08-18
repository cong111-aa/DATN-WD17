const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contractCode: { type: String, required: true, unique: true, trim: true }, // Ma hop dong
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nguoi dai dien
    tenantRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // Ban ghi thue cua nguoi dai dien
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Phong
    memberCount: { type: Number, default: 1, min: 1 }, // Tong thanh vien
    moveInDate: { type: Date, required: true }, // Ngay vao o
    durationMonths: { type: Number, required: true, min: 1 }, // Thoi han hop dong
    startDate: { type: Date, required: true }, // Ngay bat dau
    endDate: { type: Date, required: true }, // Ngay ket thuc
    monthlyRent: { type: Number, required: true, min: 0 }, // Gia thue
    deposit: { type: Number, default: 0, min: 0 }, // Tien coc
    terms: { type: String, default: "", trim: true }, // Dieu khoan
    signatureImage: { type: String, default: "", trim: true },
    signatureMethod: {
      type: String,
      enum: ["", "drawn", "auto_generated"],
      default: "",
    },
    signedAt: { type: Date },
    signIp: { type: String, default: "", trim: true },
    signUserAgent: { type: String, default: "", trim: true },
    contentHash: { type: String, default: "", trim: true },
    contractHtmlSnapshot: { type: String, default: "" },
    lockedAt: { type: Date },
    version: { type: Number, default: 1, min: 1 },
    revisionRequests: [
      {
        message: { type: String, required: true, trim: true },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        requestedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
        adminResponse: { type: String, default: "", trim: true },
        status: {
          type: String,
          enum: ["pending", "resolved", "rejected"],
          default: "pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending_user_signature", "revision_requested", "active", "expired", "terminated"],
      default: "pending_user_signature",
    }, // Trang thai hop dong
  },
  { timestamps: true }
);

contractSchema.index({ room: 1, status: 1 });
contractSchema.index({ contractCode: 1 }, { unique: true });

module.exports = mongoose.model("Contract", contractSchema);
