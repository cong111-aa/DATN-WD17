import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  ToolOutlined,
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
  Image,
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

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const panelStyle = { border: "1px solid #eef1f7", borderRadius: 8, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" };
const heroStyle = { ...panelStyle, overflow: "hidden", background: "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #5b21b6 0%, #7c2dff 46%, #2563eb 100%)", backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto" };
const statIconStyle = { alignItems: "center", borderRadius: 8, display: "flex", height: 42, justifyContent: "center", width: 42 };
const toolbarInputStyle = { borderRadius: 8, height: 40 };
const mutedTextStyle = { color: "#64748b" };
const sectionTitleStyle = { color: "#0f172a", fontSize: 16 };

const priorityOptions = [
  { label: "Thap", value: "low" },
  { label: "Trung binh", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khan cap", value: "urgent" },
];

const priorityMeta = {
  low: { color: "default", label: "Thap" },
  medium: { color: "blue", label: "Trung binh" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khan cap" },
};

const statusOptions = [
  { label: "Cho xu ly", value: "pending" },
  { label: "Dang xu ly", value: "processing" },
  { label: "Da xu ly", value: "resolved" },
  { label: "Da huy", value: "cancelled" },
];

const statusMeta = {
  pending: { color: "warning", label: "Cho xu ly" },
  processing: { color: "processing", label: "Dang xu ly" },
  resolved: { color: "success", label: "Da xu ly" },
  cancelled: { color: "default", label: "Da huy" },
};

const creatorRoleMeta = {
  admin: { color: "purple", label: "Admin" },
  user: { color: "green", label: "Nguoi dung" },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chua xu ly");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toFormValues = (record) => ({
  adminNote: record.adminNote,
  description: record.description,
  priority: record.priority,
  resolvedAt: record.resolvedAt ? dayjs(record.resolvedAt) : undefined,
  room: record.room,
  status: record.status,
  title: record.title,
});

const toPayload = (values) => ({
  ...values,
  resolvedAt: values.resolvedAt ? values.resolvedAt.toISOString() : undefined,
});

const RepairRequestManagementPage = () => {
  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requestStats = useMemo(() => {
    const pending = requests.filter((item) => ["pending", "processing"].includes(item.status)).length;
    const resolved = requests.filter((item) => item.status === "resolved").length;
    const urgent = requests.filter((item) => item.priority === "urgent").length;
    return { pending, resolved, urgent, total: requests.length };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesSearch = !keyword || [item.title, item.roomNumber, item.roomName, item.createdByName, item.tenantName]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
      return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
    });
  }, [requests, searchText, statusFilter]);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const fetchRooms = async () => {
    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
    }
  };

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/repair-requests");
      setRequests(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach su co");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRequests();
  }, []);

  const refreshAll = () => {
    fetchRooms();
    fetchRequests();
  };

  const resetFilters = () => { setSearchText(""); setStatusFilter("all"); };

  const openEditModal = (record) => {
    setEditingRequest(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRequest(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      await http.put(`/repair-requests/${editingRequest.id}`, toPayload(values));
      message.success("Da cap nhat xu ly su co");

      closeModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu su co that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/repair-requests/${record.id}`);
      setDetailRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet su co");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/repair-requests/${record.id}`);
      message.success("Da xoa su co");
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa su co that bai");
    }
  };

  const columns = [
    {
      title: "SU CO",
      dataIndex: "title",
      key: "title",
      width: 255,
      render: (value, record) => <Space size={11}><Avatar size={40} style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }} icon={<ToolOutlined />} /><div><Typography.Text strong style={{ color: "#334155" }}>{value}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.roomNumber || "-"} - {record.roomName || "-"}</Typography.Text></div></Space>,
    },
    {
      title: "NGUOI TAO",
      key: "creator",
      render: (_, record) => {
        const roleMeta = creatorRoleMeta[record.createdByRole] || creatorRoleMeta.user;

        return (
          <Space direction="vertical" size={2}><Typography.Text style={{ color: "#475569" }}>{record.createdByName || record.tenantName || "-"}</Typography.Text><Tag bordered={false} style={{ background: record.createdByRole === "admin" ? "#f5edff" : "#dcfce7", color: record.createdByRole === "admin" ? "#7c3aed" : "#15803d", borderRadius: 5, fontWeight: 700, margin: 0, width: "fit-content" }}>{roleMeta.label}</Tag></Space>
        );
      },
    },
    {
      title: "MUC DO",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = priorityMeta[priority] || priorityMeta.medium;
        return <Tag bordered={false} style={{ background: priority === "urgent" ? "#fee2e2" : priority === "high" ? "#ffedd5" : priority === "medium" ? "#dbeafe" : "#f1f5f9", borderRadius: 5, color: priority === "urgent" ? "#dc2626" : priority === "high" ? "#c2410c" : priority === "medium" ? "#2563eb" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
      },
    },
    {
      title: "TRANG THAI",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = statusMeta[status] || statusMeta.pending;
        return <Tag bordered={false} icon={status === "resolved" ? <CheckCircleOutlined /> : status === "cancelled" ? <StopOutlined /> : undefined} style={{ background: status === "resolved" ? "#dcfce7" : status === "cancelled" ? "#f1f5f9" : status === "processing" ? "#dbeafe" : "#fef3c7", borderRadius: 5, color: status === "resolved" ? "#15803d" : status === "cancelled" ? "#64748b" : status === "processing" ? "#2563eb" : "#b45309", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
      },
    },
    {
      title: "NGAY TAO",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "NGAY MONG MUON",
      dataIndex: "requestedResolveDate",
      key: "requestedResolveDate",
      render: formatDate,
    },
    {
      title: "NGAY XU LY",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: formatResolvedDate,
    },
    {
      title: "ANH",
      dataIndex: "images",
      key: "images",
      render: (images = []) => `${images.length || 0} anh`,
    },
    {
      title: "THAO TAC",
      key: "actions",
      fixed: "right",
      align: "center",
      width: 135,
      render: (_, record) => (
        <Space size={7}>
          <Tooltip title="Xem chi tiet"><Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          <Tooltip title="Sua su co"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          <Popconfirm
            title="Xoa su co nay?"
            okText="Xoa"
            cancelText="Huy"
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xoa su co"><Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto", fontFamily: "Inter, 'Segoe UI', Arial, sans-serif", letterSpacing: "0.1px" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between"><Col xs={24} lg={15}><Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>TRO PLUS ADMIN</Typography.Text><Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30, letterSpacing: "-0.5px" }}>Quan ly su co</Typography.Title><Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Theo doi, phan loai va cap nhat tien do xu ly su co trong toa nha.</Typography.Paragraph><Space wrap><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.total} su co</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.pending} can xu ly</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.urgent} khan cap</Tag></Space></Col><Col xs={24} lg={9}><Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}><Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tai lai</Button></Space></Col></Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}><Row gutter={[12, 12]} align="middle" justify="space-between"><Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bo loc su co</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tim theo tieu de, phong hoac nguoi bao cao</Typography.Text></div></Space></Col><Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tim su co, phong hoac nguoi tao" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Dat lai</Button></Col></Row></Col></Row></Card>

      <Card title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><ToolOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sach su co</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Quan ly cac yeu cau bao tri va sua chua</Typography.Text></div></Space>} extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hien thi {filteredRequests.length}/{requests.length}</Tag>} style={{ ...panelStyle, overflow: "hidden" }} styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} su co` }}
          locale={{ emptyText: <Empty description="Chua co su co phu hop" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<ToolOutlined />} />
            <div><Typography.Text strong>Cap nhat xu ly su co</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingRequest?.title || "Thong tin su co"}</Typography.Text></div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Luu"
        cancelText="Huy"
        width={780}
      >
        <Alert showIcon type="info" message="Cap nhat tien do va ket qua xu ly" style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><ToolOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin xu ly</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="priority" label="Muc do" rules={[{ required: true }]}>
              <Select options={priorityOptions} />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="resolvedAt" label="Ngay xu ly">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Ngay user mong muon">
              <Input
                disabled
                value={formatDate(editingRequest?.requestedResolveDate)}
              />
            </Form.Item>
            <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
              <Select options={roomOptions} showSearch optionFilterProp="label" placeholder="Chon phong" />
            </Form.Item>
            <Form.Item label="Nguoi tao">
              <Input
                disabled
                value={
                  editingRequest
                    ? `${editingRequest.createdByName || editingRequest.tenantName || "-"} (${creatorRoleMeta[editingRequest.createdByRole]?.label || "-"})`
                    : ""
                }
              />
            </Form.Item>
          </div>
          <Space><EditOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Mo ta va ghi chu</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Form.Item name="title" label="Tieu de" rules={[{ required: true }]}>
            <Input placeholder="VD: Dieu hoa khong lanh" />
          </Form.Item>
          <Form.Item name="description" label="Mo ta su co" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="adminNote" label="Ghi chu xu ly">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Anh su co">
            {(editingRequest?.images || []).length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {editingRequest.images.map((image) => (
                    <Image
                      key={image}
                      src={toImageUrl(image)}
                      width={120}
                      height={86}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">Khong co anh</Typography.Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }} icon={<ToolOutlined />} /><div><Typography.Text strong>Chi tiet su co</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailRequest?.title || "Thong tin bao tri"}</Typography.Text></div></Space>}
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Dong
          </Button>,
        ]}
        width={820}
      >
        {detailRequest && (
          <>
          <Alert showIcon type={detailRequest.status === "resolved" ? "success" : "info"} message={`Trang thai: ${statusMeta[detailRequest.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} />
          <Space><ToolOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin su co</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Tieu de" span={2}>
              {detailRequest.title}
            </Descriptions.Item>
            <Descriptions.Item label="Phong">
              {detailRequest.roomNumber} - {detailRequest.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Nguoi tao">
              {detailRequest.createdByName || detailRequest.tenantName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vai tro nguoi tao">
              <Tag color={creatorRoleMeta[detailRequest.createdByRole]?.color}>
                {creatorRoleMeta[detailRequest.createdByRole]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Muc do">
              <Tag color={priorityMeta[detailRequest.priority]?.color}>
                {priorityMeta[detailRequest.priority]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trang thai">
              <Tag color={statusMeta[detailRequest.status]?.color}>
                {statusMeta[detailRequest.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngay tao">{formatDate(detailRequest.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Ngay user mong muon">
              {formatDate(detailRequest.requestedResolveDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngay xu ly">{formatResolvedDate(detailRequest.resolvedAt)}</Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 20 }}><EditOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Noi dung va ket qua xu ly</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mo ta" span={2}>
              {detailRequest.description}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chu xu ly" span={2}>
              {detailRequest.adminNote || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Anh su co" span={2}>
              {(detailRequest.images || []).length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailRequest.images.map((image) => (
                      <Image
                        key={image}
                        src={toImageUrl(image)}
                        width={120}
                        height={86}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
          </>
        )}
      </Modal>
    </Space>
  );
};

export default RepairRequestManagementPage;
