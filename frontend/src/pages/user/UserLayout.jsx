import {
  CreditCardOutlined,
  DownOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  LogoutOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;
const { Text } = Typography;

const UserLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [pendingRepairCount, setPendingRepairCount] = useState(0);
  const [activeTenanciesCount, setActiveTenanciesCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!user) return;
    const fetchQuickCounts = async () => {
      try {
        const [invRes, repairRes, tenancyRes] = await Promise.all([
          http.get("/me/invoices"),
          http.get("/me/repair-requests"),
          http.get("/me/tenancies"),
        ]);
        const unpaid = (invRes.data || []).filter((inv) => inv.status === "unpaid" || inv.status === "overdue").length;
        const pending = (repairRes.data || []).filter((req) => req.status === "pending" || req.status === "processing").length;
        const active = (tenancyRes.data || []).filter((t) => t.status === "active").length;
        setUnpaidInvoicesCount(unpaid);
        setPendingRepairCount(pending);
        setActiveTenanciesCount(active);
      } catch (err) {
        // silent fail
      }
    };
    fetchQuickCounts();
  }, [user]);

  const activePath = location.pathname;

  const userMenuItems = [
    {
      key: "user-header",
      label: (
        <div style={{ padding: "6px 8px 10px 8px" }}>
          <Text strong style={{ fontSize: 15, display: "block", color: "#0f172a" }}>
            {user?.name || "Khách hàng"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {user?.email}
          </Text>
          {activeTenanciesCount > 0 && (
            <Tag color="success" style={{ marginTop: 6, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
              Đang thuê {activeTenanciesCount} phòng
            </Tag>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "home",
      icon: <HomeOutlined style={{ color: "#0d9488", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user" ? 700 : 500 }}>Trang tổng quan</span>,
      onClick: () => navigate("/user"),
    },
    {
      key: "rooms",
      icon: <HomeOutlined style={{ color: "#0d9488", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user/my-rooms" ? 700 : 500 }}>Phòng của tôi</span>,
      onClick: () => navigate("/user/my-rooms"),
    },
    {
      key: "contracts",
      icon: <FileProtectOutlined style={{ color: "#2563eb", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user/contracts" ? 700 : 500 }}>Hợp đồng</span>,
      onClick: () => navigate("/user/contracts"),
    },
    {
      key: "invoices",
      icon: <FileTextOutlined style={{ color: "#d97706", fontSize: 16 }} />,
      label: (
        <Space size={8}>
          <span style={{ fontWeight: activePath === "/user/invoices" ? 700 : 500 }}>Hóa đơn</span>
          {unpaidInvoicesCount > 0 && (
            <Tag color="error" style={{ borderRadius: 10, fontSize: 11, padding: "0 6px" }}>
              {unpaidInvoicesCount} chưa TT
            </Tag>
          )}
        </Space>
      ),
      onClick: () => navigate("/user/invoices"),
    },
    {
      key: "repair-requests",
      icon: <ToolOutlined style={{ color: "#e11d48", fontSize: 16 }} />,
      label: (
        <Space size={8}>
          <span style={{ fontWeight: activePath === "/user/repair-requests" ? 700 : 500 }}>Báo sự cố</span>
          {pendingRepairCount > 0 && (
            <Tag color="warning" style={{ borderRadius: 10, fontSize: 11, padding: "0 6px" }}>
              {pendingRepairCount}
            </Tag>
          )}
        </Space>
      ),
      onClick: () => navigate("/user/repair-requests"),
    },
    {
      key: "room-requests",
      icon: <CreditCardOutlined style={{ color: "#0284c7", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user/room-requests" ? 700 : 500 }}>Yêu cầu & Cọc</span>,
      onClick: () => navigate("/user/room-requests"),
    },
    {
      key: "interested-rooms",
      icon: <HeartOutlined style={{ color: "#e11d48", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user/interested-rooms" ? 700 : 500 }}>Phòng yêu thích</span>,
      onClick: () => navigate("/user/interested-rooms"),
    },
    {
      key: "profile",
      icon: <UserOutlined style={{ color: "#4f46e5", fontSize: 16 }} />,
      label: <span style={{ fontWeight: activePath === "/user/profile" ? 700 : 500 }}>Hồ sơ cá nhân</span>,
      onClick: () => navigate("/user/profile"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "#ef4444", fontSize: 16 }} />,
      label: <span style={{ color: "#ef4444", fontWeight: 600 }}>Đăng xuất</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand" onClick={() => navigate("/")}>
          <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
          <span>TRO PLUS</span>
          <span className="brand-badge">Tenant Portal</span>
        </div>
        <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight" overlayClassName="user-header-dropdown">
          <div className="user-profile-trigger">
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{ background: "#0f766e", cursor: "pointer" }}
            />
            <div className="user-profile-info">
              <span className="user-profile-name">{user?.name || "Khách hàng"}</span>
              <span className="user-profile-role">Người thuê trọ</span>
            </div>
            <DownOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
          </div>
        </Dropdown>
      </Header>
      <Content className="app-content">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default UserLayout;
