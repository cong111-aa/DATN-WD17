import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilterOutlined,
  FireOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
  ToolOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
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
  low: {
    color: "default",
    label: "Thấp",
    bg: "#f1f5f9",
    textColor: "#475569",
    border: "#cbd5e1",
    icon: <InfoCircleOutlined />,
  },
  medium: {
    color: "blue",
    label: "Trung bình",
    bg: "#eff6ff",
    textColor: "#1d4ed8",
    border: "#bfdbfe",
    icon: <InfoCircleOutlined />,
  },
  high: {
    color: "orange",
    label: "Cao",
    bg: "#fff7ed",
    textColor: "#c2410c",
    border: "#fed7aa",
    icon: <WarningOutlined />,
  },
  urgent: {
    color: "error",
    label: "Khẩn cấp",
    bg: "#fef2f2",
    textColor: "#b91c1c",
    border: "#fecaca",
    icon: <FireOutlined />,
  },
};

const statusOptions = [
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đã xử lý", value: "resolved" },
  { label: "Đã hủy", value: "cancelled" },
];

const statusMeta = {
  pending: {
    color: "warning",
    label: "Chờ xử lý",
    bg: "#fffbeb",
    textColor: "#b45309",
    border: "#fde68a",
    icon: <ClockCircleOutlined />,
  },
  processing: {
    color: "processing",
    label: "Đang xử lý",
    bg: "#eff6ff",
    textColor: "#2563eb",
    border: "#bfdbfe",
    icon: <SyncOutlined spin />,
  },
  resolved: {
    color: "success",
    label: "Đã xử lý",
    bg: "#ecfdf5",
    textColor: "#047857",
    border: "#a7f3d0",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    color: "default",
    label: "Đã hủy",
    bg: "#f1f5f9",
    textColor: "#64748b",
    border: "#e2e8f0",
    icon: <StopOutlined />,
  },
};

const creatorRoleMeta = {
  admin: {
    color: "purple",
    label: "Quản trị viên",
    bg: "#f5edff",
    textColor: "#7c3aed",
    border: "#e9d5ff",
  },
  user: {
    color: "green",
    label: "Khách thuê",
    bg: "#ecfdf5",
    textColor: "#047857",
    border: "#a7f3d0",
  },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chưa xử lý");
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

const inlineStyles = `
/* ==========================================================================
   Repair Request Management - Modern Aesthetic Theme
   ========================================================================== */
.rp-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: rpFadeIn 0.35s ease-out;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

@keyframes rpFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hero Banner */
.rp-hero-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #4f46e5 100%);
  border-radius: 18px;
  padding: 30px 36px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px -4px rgba(79, 70, 229, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.rp-hero-banner::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.rp-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -60px;
  left: 25%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.rp-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.rp-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  color: #c7d2fe;
  width: fit-content;
  letter-spacing: 0.5px;
}

.rp-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #f87171;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.7);
  animation: rpPulse 2s infinite;
}

@keyframes rpPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(248, 113, 113, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}

.rp-hero-title {
  font-size: 28px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.rp-hero-subtitle {
  color: #e2e8f0 !important;
  font-size: 14px;
  margin: 0 !important;
  max-width: 640px;
  line-height: 1.5;
}

.rp-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rp-btn-reload {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  backdrop-filter: blur(8px);
  font-weight: 600 !important;
  height: 42px !important;
  padding: 0 18px !important;
  transition: all 0.2s ease !important;
}

.rp-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

/* KPI Stats Grid */
.rp-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.rp-stat-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.rp-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.rp-stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.rp-stat-card.stat-indigo::before { background: #6366f1; }
.rp-stat-card.stat-amber::before { background: #f59e0b; }
.rp-stat-card.stat-rose::before { background: #ef4444; }
.rp-stat-card.stat-emerald::before { background: #10b981; }

.rp-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rp-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rp-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.rp-stat-sub {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.rp-stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.icon-indigo {
  background: #eef2ff;
  color: #6366f1;
}

.icon-amber {
  background: #fffbeb;
  color: #f59e0b;
}

.icon-rose {
  background: #fef2f2;
  color: #ef4444;
}

.icon-emerald {
  background: #ecfdf5;
  color: #10b981;
}

/* Filter Card */
.rp-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.rp-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.rp-filter-left {
  flex: 1;
  min-width: 280px;
}

.rp-filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rp-search-input {
  border-radius: 10px !important;
  height: 40px !important;
  border-color: #e2e8f0 !important;
  box-shadow: none !important;
  font-size: 13px !important;
}

.rp-search-input:focus,
.rp-search-input:hover {
  border-color: #6366f1 !important;
}

.rp-select-filter {
  min-width: 170px;
}

.rp-select-filter .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  border-color: #e2e8f0 !important;
}

.rp-btn-reset {
  border-radius: 10px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
}

.rp-btn-reset:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}

/* Table Card */
.rp-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.rp-table-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  flex-wrap: wrap;
  gap: 12px;
}

.rp-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rp-count-pill {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #e0e7ff;
}

.rp-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  font-weight: 700 !important;
  color: #64748b !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.rp-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  font-size: 13px !important;
}

.rp-table .ant-table-tbody > tr:hover > td {
  background: #fbfbfe !important;
}

/* Repair Issue Cell */
.rp-issue-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.rp-issue-avatar {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: #ffffff !important;
  font-size: 18px !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3) !important;
  flex-shrink: 0;
  margin-top: 2px;
}

.rp-issue-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rp-issue-title {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.rp-room-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 1px 8px;
  border-radius: 6px;
  font-weight: 600;
  width: fit-content;
}

/* Creator Cell */
.rp-creator-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rp-creator-name {
  font-weight: 600;
  color: #334155;
  font-size: 13px;
}

/* Badges */
.rp-priority-badge,
.rp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  border-width: 1px;
  border-style: solid;
}

.rp-date-text {
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.rp-images-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

/* Action Buttons */
.rp-action-btn {
  width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #475569 !important;
  transition: all 0.2s ease !important;
}

.rp-action-btn:hover {
  transform: translateY(-1px) !important;
}

.rp-action-btn.btn-view:hover {
  color: #4f46e5 !important;
  border-color: #c7d2fe !important;
  background: #eef2ff !important;
}

.rp-action-btn.btn-edit:hover {
  color: #0284c7 !important;
  border-color: #bae6fd !important;
  background: #f0f9ff !important;
}

.rp-action-btn.btn-delete:hover {
  color: #dc2626 !important;
  border-color: #fecaca !important;
  background: #fef2f2 !important;
}

/* Form Styles */
.rp-form-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
  margin-top: 14px;
}

.rp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .rp-form-grid {
    grid-template-columns: 1fr;
  }
}

.rp-form-grid .ant-form-item {
  margin-bottom: 14px;
}

.rp-input-rounded {
  border-radius: 8px !important;
}

.rp-input-rounded .ant-select-selector,
.rp-input-rounded.ant-picker {
  border-radius: 8px !important;
  width: 100% !important;
}

/* Detail Profile Card */
.rp-detail-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.rp-detail-banner-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rp-detail-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e1b4b;
}

.rp-detail-sub {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rp-admin-note-box {
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}
`;

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
      const matchesSearch =
        !keyword ||
        [item.title, item.roomNumber, item.roomName, item.createdByName, item.tenantName].some(
          (value) => String(value || "").toLowerCase().includes(keyword)
        );
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

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

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
      message.success("Đã cập nhật tiến độ xử lý sự cố");

      closeModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu thông tin sự cố thất bại");
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
      message.success("Đã xóa sự cố thành công");
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa sự cố thất bại");
    }
  };

  const columns = [
    {
      title: "Sự cố & Phòng",
      dataIndex: "title",
      key: "title",
      width: 270,
      render: (value, record) => (
        <div className="rp-issue-cell">
          <Avatar size={40} className="rp-issue-avatar" icon={<ToolOutlined />} />
          <div className="rp-issue-info">
            <span className="rp-issue-title">{value}</span>
            <span className="rp-room-badge">
              <HomeOutlined />
              Phòng {record.roomNumber || "-"} ({record.roomName || "-"})
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Người báo cáo",
      key: "creator",
      width: 190,
      render: (_, record) => {
        const roleMeta = creatorRoleMeta[record.createdByRole] || creatorRoleMeta.user;

        return (
          <div className="rp-creator-cell">
            <span className="rp-creator-name">
              <UserOutlined style={{ marginRight: 6, color: "#94a3b8" }} />
              {record.createdByName || record.tenantName || "-"}
            </span>
            <Tag
              bordered={false}
              style={{
                background: roleMeta.bg,
                color: roleMeta.textColor,
                borderColor: roleMeta.border,
                borderRadius: 5,
                fontWeight: 700,
                margin: 0,
                width: "fit-content",
              }}
            >
              {roleMeta.label}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Mức độ",
      dataIndex: "priority",
      key: "priority",
      width: 140,
      render: (priority) => {
        const meta = priorityMeta[priority] || priorityMeta.medium;
        return (
          <span
            className="rp-priority-badge"
            style={{
              background: meta.bg,
              color: meta.textColor,
              borderColor: meta.border,
            }}
          >
            {meta.icon}
            {meta.label}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const meta = statusMeta[status] || statusMeta.pending;
        return (
          <span
            className="rp-status-badge"
            style={{
              background: meta.bg,
              color: meta.textColor,
              borderColor: meta.border,
            }}
          >
            {meta.icon}
            {meta.label}
          </span>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (value) => (
        <span className="rp-date-text">
          <CalendarOutlined style={{ color: "#6366f1" }} />
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: "Hạn mong muốn",
      dataIndex: "requestedResolveDate",
      key: "requestedResolveDate",
      width: 140,
      render: (value) => (
        <span className="rp-date-text">
          <ClockCircleOutlined style={{ color: value ? "#f59e0b" : "#94a3b8" }} />
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: "Ngày xử lý",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      width: 130,
      render: (value) => (
        <span className="rp-date-text">
          <CheckCircleOutlined style={{ color: value ? "#10b981" : "#94a3b8" }} />
          {formatResolvedDate(value)}
        </span>
      ),
    },
    {
      title: "Ảnh",
      dataIndex: "images",
      key: "images",
      width: 100,
      render: (images = []) => (
        <span className="rp-images-badge">
          <PictureOutlined style={{ color: "#6366f1" }} />
          {images.length || 0} ảnh
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết sự cố">
            <Button
              size="small"
              className="rp-action-btn btn-view"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Cập nhật xử lý">
            <Button
              size="small"
              className="rp-action-btn btn-edit"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa sự cố này?"
            description="Hành động này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa sự cố">
              <Button danger size="small" className="rp-action-btn btn-delete" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="rp-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Welcome Banner */}
      <div className="rp-hero-banner">
        <div className="rp-hero-inner">
          <div className="rp-hero-left">
            <div className="rp-hero-badge">
              <span className="pulse-dot" />
              <span>TRỌ PLUS • BẢO TRÌ & SỰ CỐ</span>
            </div>
            <Typography.Title level={2} className="rp-hero-title">
              Quản Lý Yêu Cầu Sửa Chữa & Bảo Trì
            </Typography.Title>
            <Typography.Paragraph className="rp-hero-subtitle">
              Theo dõi tình trạng hư hỏng, phân loại mức độ khẩn cấp và cập nhật tiến độ giải quyết sự cố cho khách thuê phòng.
            </Typography.Paragraph>
          </div>

          <div className="rp-hero-right">
            <Button
              className="rp-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refreshAll}
              loading={loading}
            >
              Tải lại
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="rp-stats-grid">
        <div className="rp-stat-card stat-indigo">
          <div className="rp-stat-info">
            <span className="rp-stat-label">Tổng số sự cố</span>
            <span className="rp-stat-value">{requestStats.total}</span>
            <span className="rp-stat-sub">Toàn bộ yêu cầu bảo trì</span>
          </div>
          <div className="rp-stat-icon-wrap icon-indigo">
            <ToolOutlined />
          </div>
        </div>

        <div className="rp-stat-card stat-amber">
          <div className="rp-stat-info">
            <span className="rp-stat-label">Chờ & Đang xử lý</span>
            <span className="rp-stat-value" style={{ color: "#d97706" }}>
              {requestStats.pending}
            </span>
            <span className="rp-stat-sub">Cần xử lý kịp thời</span>
          </div>
          <div className="rp-stat-icon-wrap icon-amber">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="rp-stat-card stat-rose">
          <div className="rp-stat-info">
            <span className="rp-stat-label">Khẩn cấp</span>
            <span className="rp-stat-value" style={{ color: "#dc2626" }}>
              {requestStats.urgent}
            </span>
            <span className="rp-stat-sub">Ưu tiên khắc phục ngay</span>
          </div>
          <div className="rp-stat-icon-wrap icon-rose">
            <FireOutlined />
          </div>
        </div>

        <div className="rp-stat-card stat-emerald">
          <div className="rp-stat-info">
            <span className="rp-stat-label">Đã hoàn thành</span>
            <span className="rp-stat-value" style={{ color: "#059669" }}>
              {requestStats.resolved}
            </span>
            <span className="rp-stat-sub">Đã sửa chữa xong</span>
          </div>
          <div className="rp-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rp-filter-card">
        <div className="rp-filter-row">
          <div className="rp-filter-left">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm theo tiêu đề sự cố, số phòng, người báo cáo..."
              className="rp-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="rp-filter-right">
            <Select
              value={statusFilter}
              className="rp-select-filter"
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
            />
            <Button className="rp-btn-reset" icon={<ReloadOutlined />} onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rp-table-card">
        <div className="rp-table-header">
          <h3 className="rp-table-title">
            <ToolOutlined style={{ color: "#6366f1" }} />
            Danh Sách Sự Cố Cần Xử Lý
          </h3>
          <span className="rp-count-pill">
            Hiển thị {filteredRequests.length} / {requests.length} sự cố
          </span>
        </div>

        <Table
          rowKey="id"
          className="rp-table"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng cộng ${total} sự cố`,
          }}
          locale={{ emptyText: <Empty description="Chưa có yêu cầu sự cố nào phù hợp" /> }}
        />
      </div>

      {/* Update / Edit Modal */}
      <Modal
        title={
          <Space size={12}>
            <Avatar size={38} style={{ background: "#4f46e5" }} icon={<ToolOutlined />} />
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Cập nhật xử lý sự cố
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingRequest?.title || "Thông tin bảo trì sự cố"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={780}
      >
        <Alert
          showIcon
          type="info"
          message="Cập nhật tiến độ xử lý, trạng thái và ngày hoàn thành sự cố."
          style={{ marginBottom: 18, borderRadius: 8 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="rp-form-section">
            <ToolOutlined style={{ color: "#6366f1" }} />
            <span>Tiến độ & Phân loại xử lý</span>
          </div>
          <Divider style={{ margin: "8px 0 14px" }} />

          <div className="rp-form-grid">
            <Form.Item name="priority" label="Mức độ ưu tiên" rules={[{ required: true, message: "Chọn mức độ!" }]}>
              <Select options={priorityOptions} className="rp-input-rounded" />
            </Form.Item>

            <Form.Item name="status" label="Trạng thái xử lý" rules={[{ required: true, message: "Chọn trạng thái!" }]}>
              <Select options={statusOptions} className="rp-input-rounded" />
            </Form.Item>

            <Form.Item name="resolvedAt" label="Ngày xử lý xong">
              <DatePicker className="rp-input-rounded" format="DD/MM/YYYY" placeholder="Chọn ngày hoàn thành" />
            </Form.Item>

            <Form.Item label="Hạn user mong muốn">
              <Input
                disabled
                value={formatDate(editingRequest?.requestedResolveDate)}
                className="rp-input-rounded"
              />
            </Form.Item>

            <Form.Item name="room" label="Phòng xảy ra sự cố" rules={[{ required: true, message: "Chọn phòng!" }]}>
              <Select
                options={roomOptions}
                showSearch
                optionFilterProp="label"
                placeholder="Chọn phòng"
                className="rp-input-rounded"
              />
            </Form.Item>

            <Form.Item label="Người tạo yêu cầu">
              <Input
                disabled
                value={
                  editingRequest
                    ? `${editingRequest.createdByName || editingRequest.tenantName || "-"} (${creatorRoleMeta[editingRequest.createdByRole]?.label || "-"})`
                    : ""
                }
                className="rp-input-rounded"
              />
            </Form.Item>
          </div>

          <div className="rp-form-section">
            <EditOutlined style={{ color: "#2563eb" }} />
            <span>Mô tả chi tiết & Ghi chú quản lý</span>
          </div>
          <Divider style={{ margin: "8px 0 14px" }} />

          <Form.Item name="title" label="Tiêu đề sự cố" rules={[{ required: true, message: "Nhập tiêu đề!" }]}>
            <Input placeholder="VD: Điều hòa không lạnh, Rò rỉ ống nước..." className="rp-input-rounded" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sự cố của khách" rules={[{ required: true, message: "Nhập mô tả!" }]}>
            <Input.TextArea rows={3} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="adminNote" label="Ghi chú kết quả xử lý của quản trị viên">
            <Input.TextArea
              rows={3}
              placeholder="Nhập phương án khắc phục, chi phí sửa chữa hoặc lưu ý..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item label="Hình ảnh hiện trường đính kèm">
            {(editingRequest?.images || []).length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap size={10}>
                  {editingRequest.images.map((image) => (
                    <Image
                      key={image}
                      src={toImageUrl(image)}
                      width={120}
                      height={90}
                      style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">Khách hàng không đính kèm hình ảnh</Typography.Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space size={12}>
            <Avatar size={38} style={{ background: "#4f46e5" }} icon={<ToolOutlined />} />
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Hồ sơ chi tiết sự cố bảo trì
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {detailRequest?.title || "Thông tin bảo trì"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {detailRequest && (
          <div style={{ marginTop: 8 }}>
            {/* Incident Summary Card */}
            <div className="rp-detail-banner">
              <div className="rp-detail-banner-left">
                <Avatar
                  size={52}
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    fontSize: 22,
                  }}
                  icon={<ToolOutlined />}
                />
                <div>
                  <div className="rp-detail-title">{detailRequest.title}</div>
                  <div className="rp-detail-sub">
                    <HomeOutlined /> Phòng {detailRequest.roomNumber || "-"} ({detailRequest.roomName || "-"}) •{" "}
                    <UserOutlined /> Người tạo: {detailRequest.createdByName || detailRequest.tenantName || "-"}
                  </div>
                </div>
              </div>

              <Space>
                <Tag
                  bordered={false}
                  style={{
                    background: priorityMeta[detailRequest.priority]?.bg,
                    color: priorityMeta[detailRequest.priority]?.textColor,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {priorityMeta[detailRequest.priority]?.icon} Mức độ: {priorityMeta[detailRequest.priority]?.label || "-"}
                </Tag>
                <Tag
                  bordered={false}
                  style={{
                    background: statusMeta[detailRequest.status]?.bg,
                    color: statusMeta[detailRequest.status]?.textColor,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {statusMeta[detailRequest.status]?.label || "-"}
                </Tag>
              </Space>
            </div>

            {/* Thông tin sự cố */}
            <div className="rp-form-section">
              <ToolOutlined style={{ color: "#6366f1" }} />
              <span>Thông tin chung về sự cố</span>
            </div>
            <Divider style={{ margin: "8px 0 14px" }} />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tiêu đề sự cố" span={2}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{detailRequest.title}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng bị sự cố">
                <span style={{ fontWeight: 600, color: "#047857" }}>
                  Phòng {detailRequest.roomNumber} ({detailRequest.roomName})
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Người báo cáo">
                {detailRequest.createdByName || detailRequest.tenantName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò người tạo">
                <Tag bordered={false} color={creatorRoleMeta[detailRequest.createdByRole]?.color}>
                  {creatorRoleMeta[detailRequest.createdByRole]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ ưu tiên">
                <Tag bordered={false} color={priorityMeta[detailRequest.priority]?.color}>
                  {priorityMeta[detailRequest.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo yêu cầu">
                {formatDate(detailRequest.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn user mong muốn">
                {formatDate(detailRequest.requestedResolveDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày xử lý xong" span={2}>
                <span style={{ fontWeight: 600, color: detailRequest.resolvedAt ? "#047857" : "#64748b" }}>
                  {formatResolvedDate(detailRequest.resolvedAt)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {/* Nội dung & Ghi chú */}
            <div className="rp-form-section" style={{ marginTop: 20 }}>
              <EditOutlined style={{ color: "#2563eb" }} />
              <span>Nội dung mô tả & Kết quả xử lý</span>
            </div>
            <Divider style={{ margin: "8px 0 14px" }} />
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Mô tả sự cố từ khách">
                {detailRequest.description || "Không có mô tả chi tiết"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú của quản trị viên">
                {detailRequest.adminNote ? (
                  <div className="rp-admin-note-box">{detailRequest.adminNote}</div>
                ) : (
                  <Typography.Text type="secondary">Chưa có ghi chú xử lý</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh chụp hiện trường">
                {(detailRequest.images || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap size={12}>
                      {detailRequest.images.map((image) => (
                        <Image
                          key={image}
                          src={toImageUrl(image)}
                          width={130}
                          height={95}
                          style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Typography.Text type="secondary">Không có hình ảnh đính kèm</Typography.Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RepairRequestManagementPage;
