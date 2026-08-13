import { BellOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Empty, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import http from "../api/http";

const { Text } = Typography;

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} giờ trước`;

  return date.toLocaleDateString("vi-VN");
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const [{ data: list }, { data: countData }] = await Promise.all([
        http.get("/notifications?limit=12"),
        http.get("/notifications/unread-count"),
      ]);

      setNotifications(list || []);
      setUnreadCount(Number(countData?.unreadCount || 0));
    } catch (error) {
      // Ignore background notification errors
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetchNotifications();

    if (!token) {
      return undefined;
    }

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("notifications:new", (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 12));
      setUnreadCount((count) => count + 1);
    });

    socket.on("notifications:unread-count", ({ unreadCount: nextCount }) => {
      setUnreadCount(Number(nextCount || 0));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await http.patch(`/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
          )
        );
        setUnreadCount((count) => Math.max(count - 1, 0));
      }

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không cập nhật được thông báo");
    }
  };

  const handleReadAll = async () => {
    try {
      await http.patch("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      message.error(error.response?.data?.message || "Không đánh dấu đọc được thông báo");
    }
  };

  const menuItems = useMemo(() => {
    if (!notifications.length) {
      return [
        {
          key: "empty",
          disabled: true,
          label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />,
        },
      ];
    }

    return [
      ...notifications.map((notification) => ({
        key: notification.id,
        label: (
          <button
            type="button"
            className={`notification-item ${notification.isRead ? "" : "unread"}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <span className="notification-dot" />
            <span className="notification-content">
              <Text strong={!notification.isRead} className="notification-title">
                {notification.title}
              </Text>
              <Text type="secondary" className="notification-message">
                {notification.message}
              </Text>
              <Text type="secondary" className="notification-time">
                {formatNotificationTime(notification.createdAt)}
              </Text>
            </span>
          </button>
        ),
      })),
      { type: "divider" },
      {
        key: "read-all",
        label: (
          <Button type="link" block onClick={handleReadAll} disabled={!unreadCount}>
            Đánh dấu tất cả đã đọc
          </Button>
        ),
      },
    ];
  }, [notifications, unreadCount]);

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        overlayClassName="notification-dropdown"
        trigger={["click"]}
        placement="bottomRight"
      >
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <Button
            aria-label="Thông báo"
            icon={<BellOutlined />}
            shape="circle"
            className="notification-bell-btn"
          />
        </Badge>
      </Dropdown>
      <style>{`
        .notification-bell-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #0f172a;
        }
        .notification-dropdown .ant-dropdown-menu {
          width: min(380px, calc(100vw - 32px));
          max-height: 520px;
          overflow-y: auto;
          padding: 8px;
        }
        .notification-item {
          display: grid;
          grid-template-columns: 8px 1fr;
          gap: 10px;
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          padding: 10px 8px;
          cursor: pointer;
          border-radius: 8px;
        }
        .notification-item:hover {
          background: #f1f5f9;
        }
        .notification-item.unread {
          background: #ecfeff;
        }
        .notification-dot {
          width: 8px;
          height: 8px;
          margin-top: 7px;
          border-radius: 50%;
          background: transparent;
        }
        .notification-item.unread .notification-dot {
          background: #0f766e;
        }
        .notification-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .notification-title,
        .notification-message,
        .notification-time {
          white-space: normal;
          line-height: 1.35;
        }
        .notification-message {
          font-size: 12px;
        }
        .notification-time {
          font-size: 11px;
        }
      `}</style>
    </>
  );
};

export default NotificationBell;
