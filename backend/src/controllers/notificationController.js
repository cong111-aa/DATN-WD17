const Notification = require("../models/Notification");
const { emitUnreadCount, toNotificationResponse } = require("../services/notificationService");

const buildNotificationFilter = (user) => ({ recipient: user._id });

const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const notifications = await Notification.find(buildNotificationFilter(req.user))
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(notifications.map(toNotificationResponse));
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      ...buildNotificationFilter(req.user),
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...buildNotificationFilter(req.user) },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    await emitUnreadCount({ recipient: req.user._id, recipientRole: req.user.role });
    res.json(toNotificationResponse(notification));
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { ...buildNotificationFilter(req.user), isRead: false },
      { isRead: true, readAt: new Date() }
    );
    await emitUnreadCount({ recipient: req.user._id, recipientRole: req.user.role });

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
};
