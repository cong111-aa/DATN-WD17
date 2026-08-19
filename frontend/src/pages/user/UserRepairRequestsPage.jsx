import {
  AlertOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileImageOutlined,
  HomeOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import http from "../../api/http";

const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toUploadedImageUrls = (fileList = []) =>
  fileList.flatMap((file) => file.response?.urls || (file.rawUrl ? [file.rawUrl] : file.url ? [file.url] : []));

const toRepairImageFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    rawUrl: url,
    status: "done",
    url: toImageUrl(url),
  }));

const repairPriorityOptions = [
  { label: "Thấp", value: "low" },
  { label: "Trung bình", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khẩn cấp 🚨", value: "urgent" },
];

const repairPriorityMeta = {
  low: { color: "default", label: "Thấp", bg: "#f8fafc", text: "#64748b" },
  medium: { color: "blue", label: "Trung bình", bg: "#eff6ff", text: "#2563eb" },
  high: { color: "orange", label: "Cao", bg: "#fff7ed", text: "#c2410c" },
  urgent: { color: "error", label: "Khẩn cấp 🚨", bg: "#fef2f2", text: "#e11d48", urgent: true },
};

const repairStatusMeta = {
  pending: {
    color: "warning",
    label: "Chờ tiếp nhận",
    badgeBg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    icon: <ClockCircleOutlined />,
  },
  processing: {
    color: "processing",
    label: "Đang xử lý",
    badgeBg: "#eff6ff",
    text: "#2563eb",
    border: "#bfdbfe",
    icon: <SyncOutlined spin />,
  },
  resolved: {
    color: "success",
    label: "Đã khắc phục",
    badgeBg: "#f0fdf4",
    text: "#15803d",
    border: "#bbf7d0",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    color: "default",
    label: "Đã hủy",
    badgeBg: "#f8fafc",
    text: "#64748b",
    border: "#e2e8f0",
    icon: <ExclamationCircleOutlined />,
  },
};

const UserRepairRequestsPage = () => {
  const [repairForm] = Form.useForm();
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [tenancies, setTenancies] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [editingRepairRequest, setEditingRepairRequest] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [detailRepairRequest, setDetailRepairRequest] = useState(null);
  const [repairImageFileList, setRepairImageFileList] = useState([]);

  const activeTenancies = useMemo(
    () => tenancies.filter((tenancy) => tenancy.status === "active"),
    [tenancies]
  );

  const activeRoomOptions = useMemo(
    () =>
      activeTenancies.map((tenancy) => ({
        label: `Phòng ${tenancy.roomNumber} - ${tenancy.roomName || "Phòng trọ đang thuê"}`,
        value: tenancy.room,
      })),
    [activeTenancies]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenRes, repRes] = await Promise.all([
        http.get("/me/tenancies"),
        http.get("/me/repair-requests"),
      ]);
      setTenancies(tenRes.data || []);
      setRepairRequests(repRes.data || []);
      if (outletContext?.refreshBadgeCounts) {
        outletContext.refreshBadgeCounts();
      }
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRepairModal = () => {
    setEditingRepairRequest(null);
    setRepairImageFileList([]);
    repairForm.resetFields();
    setRepairModalOpen(true);
  };

  const openEditRepairModal = (request) => {
    setEditingRepairRequest(request);
    setRepairImageFileList(toRepairImageFileList(request.images || []));
    repairForm.setFieldsValue({
      room: request.room,
      priority: request.priority,
      requestedResolveDate: request.requestedResolveDate ? dayjs(request.requestedResolveDate) : null,
      title: request.title,
      description: request.description,
    });
    setRepairModalOpen(true);
  };

  const closeRepairModal = () => {
    setRepairModalOpen(false);
    setEditingRepairRequest(null);
    setRepairImageFileList([]);
    repairForm.resetFields();
  };

  const handleRepairImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/repair-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload ảnh sự cố thất bại");
      onError(error);
    }
  };

  const handleCreateRepairRequest = async (values) => {
    setRepairSubmitting(true);
    try {
      const payload = {
        ...values,
        images: toUploadedImageUrls(repairImageFileList),
        requestedResolveDate: values.requestedResolveDate
          ? values.requestedResolveDate.toISOString()
          : null,
      };

      if (editingRepairRequest) {
        await http.put(`/me/repair-requests/${editingRepairRequest.id}`, payload);
        message.success("Đã cập nhật thông tin báo cáo sự cố thành công!");
      } else {
        await http.post("/me/repair-requests", payload);
        message.success("Đã gửi báo cáo sự cố! Ban quản lý sẽ xử lý sớm nhất.");
      }

      closeRepairModal();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi báo cáo sự cố thất bại");
    } finally {
      setRepairSubmitting(false);
    }
  };

  const handleViewRepairRequest = async (request) => {
    try {
      const { data } = await http.get(`/me/repair-requests/${request.id}`);
      setDetailRepairRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết sự cố");
    }
  };

  const handleDeleteRepairRequest = async (request) => {
    try {
      await http.delete(`/me/repair-requests/${request.id}`);
      message.success("Đã hủy báo cáo sự cố");
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa sự cố thất bại");
    }
  };

  // Filter logic
  const filteredRequests = useMemo(() => {
    return repairRequests.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
          ? item.status === "pending" || item.status === "processing"
          : item.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [repairRequests, statusFilter, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const pending = repairRequests.filter((r) => r.status === "pending" || r.status === "processing").length;
    const resolved = repairRequests.filter((r) => r.status === "resolved").length;
    const urgent = repairRequests.filter((r) => r.priority === "urgent").length;
    const total = repairRequests.length;
    return { pending, resolved, urgent, total };
  }, [repairRequests]);

  // Table Columns
  const repairRequestColumns = [
    {
      title: "Sự cố kỹ thuật",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <Space size={10}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: record.priority === "urgent" ? "#fef2f2" : "#fff1f2",
              color: record.priority === "urgent" ? "#dc2626" : "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <ToolOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
              {title}
            </Text>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Phòng {record.roomNumber || "-"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Mức độ khẩn cấp",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = repairPriorityMeta[priority] || repairPriorityMeta.medium;
        return (
          <Tag color={meta.color} style={{ borderRadius: 6, fontWeight: 700 }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái xử lý",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = repairStatusMeta[status] || repairStatusMeta.pending;
        return (
          <Tag
            icon={meta.icon}
            style={{
              background: meta.badgeBg,
              color: meta.text,
              borderColor: meta.border,
              borderRadius: 6,
              fontWeight: 600,
              padding: "3px 10px",
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Ngày gửi báo cáo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size={8} wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewRepairRequest(record)}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            Chi tiết
          </Button>

          {record.status === "pending" && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditRepairModal(record)}
                style={{ borderRadius: 6 }}
              >
                Sửa
              </Button>
              <Popconfirm
                title="Hủy báo cáo sự cố này?"
                description="Bạn có chắc chắn muốn hủy yêu cầu bảo trì này không?"
                okText="Xóa ngay"
                cancelText="Hủy"
                onConfirm={() => handleDeleteRepairRequest(record)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
                  Hủy
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="my-repairs-container">
      {/* Hero Header Section */}
      <div className="my-repairs-hero">
        <div className="my-repairs-hero-badge">
          <ToolOutlined />
          <span>TRUNG TÂM BẢO TRÌ & XỬ LÝ SỰ CỐ 24/7 • TRO PLUS</span>
        </div>
        <Title level={2} className="my-repairs-hero-title">
          Báo Cáo & Xử Lý Sự Cố Kỹ Thuật
        </Title>
        <p className="my-repairs-hero-desc">
          Gửi yêu cầu sửa chữa thiết bị hỏng hóc, sự cố điện nước hay hạ tầng phòng trọ. Ban quản lý tiếp nhận & điều phối kỹ thuật viên hỗ trợ tận nơi nhanh chóng 24/7.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-repairs-stats-grid">
          <div className="my-repairs-stat-card">
            <div className="my-repairs-stat-icon rose">
              <ToolOutlined />
            </div>
            <div>
              <div className="my-repairs-stat-val">{stats.total}</div>
              <div className="my-repairs-stat-lbl">Tổng yêu cầu đã báo</div>
            </div>
          </div>

          <div className="my-repairs-stat-card amber">
            <div className="my-repairs-stat-icon amber">
              <ClockCircleOutlined />
            </div>
            <div>
              <div className="my-repairs-stat-val">{stats.pending}</div>
              <div className="my-repairs-stat-lbl">Đang chờ xử lý</div>
            </div>
          </div>

          <div className="my-repairs-stat-card emerald">
            <div className="my-repairs-stat-icon emerald">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="my-repairs-stat-val">{stats.resolved}</div>
              <div className="my-repairs-stat-lbl">Đã khắc phục xong</div>
            </div>
          </div>

          <div className="my-repairs-stat-card blue">
            <div className="my-repairs-stat-icon blue">
              <AlertOutlined />
            </div>
            <div>
              <div className="my-repairs-stat-val">{stats.urgent}</div>
              <div className="my-repairs-stat-lbl">Sự cố khẩn cấp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-repairs-control-bar">
        <Space wrap size={12}>
          <Input
            placeholder="Tìm theo tên sự cố, phòng..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 300, width: "100%", borderRadius: 10 }}
          />

          <Segmented
            options={[
              { label: `Tất cả (${repairRequests.length})`, value: "all" },
              {
                label: `Đang chờ / Xử lý (${stats.pending})`,
                value: "pending",
              },
              {
                label: `Đã xong (${stats.resolved})`,
                value: "resolved",
              },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ borderRadius: 10, background: "#f1f5f9" }}
          />
        </Space>

        <Space size={12}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openRepairModal}
            disabled={activeRoomOptions.length === 0}
            style={{
              background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            Báo sự cố mới
          </Button>

          <Segmented
            options={[
              { value: "grid", icon: <AppstoreOutlined /> },
              { value: "table", icon: <UnorderedListOutlined /> },
            ]}
            value={viewMode}
            onChange={setViewMode}
            style={{ borderRadius: 10, background: "#f1f5f9" }}
          />
        </Space>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#64748b", fontWeight: 500 }}>
            Đang tải dữ liệu sự cố bảo trì...
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="my-rooms-empty-sales-card">
          <div
            className="my-rooms-empty-icon-wrapper"
            style={{ background: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)", color: "#e11d48" }}
          >
            <ToolOutlined />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy yêu cầu phù hợp"
              : "Không có sự cố nào được ghi nhận"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng kiểm tra lại bộ lọc tìm kiếm."
              : "Hệ thống thiết bị phòng trọ của bạn đang vận hành ổn định. Nếu phát sinh hỏng hóc, hãy gửi báo cáo ngay cho chúng tôi!"}
          </Paragraph>

          <Space size={14} wrap style={{ justifyContent: "center" }}>
            {activeRoomOptions.length > 0 && (
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={openRepairModal}
                style={{
                  background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                  borderRadius: 12,
                  height: 48,
                  padding: "0 28px",
                  fontWeight: 700,
                }}
              >
                Gửi báo cáo sự cố ngay
              </Button>
            )}
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/user/my-rooms")}
              style={{ borderRadius: 12, height: 48, padding: "0 24px", fontWeight: 600 }}
            >
              Về trang phòng của tôi
            </Button>
          </Space>
        </div>
      ) : viewMode === "grid" ? (
        /* Card Grid View */
        <div className="my-repairs-grid">
          {filteredRequests.map((request) => {
            const statusMeta = repairStatusMeta[request.status] || repairStatusMeta.pending;
            const priorityMeta = repairPriorityMeta[request.priority] || repairPriorityMeta.medium;
            const isUrgent = request.priority === "urgent";

            return (
              <div
                key={request.id}
                className={`my-repair-card ${isUrgent ? "urgent" : ""}`}
              >
                {/* Header */}
                <div className="my-repair-card-header">
                  <div>
                    <h3 className="my-repair-title">{request.title}</h3>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      Phòng {request.roomNumber || "-"} • Ngày báo: {formatDate(request.createdAt)}
                    </div>
                  </div>

                  <Tag
                    icon={statusMeta.icon}
                    style={{
                      background: statusMeta.badgeBg,
                      color: statusMeta.text,
                      borderColor: statusMeta.border,
                      borderRadius: 8,
                      fontWeight: 700,
                      padding: "4px 10px",
                    }}
                  >
                    {statusMeta.label}
                  </Tag>
                </div>

                {/* Body */}
                <div className="my-repair-card-body">
                  <div className="my-repair-info-box">
                    <div className="my-repair-info-row">
                      <span style={{ color: "#64748b" }}>Mức độ ưu tiên:</span>
                      <Tag color={priorityMeta.color} style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                        {priorityMeta.label}
                      </Tag>
                    </div>

                    {request.requestedResolveDate && (
                      <div className="my-repair-info-row">
                        <span style={{ color: "#64748b" }}>Ngày mong muốn hỗ trợ:</span>
                        <strong style={{ color: "#0f172a" }}>{formatDate(request.requestedResolveDate)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Description preview */}
                  <div
                    style={{
                      fontSize: 13,
                      color: "#334155",
                      lineHeight: 1.5,
                      background: "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 2 }}>
                      Mô tả chi tiết:
                    </Text>
                    {request.description || "Không có mô tả chi tiết."}
                  </div>

                  {/* Image attachment indicator */}
                  {(request.images || []).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0f766e" }}>
                      <FileImageOutlined />
                      <span>Đã đính kèm {request.images.length} hình ảnh thực tế</span>
                    </div>
                  )}

                  {/* Admin feedback note */}
                  {request.adminNote && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#92400e",
                        background: "#fef3c7",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #fde68a",
                      }}
                    >
                      💬 <strong>Phản hồi kỹ thuật:</strong> {request.adminNote}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="my-repair-card-actions">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewRepairRequest(request)}
                      style={{
                        flex: 1,
                        background: "#0f766e",
                        borderColor: "#0f766e",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      Chi tiết
                    </Button>

                    {request.status === "pending" && (
                      <>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => openEditRepairModal(request)}
                          style={{ borderRadius: 10 }}
                        >
                          Sửa
                        </Button>
                        <Popconfirm
                          title="Hủy báo cáo sự cố?"
                          description="Bạn chắc chắn muốn hủy yêu cầu bảo trì này không?"
                          okText="Hủy ngay"
                          cancelText="Đóng"
                          onConfirm={() => handleDeleteRepairRequest(request)}
                        >
                          <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 10 }} />
                        </Popconfirm>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            rowKey="id"
            columns={repairRequestColumns}
            dataSource={filteredRequests}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      {/* Create / Edit Repair Modal */}
      <Modal
        title={
          <Space size={10}>
            <ToolOutlined style={{ color: "#e11d48", fontSize: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              {editingRepairRequest ? "Chỉnh Sửa Báo Cáo Sự Cố" : "Báo Cáo Sự Cố Thiết Bị & Bảo Trì"}
            </span>
          </Space>
        }
        open={repairModalOpen}
        onCancel={closeRepairModal}
        onOk={() => repairForm.submit()}
        confirmLoading={repairSubmitting}
        okText={editingRepairRequest ? "Cập nhật" : "Gửi báo cáo"}
        cancelText="Đóng"
        width={720}
        centered
        okButtonProps={{
          style: {
            borderRadius: 8,
            background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
            fontWeight: 700,
          },
        }}
      >
        <Form form={repairForm} layout="vertical" onFinish={handleCreateRepairRequest} style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item name="room" label="Chọn phòng trọ" rules={[{ required: true, message: "Vui lòng chọn phòng" }]}>
              <Select options={activeRoomOptions} placeholder="Chọn phòng đang ở" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item name="priority" label="Mức độ khẩn cấp" rules={[{ required: true }]}>
              <Select options={repairPriorityOptions} style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>

          <Form.Item name="requestedResolveDate" label="Ngày mong muốn kỹ thuật viên hỗ trợ">
            <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày mong muốn" style={{ width: "100%", borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="title" label="Tiêu đề sự cố" rules={[{ required: true, message: "Vui lòng nhập tiêu đề sự cố" }]}>
            <Input placeholder="VD: Vòi nước bồn rửa rò rỉ, điều hòa không mát..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết sự cố" rules={[{ required: true, message: "Vui lòng mô tả chi tiết" }]}>
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết hiện trạng hư hỏng để kỹ thuật viên chuẩn bị vật tư sửa chữa..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item label="Hình ảnh thực tế hiện trạng sự cố">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleRepairImageUpload}
              fileList={repairImageFileList}
              listType="picture-card"
              multiple
              onChange={({ fileList }) => setRepairImageFileList(fileList)}
            >
              {repairImageFileList.length >= 10 ? null : (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <UploadOutlined style={{ fontSize: 20, color: "#e11d48" }} />
                  <div style={{ marginTop: 4, fontSize: 12 }}>Tải ảnh lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Repair Detail Modal */}
      <Modal
        title={
          <Space size={10}>
            <EyeOutlined style={{ color: "#0f766e", fontSize: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              Chi Tiết Yêu Cầu Bảo Trì #{detailRepairRequest?.title}
            </span>
          </Space>
        }
        open={Boolean(detailRepairRequest)}
        onCancel={() => setDetailRepairRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRepairRequest(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={760}
        centered
      >
        {detailRepairRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Tiêu đề sự cố" span={2}>
                <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                  {detailRepairRequest.title}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng trọ">
                Phòng {detailRepairRequest.roomNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ khẩn cấp">
                <Tag color={repairPriorityMeta[detailRepairRequest.priority]?.color}>
                  {repairPriorityMeta[detailRepairRequest.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái xử lý">
                <Tag color={repairStatusMeta[detailRepairRequest.status]?.color}>
                  {repairStatusMeta[detailRepairRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gửi báo cáo">
                {formatDate(detailRepairRequest.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả sự cố" span={2}>
                {detailRepairRequest.description}
              </Descriptions.Item>
              <Descriptions.Item label="Phản hồi từ Ban quản lý" span={2}>
                <Text type={detailRepairRequest.adminNote ? "warning" : "secondary"}>
                  {detailRepairRequest.adminNote || "Chưa có phản hồi mới từ kỹ thuật viên."}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Photo Gallery Grid */}
            {(detailRepairRequest.images || []).length > 0 && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                  🖼️ Hình ảnh hiện trạng đã đính kèm ({detailRepairRequest.images.length} ảnh):
                </Text>
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailRepairRequest.images.map((image, idx) => (
                      <Image
                        key={idx}
                        src={toImageUrl(image)}
                        width={120}
                        height={90}
                        style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserRepairRequestsPage;
