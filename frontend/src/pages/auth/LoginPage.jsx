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

const inlineStyles = `
/* Modern Typography & Styling for Login Page */
.auth-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  color: #5eead4;
  backdrop-filter: blur(10px);
  letter-spacing: 0.5px;
  margin-bottom: 20px;
}

.auth-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #2dd4bf;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7);
  animation: authPulse 2s infinite;
}

@keyframes authPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(45, 212, 191, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
}

.auth-hero-title {
  font-size: 38px !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  line-height: 1.25 !important;
  letter-spacing: -0.8px;
  margin: 0 0 16px 0 !important;
}

.auth-hero-title .highlight-text {
  background: linear-gradient(135deg, #2dd4bf 0%, #a7f3d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-hero-desc {
  color: #e2e8f0 !important;
  font-size: 15.5px !important;
  line-height: 1.65 !important;
  max-width: 520px;
  margin-bottom: 28px !important;
}

.auth-stats-grid {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.auth-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 600;
  font-size: 13.5px;
  transition: all 0.25s ease;
}

.auth-stat-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.35);
}

.auth-stat-item .anticon {
  font-size: 16px;
  color: #5eead4;
}

.auth-eyebrow {
  color: #0d9488 !important;
  font-weight: 700 !important;
  font-size: 11.5px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.8px !important;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.auth-card-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  margin: 0 !important;
  letter-spacing: -0.4px;
}

.auth-card-subtitle {
  color: #64748b !important;
  font-size: 13.5px !important;
  line-height: 1.5 !important;
}

.auth-submit-btn {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
  border: none !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(15, 118, 110, 0.35) !important;
  transition: all 0.2s ease !important;
}

.auth-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(15, 118, 110, 0.45) !important;
  opacity: 0.95;
}

.auth-submit-btn:active {
  transform: scale(0.98);
}

.auth-register-footer {
  margin-top: 20px !important;
  text-align: center;
  color: #64748b !important;
  font-size: 13.5px !important;
}

.auth-register-footer a {
  color: #0f766e !important;
  font-weight: 700;
  margin-left: 5px;
  transition: color 0.15s ease;
}

.auth-register-footer a:hover {
  color: #0d9488 !important;
  text-decoration: underline;
}
`;

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
      setErrorMessage(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to={isAdmin ? "/admin" : searchParams.get("redirect") || "/user"} replace />;
  }

  return (
    <div className="auth-page">
      <style>{inlineStyles}</style>
      <div className="auth-wrap">
        {/* Left Hero Content */}
        <div className="auth-hero">
          <div className="auth-hero-badge">
            <span className="pulse-dot" />
            <SafetyCertificateOutlined />
            <span>Trọ Plus • Nền Tảng Quản Lý Thông Minh</span>
          </div>

          <Typography.Title level={1} className="auth-hero-title">
            Quản lý phòng trọ <span className="highlight-text">thông minh & tối ưu</span> hơn mỗi ngày.
          </Typography.Title>

          <Typography.Paragraph className="auth-hero-desc">
            Theo dõi khách thuê, quản lý hợp đồng, hóa đơn và vận hành phòng trọ toàn diện trong một không gian làm việc chuyên nghiệp, minh bạch và an toàn.
          </Typography.Paragraph>

          <div className="auth-stats-grid" aria-label="Tổng quan hệ thống">
            <div className="auth-stat-item">
              <HomeOutlined />
              <span>Phòng trọ & Tiện ích</span>
            </div>
            <div className="auth-stat-item">
              <TeamOutlined />
              <span>Khách thuê & Cư dân</span>
            </div>
            <div className="auth-stat-item">
              <SafetyCertificateOutlined />
              <span>Bảo mật & An toàn</span>
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <Card className="auth-card">
          <Space direction="vertical" size={6} className="auth-title" style={{ width: "100%", marginBottom: 16 }}>
            <span className="auth-eyebrow">Hệ thống quản lý</span>
            <Typography.Title level={2} className="auth-card-title">
              Đăng nhập tài khoản
            </Typography.Title>
            <Typography.Text className="auth-card-subtitle">
              Sử dụng tài khoản đã đăng ký để truy cập hệ thống quản lý Trọ Plus.
            </Typography.Text>
          </Space>

          {errorMessage ? (
            <Alert
              className="auth-alert"
              type="error"
              message={errorMessage}
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
            />
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
              label="Địa chỉ Email"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ email" },
                { type: "email", message: "Địa chỉ email không đúng định dạng" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Nhập email của bạn (ví dụ: admin@example.com)"
                autoComplete="email"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Nhập mật khẩu truy cập"
                autoComplete="current-password"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" className="auth-options">
              <Checkbox>Ghi nhớ phiên đăng nhập</Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="auth-submit-btn"
            >
              Đăng nhập ngay
            </Button>
          </Form>

          <Typography.Paragraph className="auth-register-footer">
            Chưa có tài khoản?{" "}
            <Link
              to={`/register${
                searchParams.get("redirect")
                  ? `?redirect=${encodeURIComponent(searchParams.get("redirect"))}`
                  : ""
              }`}
            >
              Đăng ký tài khoản mới
            </Link>
          </Typography.Paragraph>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
