import {
  BankOutlined,
  DashboardOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Space, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const { Content, Header, Sider } = Layout;

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedKey = location.pathname.startsWith("/admin/users")
    ? "/admin/users"
    : location.pathname.startsWith("/admin/buildings")
      ? "/admin/buildings"
      : location.pathname.startsWith("/admin/rooms")
        ? "/admin/rooms"
        : location.pathname.startsWith("/admin/tenants")
          ? "/admin/tenants"
      : "/admin";

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth="0" className="admin-sider">
        <div className="admin-logo">Tro Plus Admin</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: "/admin",
              icon: <DashboardOutlined />,
              label: "Tong quan",
              onClick: () => navigate("/admin"),
            },
            {
              key: "/admin/users",
              icon: <TeamOutlined />,
              label: "Quan ly tai khoan",
              onClick: () => navigate("/admin/users"),
            },
            {
              key: "/admin/buildings",
              icon: <BankOutlined />,
              label: "Quan ly toa nha",
              onClick: () => navigate("/admin/buildings"),
            },
            {
              key: "/admin/rooms",
              icon: <HomeOutlined />,
              label: "Quan ly phong",
              onClick: () => navigate("/admin/rooms"),
            },
            {
              key: "/admin/tenants",
              icon: <UserSwitchOutlined />,
              label: "Quan ly khach thue",
              onClick: () => navigate("/admin/tenants"),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="brand">Tro Plus</div>
          <Space>
            <Typography.Text className="header-user">{user?.name}</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Dang xuat
            </Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
