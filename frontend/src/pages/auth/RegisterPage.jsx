import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const { isAdmin, register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (values) => {
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await register(values);
      const redirect = searchParams.get("redirect");
      navigate(data.role === "admin" ? "/admin" : redirect || "/user");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Dang ky that bai. Vui long thu lai.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to={isAdmin ? "/admin" : searchParams.get("redirect") || "/user"} replace />;
  }

  return (
    <div className="auth-page">
      <Card className="auth-card auth-card-narrow">
        <Space direction="vertical" size={6} className="auth-title">
          <Typography.Text className="auth-eyebrow">Tro Plus</Typography.Text>
          <Typography.Title level={2}>Dang ky tai khoan</Typography.Title>
          <Typography.Text type="secondary">
            Tao tai khoan nguoi dung de su dung cac tinh nang phia khach thue.
          </Typography.Text>
        </Space>

        {errorMessage ? (
          <Alert className="auth-alert" type="error" message={errorMessage} showIcon />
        ) : null}

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} size="large">
          <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Nguyen Van A" autoComplete="name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="Mat khau" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Toi thieu 6 ky tu" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="phone" label="So dien thoai">
            <Input prefix={<PhoneOutlined />} autoComplete="tel" />
          </Form.Item>
          <Form.Item name="identityNumber" label="So CCCD/CMND">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Dia chi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Dang ky
          </Button>
        </Form>

        <Typography.Paragraph className="auth-register-link">
          Da co tai khoan? <Link to={`/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect"))}` : ""}`}>Dang nhap</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};

export default RegisterPage;
