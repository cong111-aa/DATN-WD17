import { Button, Card, Form, Input, Typography, message } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { isAdmin, login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const data = await login(values);
      navigate(data.role === "admin" ? "/admin" : "/user");
    } catch (error) {
      message.error(error.response?.data?.message || "Dang nhap that bai");
    }
  };

  if (user) {
    return <Navigate to={isAdmin ? "/admin" : "/user"} replace />;
  }

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={2}>Dang nhap</Typography.Title>
        <Typography.Paragraph type="secondary">
          Admin dang nhap de tao tai khoan nguoi thue.
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Mat khau" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Dang nhap
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
