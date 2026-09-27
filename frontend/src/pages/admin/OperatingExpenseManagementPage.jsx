import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
  DeleteOutlined,
  DollarCircleFilled,
  DollarOutlined,
  EditOutlined,
  ExperimentOutlined,
  EyeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
  WalletFilled,
  WifiOutlined,
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
  Progress,
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

const now = new Date();

const defaultFormValues = {
  amount: 0,
  expenseDate: dayjs(),
  month: now.getMonth() + 1,
  status: "paid",
  year: now.getFullYear(),
};

const categoryOptions = [
  { label: "Internet", value: "internet" },
  { label: "Vệ sinh", value: "cleaning" },
  { label: "Bảo trì", value: "maintenance" },
  { label: "Bảo vệ", value: "security" },
  { label: "Điện chung", value: "common_electricity" },
  { label: "Nước chung", value: "common_water" },
  { label: "Rác thải", value: "garbage" },
  { label: "Quản lý", value: "management" },
  { label: "Khác", value: "other" },
];

const categoryMeta = {
  internet: {
    bg: "#f0f9ff",
    border: "#bae6fd",
    color: "#0284c7",
    icon: <WifiOutlined />,
    label: "Internet",
  },
  cleaning: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    color: "#059669",
    icon: <ClearOutlined />,
    label: "Vệ sinh",
  },
  maintenance: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#d97706",
    icon: <ToolOutlined />,
    label: "Bảo trì",
  },
  security: {
    bg: "#eef2ff",
    border: "#c7d2fe",
    color: "#4f46e5",
    icon: <SafetyCertificateOutlined />,
    label: "Bảo vệ",
  },
  common_electricity: {
    bg: "#fefce8",
    border: "#fef08a",
    color: "#ca8a04",
    icon: <ThunderboltOutlined />,
    label: "Điện chung",
  },
  common_water: {
    bg: "#ecfeff",
    border: "#a5f3fc",
    color: "#0891b2",
    icon: <ExperimentOutlined />,
    label: "Nước chung",
  },
  garbage: {
    bg: "#f8fafc",
    border: "#e2e8f0",
    color: "#64748b",
    icon: <DeleteOutlined />,
    label: "Rác thải",
  },
  management: {
    bg: "#f5f3ff",
    border: "#ddd6fe",
    color: "#7c3aed",
    icon: <AppstoreOutlined />,
    label: "Quản lý",
  },
  other: {
    bg: "#f1f5f9",
    border: "#cbd5e1",
    color: "#475569",
    icon: <DollarOutlined />,
    label: "Khác",
  },
};

const statusOptions = [
  { label: "Chờ chi", value: "pending" },
  { label: "Đã chi", value: "paid" },
  { label: "Đã hủy", value: "cancelled" },
];

const statusMeta = {
  pending: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#b45309",
    icon: <ClockCircleFilled />,
    label: "Chờ chi",
  },
  paid: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    color: "#047857",
    icon: <CheckCircleFilled />,
    label: "Đã chi",
  },
  cancelled: {
    bg: "#f1f5f9",
    border: "#e2e8f0",
    color: "#64748b",
    icon: <CloseCircleFilled />,
    label: "Đã hủy",
  },
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Tháng ${index + 1}`,
  value: index + 1,
}));

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const getCategoryMeta = (value) =>
  categoryMeta[value] || {
    bg: "#f1f5f9",
    border: "#cbd5e1",
    color: "#475569",
    icon: <DollarOutlined />,
    label: value || "-",
  };

const renderCategoryTag = (category) => {
  const meta = getCategoryMeta(category);
  return (
    <span
      className="oe-category-tag"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
        color: meta.color,
      }}
    >
      <span className="oe-cat-icon">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
};

const renderStatusTag = (status) => {
  const meta = statusMeta[status] || statusMeta.pending;
  return (
    <span
      className="oe-status-tag"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
        color: meta.color,
      }}
    >
      <span className="oe-status-icon">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
};

const toFormValues = (record) => ({
  ...record,
  expenseDate: record.expenseDate ? dayjs(record.expenseDate) : undefined,
});

const toPayload = (values) => ({
  ...values,
  expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
});

const createDefaultExpenseItems = (month = now.getMonth() + 1, year = now.getFullYear()) =>
  categoryOptions.map((option) => ({
    amount: 0,
    category: option.value,
    note: "",
    title: `${option.label} tháng ${month}/${year}`,
  }));

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const inlineStyles = `
/* ==========================================================================
   Operating Expense Management - Modern Aesthetic Theme
   ========================================================================== */
.oe-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: oeFadeIn 0.35s ease-out;
}

@keyframes oeFadeIn {
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
.oe-hero-banner {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%);
  border-radius: 18px;
  padding: 28px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px -4px rgba(67, 56, 202, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.oe-hero-banner::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(165, 180, 252, 0.35) 0%, rgba(165, 180, 252, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.oe-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -60px;
  left: 20%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.oe-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.oe-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.oe-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #e0e7ff;
  width: fit-content;
}

.oe-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #818cf8;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7);
  animation: oePulse 2s infinite;
}

@keyframes oePulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(129, 140, 248, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); }
}

.oe-hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.oe-hero-subtitle {
  color: #e0e7ff !important;
  font-size: 14px;
  margin: 0 !important;
  max-width: 650px;
}

.oe-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.oe-btn-reload {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  backdrop-filter: blur(8px);
  font-weight: 600;
  height: 40px !important;
  transition: all 0.2s ease !important;
}

.oe-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

.oe-btn-add {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  font-weight: 700;
  height: 40px !important;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4) !important;
  transition: all 0.2s ease !important;
}

.oe-btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.55) !important;
}

/* KPI Stats Grid */
.oe-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.oe-stat-card {
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

.oe-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  border-color: #cbd5e1;
}

.oe-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.oe-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.oe-stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.oe-stat-sub {
  font-size: 12px;
  color: #94a3b8;
}

.oe-stat-icon-wrap {
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

.oe-stat-card:hover .oe-stat-icon-wrap {
  transform: scale(1.08);
}

.oe-icon-indigo { background: #eef2ff; color: #4f46e5; }
.oe-icon-emerald { background: #ecfdf5; color: #059669; }
.oe-icon-amber { background: #fffbeb; color: #d97706; }
.oe-icon-purple { background: #f5f3ff; color: #7c3aed; }

/* Filter Card */
.oe-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.oe-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.oe-filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.oe-search-input {
  max-width: 320px;
  min-width: 220px;
  border-radius: 10px !important;
  height: 40px !important;
  border-color: #cbd5e1 !important;
}

.oe-search-input:focus,
.oe-search-input:hover {
  border-color: #6366f1 !important;
}

.oe-filter-select {
  min-width: 150px;
  height: 40px !important;
}

.oe-filter-select .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  border-color: #cbd5e1 !important;
  display: flex;
  align-items: center;
}

.oe-year-input {
  min-width: 110px;
  height: 40px !important;
  border-radius: 10px !important;
  border-color: #cbd5e1 !important;
}

.oe-year-input .ant-input-number-input {
  height: 38px !important;
}

.oe-filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.oe-btn-reset {
  height: 40px !important;
  border-radius: 10px !important;
  color: #64748b !important;
  border-color: #cbd5e1 !important;
  font-weight: 600;
}

.oe-btn-reset:hover {
  color: #4f46e5 !important;
  border-color: #6366f1 !important;
  background: #eef2ff !important;
}

/* Table Card Container */
.oe-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.oe-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 12px;
}

.oe-table-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.oe-table-title-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.oe-table-subtitle {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

/* Custom Table Styling */
.oe-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  color: #475569 !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.oe-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  transition: background 0.15s ease;
}

.oe-table .ant-table-tbody > tr:hover > td {
  background: #f8faff !important;
}

/* Period Cell */
.oe-period-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.oe-period-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  line-height: 1.1;
  border: 1px solid #a5b4fc;
}

.oe-period-avatar .period-year {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
}

.oe-period-info {
  display: flex;
  flex-direction: column;
}

.oe-period-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 14px;
}

.oe-period-tag {
  font-size: 11px;
  color: #64748b;
}

/* Item Count Badge */
.oe-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

/* Tags */
.oe-category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

.oe-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* Action Buttons */
.oe-action-btn-view {
  color: #4f46e5 !important;
  background: #eef2ff !important;
  border: 1px solid #c7d2fe !important;
  border-radius: 8px !important;
  font-weight: 600;
  height: 32px !important;
  transition: all 0.2s ease !important;
}

.oe-action-btn-view:hover {
  background: #4f46e5 !important;
  color: #ffffff !important;
  border-color: #4f46e5 !important;
  transform: translateY(-1px);
}

.oe-action-btn-edit {
  color: #d97706 !important;
  background: #fffbeb !important;
  border: 1px solid #fde68a !important;
  border-radius: 8px !important;
  height: 32px !important;
  transition: all 0.2s ease !important;
}

.oe-action-btn-edit:hover {
  background: #d97706 !important;
  color: #ffffff !important;
  border-color: #d97706 !important;
  transform: translateY(-1px);
}

.oe-action-btn-delete {
  color: #dc2626 !important;
  background: #fef2f2 !important;
  border: 1px solid #fecaca !important;
  border-radius: 8px !important;
  height: 32px !important;
  transition: all 0.2s ease !important;
}

.oe-action-btn-delete:hover:not(:disabled) {
  background: #dc2626 !important;
  color: #ffffff !important;
  border-color: #dc2626 !important;
  transform: translateY(-1px);
}

/* Modal styling */
.oe-modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.oe-modal-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.oe-section-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.oe-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Detail Modal KPI Cards */
.oe-detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.oe-detail-stat-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.oe-detail-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.oe-detail-stat-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 2px;
}

/* Live Summary Footer in Bulk Modal */
.oe-bulk-total-bar {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border: 1px dashed #a5b4fc;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.oe-bulk-total-label {
  font-weight: 600;
  color: #4338ca;
  font-size: 14px;
}

.oe-bulk-total-value {
  font-size: 18px;
  font-weight: 800;
  color: #312e81;
}
`;

function OperatingExpenseManagementPage() {
  const [form] = Form.useForm();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");

  const watchedItems = Form.useWatch("items", form);

  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/operating-expenses");
      setExpenses(data.data || data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách chi phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const summary = useMemo(() => {
    return expenses.reduce(
      (result, item) => {
        const amount = Number(item.amount || 0);
        result.total += amount;

        if (item.status === "paid") {
          result.paid += amount;
        }

        if (item.status === "pending") {
          result.pending += amount;
        }

        if (item.status === "cancelled") {
          result.cancelled += amount;
        }

        return result;
      },
      { cancelled: 0, paid: 0, pending: 0, total: 0 },
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const keyword = normalizeText(searchText);

    return expenses.filter((item) => {
      const matchSearch =
        !keyword ||
        [item.title, item.note, item.createdByName, getCategoryMeta(item.category).label]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(keyword));
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchMonth = monthFilter === "all" || Number(item.month) === Number(monthFilter);
      const matchYear = !yearFilter || Number(item.year) === Number(yearFilter);

      return matchSearch && matchCategory && matchStatus && matchMonth && matchYear;
    });
  }, [categoryFilter, expenses, monthFilter, searchText, statusFilter, yearFilter]);

  const groupedExpenses = useMemo(() => {
    const groups = filteredExpenses.reduce((result, item) => {
      const key = `${item.year}-${item.month}`;

      if (!result[key]) {
        result[key] = {
          cancelledAmount: 0,
          itemCount: 0,
          items: [],
          key,
          month: item.month,
          paidAmount: 0,
          pendingAmount: 0,
          totalAmount: 0,
          year: item.year,
        };
      }

      const amount = Number(item.amount || 0);
      result[key].items.push(item);
      result[key].itemCount += 1;
      result[key].totalAmount += amount;

      if (item.status === "paid") {
        result[key].paidAmount += amount;
      }

      if (item.status === "pending") {
        result[key].pendingAmount += amount;
      }

      if (item.status === "cancelled") {
        result[key].cancelledAmount += amount;
      }

      return result;
    }, {});

    return Object.values(groups).sort((a, b) => {
      if (b.year !== a.year) {
        return Number(b.year) - Number(a.year);
      }

      return Number(b.month) - Number(a.month);
    });
  }, [filteredExpenses]);

  const detailGroup = useMemo(
    () => groupedExpenses.find((group) => group.key === detailGroupKey),
    [detailGroupKey, groupedExpenses],
  );

  const bulkCalculatedTotal = useMemo(() => {
    if (!watchedItems || !Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [watchedItems]);

  const resetFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("");
  };

  const hasActiveFilters = Boolean(
    searchText ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    monthFilter !== "all" ||
    yearFilter,
  );

  const openCreateModal = () => {
    setEditingExpense(null);
    form.setFieldsValue({
      ...defaultFormValues,
      items: createDefaultExpenseItems(defaultFormValues.month, defaultFormValues.year),
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingExpense(record);
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const handleViewDetail = (record) => {
    setDetailGroupKey(record.key);
    setDetailOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingExpense) {
        await http.put(`/operating-expenses/${editingExpense._id}`, toPayload(values));
        message.success("Đã cập nhật chi phí thành công");
      } else {
        const items = (values.items || [])
          .filter((item) => Number(item.amount || 0) > 0)
          .map((item) => ({
            category: item.category,
            title: item.title,
            amount: item.amount,
            note: item.note,
          }));
        if (!items.length) {
          message.warning("Cần nhập ít nhất một khoản chi có số tiền lớn hơn 0");
          return;
        }

        await http.post("/operating-expenses/bulk", {
          expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
          items,
          month: values.month,
          status: values.status,
          year: values.year,
        });
        message.success(`Đã tạo thành công ${items.length} khoản chi phí`);
      }

      setModalOpen(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Không lưu được chi phí");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/operating-expenses/${record._id}`);
      message.success("Đã xóa khoản chi phí thành công");
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Không xóa được chi phí");
    }
  };

  const groupColumns = [
    {
      dataIndex: "month",
      key: "period",
      render: (_, record) => (
        <div className="oe-period-cell">
          <div className="oe-period-avatar">
            <span>T{record.month}</span>
            <span className="period-year">{record.year}</span>
          </div>
          <div className="oe-period-info">
            <span className="oe-period-name">
              Tháng {record.month}/{record.year}
            </span>
            <span className="oe-period-tag">Kỳ chi phí vận hành toà nhà</span>
          </div>
        </div>
      ),
      title: "KỲ CHI PHÍ",
      width: 220,
    },
    {
      align: "center",
      dataIndex: "itemCount",
      key: "itemCount",
      render: (value) => <span className="oe-count-badge">{value} khoản</span>,
      title: "SỐ KHOẢN",
      width: 120,
    },
    {
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => (
        <Typography.Text strong style={{ color: "#1e1b4b", fontSize: 14 }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
      title: "TỔNG CHI",
      width: 170,
    },
    {
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (value) => (
        <Typography.Text strong style={{ color: "#047857" }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
      title: "ĐÃ CHI",
      width: 160,
    },
    {
      dataIndex: "pendingAmount",
      key: "pendingAmount",
      render: (value) => (
        <Typography.Text strong style={{ color: "#b45309" }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
      title: "CHỜ CHI",
      width: 160,
    },
    {
      dataIndex: "cancelledAmount",
      key: "cancelledAmount",
      render: (value) => (
        <Typography.Text style={{ color: "#94a3b8" }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
      title: "ĐÃ HỦY",
      width: 140,
    },
    {
      key: "progress",
      render: (_, record) => {
        const total = Number(record.totalAmount || 0);
        const paid = Number(record.paidAmount || 0);
        const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
        return (
          <div style={{ minWidth: 100, paddingRight: 8 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor="#10b981"
              trailColor="#e2e8f0"
            />
          </div>
        );
      },
      title: "TIẾN ĐỘ CHI",
      width: 150,
    },
    {
      align: "center",
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết các khoản chi">
          <Button
            className="oe-action-btn-view"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            Chi tiết
          </Button>
        </Tooltip>
      ),
      title: "THAO TÁC",
      width: 110,
    },
  ];

  const detailColumns = [
    {
      dataIndex: "category",
      key: "category",
      render: (value) => renderCategoryTag(value),
      title: "LOẠI CHI PHÍ",
      width: 160,
    },
    {
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong style={{ color: "#0f172a" }}>
            {value}
          </Typography.Text>
          {record.note ? (
            <Typography.Text style={{ color: "#64748b", fontSize: 12 }}>
              {record.note}
            </Typography.Text>
          ) : null}
        </Space>
      ),
      title: "TIÊU ĐỀ & GHI CHÚ",
      width: 260,
    },
    {
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Typography.Text strong style={{ color: "#1e1b4b", fontSize: 14 }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
      title: "SỐ TIỀN",
      width: 150,
    },
    {
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: (value) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "#94a3b8" }} />
          <span>{formatDate(value)}</span>
        </Space>
      ),
      title: "NGÀY PHÁT SINH",
      width: 140,
    },
    {
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
      title: "TRẠNG THÁI",
      width: 130,
    },
    {
      dataIndex: "createdByName",
      key: "createdByName",
      render: (value) => (
        <Space size={6}>
          <Avatar icon={<UserOutlined />} size={22} style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }} />
          <span>{value || "Quản trị viên"}</span>
        </Space>
      ),
      title: "NGƯỜI TẠO",
      width: 150,
    },
    {
      align: "center",
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Sửa khoản chi">
            <Button
              className="oe-action-btn-edit"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              shape="circle"
              size="small"
            />
          </Tooltip>
          <Popconfirm
            cancelText="Hủy"
            disabled={record.status === "paid"}
            okText="Xóa"
            onConfirm={() => handleDelete(record)}
            title="Xóa chi phí này?"
          >
            <Tooltip title={record.status === "paid" ? "Khoản chi đã chi không thể xóa" : "Xóa khoản chi"}>
              <Button
                className="oe-action-btn-delete"
                danger
                disabled={record.status === "paid"}
                icon={<DeleteOutlined />}
                shape="circle"
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      title: "THAO TÁC",
      width: 100,
    },
  ];

  return (
    <div className="oe-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Header Banner */}
      <div className="oe-hero-banner">
        <div className="oe-hero-inner">
          <div className="oe-hero-left">
            <div className="oe-hero-badge">
              <span className="pulse-dot" />
              <span>QUẢN LÝ TÀI CHÍNH VẬN HÀNH</span>
            </div>
            <h1 className="oe-hero-title">Quản Lý Chi Phí Vận Hành</h1>
            <p className="oe-hero-subtitle">
              Theo dõi, phân bổ và kiểm soát toàn bộ các khoản chi định kỳ hàng tháng theo từng kỳ vận hành tòa nhà.
            </p>
          </div>
          <div className="oe-hero-right">
            <Button
              className="oe-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchExpenses}
            >
              Làm mới
            </Button>
            <Button
              className="oe-btn-add"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              type="primary"
            >
              Tạo chi phí kỳ mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="oe-stats-grid">
        <div className="oe-stat-card">
          <div className="oe-stat-info">
            <span className="oe-stat-label">TỔNG CHI PHÍ TÍCH LŨY</span>
            <span className="oe-stat-value">{currencyFormatter(summary.total)}</span>
            <span className="oe-stat-sub">Tổng các khoản chi trong hệ thống</span>
          </div>
          <div className="oe-stat-icon-wrap oe-icon-indigo">
            <WalletFilled />
          </div>
        </div>

        <div className="oe-stat-card">
          <div className="oe-stat-info">
            <span className="oe-stat-label">ĐÃ THANH TOÁN (ĐÃ CHI)</span>
            <span className="oe-stat-value" style={{ color: "#047857" }}>
              {currencyFormatter(summary.paid)}
            </span>
            <span className="oe-stat-sub">
              {summary.total > 0
                ? `Chiếm ${Math.round((summary.paid / summary.total) * 100)}% tổng chi phí`
                : "0% tổng chi phí"}
            </span>
          </div>
          <div className="oe-stat-icon-wrap oe-icon-emerald">
            <CheckCircleFilled />
          </div>
        </div>

        <div className="oe-stat-card">
          <div className="oe-stat-info">
            <span className="oe-stat-label">ĐANG CHỜ CHI</span>
            <span className="oe-stat-value" style={{ color: "#b45309" }}>
              {currencyFormatter(summary.pending)}
            </span>
            <span className="oe-stat-sub">Cần chuẩn bị quỹ thanh toán</span>
          </div>
          <div className="oe-stat-icon-wrap oe-icon-amber">
            <ClockCircleFilled />
          </div>
        </div>

        <div className="oe-stat-card">
          <div className="oe-stat-info">
            <span className="oe-stat-label">QUY MÔ KỲ & KHOẢN CHI</span>
            <span className="oe-stat-value" style={{ color: "#7c3aed" }}>
              {groupedExpenses.length} <span style={{ fontSize: 15, fontWeight: 600 }}>kỳ</span> / {expenses.length} <span style={{ fontSize: 15, fontWeight: 600 }}>khoản</span>
            </span>
            <span className="oe-stat-sub">Phân bổ chi phí theo các tháng</span>
          </div>
          <div className="oe-stat-icon-wrap oe-icon-purple">
            <DollarCircleFilled />
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="oe-filter-card">
        <div className="oe-filter-row">
          <div className="oe-filter-left">
            <Input
              allowClear
              className="oe-search-input"
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm theo tiêu đề, ghi chú, người tạo..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={searchText}
            />

            <Select
              className="oe-filter-select"
              onChange={setCategoryFilter}
              options={[{ label: "Tất cả loại chi", value: "all" }, ...categoryOptions]}
              placeholder="Loại chi phí"
              value={categoryFilter}
            />

            <Select
              className="oe-filter-select"
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
              placeholder="Trạng thái"
              value={statusFilter}
            />

            <Select
              className="oe-filter-select"
              onChange={setMonthFilter}
              options={[{ label: "Tất cả tháng", value: "all" }, ...monthOptions]}
              placeholder="Tháng"
              value={monthFilter}
            />

            <InputNumber
              className="oe-year-input"
              min={2000}
              onChange={(value) => setYearFilter(value || "")}
              placeholder="Năm"
              value={yearFilter || null}
            />
          </div>

          <div className="oe-filter-right">
            {hasActiveFilters && (
              <Button
                className="oe-btn-reset"
                icon={<FilterOutlined />}
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="oe-table-card">
        <div className="oe-table-header">
          <div className="oe-table-title">
            <div className="oe-table-title-icon">
              <DollarOutlined />
            </div>
            <span>Danh Sách Chi Phí Theo Kỳ Vận Hành</span>
          </div>
          <div className="oe-table-subtitle">
            Hiển thị <strong>{groupedExpenses.length}</strong> kỳ vận hành / <strong>{filteredExpenses.length}</strong> khoản chi phí
          </div>
        </div>

        <Table
          className="oe-table"
          columns={groupColumns}
          dataSource={groupedExpenses}
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description="Không tìm thấy chi phí vận hành nào phù hợp"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng cộng ${total} kỳ chi phí`,
          }}
          rowKey="key"
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Modal Thêm Mới / Sửa Chi Phí */}
      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => {
          setModalOpen(false);
          setEditingExpense(null);
          form.resetFields();
        }}
        open={modalOpen}
        title={
          <div className="oe-modal-header">
            <div className="oe-modal-header-icon">
              <DollarOutlined />
            </div>
            <div>
              <Typography.Text strong style={{ fontSize: 17, color: "#0f172a" }}>
                {editingExpense ? "Cập Nhật Khoản Chi Phí" : "Tạo Danh Sách Chi Phí Kỳ Mới"}
              </Typography.Text>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                {editingExpense
                  ? "Chỉnh sửa thông tin chi tiết của khoản chi này"
                  : "Khởi tạo nhanh các danh mục chi phí vận hành cho tòa nhà"}
              </div>
            </div>
          </div>
        }
        width={editingExpense ? 760 : 1020}
      >
        <Alert
          message={
            editingExpense
              ? "Cập nhật thông tin khoản chi, trạng thái và ngày phát sinh."
              : "Hệ thống tự động đề xuất các khoản chi tiêu chuẩn. Chỉ những dòng có số tiền lớn hơn 0 mới được lưu vào hệ thống."
          }
          showIcon
          style={{
            backgroundColor: "#f0fdf4",
            borderColor: "#bbf7d0",
            borderRadius: 10,
            marginBottom: 20,
          }}
          type="info"
        />

        <Form form={form} initialValues={defaultFormValues} layout="vertical" onFinish={handleSubmit}>
          {/* Section 1: Kỳ chi phí */}
          <div className="oe-section-box">
            <div className="oe-section-title">
              <CalendarOutlined style={{ color: "#4f46e5" }} />
              <span>Thông Tin Kỳ & Ngày Phát Sinh</span>
            </div>

            <Row gutter={16}>
              <Col md={6} sm={12} xs={24}>
                <Form.Item
                  label="Ngày phát sinh"
                  name="expenseDate"
                  rules={[{ message: "Chọn ngày phát sinh", required: true }]}
                >
                  <DatePicker format="DD/MM/YYYY" style={{ borderRadius: 8, height: 38, width: "100%" }} />
                </Form.Item>
              </Col>
              <Col md={6} sm={12} xs={24}>
                <Form.Item
                  label="Tháng"
                  name="month"
                  rules={[{ message: "Chọn tháng", required: true }]}
                >
                  <Select options={monthOptions} style={{ height: 38 }} />
                </Form.Item>
              </Col>
              <Col md={6} sm={12} xs={24}>
                <Form.Item
                  label="Năm"
                  name="year"
                  rules={[{ message: "Nhập năm", required: true }]}
                >
                  <InputNumber min={2000} style={{ borderRadius: 8, height: 38, width: "100%" }} />
                </Form.Item>
              </Col>
              <Col md={6} sm={12} xs={24}>
                <Form.Item
                  label="Trạng thái thanh toán"
                  name="status"
                  rules={[{ message: "Chọn trạng thái", required: true }]}
                >
                  <Select options={statusOptions} style={{ height: 38 }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {editingExpense ? (
            /* Section 2 (Single Edit): Thông tin khoản chi */
            <div className="oe-section-box">
              <div className="oe-section-title">
                <InfoCircleOutlined style={{ color: "#4f46e5" }} />
                <span>Chi Tiết Khoản Chi</span>
              </div>

              <Row gutter={16}>
                <Col md={12} xs={24}>
                  <Form.Item
                    label="Loại chi phí"
                    name="category"
                    rules={[{ message: "Chọn loại chi phí", required: true }]}
                  >
                    <Select options={categoryOptions} style={{ height: 38 }} />
                  </Form.Item>
                </Col>
                <Col md={12} xs={24}>
                  <Form.Item
                    label="Tiêu đề khoản chi"
                    name="title"
                    rules={[{ message: "Nhập tiêu đề", required: true }]}
                  >
                    <Input placeholder="VD: Tiền internet tòa nhà tháng này" style={{ borderRadius: 8, height: 38 }} />
                  </Form.Item>
                </Col>
                <Col md={12} xs={24}>
                  <Form.Item
                    label="Số tiền (VND)"
                    name="amount"
                    rules={[{ message: "Nhập số tiền", required: true }]}
                  >
                    <InputNumber
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      min={0}
                      parser={(val) => val.replace(/\$\s?|(,*)/g, "")}
                      style={{ borderRadius: 8, height: 38, width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col md={12} xs={24}>
                  <Form.Item label="Ghi chú" name="note">
                    <Input placeholder="Ghi chú thêm nếu có" style={{ borderRadius: 8, height: 38 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ) : (
            /* Section 2 (Bulk Create): Danh sách các dòng chi phí */
            <div className="oe-section-box">
              <div className="oe-section-title">
                <AppstoreOutlined style={{ color: "#4f46e5" }} />
                <span>Danh Sách Các Khoản Chi</span>
              </div>

              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Table
                      className="oe-table"
                      columns={[
                        {
                          key: "category",
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, "category"]}
                              rules={[{ message: "Chọn loại", required: true }]}
                              style={{ margin: 0 }}
                            >
                              <Select options={categoryOptions} style={{ minWidth: 150 }} />
                            </Form.Item>
                          ),
                          title: "Loại chi phí",
                          width: 170,
                        },
                        {
                          key: "title",
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, "title"]}
                              rules={[{ message: "Nhập tiêu đề", required: true }]}
                              style={{ margin: 0 }}
                            >
                              <Input placeholder="Tiêu đề khoản chi" style={{ borderRadius: 6 }} />
                            </Form.Item>
                          ),
                          title: "Tiêu đề",
                          width: 250,
                        },
                        {
                          key: "amount",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "amount"]} style={{ margin: 0 }}>
                              <InputNumber
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                min={0}
                                parser={(val) => val.replace(/\$\s?|(,*)/g, "")}
                                placeholder="0 VND"
                                style={{ borderRadius: 6, width: "100%" }}
                              />
                            </Form.Item>
                          ),
                          title: "Số tiền (VND)",
                          width: 180,
                        },
                        {
                          key: "note",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "note"]} style={{ margin: 0 }}>
                              <Input placeholder="Ghi chú thêm" style={{ borderRadius: 6 }} />
                            </Form.Item>
                          ),
                          title: "Ghi chú",
                        },
                        {
                          align: "center",
                          key: "actions",
                          render: (_, field) => (
                            <Button
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(field.name)}
                              shape="circle"
                              size="small"
                            />
                          ),
                          title: "",
                          width: 60,
                        },
                      ]}
                      dataSource={fields}
                      pagination={false}
                      rowKey="key"
                      scroll={{ x: 780 }}
                    />

                    <Button
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add({ amount: 0, category: "other", note: "", title: "" })}
                      style={{
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                        borderStyle: "dashed",
                        borderRadius: 8,
                        color: "#4f46e5",
                        fontWeight: 600,
                        height: 38,
                      }}
                    >
                      Thêm dòng chi phí mới
                    </Button>

                    <div className="oe-bulk-total-bar">
                      <span className="oe-bulk-total-label">
                        Tổng cộng ước tính (các dòng {">"} 0 VND):
                      </span>
                      <span className="oe-bulk-total-value">
                        {currencyFormatter(bulkCalculatedTotal)}
                      </span>
                    </div>
                  </Space>
                )}
              </Form.List>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingExpense(null);
                form.resetFields();
              }}
              style={{ borderRadius: 8, height: 38 }}
            >
              Hủy
            </Button>
            <Button
              className="oe-btn-add"
              htmlType="submit"
              loading={submitting}
              style={{ height: 38 }}
              type="primary"
            >
              {editingExpense ? "Lưu thay đổi" : "Lưu danh sách chi phí"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Xem Chi Tiết Kỳ Chi Phí */}
      <Modal
        footer={null}
        onCancel={() => setDetailOpen(false)}
        open={detailOpen}
        title={
          <div className="oe-modal-header">
            <div className="oe-modal-header-icon">
              <EyeOutlined />
            </div>
            <div>
              <Typography.Text strong style={{ fontSize: 17, color: "#0f172a" }}>
                Chi Tiết Kỳ Chi Phí Tháng {detailGroup ? `${detailGroup.month}/${detailGroup.year}` : ""}
              </Typography.Text>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Toàn bộ danh sách các khoản chi phát sinh trong kỳ này
              </div>
            </div>
          </div>
        }
        width={1100}
      >
        {detailGroup ? (
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            {/* KPI Mini-Cards in Detail */}
            <div className="oe-detail-summary-grid">
              <div className="oe-detail-stat-box" style={{ borderLeft: "4px solid #4f46e5" }}>
                <div className="oe-detail-stat-label">Tổng Chi Kỳ Này</div>
                <div className="oe-detail-stat-value" style={{ color: "#4f46e5" }}>
                  {currencyFormatter(detailGroup.totalAmount)}
                </div>
              </div>
              <div className="oe-detail-stat-box" style={{ borderLeft: "4px solid #059669" }}>
                <div className="oe-detail-stat-label">Đã Chi (Thanh Toán)</div>
                <div className="oe-detail-stat-value" style={{ color: "#059669" }}>
                  {currencyFormatter(detailGroup.paidAmount)}
                </div>
              </div>
              <div className="oe-detail-stat-box" style={{ borderLeft: "4px solid #d97706" }}>
                <div className="oe-detail-stat-label">Đang Chờ Chi</div>
                <div className="oe-detail-stat-value" style={{ color: "#d97706" }}>
                  {currencyFormatter(detailGroup.pendingAmount)}
                </div>
              </div>
              <div className="oe-detail-stat-box" style={{ borderLeft: "4px solid #94a3b8" }}>
                <div className="oe-detail-stat-label">Số Khoản Chi</div>
                <div className="oe-detail-stat-value" style={{ color: "#334155" }}>
                  {detailGroup.itemCount} khoản
                </div>
              </div>
            </div>

            <Table
              className="oe-table"
              columns={detailColumns}
              dataSource={detailGroup.items}
              pagination={false}
              rowKey="_id"
              scroll={{ x: 1000 }}
            />
          </Space>
        ) : (
          <Empty description="Không tìm thấy chi tiết chi phí kỳ này" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </div>
  );
}

export default OperatingExpenseManagementPage;
