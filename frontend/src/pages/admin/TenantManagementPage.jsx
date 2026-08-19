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
  { label: "Đang thuê", value: "active" },
  { label: "Đã kết thúc", value: "inactive" },
];

const roomRoleOptions = [
  { label: "Người đại diện phòng", value: "representative" },
  { label: "Người thuê phòng", value: "member" },
];

const roomRoleMeta = {
  representative: { color: "gold", label: "Đại diện phòng" },
  member: { color: "green", label: "Người thuê phòng" },
};

const statusMeta = {
  active: { color: "blue", label: "Đang thuê" },
  inactive: { color: "default", label: "Đã kết thúc" },
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
      message.error(error.response?.data?.message || "Không tải được dữ liệu lựa chọn");
    }
  };

  const fetchTenants = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/tenants");
      setTenants(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách khách thuê");
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
        message.success("Đã cập nhật khách thuê");
      } else {
        await http.post("/tenants", payload);
        message.success("Đã tạo khách thuê");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu khách thuê thất bại");
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
      message.success(nextStatus === "active" ? "Đã kích hoạt khách thuê" : "Đã kết thúc thuê");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/tenants/${record.id}`);
      message.success("Đã xóa khách thuê");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa khách thuê thất bại");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "KHÁCH THUÊ",
        dataIndex: "userName",
        key: "userName",
        width: 235,
        render: (value, record) => <Space size={11}><Avatar size={40} style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", fontWeight: 700 }}>{(value || "K").charAt(0).toUpperCase()}</Avatar><div><Typography.Text strong style={{ color: "#334155" }}>{value || "-"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.userIdentityNumber || "Chưa có CCCD/CMND"}</Typography.Text></div></Space>,
      },
      {
        title: "LIÊN HỆ",
        dataIndex: "userEmail",
        key: "userEmail",
        width: 225,
        render: (value, record) => <Space direction="vertical" size={0}><Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text><Typography.Text type="secondary">{record.userPhone || "-"}</Typography.Text></Space>,
      },
      {
        title: "PHÒNG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 180,
        render: (value, record) => <Typography.Text style={{ color: "#475569" }}>{value || "-"} - {record.roomName || "-"}</Typography.Text>,
      },
      {
        title: "PHÂN LOẠI",
        dataIndex: "roomRole",
        key: "roomRole",
        render: (roomRole) => {
          const meta = roomRoleMeta[roomRole] || roomRoleMeta.member;
          return <Tag bordered={false} style={{ background: roomRole === "representative" ? "#f5edff" : "#dcfce7", borderRadius: 5, color: roomRole === "representative" ? "#7c3aed" : "#15803d", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "NGÀY VÀO",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "NGÀY RỜI",
        dataIndex: "moveOutDate",
        key: "moveOutDate",
        render: formatDate,
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return <Tag bordered={false} icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />} style={{ background: status === "active" ? "#dcfce7" : "#f1f5f9", borderRadius: 5, color: status === "active" ? "#15803d" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 170,
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space size={7}>
              <Tooltip title="Xem chi tiết"><Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Tooltip title="Sửa khách thuê"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Tooltip title={isActive ? "Kết thúc thuê" : "Kích hoạt thuê"}><Button size="small" icon={isActive ? <LogoutOutlined /> : <LoginOutlined />} onClick={() => handleToggleStatus(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
              <Popconfirm
                title="Xóa khách thuê này?"
                description="Chỉ xóa được khách thuê đã kết thúc."
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
                disabled={isActive}
              >
                <Tooltip title="Xóa khách thuê"><Button danger size="small" icon={<DeleteOutlined />} disabled={isActive} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
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
        <Row gutter={[18, 18]} align="middle" justify="space-between"><Col xs={24} lg={15}><Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>TRỌ PLUS ADMIN</Typography.Text><Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>Quản lý khách thuê</Typography.Title><Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Gán người dùng vào phòng, theo dõi vai trò và trạng thái thuê.</Typography.Paragraph><Space wrap><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.total} khách thuê</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.active} đang thuê</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{tenantStats.representatives} đại diện phòng</Tag></Space></Col><Col xs={24} lg={9}><Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}><Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tải lại</Button><Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 8, boxShadow: "none", fontWeight: 800, height: 40 }}>Thêm khách thuê</Button></Space></Col></Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}><Row gutter={[12, 12]} align="middle" justify="space-between"><Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bộ lọc khách thuê</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tìm theo tên, liên hệ hoặc phòng đang thuê</Typography.Text></div></Space></Col><Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên, email, SĐT hoặc phòng" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Đặt lại</Button></Col></Row></Col></Row></Card>

      <Card title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><TeamOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sách khách thuê</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Quản lý người đang thuê và thông tin lưu trú</Typography.Text></div></Space>} extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hiển thị {filteredTenants.length}/{tenants.length}</Tag>} style={{ ...panelStyle, overflow: "hidden" }} styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTenants}
          loading={loading}
          size="middle"
          locale={{ emptyText: <Empty description="Không có khách thuê phù hợp" /> }}
          scroll={{ x: 1250 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} khách thuê` }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<UserSwitchOutlined />} />
            <div><Typography.Text strong>{editingTenant ? "Sửa khách thuê" : "Thêm khách thuê"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingTenant ? editingTenant.userName : "Gán người dùng vào phòng thuê"}</Typography.Text></div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingTenant ? "Lưu" : "Tạo khách thuê"}
        cancelText="Hủy"
        width={720}
      >
        <Alert showIcon type="info" message={editingTenant ? "Cập nhật thông tin lưu trú của khách thuê" : "Chọn tài khoản và phòng cho khách thuê mới"} style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin lưu trú</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Form.Item name="user" label="Tài khoản khách thuê" rules={[{ required: true, message: "Vui lòng chọn tài khoản khách thuê!" }]}>
            <Select
              options={userOptions}
              placeholder="Chọn tài khoản người dùng"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="room" label="Phòng" rules={[{ required: true, message: "Vui lòng chọn phòng!" }]}>
            <Select
              options={roomOptions}
              placeholder="Chọn phòng"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Space><UserSwitchOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thời gian và vai trò</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="moveInDate" label="Ngày vào ở" rules={[{ required: true, message: "Vui lòng chọn ngày vào ở!" }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="moveOutDate" label="Ngày rời đi">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="roomRole" label="Phân loại" rules={[{ required: true, message: "Vui lòng chọn phân loại vai trò!" }]}>
              <Select options={roomRoleOptions} />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }}>{(detailTenant?.userName || "K").charAt(0).toUpperCase()}</Avatar><div><Typography.Text strong>Chi tiết khách thuê</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailTenant?.userName || "Thông tin lưu trú"}</Typography.Text></div></Space>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailOpen(false)}>Đóng</Button>]}
        width={720}
      >
        {detailTenant && <><Alert showIcon type={detailTenant.status === "active" ? "success" : "info"} message={`Trạng thái: ${statusMeta[detailTenant.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} /><Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin khách thuê</Typography.Text></Space><Divider style={{ margin: "12px 0 16px" }} /><Descriptions bordered size="small" column={2}><Descriptions.Item label="Họ tên">{detailTenant.userName || "-"}</Descriptions.Item><Descriptions.Item label="Phân loại"><Tag bordered={false} color={roomRoleMeta[detailTenant.roomRole]?.color}>{roomRoleMeta[detailTenant.roomRole]?.label || "-"}</Tag></Descriptions.Item><Descriptions.Item label="Email">{detailTenant.userEmail || "-"}</Descriptions.Item><Descriptions.Item label="Số điện thoại">{detailTenant.userPhone || "-"}</Descriptions.Item><Descriptions.Item label="CCCD/CMND">{detailTenant.userIdentityNumber || "-"}</Descriptions.Item><Descriptions.Item label="Trạng thái"><Tag bordered={false} color={statusMeta[detailTenant.status]?.color}>{statusMeta[detailTenant.status]?.label || "-"}</Tag></Descriptions.Item></Descriptions><Space style={{ marginTop: 20 }}><UserSwitchOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thông tin phòng và thời gian</Typography.Text></Space><Divider style={{ margin: "12px 0 16px" }} /><Descriptions bordered size="small" column={2}><Descriptions.Item label="Phòng">{detailTenant.roomNumber || "-"} - {detailTenant.roomName || "-"}</Descriptions.Item><Descriptions.Item label="Ngày vào ở">{formatDate(detailTenant.moveInDate)}</Descriptions.Item><Descriptions.Item label="Ngày rời đi">{formatDate(detailTenant.moveOutDate)}</Descriptions.Item><Descriptions.Item label="Ghi chú" span={2}>{detailTenant.note || "-"}</Descriptions.Item></Descriptions></>}
      </Modal>
    </Space>
  );
};

export default TenantManagementPage;
