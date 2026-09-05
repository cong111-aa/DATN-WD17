import {
  CrownFilled,
  DashboardOutlined,
  DollarOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  SolutionOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Tooltip } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import { useAuth } from "../../context/AuthContext";

const { Content, Header, Sider } = Layout;

const inlineStyles = `
/* ==========================================================================
   Modern Rental Admin Navigation & Layout (Direct Embedded)
   ========================================================================== */
.admin-app-shell {
  min-height: 100vh;
  background-color: #f8fafc;
}

/* Sider Styling */
.admin-sider-modern {
  background: #0b1120 !important;
  border-right: 1px solid #1e293b;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.admin-sider-modern .ant-layout-sider-children {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Brand Section */
.admin-brand-section {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #1e293b;
  background: #070a12;
  min-height: 64px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.admin-brand-section:hover {
  background: #0c111d;
}

.admin-brand-logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.admin-brand-section:hover .admin-brand-logo-icon {
  transform: rotate(-6deg) scale(1.08);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.6);
}

.admin-brand-section:active .admin-brand-logo-icon {
  transform: scale(0.92);
}

.admin-brand-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;
}

.admin-brand-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-brand-title {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff !important;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.admin-brand-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.4);
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.admin-brand-section:hover .admin-brand-badge {
  background: rgba(99, 102, 241, 0.35);
  color: #a5b4fc;
}

.admin-brand-subtitle {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.2px;
}

/* Menu Customization */
.admin-menu-modern {
  background: transparent !important;
  border: none !important;
  padding: 12px 10px !important;
  flex: 1;
  overflow-y: auto;
}

/* Group Label Styling */
.admin-menu-modern .ant-menu-item-group-title {
  color: #64748b !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  padding: 12px 12px 6px !important;
  user-select: none;
}

.admin-menu-modern .ant-menu-item {
  border-radius: 8px !important;
  margin: 3px 0 !important;
  height: 42px !important;
  line-height: 42px !important;
  color: #94a3b8 !important;
  font-weight: 500 !important;
  font-size: 13.5px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding-left: 14px !important;
  cursor: pointer !important;
  position: relative;
}

.admin-menu-modern .ant-menu-item .ant-menu-item-icon {
  font-size: 16px !important;
  min-width: 16px !important;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease !important;
}

/* Hover Effect */
.admin-menu-modern .ant-menu-item:hover {
  color: #ffffff !important;
  background: rgba(30, 41, 59, 0.8) !important;
  transform: translateX(4px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

.admin-menu-modern .ant-menu-item:hover .ant-menu-item-icon {
  transform: scale(1.2);
  color: #818cf8 !important;
}

/* Click/Active Effect */
.admin-menu-modern .ant-menu-item:active {
  transform: scale(0.96) translateX(2px) !important;
  transition: transform 0.08s ease !important;
}

/* Selected Menu Item */
.admin-menu-modern .ant-menu-item-selected {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4) !important;
}

.admin-menu-modern .ant-menu-item-selected:hover {
  transform: translateX(4px) scale(1.01) !important;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.5) !important;
}

.admin-menu-modern .ant-menu-item-selected .ant-menu-item-icon {
  color: #ffffff !important;
  transform: scale(1.05);
}

/* Sider Footer */
.admin-sider-footer {
  padding: 12px 14px;
  border-top: 1px solid #1e293b;
  background: #070a12;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-footer-status-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 6px;
  background: #131d31;
  border: 1px solid #1e293b;
  transition: all 0.2s ease;
  user-select: none;
}

.admin-footer-status-box:hover {
  border-color: #334155;
  background: #182238;
}

.admin-footer-status-info {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: #cbd5e1;
  font-weight: 500;
  white-space: nowrap;
}

.admin-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: adminPulse 2s infinite;
}

@keyframes adminPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.admin-footer-version {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

/* ==========================================================================
   Modern Header Styling - Perfectly Contained & Centered
   ========================================================================== */
.admin-header-modern {
  background: #ffffff !important;
  height: 64px !important;
  max-height: 64px !important;
  line-height: normal !important;
  padding: 0 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03) !important;
  position: sticky;
  top: 0;
  z-index: 99;
  box-sizing: border-box !important;
}

.admin-header-modern * {
  box-sizing: border-box !important;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  line-height: normal !important;
}

.admin-toggle-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #475569 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  padding: 0 !important;
  line-height: 1 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: pointer !important;
  flex-shrink: 0;
}

.admin-toggle-btn:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
  transform: scale(1.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08) !important;
}

.admin-toggle-btn:active {
  transform: scale(0.9) rotate(-8deg) !important;
}

.admin-header-divider {
  width: 1px;
  height: 22px;
  background-color: #e2e8f0;
  flex-shrink: 0;
}

.admin-header-breadcrumb-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1 !important;
  user-select: none;
}

.admin-breadcrumb-home {
  color: #94a3b8;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1 !important;
  transition: all 0.15s ease;
  cursor: pointer;
}

.admin-breadcrumb-home:hover {
  color: #4f46e5;
  transform: scale(1.1);
}

.admin-breadcrumb-sep {
  color: #cbd5e1;
  font-size: 11px;
  line-height: 1 !important;
  display: inline-flex;
  align-items: center;
}

.admin-breadcrumb-parent {
  font-size: 12.5px;
  font-weight: 500;
  color: #64748b;
  line-height: 1 !important;
}

.admin-breadcrumb-current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0 10px;
  height: 30px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #0f172a;
  line-height: 28px !important;
  transition: all 0.2s ease;
  cursor: default;
}

.admin-breadcrumb-current .anticon {
  font-size: 13px;
  display: inline-flex;
  align-items: center;
}

.admin-breadcrumb-current:hover {
  transform: translateY(-1px);
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  line-height: normal !important;
}

.admin-header-bell-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  line-height: normal !important;
  flex-shrink: 0;
}

.admin-header-bell-wrap .notification-bell-btn {
  width: 36px !important;
  height: 36px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #475569 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: pointer !important;
}

.admin-header-bell-wrap .notification-bell-btn:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #4f46e5 !important;
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.admin-header-bell-wrap .notification-bell-btn:active {
  transform: scale(0.92);
}

.admin-header-sep {
  width: 1px;
  height: 22px;
  background-color: #e2e8f0;
  margin: 0 2px;
  flex-shrink: 0;
}

.admin-user-profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 3px 10px 3px 4px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  height: 38px;
  line-height: normal !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-sizing: border-box;
}

.admin-user-profile-badge:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
}

.admin-user-profile-badge:active {
  transform: scale(0.97);
}

.admin-user-avatar {
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.admin-user-profile-badge:hover .admin-user-avatar {
  transform: scale(1.08);
}

.admin-user-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.15 !important;
  text-align: left;
}

.admin-user-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.2 !important;
  display: block;
}

.admin-user-role {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
  line-height: 1.2 !important;
}

.admin-logout-btn {
  border-radius: 8px !important;
  height: 36px !important;
  line-height: 34px !important;
  padding: 0 12px !important;
  font-weight: 500 !important;
  font-size: 12.5px !important;
  color: #475569 !important;
  border-color: #cbd5e1 !important;
  background: #ffffff !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  cursor: pointer !important;
  flex-shrink: 0;
}

.admin-logout-btn:hover {
  color: #dc2626 !important;
  border-color: #fca5a5 !important;
  background: #fef2f2 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.18) !important;
}

.admin-logout-btn:active {
  transform: scale(0.93) !important;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.2) !important;
}

/* Content Area */
.admin-content-custom {
  padding: 0 !important;
  min-height: calc(100vh - 64px) !important;
  background-color: #f8fafc !important;
}

@media (max-width: 768px) {
  .admin-header-modern { padding: 0 12px !important; }
  .admin-breadcrumb-parent, .admin-breadcrumb-sep, .admin-user-meta, .admin-header-sep { display: none; }
}
`;

const routeMeta = {
  "/admin": {
    icon: <DashboardOutlined />,
    title: "Tổng quan hệ thống",
  },
  "/admin/users": {
    icon: <TeamOutlined />,
    title: "Quản lý tài khoản",
  },
  "/admin/rooms": {
    icon: <HomeOutlined />,
    title: "Quản lý phòng trọ",
  },
  "/admin/invoices": {
    icon: <FileTextOutlined />,
    title: "Quản lý hóa đơn",
  },
  "/admin/contracts": {
    icon: <FileProtectOutlined />,
    title: "Quản lý hợp đồng",
  },
  "/admin/operating-expenses": {
    icon: <DollarOutlined />,
    title: "Quản lý chi phí",
  },
  "/admin/repair-requests": {
    icon: <ToolOutlined />,
    title: "Quản lý sự cố",
  },
  "/admin/room-requests": {
    icon: <SolutionOutlined />,
    title: "Yêu cầu thuê phòng",
  },
  "/admin/tenants": {
    icon: <UserSwitchOutlined />,
    title: "Quản lý khách thuê",
  },
};

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedKey = location.pathname.startsWith("/admin/users")
    ? "/admin/users"
    : location.pathname.startsWith("/admin/rooms")
      ? "/admin/rooms"
      : location.pathname.startsWith("/admin/invoices")
        ? "/admin/invoices"
        : location.pathname.startsWith("/admin/contracts")
          ? "/admin/contracts"
          : location.pathname.startsWith("/admin/operating-expenses")
            ? "/admin/operating-expenses"
            : location.pathname.startsWith("/admin/repair-requests")
              ? "/admin/repair-requests"
              : location.pathname.startsWith("/admin/room-requests")
                ? "/admin/room-requests"
                : location.pathname.startsWith("/admin/tenants")
                  ? "/admin/tenants"
                  : "/admin";

  const currentRoute = routeMeta[selectedKey] || {
    icon: <DashboardOutlined />,
    title: "Hệ thống quản trị",
  };

  const menuItems = [
    {
      type: "group",
      label: "TỔNG QUAN",
      children: [
        {
          key: "/admin",
          icon: <DashboardOutlined />,
          label: "Tổng quan",
          onClick: () => navigate("/admin"),
        },
      ],
    },
    {
      type: "group",
      label: "QUẢN LÝ PHÒNG & THUÊ",
      children: [
        {
          key: "/admin/rooms",
          icon: <HomeOutlined />,
          label: "Danh sách phòng",
          onClick: () => navigate("/admin/rooms"),
        },
        {
          key: "/admin/room-requests",
          icon: <SolutionOutlined />,
          label: "Yêu cầu thuê phòng",
          onClick: () => navigate("/admin/room-requests"),
        },
        {
          key: "/admin/tenants",
          icon: <UserSwitchOutlined />,
          label: "Khách thuê phòng",
          onClick: () => navigate("/admin/tenants"),
        },
        {
          key: "/admin/contracts",
          icon: <FileProtectOutlined />,
          label: "Hợp đồng thuê",
          onClick: () => navigate("/admin/contracts"),
        },
      ],
    },
    {
      type: "group",
      label: "TÀI CHÍNH & THU CHI",
      children: [
        {
          key: "/admin/invoices",
          icon: <FileTextOutlined />,
          label: "Hóa đơn tiền phòng",
          onClick: () => navigate("/admin/invoices"),
        },
        {
          key: "/admin/operating-expenses",
          icon: <DollarOutlined />,
          label: "Chi phí vận hành",
          onClick: () => navigate("/admin/operating-expenses"),
        },
      ],
    },
    {
      type: "group",
      label: "VẬN HÀNH & HỆ THỐNG",
      children: [
        {
          key: "/admin/repair-requests",
          icon: <ToolOutlined />,
          label: "Sự cố & Sửa chữa",
          onClick: () => navigate("/admin/repair-requests"),
        },
        {
          key: "/admin/users",
          icon: <TeamOutlined />,
          label: "Tài khoản hệ thống",
          onClick: () => navigate("/admin/users"),
        },
      ],
    },
  ];

  return (
    <Layout className="admin-app-shell">
      <style>{inlineStyles}</style>
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={76}
        width={256}
        className="admin-sider-modern"
      >
        <div className="admin-brand-section">
          <div className="admin-brand-logo-icon">
            <HomeOutlined />
          </div>
          {!collapsed && (
            <div className="admin-brand-text">
              <div className="admin-brand-title-wrap">
                <span className="admin-brand-title">Trọ Plus</span>
                <span className="admin-brand-badge">Admin</span>
              </div>
              <span className="admin-brand-subtitle">Quản Lý Phòng Trọ</span>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="admin-menu-modern"
          items={menuItems}
        />

        <div className="admin-sider-footer">
          <div className="admin-footer-status-box">
            <div className="admin-footer-status-info">
              <span className="admin-pulse-dot" />
              {!collapsed && <span>Hệ thống trực tuyến</span>}
            </div>
            {!collapsed && <span className="admin-footer-version">v1.0</span>}
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="admin-header-modern">
          <div className="admin-header-left">
            <Tooltip title={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}>
              <Button
                className="admin-toggle-btn"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            </Tooltip>

            <div className="admin-header-divider" />

            <div className="admin-header-breadcrumb-wrap">
              <span className="admin-breadcrumb-home" onClick={() => navigate("/admin")}>
                <HomeOutlined />
              </span>
              <span className="admin-breadcrumb-sep">
                <RightOutlined />
              </span>
              <span className="admin-breadcrumb-parent">Quản trị</span>
              <span className="admin-breadcrumb-sep">
                <RightOutlined />
              </span>
              <span className="admin-breadcrumb-current">
                {currentRoute.icon}
                {currentRoute.title}
              </span>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-header-bell-wrap">
              <NotificationBell />
            </div>

            <div className="admin-header-sep" />

            <div className="admin-user-profile-badge">
              <Avatar
                className="admin-user-avatar"
                size={28}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 12,
                }}
                icon={<UserOutlined />}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </Avatar>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user?.name || "Quản trị viên"}</span>
                <span className="admin-user-role">
                  <CrownFilled style={{ color: "#d97706", fontSize: 10 }} />
                  Admin
                </span>
              </div>
            </div>

            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="admin-logout-btn"
            >
              Đăng xuất
            </Button>
          </div>
        </Header>

        <Content className="admin-content-custom">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
