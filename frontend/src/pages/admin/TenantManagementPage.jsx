import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  roomRole: "member",
  status: "active",
};

const panelStyle = { border: "1px solid #eef1f7", borderRadius: 8, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" };
const heroStyle = { ...panelStyle, overflow: "hidden", background: "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #5b21b6 0%, #7c2dff 46%, #2563eb 100%)", backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto" };
const statIconStyle = { alignItems: "center", borderRadius: 8, display: "flex", height: 42, justifyContent: "center", width: 42 };
const toolbarInputStyle = { borderRadius: 8, height: 40 };
const mutedTextStyle = { color: "#64748b" };
const sectionTitleStyle = { color: "#0f172a", fontSize: 16 };

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tenantStats = useMemo(() => {
    const active = tenants.filter((item) => item.status === "active").length;
    const representatives = tenants.filter((item) => item.roomRole === "representative" && item.status === "active").length;
    return { active, representatives, total: tenants.length };
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return tenants.filter((item) => {
      const matchesSearch = !keyword || [item.userName, item.userEmail, item.userPhone, item.roomNumber, item.roomName]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
      return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
    });
  }, [searchText, statusFilter, tenants]);

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

  const resetFilters = () => { setSearchText(""); setStatusFilter("all"); };
  const openDetailModal = (record) => { setDetailTenant(record); setDetailOpen(true); };

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
        title: "KHACH THUE",
        dataIndex: "userName",
        key: "userName",
        width: 235,
        render: (value, record) => <Space size={11}><Avatar size={40} style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", fontWeight: 700 }}>{(value || "K").charAt(0).toUpperCase()}</Avatar><div><Typography.Text strong style={{ color: "#334155" }}>{value || "-"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.userIdentityNumber || "Chua co CCCD/CMND"}</Typography.Text></div></Space>,
      },
      {
        title: "LIEN HE",
        dataIndex: "userEmail",
        key: "userEmail",
        width: 225,
        render: (value, record) => <Space direction="vertical" size={0}><Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text><Typography.Text type="secondary">{record.userPhone || "-"}</Typography.Text></Space>,
      },
      {
        title: "PHONG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 180,
        render: (value, record) => <Typography.Text style={{ color: "#475569" }}>{value || "-"} - {record.roomName || "-"}</Typography.Text>,
      },
      {
        title: "PHAN LOAI",
        dataIndex: "roomRole",
        key: "roomRole",
        render: (roomRole) => {
          const meta = roomRoleMeta[roomRole] || roomRoleMeta.member;
          return <Tag bordered={false} style={{ background: roomRole === "representative" ? "#f5edff" : "#dcfce7", borderRadius: 5, color: roomRole === "representative" ? "#7c3aed" : "#15803d", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "NGAY VAO",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "NGAY ROI",
        dataIndex: "moveOutDate",
        key: "moveOutDate",
        render: formatDate,
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return <Tag bordered={false} icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />} style={{ background: status === "active" ? "#dcfce7" : "#f1f5f9", borderRadius: 5, color: status === "active" ? "#15803d" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 170,
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space size={7}>
              <Tooltip title="Xem chi tiet"><Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Tooltip title="Sua khach thue"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Tooltip title={isActive ? "Ket thuc thue" : "Kich hoat thue"}><Button size="small" icon={isActive ? <LogoutOutlined /> : <LoginOutlined />} onClick={() => handleToggleStatus(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Popconfirm
                title="Xoa khach thue nay?"
                description="Chi xoa duoc khach thue da ket thuc."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isActive}
              >
                <Tooltip title="Xoa khach thue"><Button danger size="small" icon={<DeleteOutlined />} disabled={isActive} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between"><Col xs={24} lg={15}><Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>TRO PLUS ADMIN</Typography.Text><Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>Quan ly khach thue</Typography.Title><Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Gan nguoi dung vao phong, theo doi vai tro va trang thai thue.</Typography.Paragraph><Space wrap><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.total} khach thue</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.active} dang thue</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.representatives} dai dien phong</Tag></Space></Col><Col xs={24} lg={9}><Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}><Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tai lai</Button><Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 8, boxShadow: "none", fontWeight: 800, height: 40 }}>Them khach thue</Button></Space></Col></Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}><Row gutter={[12, 12]} align="middle" justify="space-between"><Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bo loc khach thue</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tim theo ten, lien he hoac phong dang thue</Typography.Text></div></Space></Col><Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tim ten, email, SDT hoac phong" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Dat lai</Button></Col></Row></Col></Row></Card>

      <Card title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><TeamOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sach khach thue</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Quan ly nguoi dang thue va thong tin luu tru</Typography.Text></div></Space>} extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hien thi {filteredTenants.length}/{tenants.length}</Tag>} style={{ ...panelStyle, overflow: "hidden" }} styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTenants}
          loading={loading}
          size="middle"
          locale={{ emptyText: <Empty description="Khong co khach thue phu hop" /> }}
          scroll={{ x: 1250 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} khach thue` }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<UserSwitchOutlined />} />
            <div><Typography.Text strong>{editingTenant ? "Sua khach thue" : "Them khach thue"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingTenant ? editingTenant.userName : "Gan nguoi dung vao phong thue"}</Typography.Text></div>
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
        <Alert showIcon type="info" message={editingTenant ? "Cap nhat thong tin luu tru cua khach thue" : "Chon tai khoan va phong cho khach thue moi"} style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin luu tru</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
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
          <Space><UserSwitchOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thoi gian va vai tro</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
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

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }}>{(detailTenant?.userName || "K").charAt(0).toUpperCase()}</Avatar><div><Typography.Text strong>Chi tiet khach thue</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailTenant?.userName || "Thong tin luu tru"}</Typography.Text></div></Space>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailOpen(false)}>Dong</Button>]}
        width={720}
      >
        {detailTenant && <><Alert showIcon type={detailTenant.status === "active" ? "success" : "info"} message={`Trang thai: ${statusMeta[detailTenant.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} /><Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin khach thue</Typography.Text></Space><Divider style={{ margin: "12px 0 16px" }} /><Descriptions bordered size="small" column={2}><Descriptions.Item label="Ho ten">{detailTenant.userName || "-"}</Descriptions.Item><Descriptions.Item label="Phan loai"><Tag bordered={false} color={roomRoleMeta[detailTenant.roomRole]?.color}>{roomRoleMeta[detailTenant.roomRole]?.label || "-"}</Tag></Descriptions.Item><Descriptions.Item label="Email">{detailTenant.userEmail || "-"}</Descriptions.Item><Descriptions.Item label="So dien thoai">{detailTenant.userPhone || "-"}</Descriptions.Item><Descriptions.Item label="CCCD/CMND">{detailTenant.userIdentityNumber || "-"}</Descriptions.Item><Descriptions.Item label="Trang thai"><Tag bordered={false} color={statusMeta[detailTenant.status]?.color}>{statusMeta[detailTenant.status]?.label || "-"}</Tag></Descriptions.Item></Descriptions><Space style={{ marginTop: 20 }}><UserSwitchOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thong tin phong va thoi gian</Typography.Text></Space><Divider style={{ margin: "12px 0 16px" }} /><Descriptions bordered size="small" column={2}><Descriptions.Item label="Phong">{detailTenant.roomNumber || "-"} - {detailTenant.roomName || "-"}</Descriptions.Item><Descriptions.Item label="Ngay vao o">{formatDate(detailTenant.moveInDate)}</Descriptions.Item><Descriptions.Item label="Ngay roi di">{formatDate(detailTenant.moveOutDate)}</Descriptions.Item><Descriptions.Item label="Ghi chu" span={2}>{detailTenant.note || "-"}</Descriptions.Item></Descriptions></>}
      </Modal>
    </Space>
  );
};

export default TenantManagementPage;
