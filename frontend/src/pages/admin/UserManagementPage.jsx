import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
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

const UserManagementPage = () => {
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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

  const columns = useMemo(
    () => [
      {
        title: "Ho ten",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "So dien thoai",
        dataIndex: "phone",
        key: "phone",
        render: (value) => value || "-",
      },
      {
        title: "Vai tro",
        dataIndex: "role",
        key: "role",
        render: (role) => (
          <Tag color={role === "admin" ? "blue" : "green"}>
            {role === "admin" ? "Admin" : "Nguoi dung"}
          </Tag>
        ),
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag color={status === "active" ? "success" : "default"}>
            {status === "active" ? "Hoat dong" : "Da khoa"}
          </Tag>
        ),
      },
      {
        title: "Ngay tao",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => {
          const isSelf = String(record.id) === String(currentUserId);
          const isActive = record.status === "active";

          return (
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Sua
              </Button>
              <Button
                icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                disabled={isSelf && isActive}
                onClick={() => handleToggleStatus(record)}
              >
                {isActive ? "Khoa" : "Mo khoa"}
              </Button>
              <Popconfirm
                title="Xoa tai khoan nay?"
                description="Hanh dong nay khong the hoan tac."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isSelf}
              >
                <Button danger icon={<DeleteOutlined />} disabled={isSelf}>
                  Xoa
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [currentUserId]
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly tai khoan</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat, khoa hoac xoa tai khoan trong he thong.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Them tai khoan
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8 }}
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
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? "Mat khau moi" : "Mat khau"}
            rules={editingUser ? [] : [{ required: true }, { min: 6 }]}
          >
            <Input.Password placeholder={editingUser ? "De trong neu khong doi" : ""} />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="phone" label="So dien thoai">
              <Input />
            </Form.Item>
            <Form.Item name="identityNumber" label="So CCCD/CMND">
              <Input />
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
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default UserManagementPage;
