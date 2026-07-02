import {
  DeleteOutlined,
  EditOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
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
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  roomRole: "member",
  status: "active",
};

const statusOptions = [
  { label: "Dang thue", value: "active" },
  { label: "Da ket thuc", value: "inactive" },
];

const roomRoleOptions = [
  { label: "Nguoi dai dien phong", value: "representative" },
  { label: "Nguoi thue phong", value: "member" },
];

const roomRoleMeta = {
  representative: { color: "gold", label: "Dai dien phong" },
  member: { color: "green", label: "Nguoi thue phong" },
};

const statusMeta = {
  active: { color: "blue", label: "Dang thue" },
  inactive: { color: "default", label: "Da ket thuc" },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const toFormValues = (record) => ({
  ...record,
  moveInDate: record.moveInDate ? dayjs(record.moveInDate) : undefined,
  moveOutDate: record.moveOutDate ? dayjs(record.moveOutDate) : undefined,
});

const toPayload = (values) => ({
  ...values,
  moveInDate: values.moveInDate ? values.moveInDate.toISOString() : undefined,
  moveOutDate: values.moveOutDate ? values.moveOutDate.toISOString() : undefined,
});

const TenantManagementPage = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const userOptions = useMemo(
    () =>
      users
        .filter((user) => user.role === "user")
        .map((user) => ({
          label: `${user.name} - ${user.email}`,
          value: user.id,
        })),
    [users]
  );

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const fetchOptions = async () => {
    try {
      const [{ data: userData }, { data: roomData }] = await Promise.all([
        http.get("/users"),
        http.get("/rooms"),
      ]);

      setUsers(userData);
      setRooms(roomData);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc du lieu lua chon");
    }
  };

  const fetchTenants = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/tenants");
      setTenants(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach khach thue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchTenants();
  }, []);

  const refreshAll = () => {
    fetchOptions();
    fetchTenants();
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    form.resetFields();
    form.setFieldsValue({
      ...defaultFormValues,
      moveInDate: dayjs(),
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingTenant(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTenant(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = toPayload(values);

      if (editingTenant) {
        await http.put(`/tenants/${editingTenant.id}`, payload);
        message.success("Da cap nhat khach thue");
      } else {
        await http.post("/tenants", payload);
        message.success("Da tao khach thue");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu khach thue that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "active" ? "inactive" : "active";
    const payload = { status: nextStatus };

    if (nextStatus === "inactive") {
      payload.moveOutDate = new Date().toISOString();
    }

    try {
      await http.patch(`/tenants/${record.id}/status`, payload);
      message.success(nextStatus === "active" ? "Da kich hoat khach thue" : "Da ket thuc thue");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/tenants/${record.id}`);
      message.success("Da xoa khach thue");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa khach thue that bai");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Khach thue",
        dataIndex: "userName",
        key: "userName",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value || "-"}</Typography.Text>
            <Typography.Text type="secondary">{record.userIdentityNumber || "Chua co CCCD/CMND"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Lien he",
        dataIndex: "userEmail",
        key: "userEmail",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{value || "-"}</Typography.Text>
            <Typography.Text type="secondary">{record.userPhone || "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Phong",
        dataIndex: "roomNumber",
        key: "roomNumber",
        render: (value, record) => `${value || "-"} - ${record.roomName || "-"}`,
      },
      {
        title: "Phan loai",
        dataIndex: "roomRole",
        key: "roomRole",
        render: (roomRole) => {
          const meta = roomRoleMeta[roomRole] || roomRoleMeta.member;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Ngay vao",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "Ngay roi",
        dataIndex: "moveOutDate",
        key: "moveOutDate",
        render: formatDate,
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Sua
              </Button>
              <Button
                icon={isActive ? <LogoutOutlined /> : <LoginOutlined />}
                onClick={() => handleToggleStatus(record)}
              >
                {isActive ? "Ket thuc" : "Kich hoat"}
              </Button>
              <Popconfirm
                title="Xoa khach thue nay?"
                description="Chi xoa duoc khach thue da ket thuc."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isActive}
              >
                <Button danger icon={<DeleteOutlined />} disabled={isActive}>
                  Xoa
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly khach thue</Typography.Title>
          <Typography.Text type="secondary">
            Gan tai khoan nguoi dung vao phong va theo doi trang thai thue.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them khach thue
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tenants}
          loading={loading}
          scroll={{ x: 1250 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <UserSwitchOutlined />
            <span>{editingTenant ? "Sua khach thue" : "Them khach thue"}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingTenant ? "Luu" : "Tao khach thue"}
        cancelText="Huy"
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="user" label="Tai khoan khach thue" rules={[{ required: true }]}>
            <Select
              options={userOptions}
              placeholder="Chon tai khoan role user"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
            <Select
              options={roomOptions}
              placeholder="Chon phong"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="moveInDate" label="Ngay vao o" rules={[{ required: true }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="moveOutDate" label="Ngay roi di">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="roomRole" label="Phan loai" rules={[{ required: true }]}>
              <Select options={roomRoleOptions} />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default TenantManagementPage;
