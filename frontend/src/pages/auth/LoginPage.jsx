import {
  HomeOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { isAdmin, login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async ({ email, password }) => {
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await login({ email, password });
      const redirect = searchParams.get("redirect");
      navigate(data.role === "admin" ? "/admin" : redirect || "/user");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to={isAdmin ? "/admin" : searchParams.get("redirect") || "/user"} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-hero">
          <div className="auth-badge">
            <SafetyCertificateOutlined />
            <span>Tro Plus</span>
          </div>

          <Typography.Title level={1}>Quản lý nhà trọ gọn gàng hơn.</Typography.Title>
          <Typography.Paragraph>
            Theo dõi người thuê, hồ sơ phòng và thông tin vận hành trong một không gian
            làm việc rõ ràng, dễ kiểm soát.
          </Typography.Paragraph>

          <div className="auth-stats" aria-label="Tổng quan hệ thống">
            <div>
              <HomeOutlined />
              <span>Phòng trọ</span>
            </div>
            <div>
              <TeamOutlined />
              <span>Người thuê</span>
            </div>
            <div>
              <SafetyCertificateOutlined />
              <span>Bảo mật</span>
            </div>
          </div>
        </div>

        <Card className="auth-card">
          <Space direction="vertical" size={6} className="auth-title">
            <Typography.Text className="auth-eyebrow">Xin chào trở lại</Typography.Text>
            <Typography.Title level={2}>Đăng nhập</Typography.Title>
            <Typography.Text type="secondary">
              Sử dụng tài khoản đã được cấp để vào hệ thống quản lý.
            </Typography.Text>
          </Space>

          {errorMessage ? (
            <Alert className="auth-alert" type="error" message={errorMessage} showIcon />
          ) : null}

          <Form
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            size="large"
            initialValues={{ remember: true }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" className="auth-options">
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng nhập
            </Button>
          </Form>

          <Typography.Paragraph className="auth-register-link">
            Chua co tai khoan? <Link to={`/register${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect"))}` : ""}`}>Dang ky ngay</Link>
          </Typography.Paragraph>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
