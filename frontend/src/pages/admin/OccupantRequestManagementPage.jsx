import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  HomeOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  PictureOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  Modal,
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

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusMeta = {
  approved: {
    color: "success",
    label: "Đã duyệt",
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    icon: <CheckCircleOutlined />,
  },
  pending: {
    color: "warning",
    label: "Chờ xử lý",
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    icon: <ClockCircleOutlined />,
  },
  rejected: {
    color: "error",
    label: "Đã từ chối",
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
    icon: <CloseCircleOutlined />,
  },
};

const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const inlineStyles = `
/* ==========================================================================
   Occupant Request Management - Modern Aesthetic Theme
   ========================================================================== */
.or-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: orFadeIn 0.35s ease-out;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

@keyframes orFadeIn {
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
.or-hero-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #4338ca 100%);
  border-radius: 18px;
  padding: 28px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px -4px rgba(67, 56, 202, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.or-hero-banner::before {
  content: "";
  position: absolute;
  top: -70px;
  right: -50px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.or-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -50px;
  left: 28%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.or-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.or-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.or-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  color: #c7d2fe;
  width: fit-content;
  letter-spacing: 0.5px;
}

.or-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
  animation: orPulse 2s infinite;
}

@keyframes orPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
}

.or-hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.or-hero-subtitle {
  color: #e2e8f0 !important;
  font-size: 13.5px;
  margin: 0 !important;
  max-width: 650px;
  line-height: 1.5;
}

.or-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.or-btn-reload {
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

.or-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

/* KPI Stats Grid */
.or-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.or-stat-card {
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

.or-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.or-stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.or-stat-card.stat-indigo::before { background: #6366f1; }
.or-stat-card.stat-amber::before { background: #f59e0b; }
.or-stat-card.stat-emerald::before { background: #10b981; }
.or-stat-card.stat-rose::before { background: #ef4444; }

.or-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.or-stat-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.or-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.or-stat-sub {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.or-stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.icon-indigo { background: #eef2ff; color: #6366f1; }
.icon-amber { background: #fffbeb; color: #f59e0b; }
.icon-emerald { background: #ecfdf5; color: #10b981; }
.icon-rose { background: #fef2f2; color: #ef4444; }

/* Filter Card */
.or-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.or-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.or-filter-left {
  flex: 1;
  min-width: 280px;
}

.or-filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.or-search-input {
  border-radius: 10px !important;
  height: 40px !important;
  border-color: #e2e8f0 !important;
  box-shadow: none !important;
  font-size: 13.5px !important;
}

.or-search-input:focus,
.or-search-input:hover {
  border-color: #6366f1 !important;
}

.or-select-filter {
  min-width: 170px;
}

.or-select-filter .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  border-color: #e2e8f0 !important;
}

.or-btn-reset {
  border-radius: 10px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
}

.or-btn-reset:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}

/* Table Card */
.or-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.or-table-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  flex-wrap: wrap;
  gap: 12px;
}

.or-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.or-count-pill {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 9999px;
  border: 1px solid #e0e7ff;
}

.or-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  font-weight: 700 !important;
  color: #64748b !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.or-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  font-size: 13.5px !important;
}

.or-table .ant-table-tbody > tr:hover > td {
  background: #fbfbfe !important;
}

/* User & Occupant Cells */
.or-user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.or-user-avatar {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  font-size: 14px !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25) !important;
  flex-shrink: 0;
}

.or-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.or-user-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 13.5px;
}

.or-user-sub {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Room Cell */
.or-room-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 2px 9px;
  border-radius: 6px;
  font-weight: 700;
  width: fit-content;
}

.or-room-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 3px;
}

/* Badges */
.or-status-badge {
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

.or-cccd-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
}

/* Action Buttons */
.or-btn-action {
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 12.5px !important;
  height: 34px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  transition: all 0.2s ease !important;
}

.or-btn-detail {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
}

.or-btn-detail:hover {
  color: #4f46e5 !important;
  border-color: #a5b4fc !important;
  background: #f5f3ff !important;
  transform: translateY(-1px);
}

.or-btn-approve {
  background: #10b981 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25) !important;
}

.or-btn-approve:hover {
  background: #059669 !important;
  border-color: #059669 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35) !important;
}

.or-btn-reject {
  background: #ffffff !important;
  border-color: #fca5a5 !important;
  color: #dc2626 !important;
}

.or-btn-reject:hover {
  background: #fef2f2 !important;
  border-color: #ef4444 !important;
  color: #b91c1c !important;
  transform: translateY(-1px);
}

/* Modal Customization */
.or-detail-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.or-detail-title {
  font-size: 17px;
  font-weight: 800;
  color: #1e1b4b;
}

.or-detail-sub {
  font-size: 12.5px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.or-image-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 240px;
}

.or-image-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.or-image-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

.or-note-box {
  background: #f8fafc;
  border-left: 4px solid #6366f1;
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
}

.or-admin-note-box {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
}
`;

const OccupantRequestManagementPage = () => {
  const [actionForm] = Form.useForm();
  const [actionModal, setActionModal] = useState({ open: false, record: null, type: "" });
  const [detailRecord, setDetailRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/occupant-requests");
      setRequests(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được yêu cầu thêm người ở");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((item) => item.status === "pending").length;
    const approved = requests.filter((item) => item.status === "approved").length;
    const rejected = requests.filter((item) => item.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.name,
          item.phone,
          item.identityNumber,
          item.requestedByName,
          item.requestedByPhone,
          item.requestedByEmail,
          item.roomNumber,
          item.roomName,
          item.note,
          item.adminNote,
        ].some((value) => String(value || "").toLowerCase().includes(keyword));

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchText, statusFilter]);

  const openActionModal = (record, type) => {
    actionForm.resetFields();
    setActionModal({ open: true, record, type });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, record: null, type: "" });
    actionForm.resetFields();
  };

  const handleSubmitAction = async (values) => {
    if (!actionModal.record || !actionModal.type) return;

    setSubmitting(true);
    try {
      await http.patch(`/occupant-requests/${actionModal.record.id}/${actionModal.type}`, {
        adminNote: values.adminNote || "",
      });
      message.success(
        actionModal.type === "approve"
          ? "Đã phê duyệt yêu cầu thêm người ở thành công"
          : "Đã từ chối yêu cầu thêm người ở thành công"
      );
      closeActionModal();
      if (detailRecord && detailRecord.id === actionModal.record.id) {
        setDetailRecord(null);
      }
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xử lý yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Người gửi yêu cầu",
      dataIndex: "requestedByName",
      key: "requestedByName",
      render: (value, record) => {
        const initials = String(value || "U").slice(0, 2).toUpperCase();
        return (
          <div className="or-user-cell">
            <Avatar className="or-user-avatar">{initials}</Avatar>
            <div className="or-user-info">
              <span className="or-user-name">{value || "Chưa xác định"}</span>
              <span className="or-user-sub">
                <PhoneOutlined style={{ fontSize: 11 }} />
                {record.requestedByPhone || record.requestedByEmail || "Không có SĐT"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Phòng đăng ký",
      key: "room",
      render: (_, record) => (
        <div>
          <div className="or-room-badge">
            <HomeOutlined />
            <span>Phòng {record.roomNumber || "-"}</span>
          </div>
          <div className="or-room-sub">
            {record.roomName ? `${record.roomName} • ` : ""}
            Tối đa {record.roomCapacity || 1} người
            {record.roomFloor ? ` • Tầng ${record.roomFloor}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Người ở mới",
      key: "occupant",
      render: (_, record) => (
        <div className="or-user-info">
          <Typography.Text strong style={{ color: "#0f172a", fontSize: 13.5 }}>
            {record.name}
          </Typography.Text>
          <Space size={6} wrap style={{ marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <PhoneOutlined style={{ marginRight: 3 }} />
              {record.phone}
            </span>
            <span className="or-cccd-tag">
              <IdcardOutlined />
              CCCD: {record.identityNumber}
            </span>
          </Space>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = statusMeta[status] || statusMeta.pending;
        return (
          <span
            className="or-status-badge"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.text,
            }}
          >
            {meta.icon}
            <span>{meta.label}</span>
          </span>
        );
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (
        <Space size={4} style={{ color: "#475569", fontSize: 13 }}>
          <CalendarOutlined style={{ color: "#94a3b8" }} />
          <span>{formatDate(value)}</span>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Xem chi tiết thông tin và ảnh CCCD">
            <Button
              className="or-btn-action or-btn-detail"
              icon={<EyeOutlined />}
              onClick={() => setDetailRecord(record)}
            >
              Chi tiết
            </Button>
          </Tooltip>
          {record.status === "pending" && (
            <>
              <Tooltip title="Duyệt yêu cầu và thêm vào phòng">
                <Button
                  className="or-btn-action or-btn-approve"
                  icon={<CheckCircleOutlined />}
                  onClick={() => openActionModal(record, "approve")}
                >
                  Duyệt
                </Button>
              </Tooltip>
              <Tooltip title="Từ chối yêu cầu">
                <Button
                  className="or-btn-action or-btn-reject"
                  icon={<CloseCircleOutlined />}
                  onClick={() => openActionModal(record, "reject")}
                >
                  Từ chối
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="or-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Banner Header */}
      <div className="or-hero-banner">
        <div className="or-hero-inner">
          <div className="or-hero-left">
            <div className="or-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG XỬ LÝ YÊU CẦU CƯ DÂN</span>
            </div>
            <h1 className="or-hero-title">Quản lý yêu cầu thêm người ở</h1>
            <p className="or-hero-subtitle">
              Xem xét, đối chiếu hồ sơ căn cước công dân và phê duyệt cư dân đăng ký thêm vào các phòng trọ một cách nhanh chóng, minh bạch.
            </p>
          </div>
          <div className="or-hero-right">
            <Button
              className="or-btn-reload"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchRequests}
            >
              Tải lại dữ liệu
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="or-stats-grid">
        <div className="or-stat-card stat-indigo">
          <div className="or-stat-info">
            <span className="or-stat-label">Tổng số yêu cầu</span>
            <span className="or-stat-value">{stats.total}</span>
            <span className="or-stat-sub">Tổng lượt đăng ký nhận được</span>
          </div>
          <div className="or-stat-icon-wrap icon-indigo">
            <TeamOutlined />
          </div>
        </div>

        <div className="or-stat-card stat-amber">
          <div className="or-stat-info">
            <span className="or-stat-label">Chờ phê duyệt</span>
            <span className="or-stat-value" style={{ color: "#d97706" }}>
              {stats.pending}
            </span>
            <span className="or-stat-sub">Hồ sơ cần quản trị viên xử lý</span>
          </div>
          <div className="or-stat-icon-wrap icon-amber">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="or-stat-card stat-emerald">
          <div className="or-stat-info">
            <span className="or-stat-label">Đã phê duyệt</span>
            <span className="or-stat-value" style={{ color: "#059669" }}>
              {stats.approved}
            </span>
            <span className="or-stat-sub">Đã xác nhận & thêm vào phòng</span>
          </div>
          <div className="or-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="or-stat-card stat-rose">
          <div className="or-stat-info">
            <span className="or-stat-label">Đã từ chối</span>
            <span className="or-stat-value" style={{ color: "#dc2626" }}>
              {stats.rejected}
            </span>
            <span className="or-stat-sub">Hồ sơ không hợp lệ hoặc bị hủy</span>
          </div>
          <div className="or-stat-icon-wrap icon-rose">
            <CloseCircleOutlined />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="or-filter-card">
        <div className="or-filter-row">
          <div className="or-filter-left">
            <Input
              allowClear
              className="or-search-input"
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo tên khách, người ở, số phòng, SĐT, CCCD..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 6 }} />}
              value={searchText}
            />
          </div>

          <div className="or-filter-right">
            <Select
              className="or-select-filter"
              onChange={setStatusFilter}
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "⏳ Chờ xử lý", value: "pending" },
                { label: "✅ Đã duyệt", value: "approved" },
                { label: "❌ Đã từ chối", value: "rejected" },
              ]}
              prefix={<FilterOutlined style={{ color: "#94a3b8" }} />}
              value={statusFilter}
            />

            {(searchText || statusFilter !== "all") && (
              <Button
                className="or-btn-reset"
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("all");
                }}
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="or-table-card">
        <div className="or-table-header">
          <h2 className="or-table-title">
            <UserAddOutlined style={{ color: "#4f46e5" }} />
            <span>Danh sách yêu cầu thêm người ở</span>
            <span className="or-count-pill">{filteredRequests.length} hồ sơ</span>
          </h2>

          {stats.pending > 0 && (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Có {stats.pending} yêu cầu đang chờ xử lý
            </Tag>
          )}
        </div>

        <Table
          className="or-table"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description="Không tìm thấy yêu cầu thêm người ở nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "24", "48"],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
          }}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Detail Record Modal */}
      <Modal
        footer={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <div>
              {detailRecord?.status === "pending" && (
                <Space>
                  <Button
                    className="or-btn-action or-btn-approve"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      const record = detailRecord;
                      setDetailRecord(null);
                      openActionModal(record, "approve");
                    }}
                  >
                    Phê duyệt ngay
                  </Button>
                  <Button
                    className="or-btn-action or-btn-reject"
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      const record = detailRecord;
                      setDetailRecord(null);
                      openActionModal(record, "reject");
                    }}
                  >
                    Từ chối yêu cầu
                  </Button>
                </Space>
              )}
            </div>
            <Button onClick={() => setDetailRecord(null)}>Đóng</Button>
          </Space>
        }
        onCancel={() => setDetailRecord(null)}
        open={Boolean(detailRecord)}
        title={
          <Space>
            <UserOutlined style={{ color: "#4f46e5" }} />
            <span>Chi tiết yêu cầu thêm người ở</span>
          </Space>
        }
        width={840}
      >
        {detailRecord && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div className="or-detail-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar size={48} style={{ backgroundColor: "#4f46e5", fontWeight: 700, fontSize: 18 }}>
                  {String(detailRecord.name || "U").slice(0, 2).toUpperCase()}
                </Avatar>
                <div>
                  <div className="or-detail-title">{detailRecord.name}</div>
                  <div className="or-detail-sub">
                    <span>Số phòng: Phòng {detailRecord.roomNumber || "-"}</span>
                    <span>•</span>
                    <span>Gửi lúc: {formatDate(detailRecord.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <span
                  className="or-status-badge"
                  style={{
                    backgroundColor: statusMeta[detailRecord.status]?.bg,
                    borderColor: statusMeta[detailRecord.status]?.border,
                    color: statusMeta[detailRecord.status]?.text,
                  }}
                >
                  {statusMeta[detailRecord.status]?.icon}
                  <span>{statusMeta[detailRecord.status]?.label}</span>
                </span>
              </div>
            </div>

            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="Người gửi yêu cầu">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>{detailRecord.requestedByName || "Chưa xác định"}</Typography.Text>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {detailRecord.requestedByPhone || "-"}
                  </span>
                  {detailRecord.requestedByEmail && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      <MailOutlined style={{ marginRight: 4 }} />
                      {detailRecord.requestedByEmail}
                    </span>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Thông tin phòng">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>Phòng {detailRecord.roomNumber || "-"}</Typography.Text>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    {detailRecord.roomName ? `${detailRecord.roomName} • ` : ""}
                    Sức chứa: {detailRecord.roomCapacity || 1} người
                    {detailRecord.roomFloor ? ` (Tầng ${detailRecord.roomFloor})` : ""}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Người ở mới">
                <Typography.Text strong style={{ color: "#1e293b" }}>
                  {detailRecord.name}
                </Typography.Text>
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại người ở mới">
                <Typography.Text copyable>{detailRecord.phone}</Typography.Text>
              </Descriptions.Item>

              <Descriptions.Item label="Số CCCD / CMND">
                <Typography.Text copyable strong style={{ color: "#4338ca" }}>
                  {detailRecord.identityNumber}
                </Typography.Text>
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái xử lý">
                <Space>
                  <Tag color={statusMeta[detailRecord.status]?.color}>
                    {statusMeta[detailRecord.status]?.label}
                  </Tag>
                  {detailRecord.processedAt && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      ({formatDate(detailRecord.processedAt)})
                    </span>
                  )}
                </Space>
              </Descriptions.Item>

              {detailRecord.processedByName && (
                <Descriptions.Item label="Người xử lý" span={2}>
                  <Typography.Text>{detailRecord.processedByName}</Typography.Text>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Ghi chú từ khách thuê" span={2}>
                {detailRecord.note ? (
                  <div className="or-note-box">{detailRecord.note}</div>
                ) : (
                  <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Không có ghi chú</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ghi chú từ quản trị viên" span={2}>
                {detailRecord.adminNote ? (
                  <div className="or-admin-note-box">{detailRecord.adminNote}</div>
                ) : (
                  <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa có ghi chú phản hồi</span>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "12px 0" }}>
              <Space>
                <PictureOutlined style={{ color: "#4f46e5" }} />
                <span style={{ fontWeight: 600, color: "#334155" }}>
                  Hình ảnh căn cước công dân (CCCD / CMND)
                </span>
              </Space>
            </Divider>

            <Image.PreviewGroup>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div className="or-image-card">
                  <div className="or-image-label">
                    <IdcardOutlined style={{ color: "#4f46e5" }} />
                    <span>Mặt trước CCCD / CMND</span>
                  </div>
                  {detailRecord.identityFrontImage ? (
                    <Image
                      alt="Mặt trước CCCD"
                      height={200}
                      src={toImageUrl(detailRecord.identityFrontImage)}
                      style={{ borderRadius: 8, objectFit: "cover", width: "100%" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f1f5f9",
                        borderRadius: 8,
                        color: "#94a3b8",
                      }}
                    >
                      Không có ảnh mặt trước
                    </div>
                  )}
                </div>

                <div className="or-image-card">
                  <div className="or-image-label">
                    <IdcardOutlined style={{ color: "#4f46e5" }} />
                    <span>Mặt sau CCCD / CMND</span>
                  </div>
                  {detailRecord.identityBackImage ? (
                    <Image
                      alt="Mặt sau CCCD"
                      height={200}
                      src={toImageUrl(detailRecord.identityBackImage)}
                      style={{ borderRadius: 8, objectFit: "cover", width: "100%" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f1f5f9",
                        borderRadius: 8,
                        color: "#94a3b8",
                      }}
                    >
                      Không có ảnh mặt sau
                    </div>
                  )}
                </div>
              </div>
            </Image.PreviewGroup>
          </Space>
        )}
      </Modal>

      {/* Action Confirmation Modal (Approve / Reject) */}
      <Modal
        confirmLoading={submitting}
        okButtonProps={{
          danger: actionModal.type === "reject",
          style:
            actionModal.type === "approve"
              ? { backgroundColor: "#10b981", borderColor: "#10b981" }
              : undefined,
        }}
        okText={actionModal.type === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        onCancel={closeActionModal}
        onOk={() => actionForm.submit()}
        open={actionModal.open}
        title={
          <Space>
            {actionModal.type === "approve" ? (
              <CheckCircleOutlined style={{ color: "#10b981" }} />
            ) : (
              <CloseCircleOutlined style={{ color: "#ef4444" }} />
            )}
            <span>
              {actionModal.type === "approve"
                ? "Phê duyệt yêu cầu thêm người ở"
                : "Từ chối yêu cầu thêm người ở"}
            </span>
          </Space>
        }
      >
        <Form form={actionForm} layout="vertical" onFinish={handleSubmitAction}>
          {actionModal.record && (
            <Alert
              description={
                actionModal.type === "approve"
                  ? `Người ở mới ${actionModal.record.name} sẽ được kích hoạt vào danh sách người ở của Phòng ${actionModal.record.roomNumber || "-"}.`
                  : `Yêu cầu thêm người ở ${actionModal.record.name} cho Phòng ${actionModal.record.roomNumber || "-"} sẽ bị từ chối.`
              }
              message={
                actionModal.type === "approve"
                  ? "Xác nhận phê duyệt hồ sơ"
                  : "Xác nhận từ chối hồ sơ"
              }
              showIcon
              style={{ marginBottom: 16 }}
              type={actionModal.type === "approve" ? "info" : "warning"}
            />
          )}

          <Form.Item
            label="Ghi chú từ quản trị viên (gửi đến khách thuê)"
            name="adminNote"
          >
            <Input.TextArea
              placeholder={
                actionModal.type === "approve"
                  ? "Nhập ghi chú phản hồi cho khách thuê nếu cần..."
                  : "Nhập lý do từ chối để thông báo cho khách thuê (khuyến khích)..."
              }
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OccupantRequestManagementPage;
