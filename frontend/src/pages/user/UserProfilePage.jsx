import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateFilled,
  SafetyCertificateOutlined,
  ToolOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Progress,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toImageUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${apiOrigin}${url}`;
};

const formatCurrency = (val) => `${Number(val || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (val) => (val ? new Date(val).toLocaleDateString("vi-VN") : "-");

const UserProfilePage = () => {
  const [personalForm] = Form.useForm();
  const [identityForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "personal";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { refreshProfile, user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Summary counts and tenancies
  const [tenancies, setTenancies] = useState([]);
  const [contractsCount, setContractsCount] = useState(0);
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

  // Load summary data
  useEffect(() => {
    const fetchPortalSummary = async () => {
      setDataLoading(true);
      try {
        const [tenRes, conRes, invRes] = await Promise.allSettled([
          http.get("/me/tenancies"),
          http.get("/me/contracts"),
          http.get("/me/invoices"),
        ]);

        if (tenRes.status === "fulfilled") {
          setTenancies(tenRes.value.data || []);
        }
        if (conRes.status === "fulfilled") {
          const contracts = conRes.value.data || [];
          setContractsCount(contracts.filter((c) => c.status === "active").length);
        }
        if (invRes.status === "fulfilled") {
          const invoices = invRes.value.data || [];
          setUnpaidInvoicesCount(
            invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length
          );
        }
      } catch (err) {
        // quiet error
      } finally {
        setDataLoading(false);
      }
    };

    fetchPortalSummary();
  }, []);

  // Sync user info into forms
  useEffect(() => {
    if (user) {
      personalForm.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });

      identityForm.setFieldsValue({
        identityNumber: user.identityNumber || "",
        identityFrontImage: user.identityFrontImage || "",
        identityBackImage: user.identityBackImage || "",
      });
    }
  }, [user, personalForm, identityForm]);

  // Tab sync with URL
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Completion calculation
  const profileCompletion = useMemo(() => {
    let score = 0;
    if (user?.name?.trim()) score += 15;
    if (user?.email?.trim()) score += 15;
    if (user?.phone?.trim()) score += 15;
    if (user?.address?.trim()) score += 15;
    if (user?.identityNumber?.trim()) score += 15;
    if (user?.identityFrontImage?.trim()) score += 12.5;
    if (user?.identityBackImage?.trim()) score += 12.5;
    return Math.round(score);
  }, [user]);

  const isIdentityVerified = Boolean(
    user?.identityNumber && user?.identityFrontImage && user?.identityBackImage
  );

  // Avatar Upload
  const handleAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const { data } = await http.post("/uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = data.url || data.urls?.[0];

      await http.put("/me/profile", { avatar: avatarUrl });
      message.success("Cập nhật ảnh đại diện thành công!");
      await refreshProfile();
      onSuccess(data);
    } catch (err) {
      message.error(err.response?.data?.message || "Tải ảnh đại diện thất bại");
      onError(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // CCCD Image Upload handler
  const uploadIdentityImage = async (file, type) => {
    const formData = new FormData();
    formData.append("images", file);

    if (type === "front") setUploadingFront(true);
    else setUploadingBack(true);

    try {
      const { data } = await http.post("/uploads/identity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = data.urls?.[0] || data.url;

      if (type === "front") {
        identityForm.setFieldValue("identityFrontImage", uploadedUrl);
      } else {
        identityForm.setFieldValue("identityBackImage", uploadedUrl);
      }
      message.success(`Đã tải ảnh CCCD ${type === "front" ? "mặt trước" : "mặt sau"} thành công`);
    } catch (err) {
      message.error(err.response?.data?.message || "Tải ảnh CCCD thất bại");
    } finally {
      if (type === "front") setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  // Submit personal info
  const handleSavePersonalInfo = async (values) => {
    setLoading(true);
    try {
      await http.put("/me/profile", {
        name: values.name,
        phone: values.phone,
        address: values.address,
      });
      message.success("Lưu thông tin cá nhân thành công!");
      await refreshProfile();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thông tin thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Submit identity info
  const handleSaveIdentityInfo = async (values) => {
    setLoading(true);
    try {
      await http.put("/me/profile", {
        identityNumber: values.identityNumber,
        identityFrontImage: values.identityFrontImage,
        identityBackImage: values.identityBackImage,
      });
      message.success("Cập nhật thông tin CCCD định danh thành công!");
      await refreshProfile();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật CCCD thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Submit password change
  const handleSavePassword = async (values) => {
    setLoading(true);
    try {
      await http.put("/me/profile", {
        password: values.password,
      });
      message.success("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.");
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Mask identity number
  const maskedIdentity = useMemo(() => {
    if (!user?.identityNumber) return "Chưa cập nhật";
    const str = String(user.identityNumber);
    if (str.length <= 4) return str;
    return `${str.slice(0, 4)} **** ${str.slice(-4)}`;
  }, [user?.identityNumber]);

  return (
    <div className="profile-page-container">
      {/* 1. HERO HEADER BANNER */}
      <div className="profile-hero-card">
        <div className="profile-hero-banner">
          <div className="profile-hero-nav">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/user")}
              style={{ color: "#ffffff", background: "rgba(255,255,255,0.15)", borderRadius: 8 }}
            >
              Quay lại Trang chính
            </Button>
            <Tag color="#0f766e" style={{ border: "1px solid rgba(255,255,255,0.3)", padding: "4px 10px", borderRadius: 6, color: "#ffffff", fontWeight: 600 }}>
              Cổng khách thuê trọ • Tenant Portal
            </Tag>
          </div>
        </div>

        <div className="profile-hero-body">
          <div className="profile-avatar-wrapper">
            {user?.avatar ? (
              <img
                src={toImageUrl(user.avatar)}
                alt={user.name}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-img">
                {user?.name?.[0]?.toUpperCase() || <UserOutlined />}
              </div>
            )}
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={handleAvatarUpload}
              disabled={uploadingAvatar}
            >
              <Tooltip title="Đổi ảnh đại diện">
                <button type="button" className="profile-avatar-upload-btn">
                  {uploadingAvatar ? <Spin size="small" /> : <CameraOutlined style={{ fontSize: 15 }} />}
                </button>
              </Tooltip>
            </Upload>
          </div>

          <div className="profile-header-details">
            <div className="profile-header-name">
              <span>{user?.name || "Người dùng TroPlus"}</span>
              {isIdentityVerified ? (
                <Tooltip title="Tài khoản đã hoàn tất định danh CCCD">
                  <SafetyCertificateFilled style={{ color: "#0d9488", fontSize: 20 }} />
                </Tooltip>
              ) : (
                <Tooltip title="Hồ sơ chưa hoàn thiện CCCD">
                  <Tag color="warning" style={{ borderRadius: 6, fontWeight: 600 }}>Chưa định danh CCCD</Tag>
                </Tooltip>
              )}
            </div>

            <div className="profile-header-chips">
              <span className="profile-header-chip">
                <MailOutlined style={{ color: "#0f766e" }} />
                {user?.email || "Chưa có email"}
              </span>
              <span className="profile-header-chip">
                <PhoneOutlined style={{ color: "#0284c7" }} />
                {user?.phone || "Chưa cập nhật SĐT"}
              </span>
              <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                {user?.role === "admin" ? "Quản trị viên" : "Khách thuê phòng"}
              </Tag>
              <Tag color="success" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                Đang hoạt động
              </Tag>
            </div>
          </div>

          <div className="profile-completion-box">
            <div className="profile-completion-header">
              <span>Độ hoàn thiện hồ sơ</span>
              <span style={{ color: profileCompletion === 100 ? "#0f766e" : "#d97706", fontWeight: 700 }}>
                {profileCompletion}%
              </span>
            </div>
            <Progress
              percent={profileCompletion}
              showInfo={false}
              strokeColor={profileCompletion === 100 ? "#0f766e" : "#f59e0b"}
              trailColor="#e2e8f0"
              style={{ marginBottom: 6 }}
            />
            <Text type="secondary" style={{ fontSize: 11.5, display: "block" }}>
              {profileCompletion === 100
                ? "Tuyệt vời! Hồ sơ của bạn đã đầy đủ để làm hợp đồng pháp lý."
                : "Cập nhật đầy đủ CCCD để thuận tiện ký hợp đồng thuê trọ điện tử."}
            </Text>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="profile-stats-grid">
        <div
          className="profile-stat-card"
          onClick={() => handleTabChange("identity")}
        >
          <div className="profile-stat-icon-wrap" style={{ background: isIdentityVerified ? "#f0fdf4" : "#fef3c7", color: isIdentityVerified ? "#16a34a" : "#d97706" }}>
            <IdcardOutlined />
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value" style={{ fontSize: 16 }}>
              {isIdentityVerified ? "Đã định danh" : "Chưa đủ giấy tờ"}
            </div>
            <div className="profile-stat-label">Số: {maskedIdentity}</div>
          </div>
        </div>

        <div
          className="profile-stat-card"
          onClick={() => navigate("/user/my-rooms")}
        >
          <div className="profile-stat-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
            <HomeOutlined />
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value">{tenancies.length}</div>
            <div className="profile-stat-label">Phòng đang thuê</div>
          </div>
        </div>

        <div
          className="profile-stat-card"
          onClick={() => navigate("/user/contracts")}
        >
          <div className="profile-stat-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <FileProtectOutlined />
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value">{contractsCount}</div>
            <div className="profile-stat-label">Hợp đồng hiệu lực</div>
          </div>
        </div>

        <div
          className="profile-stat-card"
          onClick={() => navigate("/user/invoices")}
        >
          <div className="profile-stat-icon-wrap" style={{ background: unpaidInvoicesCount > 0 ? "#fff1f2" : "#f0fdf4", color: unpaidInvoicesCount > 0 ? "#e11d48" : "#16a34a" }}>
            <FileTextOutlined />
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value" style={{ color: unpaidInvoicesCount > 0 ? "#e11d48" : "#0f172a" }}>
              {unpaidInvoicesCount}
            </div>
            <div className="profile-stat-label">
              {unpaidInvoicesCount > 0 ? "Hóa đơn cần thanh toán" : "0 hóa đơn quá hạn"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN TABS & DETAILED SETTINGS */}
      <div className="profile-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="profile-custom-tabs"
          items={[
            {
              key: "personal",
              label: (
                <span>
                  <UserOutlined /> Thông tin cá nhân
                </span>
              ),
              children: (
                <div>
                  <div className="profile-section-title">
                    <UserOutlined style={{ color: "#0f766e" }} />
                    Thông tin tài khoản & Liên hệ
                  </div>
                  <div className="profile-section-desc">
                    Quản lý thông tin họ tên, số điện thoại và địa chỉ thường trú liên kết với tài khoản thuê trọ của bạn.
                  </div>

                  <Form
                    form={personalForm}
                    layout="vertical"
                    onFinish={handleSavePersonalInfo}
                    autoComplete="off"
                  >
                    <div className="profile-form-grid">
                      <Form.Item
                        name="name"
                        label="Họ và tên người thuê"
                        rules={[
                          { required: true, message: "Vui lòng nhập họ và tên" },
                          { min: 2, message: "Họ và tên tối thiểu 2 ký tự" },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          style={{ borderRadius: 8 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="email"
                        label={
                          <Space>
                            <span>Email đăng nhập</span>
                            <Tag color="cyan" style={{ fontSize: 11, borderRadius: 4 }}>Cố định</Tag>
                          </Space>
                        }
                        tooltip="Email được sử dụng để xác thực tài khoản và gửi hóa đơn, không thể thay đổi trực tiếp."
                      >
                        <Input
                          size="large"
                          disabled
                          prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
                          style={{ borderRadius: 8, background: "#f8fafc" }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="phone"
                        label="Số điện thoại liên hệ"
                        rules={[
                          { required: true, message: "Vui lòng nhập số điện thoại" },
                          {
                            pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
                            message: "Số điện thoại không đúng định dạng VN (10 chữ số)",
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />}
                          placeholder="Ví dụ: 0987654321"
                          style={{ borderRadius: 8 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="address"
                        label="Địa chỉ thường trú (theo hộ khẩu/CCCD)"
                        rules={[{ required: true, message: "Vui lòng nhập địa chỉ thường trú" }]}
                      >
                        <Input
                          size="large"
                          prefix={<HomeOutlined style={{ color: "#94a3b8" }} />}
                          placeholder="Ví dụ: Xã/Phường, Huyện/Quận, Tỉnh/Thành phố"
                          style={{ borderRadius: 8 }}
                        />
                      </Form.Item>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <Alert
                        type="info"
                        showIcon
                        message="Lưu ý quan trọng khi ký hợp đồng"
                        description="Họ tên và địa chỉ thường trú sẽ được dùng trực tiếp để điền vào Hợp đồng thuê nhà và đăng ký tạm trú với công an khu vực. Hãy đảm bảo thông tin chính xác theo Căn cước công dân."
                        style={{ borderRadius: 10, marginBottom: 24 }}
                      />

                      <div style={{ display: "flex", gap: 12 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={loading}
                          style={{
                            background: "#0f766e",
                            borderColor: "#0f766e",
                            borderRadius: 8,
                            fontWeight: 700,
                            paddingLeft: 32,
                            paddingRight: 32,
                          }}
                        >
                          Lưu thông tin cá nhân
                        </Button>
                        <Button
                          size="large"
                          onClick={() => personalForm.resetFields()}
                          style={{ borderRadius: 8 }}
                        >
                          Đặt lại
                        </Button>
                      </div>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: "identity",
              label: (
                <span>
                  <IdcardOutlined /> Định danh CCCD {isIdentityVerified && <CheckCircleFilled style={{ color: "#10b981", fontSize: 13, marginLeft: 4 }} />}
                </span>
              ),
              children: (
                <div>
                  <div className="profile-section-title">
                    <SafetyCertificateOutlined style={{ color: "#0f766e" }} />
                    Thông tin Định danh Căn cước công dân (eKYC)
                  </div>
                  <div className="profile-section-desc">
                    Tải lên hình ảnh 2 mặt CCCD / CMND để ban quản lý xác minh danh tính và xuất hợp đồng điện tử pháp lý.
                  </div>

                  {isIdentityVerified ? (
                    <Alert
                      type="success"
                      showIcon
                      message="Hồ sơ định danh đã hoàn tất"
                      description={`Số CCCD ${maskedIdentity} đã được cập nhật đầy đủ cùng ảnh mặt trước và mặt sau.`}
                      style={{ borderRadius: 10, marginBottom: 24 }}
                    />
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      message="Hồ sơ định danh chưa hoàn tất"
                      description="Vui lòng cung cấp số CCCD và ảnh chụp 2 mặt rõ nét để chủ nhà có thể tạo hợp đồng thuê chính thức cho bạn."
                      style={{ borderRadius: 10, marginBottom: 24 }}
                    />
                  )}

                  {/* Guidance */}
                  <div className="identity-guidance-card">
                    <div className="identity-guidance-title">
                      <InfoCircleOutlined />
                      Hướng dẫn tải ảnh CCCD đạt chuẩn:
                    </div>
                    <ul className="identity-guidance-list">
                      <li>Chụp thẳng góc, đầy đủ 4 cạnh của thẻ CCCD, không bị mất góc hay che khuất thông tin.</li>
                      <li>Hình ảnh rõ nét, không bị mờ nhòe, không bị lóa ánh đèn flash vào họ tên hoặc số CCCD.</li>
                      <li>Chỉ sử dụng ảnh gốc chụp từ camera, không qua chỉnh sửa tẩy xóa hoặc làm sai lệch nội dung.</li>
                    </ul>
                  </div>

                  <Form
                    form={identityForm}
                    layout="vertical"
                    onFinish={handleSaveIdentityInfo}
                    autoComplete="off"
                  >
                    <Form.Item
                      name="identityNumber"
                      label="Số Căn cước công dân (CCCD / CMND 12 số)"
                      rules={[
                        { required: true, message: "Vui lòng nhập số CCCD" },
                        { pattern: /^[0-9]{9,12}$/, message: "Số CCCD/CMND phải gồm 9 đến 12 chữ số" },
                      ]}
                      style={{ maxWidth: 500 }}
                    >
                      <Input
                        size="large"
                        maxLength={12}
                        prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />}
                        placeholder="Nhập 12 chữ số trên thẻ CCCD gắn chip"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    {/* Hidden Form Items for URLs */}
                    <Form.Item name="identityFrontImage" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="identityBackImage" hidden>
                      <Input />
                    </Form.Item>

                    {/* Visual Identity Image Cards */}
                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        const frontUrl = identityForm.getFieldValue("identityFrontImage");
                        const backUrl = identityForm.getFieldValue("identityBackImage");

                        return (
                          <div className="identity-cards-row">
                            {/* FRONT IMAGE CARD */}
                            <div className={`identity-card-box ${frontUrl ? "has-image" : ""}`}>
                              <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>1. Mặt trước CCCD</span>
                                {frontUrl && <Tag color="success">Đã tải lên</Tag>}
                              </div>

                              {frontUrl ? (
                                <div>
                                  <Image
                                    src={toImageUrl(frontUrl)}
                                    alt="CCCD Mặt trước"
                                    className="identity-img-preview"
                                    preview={{ mask: <><EyeOutlined /> Phóng to</> }}
                                  />
                                  <div className="identity-actions-bar">
                                    <Upload
                                      accept="image/*"
                                      showUploadList={false}
                                      customRequest={({ file }) => uploadIdentityImage(file, "front")}
                                      disabled={uploadingFront}
                                    >
                                      <Button icon={<UploadOutlined />} size="small" loading={uploadingFront}>
                                        Đổi ảnh khác
                                      </Button>
                                    </Upload>
                                    <Button
                                      danger
                                      icon={<DeleteOutlined />}
                                      size="small"
                                      onClick={() => identityForm.setFieldValue("identityFrontImage", "")}
                                    >
                                      Xóa
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ padding: "30px 10px" }}>
                                  <IdcardOutlined style={{ fontSize: 44, color: "#94a3b8", marginBottom: 12 }} />
                                  <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                                    Chưa có ảnh mặt trước
                                  </div>
                                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                                    Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)
                                  </div>
                                  <Upload
                                    accept="image/*"
                                    showUploadList={false}
                                    customRequest={({ file }) => uploadIdentityImage(file, "front")}
                                    disabled={uploadingFront}
                                  >
                                    <Button
                                      type="primary"
                                      icon={<UploadOutlined />}
                                      loading={uploadingFront}
                                      style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}
                                    >
                                      Tải ảnh mặt trước
                                    </Button>
                                  </Upload>
                                </div>
                              )}
                            </div>

                            {/* BACK IMAGE CARD */}
                            <div className={`identity-card-box ${backUrl ? "has-image" : ""}`}>
                              <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>2. Mặt sau CCCD</span>
                                {backUrl && <Tag color="success">Đã tải lên</Tag>}
                              </div>

                              {backUrl ? (
                                <div>
                                  <Image
                                    src={toImageUrl(backUrl)}
                                    alt="CCCD Mặt sau"
                                    className="identity-img-preview"
                                    preview={{ mask: <><EyeOutlined /> Phóng to</> }}
                                  />
                                  <div className="identity-actions-bar">
                                    <Upload
                                      accept="image/*"
                                      showUploadList={false}
                                      customRequest={({ file }) => uploadIdentityImage(file, "back")}
                                      disabled={uploadingBack}
                                    >
                                      <Button icon={<UploadOutlined />} size="small" loading={uploadingBack}>
                                        Đổi ảnh khác
                                      </Button>
                                    </Upload>
                                    <Button
                                      danger
                                      icon={<DeleteOutlined />}
                                      size="small"
                                      onClick={() => identityForm.setFieldValue("identityBackImage", "")}
                                    >
                                      Xóa
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ padding: "30px 10px" }}>
                                  <IdcardOutlined style={{ fontSize: 44, color: "#94a3b8", marginBottom: 12 }} />
                                  <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                                    Chưa có ảnh mặt sau
                                  </div>
                                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                                    Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)
                                  </div>
                                  <Upload
                                    accept="image/*"
                                    showUploadList={false}
                                    customRequest={({ file }) => uploadIdentityImage(file, "back")}
                                    disabled={uploadingBack}
                                  >
                                    <Button
                                      type="primary"
                                      icon={<UploadOutlined />}
                                      loading={uploadingBack}
                                      style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}
                                    >
                                      Tải ảnh mặt sau
                                    </Button>
                                  </Upload>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      style={{
                        background: "#0f766e",
                        borderColor: "#0f766e",
                        borderRadius: 8,
                        fontWeight: 700,
                        paddingLeft: 32,
                        paddingRight: 32,
                      }}
                    >
                      Lưu thông tin CCCD
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: "security",
              label: (
                <span>
                  <LockOutlined /> Đổi mật khẩu & Bảo mật
                </span>
              ),
              children: (
                <div style={{ maxWidth: 600 }}>
                  <div className="profile-section-title">
                    <KeyOutlined style={{ color: "#0f766e" }} />
                    Bảo mật tài khoản & Đổi mật khẩu
                  </div>
                  <div className="profile-section-desc">
                    Đặt mật khẩu mạnh giúp bảo vệ tài khoản cũng như dữ liệu cá nhân của bạn khỏi các truy cập trái phép.
                  </div>

                  <div className="security-alert-box">
                    <SafetyCertificateOutlined style={{ fontSize: 24, color: "#d97706", marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: "#78350f" }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>Mẹo thiết lập mật khẩu an toàn:</div>
                      <div>Nên dài tối thiểu 6 ký tự, kết hợp giữa chữ hoa, chữ thường, chữ số và không nên dùng ngày sinh.</div>
                    </div>
                  </div>

                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleSavePassword}
                    autoComplete="off"
                  >
                    <Form.Item
                      name="password"
                      label="Mật khẩu mới"
                      rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu mới" },
                        { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                      ]}
                      hasFeedback
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                        placeholder="Nhập ít nhất 6 ký tự"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Xác nhận mật khẩu mới"
                      dependencies={["password"]}
                      hasFeedback
                      rules={[
                        { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                        placeholder="Nhập lại mật khẩu mới vừa gõ"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      style={{
                        background: "#0f766e",
                        borderColor: "#0f766e",
                        borderRadius: 8,
                        fontWeight: 700,
                        paddingLeft: 32,
                        paddingRight: 32,
                        marginTop: 8,
                      }}
                    >
                      Cập nhật mật khẩu mới
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: "rentals",
              label: (
                <span>
                  <HomeOutlined /> Phòng đang thuê & Dịch vụ ({tenancies.length})
                </span>
              ),
              children: (
                <div>
                  <div className="profile-section-title">
                    <HomeOutlined style={{ color: "#0f766e" }} />
                    Danh sách phòng bạn đang thuê & Hợp đồng liên kết
                  </div>
                  <div className="profile-section-desc">
                    Xem tổng quan các phòng trọ bạn đang ở thực tế theo dữ liệu quản lý từ chủ nhà.
                  </div>

                  {dataLoading ? (
                    <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
                  ) : tenancies.length === 0 ? (
                    <Empty
                      description="Hiện tại bạn chưa được kích hoạt phòng thuê nào."
                      style={{ padding: "40px 0" }}
                    >
                      <Button
                        type="primary"
                        onClick={() => navigate("/")}
                        style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8 }}
                      >
                        Khám phá phòng trọ có sẵn
                      </Button>
                    </Empty>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                      {tenancies.map((tenancy) => {
                        const room = tenancy.room || tenancy.roomId || {};
                        return (
                          <Card
                            key={tenancy._id}
                            style={{
                              borderRadius: 14,
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            }}
                            title={
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 700, fontSize: 16, color: "#0f766e" }}>
                                  {room.name || "Phòng trọ"}
                                </span>
                                <Tag color="success" style={{ borderRadius: 4 }}>
                                  Đang thuê
                                </Tag>
                              </div>
                            }
                            extra={
                              <Button
                                type="link"
                                size="small"
                                onClick={() => navigate("/user/my-rooms")}
                              >
                                Xem chi tiết →
                              </Button>
                            }
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                              <div>
                                <Text type="secondary">Địa chỉ:</Text>{" "}
                                <Text strong>{room.address || "Hệ thống TroPlus"}</Text>
                              </div>
                              <div>
                                <Text type="secondary">Giá thuê:</Text>{" "}
                                <Text strong style={{ color: "#0f766e" }}>
                                  {formatCurrency(room.price || tenancy.rentalPrice)}/tháng
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary">Ngày bắt đầu:</Text>{" "}
                                <Text>{formatDate(tenancy.startDate)}</Text>
                              </div>
                              <div>
                                <Text type="secondary">Vai trò trong phòng:</Text>{" "}
                                <Tag color="blue">{tenancy.role === "representative" ? "Đại diện phòng" : "Thành viên"}</Tag>
                              </div>
                            </div>
                            <Divider style={{ margin: "14px 0" }} />
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button
                                block
                                size="small"
                                icon={<FileProtectOutlined />}
                                onClick={() => navigate("/user/contracts")}
                              >
                                Hợp đồng
                              </Button>
                              <Button
                                block
                                size="small"
                                icon={<FileTextOutlined />}
                                onClick={() => navigate("/user/invoices")}
                              >
                                Hóa đơn
                              </Button>
                              <Button
                                block
                                size="small"
                                icon={<ToolOutlined />}
                                onClick={() => navigate("/user/repair-requests")}
                              >
                                Báo sự cố
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Shortcut Buttons Strip */}
                  <Divider style={{ margin: "32px 0 20px" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <Button icon={<FileProtectOutlined />} onClick={() => navigate("/user/contracts")}>
                      Hợp đồng của tôi
                    </Button>
                    <Button icon={<FileTextOutlined />} onClick={() => navigate("/user/invoices")}>
                      Hóa đơn điện nước
                    </Button>
                    <Button icon={<CreditCardOutlined />} onClick={() => navigate("/user/room-requests")}>
                      Yêu cầu cọc phòng
                    </Button>
                    <Button icon={<ToolOutlined />} onClick={() => navigate("/user/repair-requests")}>
                      Yêu cầu sửa chữa
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default UserProfilePage;
