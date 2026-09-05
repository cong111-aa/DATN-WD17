import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
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
  InputNumber,
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

const inlineStyles = `
/* ==========================================================================
   Contract Management - Direct Embedded Theme
   ========================================================================== */
.cm-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: cmFadeIn 0.35s ease-out;
}

@keyframes cmFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hero Banner */
.cm-hero-banner {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #581c87 75%, #7c3aed 100%);
  border-radius: 16px;
  padding: 28px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.cm-hero-banner::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(168, 85, 247, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.cm-hero-banner::after {
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

.cm-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.cm-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cm-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #c4b5fd;
  width: fit-content;
}

.cm-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #a78bfa;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7);
  animation: cmPulse 2s infinite;
}

@keyframes cmPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(167, 139, 250, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); }
}

.cm-hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.cm-hero-subtitle {
  color: #e2e8f0 !important;
  font-size: 14px;
  margin: 0 !important;
  max-width: 620px;
}

.cm-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cm-btn-reload {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  backdrop-filter: blur(8px);
  font-weight: 600;
  height: 40px !important;
  transition: all 0.2s ease !important;
}

.cm-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

.cm-btn-add {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important;
  border: none !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  font-weight: 700;
  height: 40px !important;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4) !important;
  transition: all 0.2s ease !important;
}

.cm-btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important;
}

/* KPI Stats Grid */
.cm-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.cm-stat-card {
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

.cm-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  border-color: #cbd5e1;
}

.cm-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cm-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.cm-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.cm-stat-sub {
  font-size: 12px;
  color: #94a3b8;
}

.cm-stat-icon-wrap {
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

.cm-stat-card:hover .cm-stat-icon-wrap {
  transform: scale(1.08);
}

.icon-purple { background: #f5f3ff; color: #7c3aed; }
.icon-emerald { background: #ecfdf5; color: #059669; }
.icon-amber { background: #fffbeb; color: #d97706; }
.icon-rose { background: #fff1f2; color: #e11d48; }

/* Filter Card */
.cm-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.cm-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.cm-filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.cm-search-input {
  border-radius: 10px !important;
  height: 40px !important;
}

.cm-filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cm-select-filter {
  min-width: 170px;
}

.cm-select-filter .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

.cm-btn-reset {
  border-radius: 10px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #64748b !important;
}

.cm-btn-reset:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

/* Table Card */
.cm-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.cm-table-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.cm-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cm-count-pill {
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #ede9fe;
}

.cm-count-pill.orange {
  background: #fff7ed;
  color: #c2410c;
  border-color: #ffedd5;
}

.cm-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  font-weight: 700 !important;
  color: #64748b !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.cm-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
}

.cm-table .ant-table-tbody > tr:hover > td {
  background: #fbfbfe !important;
}

/* Cell Badges */
.cm-code-badge {
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

.cm-room-tag {
  font-weight: 600;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cm-money-text {
  font-weight: 700;
  color: #0f172a;
  font-size: 13px;
}

/* Action Buttons */
.cm-action-btn {
  width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.cm-action-btn:hover {
  transform: translateY(-1px);
}

.cm-action-btn.view { color: #2563eb; background: #eff6ff; border-color: #dbeafe; }
.cm-action-btn.view:hover { background: #2563eb; color: #ffffff; }

.cm-action-btn.doc { color: #7c3aed; background: #f5f3ff; border-color: #ede9fe; }
.cm-action-btn.doc:hover { background: #7c3aed; color: #ffffff; }

.cm-action-btn.edit { color: #d97706; background: #fffbeb; border-color: #fef3c7; }
.cm-action-btn.edit:hover { background: #d97706; color: #ffffff; }

.cm-action-btn.delete { color: #e11d48; background: #fff1f2; border-color: #ffe4e6; }
.cm-action-btn.delete:hover:not(:disabled) { background: #e11d48; color: #ffffff; }

.cm-btn-sm {
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  height: 30px !important;
  padding: 0 10px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: all 0.2s ease !important;
}

.cm-btn-sm:hover {
  transform: translateY(-1px);
}

/* Modal Styling */
.cm-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
}

.cm-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 !important;
}

.cm-modal-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0 !important;
}

.cm-form-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  margin-bottom: 8px;
}

.cm-form-divider {
  margin: 8px 0 16px 0 !important;
}

.cm-descriptions .ant-descriptions-item-label {
  background-color: #f8fafc !important;
  font-weight: 600;
  color: #64748b;
}

/* Responsive */
@media (max-width: 992px) {
  .cm-page-wrapper { padding: 16px; gap: 16px; }
  .cm-hero-banner { padding: 20px 24px; }
}

@media (max-width: 768px) {
  .cm-hero-inner { flex-direction: column; align-items: flex-start; }
  .cm-hero-right { width: 100%; }
  .cm-filter-row { flex-direction: column; align-items: stretch; }
  .cm-filter-controls { width: 100%; }
  .cm-select-filter { flex: 1; }
}
`;

const statusOptions = [
  { label: "Chờ khách ký", value: "pending_user_signature" },
  { label: "Khách yêu cầu sửa", value: "revision_requested" },
  { label: "Chờ thanh toán đầu kỳ", value: "signed_pending_payment" },
  { label: "Đang hiệu lực", value: "active" },
  { label: "Yêu cầu gia hạn", value: "renewal_requested" },
  { label: "Yêu cầu trả phòng", value: "checkout_requested" },
  { label: "Quá hạn chờ xử lý", value: "expired_pending" },
  { label: "Đã gia hạn", value: "renewed" },
  { label: "Hết hạn", value: "expired" },
  { label: "Đã chấm dứt", value: "terminated" },
];

const statusMeta = {
  pending_user_signature: { bg: "#fffbeb", color: "#b45309", icon: <ClockCircleOutlined />, label: "Chờ khách ký" },
  revision_requested: { bg: "#fff7ed", color: "#c2410c", icon: <ExclamationCircleOutlined />, label: "Khách yêu cầu sửa" },
  signed_pending_payment: { bg: "#fefce8", color: "#a16207", icon: <ClockCircleOutlined />, label: "Chờ thanh toán đầu kỳ" },
  active: { bg: "#ecfdf5", color: "#047857", icon: <CheckCircleOutlined />, label: "Đang hiệu lực" },
  renewal_requested: { bg: "#eff6ff", color: "#1d4ed8", icon: <SyncOutlined />, label: "Yêu cầu gia hạn" },
  checkout_requested: { bg: "#fff7ed", color: "#ea580c", icon: <ExclamationCircleOutlined />, label: "Yêu cầu trả phòng" },
  expired_pending: { bg: "#fef2f2", color: "#b91c1c", icon: <CloseCircleOutlined />, label: "Quá hạn chờ xử lý" },
  renewed: { bg: "#ecfeff", color: "#0e7490", icon: <CheckCircleOutlined />, label: "Đã gia hạn" },
  expired: { bg: "#f1f5f9", color: "#64748b", icon: <StopOutlined />, label: "Hết hạn" },
  terminated: { bg: "#fef2f2", color: "#dc2626", icon: <CloseCircleOutlined />, label: "Đã chấm dứt" },
};

const defaultFormValues = {
  durationMonths: 12,
  status: "pending_user_signature",
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toAbsoluteImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toPayload = (values) => ({
  ...values,
  moveInDate: values.moveInDate ? values.moveInDate.toISOString() : undefined,
  endDate: values.endDate ? values.endDate.toISOString() : undefined,
});

const toFormValues = (record) => ({
  ...record,
  moveInDate: record.moveInDate ? dayjs(record.moveInDate) : undefined,
  endDate: record.endDate ? dayjs(record.endDate) : undefined,
});

const ContractManagementPage = () => {
  const [form] = Form.useForm();
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [lifecycleContract, setLifecycleContract] = useState(null);
  const [lifecycleMode, setLifecycleMode] = useState("");
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [lifecycleForm, setLifecycleForm] = useState({
    checkoutDate: "",
    durationMonths: 12,
    monthlyRent: 0,
    note: "",
    refundBankAccountName: "",
    refundBankAccountNumber: "",
    refundBankName: "",
  });
  const [completeCheckoutContract, setCompleteCheckoutContract] = useState(null);
  const [completeCheckoutLoading, setCompleteCheckoutLoading] = useState(false);
  const [refundProofFileList, setRefundProofFileList] = useState([]);
  const [completeCheckoutForm, setCompleteCheckoutForm] = useState({
    note: "",
    refundAmount: 0,
    refundBankAccountName: "",
    refundBankAccountNumber: "",
    refundBankName: "",
    refundDeductionAmount: 0,
    refundExtraChargeAmount: 0,
    refundStatus: "not_required",
  });
  const [finalInvoiceContract, setFinalInvoiceContract] = useState(null);
  const [finalInvoiceLoading, setFinalInvoiceLoading] = useState(false);
  const [finalInvoiceForm, setFinalInvoiceForm] = useState({
    discountAmount: 0,
    dueDate: "",
    electricityNew: 0,
    electricityOld: 0,
    month: new Date().getMonth() + 1,
    note: "",
    otherAmount: 0,
    rentAmount: 0,
    serviceAmount: 0,
    waterNew: 0,
    waterOld: 0,
    year: new Date().getFullYear(),
  });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const contractStats = useMemo(() => {
    const active = contracts.filter((item) => item.status === "active").length;
    const expired = contracts.filter((item) => ["expired", "terminated"].includes(item.status)).length;
    return {
      active,
      expired,
      expiring: expiringContracts.length,
      total: contracts.length,
    };
  }, [contracts, expiringContracts]);

  const filteredContracts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return contracts.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.contractCode, item.roomNumber, item.roomName, item.tenantName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
    });
  }, [contracts, searchText, statusFilter]);

  const representativeOptions = useMemo(
    () =>
      tenants
        .filter((tenant) => tenant.status === "active" && tenant.roomRole === "representative")
        .map((tenant) => ({
          label: `${tenant.userName} - Phòng ${tenant.roomNumber}`,
          tenant,
          value: tenant.id,
        })),
    [tenants]
  );

  const fetchOptions = async () => {
    try {
      const [{ data: tenantData }, { data: roomData }] = await Promise.all([
        http.get("/tenants"),
        http.get("/rooms"),
      ]);
      setTenants(tenantData);
      setRooms(roomData);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được dữ liệu lựa chọn");
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/contracts");
      setContracts(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringContracts = async () => {
    try {
      const { data } = await http.get("/contracts/expiring");
      setExpiringContracts(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được hợp đồng sắp hết hạn");
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchContracts();
    fetchExpiringContracts();
  }, []);

  const refreshAll = () => {
    fetchOptions();
    fetchContracts();
    fetchExpiringContracts();
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const updateEndDate = () => {
    const moveInDate = form.getFieldValue("moveInDate");
    const durationMonths = form.getFieldValue("durationMonths");

    if (moveInDate && durationMonths) {
      form.setFieldsValue({ endDate: moveInDate.add(Number(durationMonths), "month") });
    }
  };

  const handleRepresentativeChange = (value) => {
    const selected = representativeOptions.find((option) => option.value === value)?.tenant;
    const room = rooms.find((item) => item.id === selected?.room);
    const memberCount = tenants.filter(
      (tenant) => tenant.room === selected?.room && tenant.status === "active"
    ).length;

    form.setFieldsValue({
      deposit: room?.deposit ?? 0,
      memberCount: memberCount || 1,
      monthlyRent: room?.price ?? 0,
      moveInDate: selected?.moveInDate ? dayjs(selected.moveInDate) : dayjs(),
      room: selected?.room,
      tenant: selected?.user,
    });
    setTimeout(updateEndDate, 0);
  };

  const openCreateModal = () => {
    setEditingContract(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingContract(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingContract(null);
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = toPayload(values);

      if (editingContract) {
        await http.put(`/contracts/${editingContract.id}`, payload);
        message.success("Đã cập nhật hợp đồng");
      } else {
        await http.post("/contracts", payload);
        message.success("Đã tạo hợp đồng");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu hợp đồng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/contracts/${record.id}`);
      message.success("Đã xóa hợp đồng");
      fetchContracts();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa hợp đồng thất bại");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/contracts/${record.id}`);
      setDetailContract(data);
      setDetailOpen(true);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết hợp đồng");
    }
  };

  const handleViewFile = async (record) => {
    try {
      const { data } = await http.get(`/contracts/${record.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được file hợp đồng");
    }
  };

  const openLifecycleModal = (record, mode) => {
    setLifecycleContract(record);
    setLifecycleMode(mode);
    setLifecycleForm({
      checkoutDate: record.checkoutDate
        ? new Date(record.checkoutDate).toISOString().slice(0, 10)
        : record.endDate
          ? new Date(record.endDate).toISOString().slice(0, 10)
          : "",
      durationMonths: record.pendingLifecycleRequest?.requestedDurationMonths || record.durationMonths || 12,
      monthlyRent: record.monthlyRent || 0,
      note: "",
      refundBankAccountName: record.pendingLifecycleRequest?.refundBankAccountName || "",
      refundBankAccountNumber: record.pendingLifecycleRequest?.refundBankAccountNumber || "",
      refundBankName: record.pendingLifecycleRequest?.refundBankName || "",
    });
  };

  const closeLifecycleModal = () => {
    setLifecycleContract(null);
    setLifecycleMode("");
    setLifecycleForm({
      checkoutDate: "",
      durationMonths: 12,
      monthlyRent: 0,
      note: "",
      refundBankAccountName: "",
      refundBankAccountNumber: "",
      refundBankName: "",
    });
  };

  const handleSendReminder = async (record) => {
    try {
      await http.patch(`/contracts/${record.id}/remind-expiry`, {
        note: "Admin nhắc khách xử lý hợp đồng sắp hết hạn.",
      });
      message.success("Đã gửi nhắc nhở");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi nhắc nhở thất bại");
    }
  };

  const toImageUrls = (fileList = []) =>
    fileList.flatMap((file) => {
      if (file.response?.urls) {
        return file.response.urls;
      }
      if (file.url?.startsWith(apiOrigin)) {
        return file.url.replace(apiOrigin, "");
      }
      return file.url ? [file.url] : [];
    });

  const openCompleteCheckoutModal = async (record) => {
    let nextRecord = record;
    try {
      const { data } = await http.get(`/contracts/${record.id}`);
      nextRecord = data;
    } catch (error) {
      message.warning(error.response?.data?.message || "Không tải được thông tin trả phòng mới nhất");
    }

    const request = nextRecord.latestCheckoutRequest || nextRecord.pendingLifecycleRequest || {};
    setCompleteCheckoutContract(nextRecord);
    setRefundProofFileList([]);
    setCompleteCheckoutForm({
      note: "",
      refundAmount: Number(nextRecord.deposit || 0),
      refundBankAccountName: request.refundBankAccountName || "",
      refundBankAccountNumber: request.refundBankAccountNumber || "",
      refundBankName: request.refundBankName || "",
      refundDeductionAmount: 0,
      refundExtraChargeAmount: 0,
      refundStatus: Number(nextRecord.deposit || 0) > 0 ? "pending" : "not_required",
    });
  };

  const closeCompleteCheckoutModal = () => {
    setCompleteCheckoutContract(null);
    setRefundProofFileList([]);
    setCompleteCheckoutForm({
      note: "",
      refundAmount: 0,
      refundBankAccountName: "",
      refundBankAccountNumber: "",
      refundBankName: "",
      refundDeductionAmount: 0,
      refundExtraChargeAmount: 0,
      refundStatus: "not_required",
    });
  };

  const handleRefundProofUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/payment-proofs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload biên lai hoàn cọc thất bại");
      onError(error);
    }
  };

  const openFinalInvoiceModal = async (record) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    setFinalInvoiceContract(record);
    setFinalInvoiceForm({
      discountAmount: 0,
      dueDate: "",
      electricityNew: 0,
      electricityOld: 0,
      month,
      note: "",
      otherAmount: 0,
      rentAmount: 0,
      serviceAmount: 0,
      waterNew: 0,
      waterOld: 0,
      year,
    });

    try {
      const { data } = await http.get("/invoices/meter-reading-seed", {
        params: { room: record.room, month, year },
      });
      setFinalInvoiceForm((current) => ({
        ...current,
        electricityNew: data.electricityNew ?? data.electricityOld ?? 0,
        electricityOld: data.electricityOld ?? 0,
        waterNew: data.waterNew ?? data.waterOld ?? 0,
        waterOld: data.waterOld ?? 0,
      }));
    } catch (error) {
      message.warning(error.response?.data?.message || "Không tải được chỉ số cũ");
    }
  };

  const closeFinalInvoiceModal = () => {
    setFinalInvoiceContract(null);
    setFinalInvoiceForm({
      discountAmount: 0,
      dueDate: "",
      electricityNew: 0,
      electricityOld: 0,
      month: new Date().getMonth() + 1,
      note: "",
      otherAmount: 0,
      rentAmount: 0,
      serviceAmount: 0,
      waterNew: 0,
      waterOld: 0,
      year: new Date().getFullYear(),
    });
  };

  const handleCreateFinalInvoice = async () => {
    if (!finalInvoiceContract) return;

    setFinalInvoiceLoading(true);
    try {
      await http.post(`/contracts/${finalInvoiceContract.id}/checkout-final-invoice`, finalInvoiceForm);
      message.success("Đã tạo hóa đơn chốt trả phòng");
      closeFinalInvoiceModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Tạo hóa đơn chốt trả phòng thất bại");
    } finally {
      setFinalInvoiceLoading(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!completeCheckoutContract) return;

    setCompleteCheckoutLoading(true);
    try {
      await http.post(`/contracts/${completeCheckoutContract.id}/complete-checkout`, {
        ...completeCheckoutForm,
        refundProofImages: toImageUrls(refundProofFileList),
      });
      message.success("Đã hoàn tất thủ tục trả phòng");
      closeCompleteCheckoutModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Hoàn tất trả phòng thất bại");
    } finally {
      setCompleteCheckoutLoading(false);
    }
  };

  const submitLifecycleAction = async () => {
    if (!lifecycleContract) return;

    setLifecycleSubmitting(true);
    try {
      if (lifecycleMode === "renew") {
        await http.post(`/contracts/${lifecycleContract.id}/renew`, {
          durationMonths: lifecycleForm.durationMonths,
          monthlyRent: lifecycleForm.monthlyRent,
          note: lifecycleForm.note,
        });
        message.success("Đã xử lý gia hạn hợp đồng");
      } else {
        await http.post(`/contracts/${lifecycleContract.id}/checkout`, {
          checkoutDate: lifecycleForm.checkoutDate,
          note: lifecycleForm.note,
          refundBankAccountName: lifecycleForm.refundBankAccountName,
          refundBankAccountNumber: lifecycleForm.refundBankAccountNumber,
          refundBankName: lifecycleForm.refundBankName,
        });
        message.success("Đã tạo thủ tục trả phòng");
      }

      closeLifecycleModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Xử lý thất bại");
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const expiryBucketMeta = {
    expiring: { bg: "#fef3c7", color: "#b45309", label: "Sắp hết hạn" },
    no_response: { bg: "#ffedd5", color: "#c2410c", label: "Chưa phản hồi" },
    urgent: { bg: "#fee2e2", color: "#dc2626", label: "Cần xử lý gấp" },
    overdue: { bg: "#fee2e2", color: "#b91c1c", label: "Quá hạn" },
  };

  const expiringColumns = [
    {
      title: "HỢP ĐỒNG",
      key: "contract",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span className="cm-code-badge">{record.contractCode}</span>
          <span style={{ fontSize: 13, color: "#475569" }}>
            Phòng {record.roomNumber || "-"} - {record.tenantName || "-"}
          </span>
        </Space>
      ),
    },
    {
      title: "HẾT HẠN",
      key: "endDate",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 600, color: "#334155" }}>{formatDate(record.endDate)}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: Number(record.daysUntilEnd || 0) <= 7 ? "#dc2626" : "#64748b",
            }}
          >
            {record.daysUntilEnd < 0
              ? `Quá hạn ${Math.abs(record.daysUntilEnd)} ngày`
              : `Còn ${record.daysUntilEnd} ngày`}
          </span>
        </Space>
      ),
    },
    {
      title: "PHÂN LOẠI",
      dataIndex: "expiryBucket",
      key: "expiryBucket",
      render: (value) => {
        const meta = expiryBucketMeta[value] || expiryBucketMeta.expiring;
        return (
          <span
            style={{
              background: meta.bg,
              borderRadius: 6,
              color: meta.color,
              display: "inline-block",
              fontSize: 12,
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      title: "PHẢN HỒI",
      key: "request",
      render: (_, record) =>
        record.pendingLifecycleRequest ? (
          <Tag color={record.pendingLifecycleRequest.type === "renewal" ? "blue" : "orange"} style={{ borderRadius: 6, fontWeight: 600 }}>
            {record.pendingLifecycleRequest.type === "renewal" ? "Yêu cầu gia hạn" : "Yêu cầu trả phòng"}
          </Tag>
        ) : (
          <Tag style={{ borderRadius: 6 }}>Chưa có</Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      width: 340,
      render: (_, record) => (
        <Space wrap size={6}>
          <Button size="small" className="cm-btn-sm" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            Xem
          </Button>
          <Button size="small" className="cm-btn-sm" icon={<BellOutlined />} onClick={() => handleSendReminder(record)}>
            Nhắc
          </Button>
          <Button size="small" type="primary" className="cm-btn-sm" icon={<SyncOutlined />} onClick={() => openLifecycleModal(record, "renew")}>
            Gia hạn
          </Button>
          <Button size="small" danger className="cm-btn-sm" icon={<StopOutlined />} onClick={() => openLifecycleModal(record, "checkout")}>
            Trả phòng
          </Button>
          {["checkout_requested", "expired_pending"].includes(record.status) ? (
            <>
              <Button size="small" className="cm-btn-sm" icon={<FileTextOutlined />} onClick={() => openFinalInvoiceModal(record)}>
                HĐ cuối
              </Button>
              <Button size="small" className="cm-btn-sm" style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }} icon={<CheckOutlined />} onClick={() => openCompleteCheckoutModal(record)}>
                Hoàn tất
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const columns = useMemo(
    () => [
      {
        title: "MÃ HỢP ĐỒNG",
        dataIndex: "contractCode",
        key: "contractCode",
        width: 175,
        render: (value) => <span className="cm-code-badge">{value}</span>,
      },
      {
        title: "PHÒNG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 180,
        render: (value, record) => (
          <div className="cm-room-tag">
            <HomeOutlined style={{ color: "#7c3aed" }} />
            <span>{value || "-"} {record.roomName ? `(${record.roomName})` : ""}</span>
          </div>
        ),
      },
      {
        title: "NGƯỜI ĐẠI DIỆN",
        dataIndex: "tenantName",
        key: "tenantName",
        width: 200,
        render: (value) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size={28} style={{ background: "#f5f3ff", color: "#7c3aed", fontWeight: 700 }}>
              {value?.charAt(0)?.toUpperCase() || <UserOutlined />}
            </Avatar>
            <span style={{ fontWeight: 600, color: "#334155" }}>{value || "-"}</span>
          </div>
        ),
      },
      {
        title: "THÀNH VIÊN",
        dataIndex: "memberCount",
        key: "memberCount",
        width: 110,
        align: "center",
        render: (value) => (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#475569", fontWeight: 600 }}>
            <TeamOutlined style={{ color: "#64748b" }} /> {value || 1}
          </span>
        ),
      },
      {
        title: "GIÁ THUÊ",
        dataIndex: "monthlyRent",
        key: "monthlyRent",
        render: (value) => <span className="cm-money-text">{formatCurrency(value)}</span>,
      },
      {
        title: "TIỀN CỌC",
        dataIndex: "deposit",
        key: "deposit",
        render: (value) => <span className="cm-money-text" style={{ color: "#4f46e5" }}>{formatCurrency(value)}</span>,
      },
      {
        title: "NGÀY TẠO",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => <span style={{ color: "#64748b", fontSize: 13 }}>{formatDate(value)}</span>,
      },
      {
        title: "NGÀY VÀO",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: (value) => <span style={{ color: "#334155", fontSize: 13 }}>{formatDate(value)}</span>,
      },
      {
        title: "THỜI HẠN",
        dataIndex: "durationMonths",
        key: "durationMonths",
        render: (value) => <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>{value} tháng</Tag>,
      },
      {
        title: "HẾT HẠN",
        dataIndex: "endDate",
        key: "endDate",
        render: (value) => <span style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{formatDate(value)}</span>,
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || { bg: "#f1f5f9", color: "#64748b", label: status };
          return (
            <span
              style={{
                alignItems: "center",
                background: meta.bg,
                border: `1px solid ${meta.bg}`,
                borderRadius: 8,
                color: meta.color,
                display: "inline-flex",
                fontSize: 12,
                fontWeight: 700,
                gap: 5,
                padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {meta.icon}
              {meta.label}
            </span>
          );
        },
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 175,
        render: (_, record) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết hợp đồng">
              <Button
                size="small"
                className="cm-action-btn view"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="Xem nội dung văn bản hợp đồng">
              <Button
                size="small"
                className="cm-action-btn doc"
                icon={<FileTextOutlined />}
                onClick={() => handleViewFile(record)}
              />
            </Tooltip>
            <Tooltip title="Chỉnh sửa hợp đồng">
              <Button
                size="small"
                className="cm-action-btn edit"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa hợp đồng này?"
              description="Không thể xóa hợp đồng đang có hiệu lực."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
              disabled={record.status === "active"}
            >
              <Tooltip title={record.status === "active" ? "Không thể xóa hợp đồng đang hiệu lực" : "Xóa hợp đồng"}>
                <Button
                  danger
                  size="small"
                  className="cm-action-btn delete"
                  icon={<DeleteOutlined />}
                  disabled={record.status === "active"}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <div className="cm-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Welcome Banner */}
      <div className="cm-hero-banner">
        <div className="cm-hero-inner">
          <div className="cm-hero-left">
            <div className="cm-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN TRỊ HỢP ĐỒNG</span>
            </div>
            <Typography.Title level={2} className="cm-hero-title">
              Quản Lý Hợp Đồng Thuê Phòng
            </Typography.Title>
            <Typography.Paragraph className="cm-hero-subtitle">
              Tạo mới, theo dõi kỳ hạn hợp đồng, xử lý yêu cầu gia hạn, trả phòng và chốt hóa đơn thanh lý cọc.
            </Typography.Paragraph>
          </div>

          <div className="cm-hero-right">
            <Button
              className="cm-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refreshAll}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              className="cm-btn-add"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm hợp đồng
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="cm-stats-grid">
        <div className="cm-stat-card">
          <div className="cm-stat-info">
            <span className="cm-stat-label">Tổng hợp đồng</span>
            <span className="cm-stat-value">{contractStats.total}</span>
            <span className="cm-stat-sub">Toàn bộ hồ sơ hợp đồng</span>
          </div>
          <div className="cm-stat-icon-wrap icon-purple">
            <FileProtectOutlined />
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-info">
            <span className="cm-stat-label">Đang hiệu lực</span>
            <span className="cm-stat-value" style={{ color: "#059669" }}>{contractStats.active}</span>
            <span className="cm-stat-sub">Khách đang thuê hiện tại</span>
          </div>
          <div className="cm-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-info">
            <span className="cm-stat-label">Sắp hết hạn</span>
            <span className="cm-stat-value" style={{ color: "#d97706" }}>{contractStats.expiring}</span>
            <span className="cm-stat-sub">Cần nhắc nhở / gia hạn</span>
          </div>
          <div className="cm-stat-icon-wrap icon-amber">
            <CalendarOutlined />
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-info">
            <span className="cm-stat-label">Hết hạn / Chấm dứt</span>
            <span className="cm-stat-value" style={{ color: "#64748b" }}>{contractStats.expired}</span>
            <span className="cm-stat-sub">Hợp đồng đã kết thúc</span>
          </div>
          <div className="cm-stat-icon-wrap icon-rose">
            <StopOutlined />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="cm-filter-card">
        <div className="cm-filter-row">
          <div className="cm-filter-left">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm kiếm mã hợp đồng, số phòng, người đại diện..."
              className="cm-search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="cm-filter-controls">
            <Select
              value={statusFilter}
              className="cm-select-filter"
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="cm-btn-reset"
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="cm-table-card">
        <div className="cm-table-header">
          <h3 className="cm-table-title">
            <FileProtectOutlined style={{ color: "#7c3aed" }} />
            Danh Sách Hợp Đồng Thuê Phòng
          </h3>
          <span className="cm-count-pill">
            Hiển thị {filteredContracts.length} / {contracts.length} hợp đồng
          </span>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredContracts}
          loading={loading}
          size="middle"
          className="cm-table"
          locale={{ emptyText: <Empty description="Không có hợp đồng phù hợp" /> }}
          scroll={{ x: 1650 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} hợp đồng`,
          }}
        />
      </div>

      {/* Expiring Contracts Table */}
      {expiringContracts.length > 0 && (
        <div className="cm-table-card">
          <div className="cm-table-header">
            <h3 className="cm-table-title">
              <CalendarOutlined style={{ color: "#f97316" }} />
              Hợp Đồng Sắp Hết Hạn Cần Theo Dõi
            </h3>
            <span className="cm-count-pill orange">
              {expiringContracts.length} hợp đồng cần xử lý
            </span>
          </div>

          <Table
            rowKey="id"
            columns={expiringColumns}
            dataSource={expiringContracts}
            pagination={{ pageSize: 5, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="Không có hợp đồng sắp hết hạn" /> }}
            scroll={{ x: 950 }}
            className="cm-table"
          />
        </div>
      )}

      {/* Modal Gia hạn / Trả phòng */}
      <Modal
        title={
          <div className="cm-modal-header">
            <Avatar size={36} style={{ background: lifecycleMode === "renew" ? "#7c3aed" : "#ea580c" }} icon={lifecycleMode === "renew" ? <SyncOutlined /> : <StopOutlined />} />
            <div>
              <h4 className="cm-modal-title">{lifecycleMode === "renew" ? "Xử lý gia hạn hợp đồng" : "Tạo thủ tục trả phòng"}</h4>
              <p className="cm-modal-subtitle">{lifecycleContract?.contractCode}</p>
            </div>
          </div>
        }
        open={Boolean(lifecycleContract)}
        onCancel={closeLifecycleModal}
        onOk={submitLifecycleAction}
        confirmLoading={lifecycleSubmitting}
        okText={lifecycleMode === "renew" ? "Xác nhận gia hạn" : "Tạo thủ tục trả phòng"}
        cancelText="Đóng"
        width={650}
      >
        {lifecycleContract ? (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 8 }}>
            <Descriptions bordered size="small" column={1} className="cm-descriptions">
              <Descriptions.Item label="Hợp đồng">{lifecycleContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {lifecycleContract.roomNumber || "-"} {lifecycleContract.roomName ? `(${lifecycleContract.roomName})` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="Người thuê">{lifecycleContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Ngày hết hạn">{formatDate(lifecycleContract.endDate)}</Descriptions.Item>
            </Descriptions>

            {lifecycleMode === "renew" ? (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Thời hạn mới (tháng)">
                    <InputNumber
                      min={1}
                      value={lifecycleForm.durationMonths}
                      onChange={(value) => setLifecycleForm((current) => ({ ...current, durationMonths: value || 1 }))}
                      style={{ width: "100%", borderRadius: 8 }}
                      addonAfter="tháng"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Giá thuê mới">
                    <InputNumber
                      min={0}
                      value={lifecycleForm.monthlyRent}
                      onChange={(value) => setLifecycleForm((current) => ({ ...current, monthlyRent: value || 0 }))}
                      style={{ width: "100%", borderRadius: 8 }}
                      addonAfter="VND"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Form.Item label="Ngày trả phòng">
                  <Input
                    type="date"
                    value={lifecycleForm.checkoutDate}
                    onChange={(event) => setLifecycleForm((current) => ({ ...current, checkoutDate: event.target.value }))}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
                <Descriptions bordered size="small" column={1} className="cm-descriptions">
                  <Descriptions.Item label="Tài khoản nhận hoàn cọc">
                    <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 4 }}>
                      <Input
                        placeholder="Tên ngân hàng"
                        value={lifecycleForm.refundBankName}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankName: event.target.value }))}
                        style={{ borderRadius: 8 }}
                      />
                      <Input
                        placeholder="Số tài khoản"
                        value={lifecycleForm.refundBankAccountNumber}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankAccountNumber: event.target.value }))}
                        style={{ borderRadius: 8 }}
                      />
                      <Input
                        placeholder="Chủ tài khoản"
                        value={lifecycleForm.refundBankAccountName}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankAccountName: event.target.value }))}
                        style={{ borderRadius: 8 }}
                      />
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            )}

            <Form.Item label="Ghi chú">
              <Input.TextArea
                rows={3}
                value={lifecycleForm.note}
                onChange={(event) => setLifecycleForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Nhập ghi chú chi tiết nếu có..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      {/* Modal Chốt điện nước & Hóa đơn cuối */}
      <Modal
        title={
          <div className="cm-modal-header">
            <Avatar size={36} style={{ background: "#0284c7" }} icon={<FileTextOutlined />} />
            <div>
              <h4 className="cm-modal-title">Chốt điện nước và tạo hóa đơn cuối</h4>
              <p className="cm-modal-subtitle">Phòng {finalInvoiceContract?.roomNumber} - {finalInvoiceContract?.contractCode}</p>
            </div>
          </div>
        }
        open={Boolean(finalInvoiceContract)}
        onCancel={closeFinalInvoiceModal}
        onOk={handleCreateFinalInvoice}
        confirmLoading={finalInvoiceLoading}
        okText="Tạo hóa đơn cuối"
        cancelText="Đóng"
        width={760}
      >
        {finalInvoiceContract ? (
          <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 8 }}>
            <Alert
              showIcon
              type="info"
              message="Hóa đơn cuối dùng để chốt chỉ số điện nước, phí phát sinh / hư hại trước khi đối soát và hoàn cọc."
              style={{ borderRadius: 8 }}
            />
            <Descriptions bordered size="small" column={2} className="cm-descriptions">
              <Descriptions.Item label="Hợp đồng">{finalInvoiceContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">{finalInvoiceContract.roomNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Người thuê">{finalInvoiceContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMeta[finalInvoiceContract.status]?.color || "default"}>
                  {statusMeta[finalInvoiceContract.status]?.label || finalInvoiceContract.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="cm-form-section-title">
              <CalendarOutlined style={{ color: "#0284c7" }} /> Kỳ tính phí và hạn thanh toán
            </div>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <Form.Item label="Tháng">
                  <InputNumber
                    min={1}
                    max={12}
                    value={finalInvoiceForm.month}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, month: value || 1 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Năm">
                  <InputNumber
                    min={2000}
                    value={finalInvoiceForm.year}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, year: value || new Date().getFullYear() }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Hạn thanh toán">
                  <Input
                    type="date"
                    value={finalInvoiceForm.dueDate}
                    onChange={(event) => setFinalInvoiceForm((current) => ({ ...current, dueDate: event.target.value }))}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="cm-form-section-title">
              <CheckCircleOutlined style={{ color: "#059669" }} /> Chỉ số điện nước
            </div>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label="Chỉ số điện cũ">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.electricityOld}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, electricityOld: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chỉ số điện mới">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.electricityNew}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, electricityNew: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chỉ số nước cũ">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.waterOld}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, waterOld: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chỉ số nước mới">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.waterNew}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, waterNew: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="cm-form-section-title">
              <FileDoneOutlined style={{ color: "#7c3aed" }} /> Chi phí phát sinh
            </div>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="Tiền phòng phát sinh">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.rentAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, rentAmount: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Phí dịch vụ phát sinh">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.serviceAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, serviceAmount: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Phí khác / hư hại">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.otherAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, otherAmount: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Giảm trừ">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.discountAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, discountAmount: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Ghi chú hóa đơn cuối">
              <Input.TextArea
                rows={3}
                value={finalInvoiceForm.note}
                onChange={(event) => setFinalInvoiceForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="VD: Chốt điện nước ngày bàn giao, phí vệ sinh, hư hại trang thiết bị..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      {/* Modal Hoàn tất trả phòng & Đối soát cọc */}
      <Modal
        title={
          <div className="cm-modal-header">
            <Avatar size={36} style={{ background: "#059669" }} icon={<CheckCircleOutlined />} />
            <div>
              <h4 className="cm-modal-title">Hoàn tất trả phòng và đối soát cọc</h4>
              <p className="cm-modal-subtitle">{completeCheckoutContract?.contractCode}</p>
            </div>
          </div>
        }
        open={Boolean(completeCheckoutContract)}
        onCancel={closeCompleteCheckoutModal}
        onOk={handleCompleteCheckout}
        confirmLoading={completeCheckoutLoading}
        okText="Hoàn tất trả phòng"
        cancelText="Đóng"
        width={740}
      >
        {completeCheckoutContract ? (
          <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 8 }}>
            <Alert
              showIcon
              type="warning"
              message="Chỉ hoàn tất sau khi đã chốt hóa đơn cuối, kiểm tra phòng và đối soát tiền cọc xong."
              style={{ borderRadius: 8 }}
            />
            <Descriptions bordered size="small" column={2} className="cm-descriptions">
              <Descriptions.Item label="Hợp đồng">{completeCheckoutContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">{completeCheckoutContract.roomNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Người thuê">{completeCheckoutContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc ban đầu">{formatCurrency(completeCheckoutContract.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{completeCheckoutForm.refundBankName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">{completeCheckoutForm.refundBankAccountNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản" span={2}>
                {completeCheckoutForm.refundBankAccountName || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label="Trạng thái hoàn cọc">
                  <Select
                    value={completeCheckoutForm.refundStatus}
                    onChange={(value) => setCompleteCheckoutForm((current) => ({ ...current, refundStatus: value }))}
                    style={{ borderRadius: 8 }}
                    options={[
                      { label: "Không cần hoàn cọc", value: "not_required" },
                      { label: "Chờ hoàn cọc", value: "pending" },
                      { label: "Đã hoàn cọc", value: "refunded" },
                      { label: "Đã khấu trừ hết cọc", value: "deducted" },
                      { label: "Khách còn phải trả thêm", value: "extra_charge_required" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Số tiền hoàn cọc">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundAmount}
                    onChange={(value) => setCompleteCheckoutForm((current) => ({ ...current, refundAmount: value || 0 }))}
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Số tiền khấu trừ">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundDeductionAmount}
                    onChange={(value) =>
                      setCompleteCheckoutForm((current) => ({ ...current, refundDeductionAmount: value || 0 }))
                    }
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Tiền khách phải trả thêm">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundExtraChargeAmount}
                    onChange={(value) =>
                      setCompleteCheckoutForm((current) => ({ ...current, refundExtraChargeAmount: value || 0 }))
                    }
                    style={{ width: "100%", borderRadius: 8 }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Cập nhật tài khoản nhận hoàn cọc nếu có thay đổi">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Input
                  placeholder="Tên ngân hàng"
                  value={completeCheckoutForm.refundBankName}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankName: event.target.value }))
                  }
                  style={{ borderRadius: 8 }}
                />
                <Input
                  placeholder="Số tài khoản"
                  value={completeCheckoutForm.refundBankAccountNumber}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankAccountNumber: event.target.value }))
                  }
                  style={{ borderRadius: 8 }}
                />
                <Input
                  placeholder="Chủ tài khoản"
                  value={completeCheckoutForm.refundBankAccountName}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankAccountName: event.target.value }))
                  }
                  style={{ borderRadius: 8 }}
                />
              </Space>
            </Form.Item>

            <Form.Item label="Biên lai chuyển khoản hoàn cọc">
              <Upload
                accept="image/png,image/jpeg,image/webp"
                customRequest={handleRefundProofUpload}
                fileList={refundProofFileList}
                listType="picture-card"
                multiple
                onChange={({ fileList }) => setRefundProofFileList(fileList)}
              >
                {refundProofFileList.length >= 5 ? null : (
                  <button type="button" style={{ border: 0, background: "transparent", cursor: "pointer", color: "#64748b" }}>
                    <UploadOutlined style={{ fontSize: 18, color: "#7c3aed" }} />
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Tải biên lai</div>
                  </button>
                )}
              </Upload>
            </Form.Item>

            <Form.Item label="Ghi chú đối soát">
              <Input.TextArea
                rows={3}
                value={completeCheckoutForm.note}
                onChange={(event) => setCompleteCheckoutForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Ghi chú đối soát cọc..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      {/* Modal Tạo / Sửa hợp đồng */}
      <Modal
        title={
          <div className="cm-modal-header">
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} />
            <div>
              <h4 className="cm-modal-title">{editingContract ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng thuê mới"}</h4>
              <p className="cm-modal-subtitle">{editingContract ? editingContract.contractCode : "Thiết lập hợp đồng thuê phòng cho khách"}</p>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingContract ? "Lưu thay đổi" : "Tạo hợp đồng"}
        cancelText="Hủy"
        width={820}
      >
        <Alert
          showIcon
          type="info"
          message={editingContract ? "Cập nhật thông tin hợp đồng thuê phòng" : "Chọn người đại diện để hệ thống tự động điền thông tin phòng và người thuê"}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="cm-form-section-title">
            <TeamOutlined style={{ color: "#7c3aed" }} /> Thông tin người thuê và phòng
          </div>
          <Divider className="cm-form-divider" />
          <Form.Item name="representativePicker" label="Phòng - Người đại diện">
            <Select
              options={representativeOptions}
              placeholder="Chọn người đại diện phòng"
              showSearch
              optionFilterProp="label"
              onChange={handleRepresentativeChange}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item name="tenant" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="room" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div className="cm-form-section-title">
            <CalendarOutlined style={{ color: "#2563eb" }} /> Điều khoản và giá trị hợp đồng
          </div>
          <Divider className="cm-form-divider" />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="contractCode" label="Mã hợp đồng" rules={[{ required: true, message: "Vui lòng nhập mã hợp đồng!" }]}>
                <Input placeholder="VD: HDT-2026-001" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="memberCount" label="Tổng thành viên">
                <InputNumber min={1} style={{ width: "100%", borderRadius: 8 }} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="monthlyRent" label="Giá thuê" rules={[{ required: true, message: "Vui lòng nhập giá thuê!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="deposit" label="Tiền cọc" rules={[{ required: true, message: "Vui lòng nhập tiền cọc!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="moveInDate" label="Ngày vào ở" rules={[{ required: true, message: "Vui lòng chọn ngày vào ở!" }]}>
                <DatePicker style={{ width: "100%", borderRadius: 8 }} format="DD/MM/YYYY" onChange={updateEndDate} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="durationMonths" label="Thời hạn hợp đồng" rules={[{ required: true, message: "Vui lòng nhập thời hạn!" }]}>
                <InputNumber min={1} style={{ width: "100%", borderRadius: 8 }} addonAfter="tháng" onChange={updateEndDate} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endDate" label="Hết hạn hợp đồng" rules={[{ required: true, message: "Vui lòng chọn ngày hết hạn!" }]}>
                <DatePicker style={{ width: "100%", borderRadius: 8 }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select options={statusOptions} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="terms" label="Điều khoản / Ghi chú hợp đồng">
            <Input.TextArea rows={4} placeholder="Nhập các điều khoản quy định riêng nếu có..." style={{ borderRadius: 8 }} />
          </Form.Item>
          {editingContract?.status === "revision_requested" ? (
            <Form.Item name="revisionResponse" label="Phản hồi yêu cầu chỉnh sửa từ khách">
              <Input.TextArea rows={3} placeholder="VD: Đã cập nhật điều khoản theo nội dung khách yêu cầu" style={{ borderRadius: 8 }} />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      {/* Modal Chi tiết hợp đồng */}
      <Modal
        title={
          <div className="cm-modal-header">
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} />
            <div>
              <h4 className="cm-modal-title">Chi tiết hợp đồng</h4>
              <p className="cm-modal-subtitle">{detailContract?.contractCode || "Thông tin chi tiết hợp đồng thuê phòng"}</p>
            </div>
          </div>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailOpen(false)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {detailContract && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 8 }}>
            <Alert
              showIcon
              type={detailContract.status === "active" ? "success" : "info"}
              message={`Trạng thái hợp đồng: ${statusMeta[detailContract.status]?.label || detailContract.status}`}
              style={{ borderRadius: 8 }}
            />

            <div className="cm-form-section-title">
              <TeamOutlined style={{ color: "#7c3aed" }} /> Thông tin người thuê và phòng
            </div>
            <Descriptions bordered size="small" column={2} className="cm-descriptions">
              <Descriptions.Item label="Mã hợp đồng">
                <span className="cm-code-badge">{detailContract.contractCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMeta[detailContract.status]?.color || "default"} style={{ borderRadius: 6, fontWeight: 700 }}>
                  {statusMeta[detailContract.status]?.label || detailContract.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {detailContract.roomNumber} - {detailContract.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Tầng">{detailContract.roomFloor || "-"}</Descriptions.Item>
              <Descriptions.Item label="Người đại diện">{detailContract.tenantName}</Descriptions.Item>
              <Descriptions.Item label="Liên hệ">
                {detailContract.tenantPhone || detailContract.tenantEmail || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng thành viên">{detailContract.memberCount || 1} người</Descriptions.Item>
            </Descriptions>

            <div className="cm-form-section-title">
              <CalendarOutlined style={{ color: "#2563eb" }} /> Giá trị và thời hạn hợp đồng
            </div>
            <Descriptions bordered size="small" column={2} className="cm-descriptions">
              <Descriptions.Item label="Giá thuê">{formatCurrency(detailContract.monthlyRent)}</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatCurrency(detailContract.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailContract.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày vào ở">{formatDate(detailContract.moveInDate)}</Descriptions.Item>
              <Descriptions.Item label="Thời hạn">{detailContract.durationMonths} tháng</Descriptions.Item>
              <Descriptions.Item label="Hết hạn">{formatDate(detailContract.endDate)}</Descriptions.Item>
              <Descriptions.Item label="Điều khoản" span={2}>
                {detailContract.terms || "-"}
              </Descriptions.Item>
              {detailContract.revisionRequests?.length ? (
                <Descriptions.Item label="Yêu cầu chỉnh sửa gần nhất" span={2}>
                  {detailContract.revisionRequests[detailContract.revisionRequests.length - 1]?.message || "-"}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ContractManagementPage;
