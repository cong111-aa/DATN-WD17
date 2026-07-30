const mongoose = require("mongoose");

const interestedRoomSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    note: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
  },
  { timestamps: true }
);

interestedRoomSchema.index({ user: 1, room: 1 }, { unique: true });
interestedRoomSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("InterestedRoom", interestedRoomSchema);
