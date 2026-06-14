const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Ho ten
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    }, // Email dang nhap, khong duoc trung
    password: { type: String, required: true, minlength: 6 }, // Mat khau da ma hoa
    phone: { type: String, default: "", trim: true }, // So dien thoai
    address: { type: String, default: "", trim: true }, // Dia chi
    identityNumber: { type: String, default: "", trim: true }, // So CCCD/CMND
    identityFrontImage: { type: String, default: "" }, // Anh mat truoc CCCD
    identityBackImage: { type: String, default: "" }, // Anh mat sau CCCD
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    }, // Vai tro
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    }, // Trang thai tai khoan
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
