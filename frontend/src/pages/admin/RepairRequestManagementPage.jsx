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
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const priorityOptions = [
  { label: "Thấp", value: "low" },
  { label: "Trung bình", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khẩn cấp", value: "urgent" },
];

const priorityMeta = {
  low: { color: "default", label: "Thấp" },
  medium: { color: "blue", label: "Trung bình" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khẩn cấp" },
};

const statusOptions = [
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đã xử lý", value: "resolved" },
  { label: "Đã hủy", value: "cancelled" },
];

const statusMeta = {
  pending: { color: "warning", label: "Chờ xử lý" },
  processing: { color: "processing", label: "Đang xử lý" },
  resolved: { color: "success", label: "Đã xử lý" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const creatorRoleMeta = {
  admin: { color: "purple", label: "Quản trị viên" },
  user: { color: "green", label: "Người dùng" },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chưa xử lý");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const statIconStyle = {
  alignItems: "center",
  borderRadius: 8,
  display: "inline-flex",
  justifyContent: "center",
};

const sectionTitleStyle = {
  color: "#334155",
  fontSize: 15,
};

const mutedTextStyle = {
  color: "#94a3b8",
  fontSize: 12,
};

const toolbarInputStyle = {
  borderRadius: 8,
  height: 40,
};

const panelStyle = {
  border: "1px solid #eef2f7",
  borderRadius: 12,
};

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
      message.error(error.response?.data?.message || "Không tải được danh sách phòng");
    }
  };

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/repair-requests");
      setRequests(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách sự cố");
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
      message.success("Đã cập nhật xử lý sự cố");

      closeModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu sự cố thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/repair-requests/${record.id}`);
      setDetailRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết sự cố");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/repair-requests/${record.id}`);
      message.success("Đã xóa sự cố");
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa sự cố thất bại");
    }
  };

  const columns = [
    {
      title: "SỰ CỐ",
      dataIndex: "title",
      key: "title",
      width: 255,
      render: (value, record) => <Space size={11}><Avatar size={40} style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }} icon={<ToolOutlined />} /><div><Typography.Text strong style={{ color: "#334155" }}>{value}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.roomNumber || "-"} - {record.roomName || "-"}</Typography.Text></div></Space>,
    },
    {
      title: "NGƯỜI TẠO",
      key: "creator",
      render: (_, record) => {
        const roleMeta = creatorRoleMeta[record.createdByRole] || creatorRoleMeta.user;

        return (
          <Space direction="vertical" size={2}><Typography.Text style={{ color: "#475569" }}>{record.createdByName || record.tenantName || "-"}</Typography.Text><Tag bordered={false} style={{ background: record.createdByRole === "admin" ? "#f5edff" : "#dcfce7", color: record.createdByRole === "admin" ? "#7c3aed" : "#15803d", borderRadius: 5, fontWeight: 700, margin: 0, width: "fit-content" }}>{roleMeta.label}</Tag></Space>
        );
      },
    },
    {
      title: "MỨC ĐỘ",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = priorityMeta[priority] || priorityMeta.medium;
        return <Tag bordered={false} style={{ background: priority === "urgent" ? "#fee2e2" : priority === "high" ? "#ffedd5" : priority === "medium" ? "#dbeafe" : "#f1f5f9", borderRadius: 5, color: priority === "urgent" ? "#dc2626" : priority === "high" ? "#c2410c" : priority === "medium" ? "#2563eb" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = statusMeta[status] || statusMeta.pending;
        return <Tag bordered={false} icon={status === "resolved" ? <CheckCircleOutlined /> : status === "cancelled" ? <StopOutlined /> : undefined} style={{ background: status === "resolved" ? "#dcfce7" : status === "cancelled" ? "#f1f5f9" : status === "processing" ? "#dbeafe" : "#fef3c7", borderRadius: 5, color: status === "resolved" ? "#15803d" : status === "cancelled" ? "#64748b" : status === "processing" ? "#2563eb" : "#b45309", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
      },
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "NGÀY MONG MUỐN",
      dataIndex: "requestedResolveDate",
      key: "requestedResolveDate",
      render: formatDate,
    },
    {
      title: "NGÀY XỬ LÝ",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: formatResolvedDate,
    },
    {
      title: "ẢNH",
      dataIndex: "images",
      key: "images",
      render: (images = []) => `${images.length || 0} ảnh`,
    },
    {
      title: "THAO TÁC",
      key: "actions",
      fixed: "right",
      align: "center",
      width: 135,
      render: (_, record) => (
        <Space size={7}>
          <Tooltip title="Xem chi tiết"><Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          <Tooltip title="Sửa sự cố"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          <Popconfirm
            title="Xóa sự cố này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa sự cố"><Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto", fontFamily: "Inter, 'Segoe UI', Arial, sans-serif", letterSpacing: "0.1px" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }}>
        <Row gutter={[18, 18]} align="middle" justify="space-between"><Col xs={24} lg={15}><Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>TRỌ PLUS ADMIN</Typography.Text><Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30, letterSpacing: "-0.5px" }}>Quản lý sự cố</Typography.Title><Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Theo dõi, phân loại và cập nhật tiến độ xử lý sự cố trong tòa nhà.</Typography.Paragraph><Space wrap><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.total} sự cố</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.pending} cần xử lý</Tag><Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{requestStats.urgent} khẩn cấp</Tag></Space></Col><Col xs={24} lg={9}><Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}><Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tải lại</Button></Space></Col></Row>
      </Card>

      <Card style={{ background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}><Row gutter={[12, 12]} align="middle" justify="space-between"><Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bộ lọc sự cố</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tìm theo tiêu đề, phòng hoặc người báo cáo</Typography.Text></div></Space></Col><Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm sự cố, phòng hoặc người tạo" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Đặt lại</Button></Col></Row></Col></Row></Card>

      <Card title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><ToolOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sách sự cố</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Quản lý các yêu cầu bảo trì và sửa chữa</Typography.Text></div></Space>} extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hiển thị {filteredRequests.length}/{requests.length}</Tag>} style={{ ...panelStyle, overflow: "hidden" }} styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} sự cố` }}
          locale={{ emptyText: <Empty description="Chưa có sự cố phù hợp" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<ToolOutlined />} />
            <div><Typography.Text strong>Cập nhật xử lý sự cố</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingRequest?.title || "Thông tin sự cố"}</Typography.Text></div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu"
        cancelText="Hủy"
        width={780}
      >
        <Alert showIcon type="info" message="Cập nhật tiến độ và kết quả xử lý" style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><ToolOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin xử lý</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="priority" label="Mức độ" rules={[{ required: true }]}>
              <Select options={priorityOptions} />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="resolvedAt" label="Ngày xử lý">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Ngày user mong muốn">
              <Input
                disabled
                value={formatDate(editingRequest?.requestedResolveDate)}
              />
            </Form.Item>
            <Form.Item name="room" label="Phòng" rules={[{ required: true }]}>
              <Select options={roomOptions} showSearch optionFilterProp="label" placeholder="Chọn phòng" />
            </Form.Item>
            <Form.Item label="Người tạo">
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
          <Space><EditOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Mô tả và ghi chú</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="VD: Điều hòa không lạnh" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả sự cố" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="adminNote" label="Ghi chú xử lý">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Ảnh sự cố">
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
              <Typography.Text type="secondary">Không có ảnh</Typography.Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }} icon={<ToolOutlined />} /><div><Typography.Text strong>Chi tiết sự cố</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailRequest?.title || "Thông tin bảo trì"}</Typography.Text></div></Space>}
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {detailRequest && (
          <>
            <Alert showIcon type={detailRequest.status === "resolved" ? "success" : "info"} message={`Trạng thái: ${statusMeta[detailRequest.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} />
            <Space><ToolOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin sự cố</Typography.Text></Space>
            <Divider style={{ margin: "12px 0 16px" }} />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tiêu đề" span={2}>
                {detailRequest.title}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {detailRequest.roomNumber} - {detailRequest.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {detailRequest.createdByName || detailRequest.tenantName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò người tạo">
                <Tag color={creatorRoleMeta[detailRequest.createdByRole]?.color}>
                  {creatorRoleMeta[detailRequest.createdByRole]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ">
                <Tag color={priorityMeta[detailRequest.priority]?.color}>
                  {priorityMeta[detailRequest.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMeta[detailRequest.status]?.color}>
                  {statusMeta[detailRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailRequest.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày user mong muốn">
                {formatDate(detailRequest.requestedResolveDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày xử lý">{formatResolvedDate(detailRequest.resolvedAt)}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 20 }}><EditOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Nội dung và kết quả xử lý</Typography.Text></Space>
            <Divider style={{ margin: "12px 0 16px" }} />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mô tả" span={2}>
                {detailRequest.description}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú xử lý" span={2}>
                {detailRequest.adminNote || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh sự cố" span={2}>
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
