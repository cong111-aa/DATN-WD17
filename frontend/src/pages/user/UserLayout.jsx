import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DownOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  LogoutOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const UserLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTenanciesCount, setActiveTenanciesCount] = useState(0);
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [pendingRepairCount, setPendingRepairCount] = useState(0);

  const fetchBadgeCounts = async () => {
    if (!user) return;
    try {
      const [tenRes, invRes, repRes] = await Promise.allSettled([
        http.get("/me/tenancies"),
        http.get("/me/invoices"),
        http.get("/me/repair-requests"),
      ]);

      if (tenRes.status === "fulfilled") {
        const tens = tenRes.value.data || [];
        setActiveTenanciesCount(tens.filter((t) => t.status === "active").length);
      }

      if (invRes.status === "fulfilled") {
        const invs = invRes.value.data || [];
        setUnpaidInvoicesCount(invs.filter((i) => i.status === "unpaid" || i.status === "overdue").length);
      }

      if (repRes.status === "fulfilled") {
        const reps = repRes.value.data || [];
        setPendingRepairCount(reps.filter((r) => r.status === "pending" || r.status === "processing").length);
      }
    } catch (err) {
      // Ignore background badge count errors
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems = useMemo(
    () => [
      {
        key: "user-header",
        disabled: true,
        label: (
          <div className="user-menu-header">
            <div className="user-menu-info-name">{user?.name || "Nguyễn Tiến Tú"}</div>
            <div className="user-menu-info-email">{user?.email || "tientu123@gmail.com"}</div>
            {activeTenanciesCount > 0 ? (
              <div className="user-menu-status-badge">Đang thuê {activeTenanciesCount} phòng</div>
            ) : (
              <div className="user-menu-status-badge inactive">Chưa thuê phòng</div>
            )}
          </div>
        ),
      },
      {
        key: "/user",
        icon: <DashboardOutlined style={{ color: "#0f766e" }} />,
        label: "Trang tổng quan",
      },
      {
        key: "/user/my-rooms",
        icon: <HomeOutlined style={{ color: "#0f766e" }} />,
        label: "Phòng của tôi",
      },
      {
        key: "/user/contracts",
        icon: <FileProtectOutlined style={{ color: "#2563eb" }} />,
        label: "Hợp đồng",
      },
      {
        key: "/user/invoices",
        icon: <FileTextOutlined style={{ color: "#d97706" }} />,
        label: (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 12 }}>
            <span>Hóa đơn</span>
            {unpaidInvoicesCount > 0 && (
              <span className="user-menu-pill-badge danger">{unpaidInvoicesCount} chưa TT</span>
            )}
          </div>
        ),
      },
      {
        key: "/user/repair-requests",
        icon: <ToolOutlined style={{ color: "#e11d48" }} />,
        label: (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 12 }}>
            <span>Báo sự cố</span>
            {pendingRepairCount > 0 && (
              <span className="user-menu-pill-badge warning">{pendingRepairCount}</span>
            )}
          </div>
        ),
      },
      {
        key: "/user/room-requests",
        icon: <CreditCardOutlined style={{ color: "#0284c7" }} />,
        label: "Phòng đã cọc",
      },
      {
        key: "/user/interested-rooms",
        icon: <HeartOutlined style={{ color: "#e11d48" }} />,
        label: "Phòng yêu thích",
      },
      {
        key: "/user/profile",
        icon: <UserOutlined style={{ color: "#4f46e5" }} />,
        label: "Hồ sơ cá nhân",
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        icon: <LogoutOutlined style={{ color: "#e11d48" }} />,
        label: <span style={{ color: "#e11d48", fontWeight: 600 }}>Đăng xuất</span>,
      },
    ],
    [user, activeTenanciesCount, unpaidInvoicesCount, pendingRepairCount]
  );

  const handleUserMenuClick = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else if (key && key !== "user-header") {
      navigate(key);
    }
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header user-portal-header">
        <div className="brand" onClick={() => navigate("/")}>
          <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
          <span>TRO PLUS</span>
          <span className="brand-badge">Tenant Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <NotificationBell />
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          overlayClassName="user-dropdown-popover"
          trigger={["click"]}
          placement="bottomRight"
        >
          <div className="header-user-btn">
            <Avatar className="header-user-avatar" size={34} icon={<UserOutlined />}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <div className="header-user-info-text">
              <span className="header-user-name">{user?.name || "Tài khoản"}</span>
              <span className="header-user-role">Người thuê trọ</span>
            </div>
            <DownOutlined style={{ fontSize: 11, opacity: 0.8 }} />
          </div>
        </Dropdown>
        </div>
      </Header>
      <Content className="app-content">
        <Outlet context={{ refreshBadgeCounts: fetchBadgeCounts }} />
      </Content>
    </Layout>
  );
};

export default UserLayout;
