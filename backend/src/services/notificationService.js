const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIo } = require("../socket");

const toNotificationResponse = (notification) => ({
  id: notification._id,
  recipient: notification.recipient,
  recipientRole: notification.recipientRole,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link,
  isRead: notification.isRead,
  readAt: notification.readAt,
  metadata: notification.metadata,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const emitUnreadCount = async ({ recipient, recipientRole }) => {
  const io = getIo();

  if (!io) {
    return;
  }

  const filter = recipient
    ? { recipient, isRead: false }
    : { recipientRole, recipient: { $exists: false }, isRead: false };
  const unreadCount = await Notification.countDocuments(filter);
  const room = recipient ? `user:${recipient}` : `role:${recipientRole}`;

  io.to(room).emit("notifications:unread-count", { unreadCount });
};

const createNotification = async ({
  link = "",
  message,
  metadata,
  recipient,
  recipientRole,
  title,
  type = "system",
}) => {
  const notification = await Notification.create({
    link,
    message,
    metadata,
    recipient,
    recipientRole,
    title,
    type,
  });
  const payload = toNotificationResponse(notification);
  const io = getIo();

  if (io) {
    io.to(recipient ? `user:${recipient}` : `role:${recipientRole}`).emit("notifications:new", payload);
  }

  await emitUnreadCount({ recipient, recipientRole });

  return notification;
};

const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: "admin", status: "active" }).select("_id");

  if (!admins.length) {
    return [];
  }

  return Promise.all(
    admins.map((admin) =>
      createNotification({
        ...payload,
        recipient: admin._id,
        recipientRole: "admin",
      })
    )
  );
};

module.exports = {
  createNotification,
  emitUnreadCount,
  notifyAdmins,
  toNotificationResponse,
};
