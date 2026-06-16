import {
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
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
