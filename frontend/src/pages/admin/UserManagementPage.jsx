import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  IdcardOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  UnlockOutlined,
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
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const defaultFormValues = {
  role: "user",
  status: "active",
};

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Nguoi dung", value: "user" },
];

const statusOptions = [
  { label: "Hoat dong", value: "active" },
  { label: "Da khoa", value: "inactive" },
];

const panelStyle = {
  border: "1px solid #eef1f7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const heroStyle = {
  ...panelStyle,
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #5b21b6 0%, #7c2dff 46%, #2563eb 100%)",
  backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto",
};

const statIconStyle = {
  alignItems: "center",
  borderRadius: 8,
  display: "flex",
  height: 42,
  justifyContent: "center",
  width: 42,
};

const toolbarInputStyle = {
  borderRadius: 8,
  height: 40,
};

const mutedTextStyle = {
  color: "#64748b",
};

const sectionTitleStyle = {
  color: "#0f172a",
  fontSize: 16,
};

const UserManagementPage = () => {
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
      message.error(error.response?.data?.message || "Khong tai duoc danh sach tai khoan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingUser(record);
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
    form.resetFields();
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
        message.success("Da cap nhat tai khoan");
      } else {
        await http.post("/users", payload);
        message.success("Da tao tai khoan");
      }

      closeModal();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu tai khoan that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "active" ? "inactive" : "active";

    try {
      await http.patch(`/users/${record.id}/status`, { status: nextStatus });
      message.success(nextStatus === "active" ? "Da mo khoa tai khoan" : "Da khoa tai khoan");
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/users/${record.id}`);
      message.success("Da xoa tai khoan");
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa tai khoan that bai");
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
        title: "HO TEN",
        dataIndex: "name",
        key: "name",
        width: 260,
        render: (value, record) => (
          <Space size={12}>
            <Avatar
              size={42}
              style={{
                background:
                  record.role === "admin"
                    ? "linear-gradient(135deg, #1677ff, #4f46e5)"
                    : "linear-gradient(135deg, #0f766e, #16a34a)",
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              {(value || "U").charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Typography.Text strong style={{ color: "#334155" }}>
                {value || "Chua cap nhat"}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.identityNumber || "Chua co CCCD/CMND"}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: "EMAIL",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
        render: (value) => <Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text>,
      },
      {
        title: "SDT",
        dataIndex: "phone",
        key: "phone",
        width: 150,
        render: (value) =>
          value ? (
            <Typography.Text style={{ color: "#475569" }}>{value}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">--</Typography.Text>
          ),
      },
      {
        title: "VAI TRO",
        dataIndex: "role",
        key: "role",
        width: 150,
        render: (role) => (
          <Tag
            bordered={false}
            style={{
              background: role === "admin" ? "#f1e8ff" : "#dcfce7",
              borderRadius: 5,
              color: role === "admin" ? "#6d28d9" : "#15803d",
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {role === "admin" ? "Admin" : "Nguoi dung"}
          </Tag>
        ),
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (status) => (
          <Tag
            bordered={false}
            icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />}
            style={{
              background: status === "active" ? "#dcfce7" : "#f1f5f9",
              borderRadius: 5,
              color: status === "active" ? "#15803d" : "#64748b",
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {status === "active" ? "Hoat dong" : "Da khoa"}
          </Tag>
        ),
      },
      {
        title: "NGAY TAO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 150,
        render: (value) => (
          <Typography.Text style={{ color: "#475569" }}>
            {value ? new Date(value).toLocaleDateString("vi-VN") : "-"}
          </Typography.Text>
        ),
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => {
          const isSelf = String(record.id) === String(currentUserId);
          const isActive = record.status === "active";

          return (
            <Space size={8}>
              <Tooltip title="Sua tai khoan">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                  style={{ borderRadius: 8, height: 32, width: 32 }}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Khoa tai khoan" : "Mo khoa tai khoan"}>
                <Button
                  size="small"
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                  disabled={isSelf && isActive}
                  onClick={() => handleToggleStatus(record)}
                  style={{ borderRadius: 8, height: 32, width: 32 }}
                />
              </Tooltip>
              <Popconfirm
                title="Xoa tai khoan nay?"
                description="Hanh dong nay khong the hoan tac."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isSelf}
              >
                <Tooltip title="Xoa tai khoan">
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={isSelf}
                    style={{ borderRadius: 8, height: 32, width: 32 }}
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
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>
              TRO PLUS ADMIN
            </Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>
              Quan ly tai khoan
            </Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>
              Tao, cap nhat, khoa hoac xoa tai khoan trong he thong.
            </Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {userStats.total} tai khoan
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {userStats.active} dang hoat dong
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {userStats.admins} admin
              </Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={fetchUsers} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>
                Tai lai
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{
                  background: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  boxShadow: "none",
                  fontWeight: 800,
                  height: 40,
                }}
              >
                Them tai khoan
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={7}>
            <Space>
              <div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}>
                <FilterOutlined />
              </div>
              <div>
                <Typography.Text strong style={sectionTitleStyle}>
                  Bo loc tai khoan
                </Typography.Text>
                <br />
                <Typography.Text style={mutedTextStyle}>
                  Loc nhanh theo thong tin, vai tro va trang thai
                </Typography.Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={17}>
            <Row gutter={[10, 10]} justify="end">
              <Col xs={24} md={9}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tim ten, email, SDT hoac CCCD"
                  style={toolbarInputStyle}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </Col>
              <Col xs={12} md={5}>
                <Select
                  value={roleFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setRoleFilter}
                  options={[{ label: "Tat ca vai tro", value: "all" }, ...roleOptions]}
                />
              </Col>
              <Col xs={12} md={5}>
                <Select
                  value={statusFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setStatusFilter}
                  options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]}
                />
              </Col>
              <Col xs={24} md={5}>
                <Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>
                  Dat lai
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}>
              <IdcardOutlined />
            </div>
            <div>
              <Typography.Text strong style={sectionTitleStyle}>
                Danh sach tai khoan
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Quan ly thong tin va quyen truy cap nguoi dung
              </Typography.Text>
            </div>
          </Space>
        }
        extra={
          <Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>
            Hien thi {filteredUsers.length}/{users.length}
          </Tag>
        }
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" },
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          size="middle"
          rowClassName={() => "user-management-row"}
          locale={{
            emptyText: <Empty description="Khong co tai khoan phu hop" />,
          }}
          scroll={{ x: 1180 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} tai khoan`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar
              size={36}
              style={{ background: editingUser?.role === "admin" ? "#1677ff" : "#0f766e" }}
              icon={<UserOutlined />}
            />
            <div>
              <Typography.Text strong>{editingUser ? "Sua tai khoan" : "Them tai khoan"}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingUser ? editingUser.email : "Tao nguoi dung moi cho he thong"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingUser ? "Luu" : "Tao tai khoan"}
        cancelText="Huy"
        width={720}
      >
        <Alert
          showIcon
          type="info"
          message={editingUser ? "Cap nhat thong tin tai khoan" : "Nhap thong tin de tao tai khoan moi"}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space>
            <SafetyCertificateOutlined style={{ color: "#1677ff" }} />
            <Typography.Text strong>Thong tin dang nhap</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
                <Input placeholder="Nhap ho ten" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
                <Input placeholder="name@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label={editingUser ? "Mat khau moi" : "Mat khau"}
                rules={editingUser ? [] : [{ required: true }, { min: 6 }]}
              >
                <Input.Password placeholder={editingUser ? "De trong neu khong doi" : "Toi thieu 6 ky tu"} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="role" label="Vai tro" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <IdcardOutlined style={{ color: "#0f766e" }} />
            <Typography.Text strong>Thong tin ca nhan</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="phone" label="So dien thoai">
              <Input placeholder="Nhap so dien thoai" />
            </Form.Item>
            <Form.Item name="identityNumber" label="So CCCD/CMND">
              <Input placeholder="Nhap so dinh danh" />
            </Form.Item>
          </div>
          <Form.Item name="identityFrontImage" label="Anh mat truoc CCCD">
            <Input placeholder="URL hoac duong dan anh" />
          </Form.Item>
          <Form.Item name="identityBackImage" label="Anh mat sau CCCD">
            <Input placeholder="URL hoac duong dan anh" />
          </Form.Item>
          <Form.Item name="address" label="Dia chi">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default UserManagementPage;
