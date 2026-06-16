import { LogoutOutlined } from "@ant-design/icons";
import { Button, Card, Layout, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const AdminHomePage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand">Tro Plus Admin</div>
        <Space>
          <Typography.Text className="header-user">{user?.name}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Dang xuat
          </Button>
        </Space>
      </Header>
      <Content className="app-content">
        <Card>
          <Typography.Title level={3}>Trang quan tri</Typography.Title>
          <Typography.Paragraph type="secondary">
            Dang nhap admin thanh cong. Cac chuc nang quan ly se duoc phat trien rieng o cac buoc tiep theo.
          </Typography.Paragraph>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminHomePage;