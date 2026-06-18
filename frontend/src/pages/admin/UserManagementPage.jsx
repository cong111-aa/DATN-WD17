import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
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

const filterRoleOptions = [{ label: "Tat ca vai tro", value: "all" }, ...roleOptions];
const filterStatusOptions = [{ label: "Tat ca trang thai", value: "all" }, ...statusOptions];
const avatarColors = ["#6d28d9", "#0f766e", "#0ea5e9", "#7c3aed", "#059669", "#dc2626"];

const normalize = (value) => String(value || "").trim().toLowerCase();

const UserManagementPage = () => {
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const currentUserId = currentUser?.id || currentUser?._id;

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

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === "active").length;
    const adminCount = users.filter((user) => user.role === "admin").length;

    return {
      total: users.length,
      active: activeCount,
      admin: adminCount,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const searchValue = normalize(keyword);

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesKeyword =
        !searchValue ||
        [user.name, user.email, user.phone, user.identityNumber]
          .map(normalize)
          .some((value) => value.includes(searchValue));

      return matchesRole && matchesStatus && matchesKeyword;
    });
  }, [users, keyword, roleFilter, statusFilter]);

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

  const handleResetFilters = () => {
    setKeyword("");
    setRoleFilter("all");
    setStatusFilter("all");
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

  const columns = useMemo(
    () => [
      {
        title: "HO TEN",
        dataIndex: "name",
        key: "name",
        width: 240,
        render: (name, record, index) => (
          <div className="entity-cell">
            <div
              className="entity-avatar"
              style={{ background: avatarColors[index % avatarColors.length] }}
            >
              {String(name || record.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="entity-name">{name}</div>
              <div className="entity-sub">{record.identityNumber || "Chua co CCCD"}</div>
            </div>
          </div>
        ),
      },
      {
        title: "EMAIL",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
        render: (value) => <span className="muted-text">{value}</span>,
      },
      {
        title: "SDT",
        dataIndex: "phone",
        key: "phone",
        width: 150,
        render: (value) => <span className="muted-text">{value || "-"}</span>,
      },
      {
        title: "VAI TRO",
        dataIndex: "role",
        key: "role",
        width: 130,
        render: (role) => (
          <Tag className={role === "admin" ? "result-tag" : "soft-tag user-role-tag"}>
            {role === "admin" ? "Admin" : "Nguoi dung"}
          </Tag>
        ),
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        width: 145,
        render: (status) => (
          <Tag className={`status-pill ${status === "active" ? "status-active" : "status-locked"}`}>
            {status === "active" ? "Hoat dong" : "Da khoa"}
          </Tag>
        ),
      },
      {
        title: "NGAY TAO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 130,
        render: (value) => (
          <span className="muted-text">{value ? new Date(value).toLocaleDateString("vi-VN") : "-"}</span>
        ),
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "right",
        width: 146,
        render: (_, record) => {
          const isSelf = String(record.id) === String(currentUserId);
          const isActive = record.status === "active";

          return (
            <Space size={8} className="action-buttons">
              <Tooltip title="Sua tai khoan">
                <Button
                  aria-label="Sua tai khoan"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Khoa tai khoan" : "Mo khoa tai khoan"}>
                <Button
                  aria-label={isActive ? "Khoa tai khoan" : "Mo khoa tai khoan"}
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                  disabled={isSelf && isActive}
                  onClick={() => handleToggleStatus(record)}
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
                  <Button danger aria-label="Xoa tai khoan" icon={<DeleteOutlined />} disabled={isSelf} />
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
    <Space direction="vertical" size={18} className="page-stack admin-management-page">
      <style>
        {`
          .user-filter-controls {
            grid-template-columns: minmax(220px, 1fr) minmax(160px, 190px) minmax(160px, 190px) 150px;
          }

          .user-role-tag {
            background: #dcfce7;
            color: #15803d;
          }

          @media (max-width: 768px) {
            .user-filter-controls {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section className="admin-hero">
        <div>
          <div className="admin-eyebrow">TRO PLUS ADMIN</div>
          <Typography.Title level={2}>Quan ly tai khoan</Typography.Title>
          <Typography.Text>
            Tao, cap nhat, khoa hoac xoa tai khoan trong he thong.
          </Typography.Text>
          <div className="hero-pills">
            <span>{stats.total} tai khoan</span>
            <span>{stats.active} dang hoat dong</span>
            <span>{stats.admin} admin</span>
          </div>
        </div>
        <div className="hero-actions">
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them tai khoan
          </Button>
        </div>
      </section>

      <Card className="filter-card">
        <div className="filter-title">
          <FilterOutlined />
          <div>
            <strong>Bo loc tai khoan</strong>
            <span>Loc nhanh theo thong tin, vai tro va trang thai</span>
          </div>
        </div>
        <div className="filter-controls user-filter-controls">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tim ten, email, SDT hoac CCCD"
          />
          <Select value={roleFilter} options={filterRoleOptions} onChange={setRoleFilter} />
          <Select value={statusFilter} options={filterStatusOptions} onChange={setStatusFilter} />
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Dat lai
          </Button>
        </div>
      </Card>

      <Card className="table-card">
        <div className="table-heading">
          <div className="table-title">
            <TeamOutlined />
            <div>
              <strong>Danh sach tai khoan</strong>
              <span>Quan ly thong tin va quyen truy cap nguoi dung</span>
            </div>
          </div>
          <Tag className="result-tag">Hien thi {filteredUsers.length}/{users.length}</Tag>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          className="management-table"
        />
      </Card>

      <Modal
        title={editingUser ? "Sua tai khoan" : "Them tai khoan"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingUser ? "Luu" : "Tao tai khoan"}
        cancelText="Huy"
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
            <Input placeholder="Nhap ho ten" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
            <Input placeholder="name@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? "Mat khau moi" : "Mat khau"}
            rules={editingUser ? [] : [{ required: true }, { min: 6 }]}
          >
            <Input.Password placeholder={editingUser ? "De trong neu khong doi" : "Toi thieu 6 ky tu"} />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="phone" label="So dien thoai">
              <Input placeholder="Nhap so dien thoai" />
            </Form.Item>
            <Form.Item name="identityNumber" label="So CCCD/CMND">
              <Input placeholder="Nhap so CCCD/CMND" />
            </Form.Item>
            <Form.Item name="role" label="Vai tro" rules={[{ required: true }]}>
              <Select options={roleOptions} />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          <Form.Item name="identityFrontImage" label="Anh mat truoc CCCD">
            <Input placeholder="URL hoac duong dan anh" />
          </Form.Item>
          <Form.Item name="identityBackImage" label="Anh mat sau CCCD">
            <Input placeholder="URL hoac duong dan anh" />
          </Form.Item>
          <Form.Item name="address" label="Dia chi">
            <Input.TextArea rows={3} placeholder="Nhap dia chi lien he" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default UserManagementPage;
