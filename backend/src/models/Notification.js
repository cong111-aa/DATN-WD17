const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientRole: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "room_request_created",
        "room_request_paid",
        "invoice_created",
        "invoice_due_soon",
        "invoice_paid",
        "invoice_overdue",
        "contract_expiry_30",
        "contract_expiry_15",
        "contract_urgent",
        "contract_expired_pending",
        "contract_renewal_requested",
        "contract_checkout_requested",
        "contract_renewed",
        "contract_checkout_completed",
        "contract_waiting_signature",
        "contract_revision_requested",
        "contract_revision_resolved",
        "room_request_created_from_hold",
        "room_request_payment_proof_uploaded",
        "system",
      ],
      default: "system",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
