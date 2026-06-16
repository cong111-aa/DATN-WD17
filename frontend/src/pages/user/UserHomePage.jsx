import { LogoutOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Layout, Space, Typography, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const UserHomePage = () => {
  const [form] = Form.useForm();
  const { logout, refreshProfile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    form.setFieldsValue(user);
  }, [form, user]);

  const handleUpdate = async (values) => {
    try {
      await http.put("/auth/profile", values);
      await refreshProfile();
      message.success("Da cap nhat thong tin");
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat that bai");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand">Tro Plus</div>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Dang xuat</Button>
      </Header>
      <Content className="app-content">
        <Space direction="vertical" size={16} className="page-stack">
          <Card>
            <Typography.Title level={3}>Thong tin ca nhan</Typography.Title>
            <Typography.Paragraph type="secondary">
              Tai khoan nguoi thue duoc tao boi admin.
            </Typography.Paragraph>
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
              <div className="form-grid">
                <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="email" label="Email">
                  <Input disabled />
                </Form.Item>
                <Form.Item name="phone" label="So dien thoai">
                  <Input />
                </Form.Item>
                <Form.Item name="identityNumber" label="So CCCD/CMND">
                  <Input />
                </Form.Item>
                <Form.Item name="identityFrontImage" label="Anh mat truoc CCCD">
                  <Input placeholder="URL hoac duong dan anh" />
                </Form.Item>
                <Form.Item name="identityBackImage" label="Anh mat sau CCCD">
                  <Input placeholder="URL hoac duong dan anh" />
                </Form.Item>
              </div>
              <Form.Item name="address" label="Dia chi">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="password" label="Mat khau moi">
                <Input.Password placeholder="De trong neu khong doi" />
              </Form.Item>
              <Button type="primary" htmlType="submit">Luu thong tin</Button>
            </Form>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default UserHomePage;
