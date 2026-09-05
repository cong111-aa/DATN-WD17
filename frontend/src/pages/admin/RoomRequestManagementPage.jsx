import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  HomeOutlined,
  PhoneOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SolutionOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
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

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const requestTypeMeta = {
  hold_deposit: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Giữ phòng" },
  rent: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Thuê phòng" },
};

const requestStatusMeta = {
  pending: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Chờ xác nhận" },
  approved: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Đã xác nhận" },
  rejected: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Từ chối" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", label: "Đã hủy" },
  expired: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Hết hạn" },
};

const paymentStatusMeta = {
  unpaid: { bg: "#f1f5f9", color: "#64748b", label: "Chưa thanh toán" },
  pending: { bg: "#eff6ff", color: "#2563eb", label: "Đang thanh toán" },
  paid: { bg: "#ecfdf5", color: "#047857", label: "Đã thanh toán" },
  failed: { bg: "#fef2f2", color: "#b91c1c", label: "Thất bại" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
};

const paymentProviderMeta = {
  manual_qr: { color: "cyan", label: "QR thủ công" },
  vnpay: { color: "blue", label: "VNPay" },
};

const getPaymentStateMeta = (record) => {
  if (record.paymentProvider === "vnpay") {
    if (record.paymentStatus === "paid") {
      return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Thanh toán thành công" };
    }

    if (["failed", "cancelled"].includes(record.paymentStatus)) {
      return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Thanh toán thất bại" };
    }

    return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Đang thanh toán" };
  }

  if (record.paymentStatus === "paid") {
    return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Đã xác nhận" };
  }

  if (["failed", "cancelled"].includes(record.paymentStatus)) {
    return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Thất bại" };
  }

  return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Chờ xác nhận" };
};

const getPaymentProviderMeta = (provider) =>
  provider === "vnpay" ? paymentProviderMeta.vnpay : paymentProviderMeta.manual_qr;

const inlineStyles = `
/* ==========================================================================
   Room Request Management - Direct Embedded Theme (Synchronized)
   ========================================================================== */
.rr-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: rrFadeIn 0.35s ease-out;
}

@keyframes rrFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hero Banner */
.rr-hero-banner {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%);
  border-radius: 16px;
  padding: 28px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.rr-hero-banner::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.35) 0%, rgba(129, 140, 248, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.rr-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -60px;
  left: 25%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.rr-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.rr-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rr-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #c7d2fe;
  width: fit-content;
}

.rr-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #818cf8;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7);
  animation: rrPulse 2s infinite;
}

@keyframes rrPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(129, 140, 248, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
}

.rr-hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.rr-hero-subtitle {
  color: #e2e8f0 !important;
  font-size: 14px;
  margin: 0 !important;
  max-width: 620px;
}

.rr-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rr-btn-reload {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  backdrop-filter: blur(8px);
  font-weight: 600;
  height: 40px !important;
  transition: all 0.2s ease !important;
}

.rr-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

/* KPI Stats Grid */
.rr-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.rr-stat-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.rr-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  border-color: #cbd5e1;
}

.rr-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rr-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.rr-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.rr-stat-sub {
  font-size: 12px;
  color: #94a3b8;
}

.rr-stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.rr-stat-card:hover .rr-stat-icon-wrap {
  transform: scale(1.08);
}

.icon-indigo { background: #eef2ff; color: #6366f1; }
.icon-amber { background: #fffbeb; color: #d97706; }
.icon-emerald { background: #ecfdf5; color: #059669; }
.icon-rose { background: #fff1f2; color: #e11d48; }

/* Filter Card */
.rr-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.rr-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.rr-filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.rr-search-input {
  border-radius: 10px !important;
  height: 40px !important;
}

.rr-filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rr-select-filter {
  min-width: 170px;
}

.rr-select-filter .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

.rr-btn-reset {
  border-radius: 10px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
}

.rr-btn-reset:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

/* Table Card */
.rr-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.rr-table-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.rr-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rr-count-pill {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #e0e7ff;
}

.rr-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  font-weight: 700 !important;
  color: #64748b !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.rr-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

.rr-table .ant-table-tbody > tr:hover > td {
  background: #fbfbfe !important;
}

/* Code & Room Badges */
.rr-code-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e0e7ff;
  font-size: 12px;
  display: inline-block;
}

.rr-room-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.rr-money-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #0f172a;
  font-size: 13.5px;
}

/* Action Buttons */
.rr-btn-sm {
  border-radius: 6px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  height: 32px !important;
  padding: 0 10px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  transition: all 0.2s ease !important;
}

.rr-btn-sm:hover {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .rr-hero-banner { padding: 20px 24px; }
  .rr-hero-inner { flex-direction: column; align-items: flex-start; }
  .rr-hero-right { width: 100%; }
  .rr-filter-row { flex-direction: column; align-items: stretch; }
  .rr-filter-controls { width: 100%; }
  .rr-select-filter { flex: 1; }
}
`;

const RoomRequestManagementPage = () => {
  const [processForm] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [paymentConfirmRequest, setPaymentConfirmRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [processAction, setProcessAction] = useState("approve");
  const [processLoading, setProcessLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const stats = useMemo(
    () => ({
      approved: requests.filter((item) => item.status === "approved").length,
      pending: requests.filter((item) => item.status === "pending").length,
      rejected: requests.filter((item) => ["rejected", "cancelled", "expired"].includes(item.status)).length,
      total: requests.length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () => {
      const normalizedSearch = searchText.trim().toLowerCase();
      return requests.filter((item) => {
        const matchSearch =
          !normalizedSearch ||
          [
            item.userName,
            item.userPhone,
            item.userEmail,
            item.roomNumber,
            item.roomName,
            item.requestCode,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch));
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        const matchType = typeFilter === "all" || item.type === typeFilter;
        return matchSearch && matchStatus && matchType;
      });
    },
    [requests, searchText, statusFilter, typeFilter]
  );

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/room-requests");
      setRequests(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách yêu cầu phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const openProcessModal = (action, request) => {
    setProcessAction(action);
    setProcessingRequest(request);
    processForm.resetFields();
  };

  const closeProcessModal = () => {
    setProcessingRequest(null);
    processForm.resetFields();
  };

  const closePaymentConfirmModal = () => {
    setPaymentConfirmRequest(null);
    processForm.resetFields();
  };

  const handleConfirmPayment = async (values) => {
    if (!paymentConfirmRequest) {
      return;
    }

    setProcessLoading(true);

    try {
      await http.patch(`/room-requests/${paymentConfirmRequest.id}/payment/paid`, {
        adminNote: values.adminNote,
      });
      message.success("Đã xác nhận thanh toán");
      closePaymentConfirmModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xác nhận thanh toán thất bại");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleProcessRequest = async (values) => {
    if (!processingRequest) {
      return;
    }

    setProcessLoading(true);

    try {
      await http.patch(`/room-requests/${processingRequest.id}/${processAction}`, {
        adminNote: values.adminNote,
      });
      message.success(processAction === "approve" ? "Đã xác nhận yêu cầu" : "Đã từ chối yêu cầu");
      closeProcessModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xử lý yêu cầu thất bại");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleOpenContractFile = async (request) => {
    if (!request.contract) {
      message.warning("Yêu cầu này chưa tạo hợp đồng");
      return;
    }

    try {
      const { data } = await http.get(`/contracts/${request.contract}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được hợp đồng");
    }
  };

  const columns = [
    {
      title: "MÃ YÊU CẦU",
      dataIndex: "requestCode",
      key: "requestCode",
      width: 150,
      render: (value) => <span className="rr-code-badge">{value || "-"}</span>,
    },
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      width: 220,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            size={32}
            style={{ background: "#eef2ff", color: "#4f46e5", fontWeight: 700 }}
          >
            {record.userName?.charAt(0)?.toUpperCase() || <UserOutlined />}
          </Avatar>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>
              {record.userName || "-"}
            </span>
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              {record.userPhone || record.userEmail || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "PHÒNG",
      key: "room",
      width: 160,
      render: (_, record) => (
        <div className="rr-room-badge">
          <HomeOutlined />
          <span>P.{record.roomNumber || "-"}</span>
          {record.roomName ? <span style={{ color: "#0d9488", fontSize: 11 }}>({record.roomName})</span> : null}
        </div>
      ),
    },
    {
      title: "LOẠI",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        const meta = requestTypeMeta[type] || requestTypeMeta.rent;
        return (
          <span
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      title: "SỐ TIỀN",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (value) => <span className="rr-money-text">{formatCurrency(value)}</span>,
    },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentProvider",
      key: "paymentProvider",
      width: 130,
      render: (provider) => {
        const meta = getPaymentProviderMeta(provider);
        return (
          <Tag color={meta.color} style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      key: "paymentState",
      width: 160,
      render: (_, record) => {
        const meta = getPaymentStateMeta(record);
        return (
          <span
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      title: "NGÀY GỬI",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (value) => <span style={{ color: "#64748b", fontSize: 12.5 }}>{formatDate(value)}</span>,
    },
    {
      title: "THAO TÁC",
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, record) => (
        <Space wrap size={6}>
          <Button
            size="small"
            className="rr-btn-sm"
            icon={<EyeOutlined />}
            onClick={() => setDetailRequest(record)}
          >
            Chi tiết
          </Button>
          {record.paymentProvider !== "vnpay" ? (
            <Button
              size="small"
              type="primary"
              className="rr-btn-sm"
              style={{ background: "#059669", borderColor: "#059669" }}
              icon={<CheckCircleOutlined />}
              onClick={() => setPaymentConfirmRequest(record)}
              disabled={
                record.status !== "pending" ||
                record.paymentStatus === "paid" ||
                !(record.paymentProofImages || []).length
              }
            >
              Xác nhận tiền
            </Button>
          ) : null}
          {record.type === "rent" && record.status === "pending" ? (
            <Button
              size="small"
              type="primary"
              className="rr-btn-sm"
              icon={<FileProtectOutlined />}
              onClick={() => openProcessModal("approve", record)}
              style={{ background: "#4f46e5", borderColor: "#4f46e5" }}
            >
              Tạo HĐ
            </Button>
          ) : null}
          {record.contract ? (
            <Button
              size="small"
              className="rr-btn-sm"
              icon={<FileProtectOutlined />}
              onClick={() => handleOpenContractFile(record)}
            >
              Hợp đồng
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="rr-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Welcome Banner */}
      <div className="rr-hero-banner">
        <div className="rr-hero-inner">
          <div className="rr-hero-left">
            <div className="rr-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN TRỊ YÊU CẦU PHÒNG</span>
            </div>
            <Typography.Title level={2} className="rr-hero-title">
              Quản Lý Yêu Cầu Thuê & Giữ Phòng
            </Typography.Title>
            <Typography.Paragraph className="rr-hero-subtitle">
              Xem, đối soát thanh toán đặt cọc giữ chỗ và phê duyệt tạo hợp đồng thuê phòng cho khách hàng trực tuyến.
            </Typography.Paragraph>
          </div>

          <div className="rr-hero-right">
            <Button
              className="rr-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchRequests}
              loading={loading}
            >
              Tải lại
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="rr-stats-grid">
        <div className="rr-stat-card">
          <div className="rr-stat-info">
            <span className="rr-stat-label">Tổng số yêu cầu</span>
            <span className="rr-stat-value">{stats.total}</span>
            <span className="rr-stat-sub">Toàn bộ hồ sơ yêu cầu</span>
          </div>
          <div className="rr-stat-icon-wrap icon-indigo">
            <SolutionOutlined />
          </div>
        </div>

        <div className="rr-stat-card">
          <div className="rr-stat-info">
            <span className="rr-stat-label">Chờ xác nhận</span>
            <span className="rr-stat-value" style={{ color: "#d97706" }}>{stats.pending}</span>
            <span className="rr-stat-sub">Cần đối soát & duyệt</span>
          </div>
          <div className="rr-stat-icon-wrap icon-amber">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="rr-stat-card">
          <div className="rr-stat-info">
            <span className="rr-stat-label">Đã xác nhận</span>
            <span className="rr-stat-value" style={{ color: "#059669" }}>{stats.approved}</span>
            <span className="rr-stat-sub">Đã duyệt / Đã tạo HĐ</span>
          </div>
          <div className="rr-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="rr-stat-card">
          <div className="rr-stat-info">
            <span className="rr-stat-label">Từ chối / Đã hủy</span>
            <span className="rr-stat-value" style={{ color: "#64748b" }}>{stats.rejected}</span>
            <span className="rr-stat-sub">Yêu cầu không thành công</span>
          </div>
          <div className="rr-stat-icon-wrap icon-rose">
            <CloseCircleOutlined />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rr-filter-card">
        <div className="rr-filter-row">
          <div className="rr-filter-left">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm kiếm theo tên khách, SĐT, email, mã yêu cầu, số phòng..."
              className="rr-search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="rr-filter-controls">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="rr-select-filter"
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Chờ xác nhận", value: "pending" },
                { label: "Đã xác nhận", value: "approved" },
                { label: "Từ chối", value: "rejected" },
                { label: "Đã hủy", value: "cancelled" },
                { label: "Hết hạn", value: "expired" },
              ]}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              className="rr-select-filter"
              options={[
                { label: "Tất cả loại yêu cầu", value: "all" },
                { label: "Giữ phòng", value: "hold_deposit" },
                { label: "Thuê phòng", value: "rent" },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="rr-btn-reset"
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Requests Table */}
      <div className="rr-table-card">
        <div className="rr-table-header">
          <h3 className="rr-table-title">
            <SolutionOutlined style={{ color: "#6366f1" }} />
            Danh Sách Yêu Cầu Thuê & Giữ Phòng
          </h3>
          <span className="rr-count-pill">
            Hiển thị {filteredRequests.length} / {requests.length} yêu cầu
          </span>
        </div>

        <Table
          rowKey="id"
          className="rr-table"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: <Empty description="Không có yêu cầu thuê phòng nào phù hợp" />,
          }}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SolutionOutlined style={{ color: "#6366f1", fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Chi tiết yêu cầu phòng</span>
          </div>
        }
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Đóng
          </Button>,
        ]}
        width={920}
      >
        {detailRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 10 }}>
            {(detailRequest.roomImages || []).length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailRequest.roomImages.map((image) => (
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
            ) : null}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã yêu cầu">
                <span className="rr-code-badge">{detailRequest.requestCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Loại yêu cầu">
                <Tag color={requestTypeMeta[detailRequest.type]?.color}>
                  {requestTypeMeta[detailRequest.type]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người gửi">{detailRequest.userName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{detailRequest.userPhone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{detailRequest.userEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="CCCD/CMND">{detailRequest.userIdentityNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {detailRequest.roomNumber} - {detailRequest.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng">{formatCurrency(detailRequest.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cần thanh toán">
                <span style={{ fontWeight: 700, color: "#4f46e5" }}>
                  {formatCurrency(detailRequest.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color={getPaymentProviderMeta(detailRequest.paymentProvider).color}>
                  {getPaymentProviderMeta(detailRequest.paymentProvider).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStateMeta(detailRequest).color}>
                  {getPaymentStateMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{detailRequest.paymentBankName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                <Typography.Text copyable>{detailRequest.paymentBankAccountNumber || "-"}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{detailRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung chuyển khoản">
                <Typography.Text copyable strong>
                  {detailRequest.paymentContent || detailRequest.paymentOrderCode || detailRequest.requestCode}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={requestStatusMeta[detailRequest.status]?.color}>
                  {requestStatusMeta[detailRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hợp đồng">
                {detailRequest.contractCode ? (
                  <Button type="link" onClick={() => handleOpenContractFile(detailRequest)}>
                    {detailRequest.contractCode}
                  </Button>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn giữ phòng">{formatDate(detailRequest.holdExpiresAt)}</Descriptions.Item>
              <Descriptions.Item label="Thời hạn thuê">{detailRequest.durationMonths || "-"} tháng</Descriptions.Item>
              <Descriptions.Item label="Số người ở">{detailRequest.occupantCount || "-"}</Descriptions.Item>
              <Descriptions.Item label="Lời nhắn từ khách" span={2}>
                {detailRequest.message || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú admin" span={2}>
                {detailRequest.adminNote || "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailRequest.type === "rent" ? (
              <Card size="small" title="Thông tin người ở cùng phòng">
                <Table
                  rowKey={(_, index) => index}
                  dataSource={detailRequest.occupants || []}
                  pagination={false}
                  scroll={{ x: 900 }}
                  columns={[
                    { title: "Họ tên", dataIndex: "name", key: "name" },
                    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
                    { title: "Số CCCD", dataIndex: "identityNumber", key: "identityNumber" },
                    {
                      title: "CCCD mặt trước",
                      dataIndex: "identityFrontImage",
                      key: "identityFrontImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover", borderRadius: 4 }} /> : "-"),
                    },
                    {
                      title: "CCCD mặt sau",
                      dataIndex: "identityBackImage",
                      key: "identityBackImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover", borderRadius: 4 }} /> : "-"),
                    },
                  ]}
                />
              </Card>
            ) : null}
            {detailRequest.paymentQrCode ? (
              <Card size="small" title="Mã QR thanh toán">
                <Space direction="vertical" align="center" style={{ width: "100%", padding: 12 }}>
                  <Image src={detailRequest.paymentQrCode} width={240} style={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Kiểm tra sao kê ngân hàng theo đúng số tiền và nội dung chuyển khoản trước khi xác nhận.
                  </Typography.Text>
                </Space>
              </Card>
            ) : null}
            {detailRequest.paymentProvider !== "vnpay" ? (
              <Card size="small" title="Ảnh biên lai chuyển khoản">
                {(detailRequest.paymentProofImages || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {detailRequest.paymentProofImages.map((image) => (
                        <Image
                          key={image}
                          src={toImageUrl(image)}
                          width={132}
                          height={92}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Typography.Text type="secondary">Khách hàng chưa tải ảnh biên lai.</Typography.Text>
                )}
              </Card>
            ) : null}
          </Space>
        )}
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal
        title="Xác nhận đã nhận tiền đặt cọc/thuê phòng"
        open={Boolean(paymentConfirmRequest)}
        onCancel={closePaymentConfirmModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText="Xác nhận thanh toán"
        cancelText="Đóng"
      >
        <Form form={processForm} layout="vertical" onFinish={handleConfirmPayment}>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, marginBottom: 14, border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              Mã: {paymentConfirmRequest?.requestCode}
            </span>
            <span style={{ marginLeft: 12, fontWeight: 700, color: "#4f46e5" }}>
              {formatCurrency(paymentConfirmRequest?.amount)}
            </span>
          </div>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Người gửi">{paymentConfirmRequest?.userName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Nội dung CK">
              <Typography.Text copyable strong>
                {paymentConfirmRequest?.paymentContent ||
                  paymentConfirmRequest?.paymentOrderCode ||
                  paymentConfirmRequest?.requestCode}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Form.Item name="adminNote" label="Ghi chú admin">
            <Input.TextArea rows={3} placeholder="VD: Đã đối soát sao kê ngân hàng thành công" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Request Modal */}
      <Modal
        title={processAction === "approve" ? "Xác nhận & Tạo hợp đồng" : "Từ chối yêu cầu phòng"}
        open={Boolean(processingRequest)}
        onCancel={closeProcessModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText={processAction === "approve" ? "Xác nhận duyệt" : "Từ chối"}
        okButtonProps={{ danger: processAction === "reject" }}
        cancelText="Đóng"
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcessRequest}>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, marginBottom: 14, border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              Mã: {processingRequest?.requestCode} - P.{processingRequest?.roomNumber} ({processingRequest?.roomName})
            </span>
          </div>
          <Form.Item name="adminNote" label="Ghi chú xử lý">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú xử lý nếu cần..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomRequestManagementPage;
