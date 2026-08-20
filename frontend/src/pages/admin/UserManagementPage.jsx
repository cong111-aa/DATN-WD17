import {
  CheckCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UnlockOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import "./UserManagement.css";

const defaultFormValues = {
  role: "user",
  status: "active",
};

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);
const toUploadedImageUrl = (fileList = []) =>
  fileList[0]?.response?.urls?.[0] || fileList[0]?.rawUrl || fileList[0]?.url || "";
const toIdentityFileList = (url) =>
  url
    ? [
        {
          uid: url,
          name: url.split("/").pop() || "identity-image",
          rawUrl: url,
          status: "done",
          url: toImageUrl(url),
        },
      ]
    : [];

const roleOptions = [
  { label: "Quản trị viên (Admin)", value: "admin" },
  { label: "Người dùng (User)", value: "user" },
];

const statusOptions = [
  { label: "Đang hoạt động", value: "active" },
  { label: "Đã khóa tài khoản", value: "inactive" },
];

const UserManagementPage = () => {
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [identityBackFileList, setIdentityBackFileList] = useState([]);
  const [identityFrontFileList, setIdentityFrontFileList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const currentUserId = currentUser?.id || currentUser?._id;

  const userStats = useMemo(() => {
    const active = users.filter((item) => item.status === "active").length;
    const inactive = users.filter((item) => item.status === "inactive").length;
    const admins = users.filter((item) => item.role === "admin").length;

    return {
      active,
      inactive,
      admins,
      users: users.length - admins,
      total: users.length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return users.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        [item.name, item.email, item.phone, item.identityNumber]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchRole = roleFilter === "all" || item.role === roleFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [roleFilter, searchText, statusFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/users");
      setUsers(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setIdentityBackFileList([]);
    setIdentityFrontFileList([]);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingUser(record);
    setIdentityBackFileList(toIdentityFileList(record.identityBackImage));
    setIdentityFrontFileList(toIdentityFileList(record.identityFrontImage));
    form.resetFields();
    form.setFieldsValue({
      ...record,
      password: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setIdentityBackFileList([]);
    setIdentityFrontFileList([]);
    form.resetFields();
  };

  const handleIdentityImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/identity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Tải ảnh CCCD thất bại");
      onError(error);
    }
  };

  const handleIdentityFileChange = (fieldName, setFileList) => ({ fileList }) => {
    const nextFileList = fileList.slice(-1);
    setFileList(nextFileList);
    form.setFieldValue(fieldName, toUploadedImageUrl(nextFileList));
  };

  const handleSubmit = async (values) => {
    const payload = { ...values };

    if (editingUser && !payload.password) {
      delete payload.password;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        await http.put(`/users/${editingUser.id}`, payload);
        message.success("Đã cập nhật tài khoản thành công");
      } else {
        await http.post("/users", payload);
        message.success("Đã tạo tài khoản mới thành công");
      }

      closeModal();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu tài khoản thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "active" ? "inactive" : "active";

    try {
      await http.patch(`/users/${record.id}/status`, { status: nextStatus });
      message.success(nextStatus === "active" ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/users/${record.id}`);
      message.success("Đã xóa tài khoản thành công");
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa tài khoản thất bại");
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const columns = useMemo(
    () => [
      {
        title: "TÀI KHOẢN & NGƯỜI DÙNG",
        dataIndex: "name",
        key: "name",
        width: 280,
        render: (value, record) => {
          const isAdmin = record.role === "admin";
          const isActive = record.status === "active";

          return (
            <div className="um-user-cell">
              <div className="um-avatar-wrap">
                <Avatar
                  size={44}
                  style={{
                    background: isAdmin
                      ? "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)"
                      : "linear-gradient(135deg, #0f766e 0%, #059669 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  {(value || "U").charAt(0).toUpperCase()}
                </Avatar>
                <div className={`um-status-dot-indicator ${isActive ? "active" : "inactive"}`} />
              </div>
              <div className="um-user-meta">
                <span className="um-user-name">{value || "Chưa cập nhật tên"}</span>
                <span className="um-user-cccd">
                  <IdcardOutlined />
                  {record.identityNumber ? `CCCD: ${record.identityNumber}` : "Chưa có CCCD"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        title: "LIÊN HỆ",
        key: "contact",
        width: 250,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontSize: 13 }}>
              <MailOutlined style={{ color: "#64748b" }} />
              {record.email || "-"}
            </span>
            {record.phone && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12 }}>
                <PhoneOutlined style={{ color: "#94a3b8" }} />
                {record.phone}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: "VAI TRÒ",
        dataIndex: "role",
        key: "role",
        width: 160,
        render: (role) => (
          <span className={`um-role-tag ${role === "admin" ? "admin" : "user"}`}>
            {role === "admin" ? <CrownOutlined /> : <UserOutlined />}
            {role === "admin" ? "Quản trị viên" : "Người dùng"}
          </span>
        ),
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        width: 170,
        render: (status) => {
          const isActive = status === "active";
          return (
            <span className={`um-status-tag ${isActive ? "active" : "inactive"}`}>
              {isActive ? <CheckCircleOutlined style={{ color: "#10b981" }} /> : <StopOutlined style={{ color: "#94a3b8" }} />}
              {isActive ? "Đang hoạt động" : "Đã khóa"}
            </span>
          );
        },
      },
      {
        title: "NGÀY TẠO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 140,
        render: (value) => (
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {value ? new Date(value).toLocaleDateString("vi-VN") : "-"}
          </span>
        ),
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => {
          const isSelf = String(record.id) === String(currentUserId);
          const isActive = record.status === "active";

          return (
            <Space size={6}>
              <Tooltip title="Chỉnh sửa thông tin">
                <Button
                  className="um-action-btn"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
                <Button
                  className="um-action-btn"
                  size="small"
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                  disabled={isSelf && isActive}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Xác nhận xóa tài khoản?"
                description="Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống."
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(record)}
                disabled={isSelf}
              >
                <Tooltip title={isSelf ? "Không thể xóa chính mình" : "Xóa tài khoản"}>
                  <Button
                    danger
                    className="um-action-btn"
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={isSelf}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [currentUserId]
  );

  return (
    <div className="user-mgmt-container">
      {/* Hero Welcome Banner */}
      <div className="um-hero-banner">
        <div className="um-hero-inner">
          <div className="um-hero-left">
            <div className="um-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN TRỊ TÀI KHOẢN</span>
            </div>
            <Typography.Title level={2} className="um-hero-title">
              Quản Lý Tài Khoản Người Dùng
            </Typography.Title>
            <Typography.Paragraph className="um-hero-subtitle">
              Kiểm soát quyền truy cập, thông tin định danh CCCD và tình trạng hoạt động của toàn bộ thành viên trong hệ thống.
            </Typography.Paragraph>
          </div>

          <div className="um-hero-right">
            <Button
              className="um-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchUsers}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              className="um-btn-add"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm tài khoản
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="um-stats-grid">
        {/* Total Users */}
        <div className="um-stat-card">
          <div className="um-stat-info">
            <span className="um-stat-label">Tổng tài khoản</span>
            <span className="um-stat-value">{userStats.total}</span>
            <span className="um-stat-sub">Toàn bộ tài khoản hệ thống</span>
          </div>
          <div className="um-stat-icon-wrap icon-purple">
            <TeamOutlined />
          </div>
        </div>

        {/* Active Users */}
        <div className="um-stat-card">
          <div className="um-stat-info">
            <span className="um-stat-label">Đang hoạt động</span>
            <span className="um-stat-value" style={{ color: "#059669" }}>
              {userStats.active}
            </span>
            <span className="um-stat-sub">Có thể đăng nhập & sử dụng</span>
          </div>
          <div className="um-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        {/* Locked Users */}
        <div className="um-stat-card">
          <div className="um-stat-info">
            <span className="um-stat-label">Tài khoản bị khóa</span>
            <span className="um-stat-value" style={{ color: "#e11d48" }}>
              {userStats.inactive}
            </span>
            <span className="um-stat-sub">Bị tạm ngừng truy cập</span>
          </div>
          <div className="um-stat-icon-wrap icon-rose">
            <StopOutlined />
          </div>
        </div>

        {/* Admin Count */}
        <div className="um-stat-card">
          <div className="um-stat-info">
            <span className="um-stat-label">Quản trị viên (Admin)</span>
            <span className="um-stat-value" style={{ color: "#2563eb" }}>
              {userStats.admins}
            </span>
            <span className="um-stat-sub">Quyền kiểm soát cao nhất</span>
          </div>
          <div className="um-stat-icon-wrap icon-blue">
            <SafetyCertificateOutlined />
          </div>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="um-filter-card">
        <div className="um-filter-row">
          <div className="um-filter-left">
            <Input
              allowClear
              className="um-search-input"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm kiếm theo họ tên, email, số điện thoại hoặc CCCD..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="um-filter-controls">
            <Select
              className="um-select-filter"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ label: "Tất cả vai trò", value: "all" }, ...roleOptions]}
            />
            <Select
              className="um-select-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
            />
            <Button
              className="um-btn-reset"
              icon={<ReloadOutlined />}
              onClick={resetFilters}
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="um-table-card">
        <div className="um-table-header">
          <h3 className="um-table-title">
            <IdcardOutlined style={{ color: "#4f46e5" }} />
            Danh Sách Người Dùng
          </h3>
          <span className="um-count-pill">
            Hiển thị {filteredUsers.length} / {users.length} tài khoản
          </span>
        </div>

        <Table
          className="um-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          size="middle"
          scroll={{ x: 1080 }}
          locale={{
            emptyText: <Empty description="Không tìm thấy tài khoản nào phù hợp" />,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng số ${total} tài khoản`,
          }}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={
          <div className="um-modal-header">
            <Avatar
              size={40}
              style={{
                background: editingUser?.role === "admin" ? "#4f46e5" : "#0f766e",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              icon={<UserOutlined />}
            />
            <div>
              <h4 className="um-modal-title">
                {editingUser ? "Chỉnh sửa thông tin tài khoản" : "Tạo tài khoản người dùng mới"}
              </h4>
              <p className="um-modal-subtitle">
                {editingUser ? `Email: ${editingUser.email}` : "Điền đầy đủ thông tin bên dưới để thiết lập tài khoản"}
              </p>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
        cancelText="Đóng"
        width={720}
      >
        <Alert
          showIcon
          type="info"
          message={
            editingUser
              ? "Cập nhật quyền hạn, mật khẩu mới (nếu cần) và thông tin cá nhân của người dùng."
              : "Hệ thống sẽ tạo tài khoản mới với mật khẩu được thiết lập."
          }
          style={{ marginBottom: 18, borderRadius: 10 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Section 1: Credentials & Role */}
          <div className="um-form-section-title">
            <SafetyCertificateOutlined style={{ color: "#4f46e5" }} />
            <span>Thông tin đăng nhập & Phân quyền</span>
          </div>
          <Divider className="um-form-divider" />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                <Input placeholder="Ví dụ: Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Địa chỉ Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không đúng định dạng" },
                ]}
              >
                <Input placeholder="example@gmail.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu đăng nhập"}
                rules={editingUser ? [] : [{ required: true, message: "Vui lòng nhập mật khẩu" }, { min: 6, message: "Tối thiểu 6 ký tự" }]}
              >
                <Input.Password placeholder={editingUser ? "Nhập mật khẩu mới nếu muốn đổi" : "Tối thiểu 6 ký tự"} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section 2: Personal Info & Identity */}
          <div className="um-form-section-title">
            <IdcardOutlined style={{ color: "#0f766e" }} />
            <span>Thông tin cá nhân & Định danh (CCCD)</span>
          </div>
          <Divider className="um-form-divider" />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="Số điện thoại liên lạc">
                <Input placeholder="Ví dụ: 0912345678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="identityNumber" label="Số CCCD / CMND">
                <Input placeholder="Ví dụ: 001201012345" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="identityFrontImage" label="Ảnh mặt trước CCCD">
                <Upload
                  accept="image/png,image/jpeg,image/webp"
                  customRequest={handleIdentityImageUpload}
                  fileList={identityFrontFileList}
                  listType="picture-card"
                  maxCount={1}
                  onChange={handleIdentityFileChange("identityFrontImage", setIdentityFrontFileList)}
                >
                  {identityFrontFileList.length ? null : (
                    <div className="um-upload-card-btn">
                      <UploadOutlined style={{ fontSize: 20 }} />
                      <span>Tải ảnh mặt trước</span>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="identityBackImage" label="Ảnh mặt sau CCCD">
                <Upload
                  accept="image/png,image/jpeg,image/webp"
                  customRequest={handleIdentityImageUpload}
                  fileList={identityBackFileList}
                  listType="picture-card"
                  maxCount={1}
                  onChange={handleIdentityFileChange("identityBackImage", setIdentityBackFileList)}
                >
                  {identityBackFileList.length ? null : (
                    <div className="um-upload-card-btn">
                      <UploadOutlined style={{ fontSize: 20 }} />
                      <span>Tải ảnh mặt sau</span>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ thường trú / Quê quán">
            <Input.TextArea rows={3} placeholder="Nhập địa chỉ đầy đủ (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;