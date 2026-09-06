import {
  CalendarOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HomeOutlined,
  IdcardOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
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

const defaultFormValues = {
  roomRole: "member",
  status: "active",
};

const statusOptions = [
  { label: "Đang thuê", value: "active" },
  { label: "Đã kết thúc", value: "inactive" },
];

const roomRoleOptions = [
  { label: "Người đại diện phòng", value: "representative" },
  { label: "Người thuê phòng", value: "member" },
];

const roomRoleMeta = {
  representative: {
    color: "gold",
    label: "Đại diện phòng",
    bg: "#fef3c7",
    textColor: "#b45309",
    border: "#fde68a",
    icon: <CrownOutlined />,
  },
  member: {
    color: "green",
    label: "Người thuê phòng",
    bg: "#ecfdf5",
    textColor: "#047857",
    border: "#a7f3d0",
    icon: <UserOutlined />,
  },
};

const statusMeta = {
  active: {
    color: "blue",
    label: "Đang thuê",
    bg: "#ecfdf5",
    textColor: "#047857",
    border: "#a7f3d0",
    icon: <CheckCircleOutlined />,
  },
  inactive: {
    color: "default",
    label: "Đã kết thúc",
    bg: "#f1f5f9",
    textColor: "#64748b",
    border: "#e2e8f0",
    icon: <StopOutlined />,
  },
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

const inlineStyles = `
/* ==========================================================================
   Tenant Management - Modern Aesthetic Theme
   ========================================================================== */
.tm-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  animation: tmFadeIn 0.35s ease-out;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

@keyframes tmFadeIn {
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
.tm-hero-banner {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%);
  border-radius: 18px;
  padding: 30px 36px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px -4px rgba(99, 102, 241, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tm-hero-banner::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.35) 0%, rgba(129, 140, 248, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.tm-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -60px;
  left: 20%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.tm-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.tm-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tm-hero-badge {
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

.tm-hero-badge .pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #818cf8;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7);
  animation: tmPulse 2s infinite;
}

@keyframes tmPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(129, 140, 248, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
}

.tm-hero-title {
  font-size: 28px;
  font-weight: 800;
  color: #ffffff !important;
  margin: 0 !important;
  letter-spacing: -0.5px;
}

.tm-hero-subtitle {
  color: #e2e8f0 !important;
  font-size: 14px;
  margin: 0 !important;
  max-width: 620px;
  line-height: 1.5;
}

.tm-hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tm-btn-reload {
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

.tm-btn-reload:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

.tm-btn-primary {
  background: #ffffff !important;
  color: #4338ca !important;
  border: none !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  height: 42px !important;
  padding: 0 20px !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease !important;
}

.tm-btn-primary:hover {
  background: #f8fafc !important;
  color: #312e81 !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
}

/* KPI Stats Grid */
.tm-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.tm-stat-card {
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

.tm-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.tm-stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.tm-stat-card.stat-indigo::before { background: #6366f1; }
.tm-stat-card.stat-emerald::before { background: #10b981; }
.tm-stat-card.stat-amber::before { background: #f59e0b; }
.tm-stat-card.stat-slate::before { background: #64748b; }

.tm-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tm-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tm-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.tm-stat-sub {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.tm-stat-icon-wrap {
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

.icon-emerald {
  background: #ecfdf5;
  color: #10b981;
}

.icon-amber {
  background: #fffbeb;
  color: #f59e0b;
}

.icon-slate {
  background: #f1f5f9;
  color: #64748b;
}

/* Filter Card */
.tm-filter-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  padding: 16px 20px;
}

.tm-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tm-filter-left {
  flex: 1;
  min-width: 280px;
}

.tm-filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tm-search-input {
  border-radius: 10px !important;
  height: 40px !important;
  border-color: #e2e8f0 !important;
  box-shadow: none !important;
  font-size: 13px !important;
}

.tm-search-input:focus,
.tm-search-input:hover {
  border-color: #6366f1 !important;
}

.tm-select-filter {
  min-width: 170px;
}

.tm-select-filter .ant-select-selector {
  border-radius: 10px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  border-color: #e2e8f0 !important;
}

.tm-btn-reset {
  border-radius: 10px !important;
  height: 40px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
}

.tm-btn-reset:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}

/* Table Card */
.tm-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.tm-table-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  flex-wrap: wrap;
  gap: 12px;
}

.tm-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tm-count-pill {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #e0e7ff;
}

.tm-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  font-weight: 700 !important;
  color: #64748b !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 14px 16px !important;
}

.tm-table .ant-table-tbody > tr > td {
  padding: 14px 16px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  font-size: 13px !important;
}

.tm-table .ant-table-tbody > tr:hover > td {
  background: #fbfbfe !important;
}

/* Tenant User Cell */
.tm-user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tm-user-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3) !important;
}

.tm-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tm-user-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.tm-user-idcard {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

/* Contact Cell */
.tm-contact-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tm-contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}

.tm-contact-item .anticon {
  color: #94a3b8;
}

/* Room Cell */
.tm-room-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
  color: #15803d;
  font-size: 13px;
}

.tm-room-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* Status & Role Badges */
.tm-role-badge {
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

.tm-status-badge {
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

.tm-date-text {
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Action Buttons */
.tm-action-btn {
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

.tm-action-btn:hover {
  transform: translateY(-1px) !important;
}

.tm-action-btn.btn-view:hover {
  color: #4f46e5 !important;
  border-color: #c7d2fe !important;
  background: #eef2ff !important;
}

.tm-action-btn.btn-edit:hover {
  color: #0284c7 !important;
  border-color: #bae6fd !important;
  background: #f0f9ff !important;
}

.tm-action-btn.btn-status-toggle:hover {
  color: #16a34a !important;
  border-color: #bbf7d0 !important;
  background: #f0fdf4 !important;
}

.tm-action-btn.btn-delete:hover {
  color: #dc2626 !important;
  border-color: #fecaca !important;
  background: #fef2f2 !important;
}

/* Form Styles */
.tm-form-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
  margin-top: 14px;
}

.tm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .tm-form-grid {
    grid-template-columns: 1fr;
  }
}

.tm-form-grid .ant-form-item {
  margin-bottom: 14px;
}

.tm-input-rounded {
  border-radius: 8px !important;
}

.tm-input-rounded .ant-select-selector,
.tm-input-rounded.ant-picker {
  border-radius: 8px !important;
  width: 100% !important;
}

/* Detail Profile Card */
.tm-detail-profile {
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

.tm-detail-profile-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tm-detail-name {
  font-size: 18px;
  font-weight: 800;
  color: #1e1b4b;
}

.tm-detail-sub {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}
`;

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
    const representatives = tenants.filter(
      (item) => item.roomRole === "representative" && item.status === "active"
    ).length;
    const inactive = tenants.filter((item) => item.status === "inactive").length;
    return { active, representatives, inactive, total: tenants.length };
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return tenants.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.userName, item.userEmail, item.userPhone, item.roomNumber, item.roomName].some(
          (value) => String(value || "").toLowerCase().includes(keyword)
        );
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

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const openDetailModal = (record) => {
    setDetailTenant(record);
    setDetailOpen(true);
  };

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
        message.success("Đã cập nhật thông tin khách thuê");
      } else {
        await http.post("/tenants", payload);
        message.success("Đã tạo mới khách thuê thành công");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu thông tin khách thuê thất bại");
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
      message.success(nextStatus === "active" ? "Đã kích hoạt khách thuê" : "Đã kết thúc hợp đồng thuê");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/tenants/${record.id}`);
      message.success("Đã xóa khách thuê thành công");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa khách thuê thất bại");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Khách thuê",
        dataIndex: "userName",
        key: "userName",
        width: 250,
        render: (value, record) => (
          <div className="tm-user-cell">
            <Avatar size={42} className="tm-user-avatar">
              {(value || "K").charAt(0).toUpperCase()}
            </Avatar>
            <div className="tm-user-info">
              <span className="tm-user-name">{value || "-"}</span>
              <span className="tm-user-idcard">
                <IdcardOutlined style={{ color: "#6366f1" }} />
                {record.userIdentityNumber || "Chưa có CCCD"}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: "Liên hệ",
        dataIndex: "userEmail",
        key: "userEmail",
        width: 230,
        render: (value, record) => (
          <div className="tm-contact-cell">
            <span className="tm-contact-item">
              <MailOutlined />
              <span>{value || "-"}</span>
            </span>
            <span className="tm-contact-item">
              <PhoneOutlined />
              <span style={{ fontWeight: 600, color: "#334155" }}>{record.userPhone || "-"}</span>
            </span>
          </div>
        ),
      },
      {
        title: "Phòng thuê",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 190,
        render: (value, record) => (
          <div>
            <span className="tm-room-cell">
              <HomeOutlined />
              Phòng {value || "-"}
            </span>
            <div className="tm-room-sub">{record.roomName || "-"}</div>
          </div>
        ),
      },
      {
        title: "Phân loại",
        dataIndex: "roomRole",
        key: "roomRole",
        width: 170,
        render: (roomRole) => {
          const meta = roomRoleMeta[roomRole] || roomRoleMeta.member;
          return (
            <span
              className="tm-role-badge"
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
        title: "Ngày vào ở",
        dataIndex: "moveInDate",
        key: "moveInDate",
        width: 140,
        render: (value) => (
          <span className="tm-date-text">
            <CalendarOutlined style={{ color: "#10b981" }} />
            {formatDate(value)}
          </span>
        ),
      },
      {
        title: "Ngày rời",
        dataIndex: "moveOutDate",
        key: "moveOutDate",
        width: 140,
        render: (value) => (
          <span className="tm-date-text">
            <CalendarOutlined style={{ color: value ? "#ef4444" : "#94a3b8" }} />
            {formatDate(value)}
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return (
            <span
              className="tm-status-badge"
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
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 170,
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space size={6}>
              <Tooltip title="Xem chi tiết">
                <Button
                  size="small"
                  className="tm-action-btn btn-view"
                  icon={<EyeOutlined />}
                  onClick={() => openDetailModal(record)}
                />
              </Tooltip>
              <Tooltip title="Chỉnh sửa thông tin">
                <Button
                  size="small"
                  className="tm-action-btn btn-edit"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Kết thúc thuê phòng" : "Kích hoạt lại thuê"}>
                <Button
                  size="small"
                  className="tm-action-btn btn-status-toggle"
                  icon={isActive ? <LogoutOutlined style={{ color: "#e11d48" }} /> : <LoginOutlined style={{ color: "#16a34a" }} />}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Xóa khách thuê này?"
                description="Chỉ có thể xóa khách thuê đã kết thúc hợp đồng."
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
                disabled={isActive}
              >
                <Tooltip title={isActive ? "Không thể xóa khách đang thuê" : "Xóa vĩnh viễn"}>
                  <Button
                    danger
                    size="small"
                    className="tm-action-btn btn-delete"
                    icon={<DeleteOutlined />}
                    disabled={isActive}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="tm-page-wrapper">
      <style>{inlineStyles}</style>

      {/* Hero Welcome Banner */}
      <div className="tm-hero-banner">
        <div className="tm-hero-inner">
          <div className="tm-hero-left">
            <div className="tm-hero-badge">
              <span className="pulse-dot" />
              <span>TRỌ PLUS • QUẢN LÝ LƯU TRÚ</span>
            </div>
            <Typography.Title level={2} className="tm-hero-title">
              Quản Lý Danh Sách Khách Thuê
            </Typography.Title>
            <Typography.Paragraph className="tm-hero-subtitle">
              Theo dõi hồ sơ người thuê phòng, phân quyền đại diện, thời hạn lưu trú và trạng thái cư trú của khách hàng trong hệ thống.
            </Typography.Paragraph>
          </div>

          <div className="tm-hero-right">
            <Button
              className="tm-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refreshAll}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              className="tm-btn-primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm khách thuê
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="tm-stats-grid">
        <div className="tm-stat-card stat-indigo">
          <div className="tm-stat-info">
            <span className="tm-stat-label">Tổng khách thuê</span>
            <span className="tm-stat-value">{tenantStats.total}</span>
            <span className="tm-stat-sub">Toàn bộ hồ sơ lưu trú</span>
          </div>
          <div className="tm-stat-icon-wrap icon-indigo">
            <TeamOutlined />
          </div>
        </div>

        <div className="tm-stat-card stat-emerald">
          <div className="tm-stat-info">
            <span className="tm-stat-label">Đang thuê</span>
            <span className="tm-stat-value" style={{ color: "#059669" }}>
              {tenantStats.active}
            </span>
            <span className="tm-stat-sub">Khách hàng đang lưu trú</span>
          </div>
          <div className="tm-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="tm-stat-card stat-amber">
          <div className="tm-stat-info">
            <span className="tm-stat-label">Đại diện phòng</span>
            <span className="tm-stat-value" style={{ color: "#d97706" }}>
              {tenantStats.representatives}
            </span>
            <span className="tm-stat-sub">Người đứng tên hợp đồng</span>
          </div>
          <div className="tm-stat-icon-wrap icon-amber">
            <CrownOutlined />
          </div>
        </div>

        <div className="tm-stat-card stat-slate">
          <div className="tm-stat-info">
            <span className="tm-stat-label">Đã kết thúc</span>
            <span className="tm-stat-value" style={{ color: "#64748b" }}>
              {tenantStats.inactive}
            </span>
            <span className="tm-stat-sub">Đã trả phòng / Hết hạn</span>
          </div>
          <div className="tm-stat-icon-wrap icon-slate">
            <LogoutOutlined />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="tm-filter-card">
        <div className="tm-filter-row">
          <div className="tm-filter-left">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm theo tên khách, email, SĐT hoặc số phòng..."
              className="tm-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="tm-filter-right">
            <Select
              value={statusFilter}
              className="tm-select-filter"
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
            />
            <Button className="tm-btn-reset" icon={<ReloadOutlined />} onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="tm-table-card">
        <div className="tm-table-header">
          <h3 className="tm-table-title">
            <TeamOutlined style={{ color: "#6366f1" }} />
            Danh Sách Khách Thuê
          </h3>
          <span className="tm-count-pill">
            Hiển thị {filteredTenants.length} / {tenants.length} khách thuê
          </span>
        </div>

        <Table
          rowKey="id"
          className="tm-table"
          columns={columns}
          dataSource={filteredTenants}
          loading={loading}
          size="middle"
          locale={{ emptyText: <Empty description="Không tìm thấy khách thuê phù hợp" /> }}
          scroll={{ x: 1250 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng cộng ${total} khách thuê`,
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <Space size={12}>
            <Avatar
              size={38}
              style={{ background: editingTenant ? "#0284c7" : "#6366f1" }}
              icon={editingTenant ? <EditOutlined /> : <UserSwitchOutlined />}
            />
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {editingTenant ? "Chỉnh sửa thông tin khách thuê" : "Thêm khách thuê mới"}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingTenant
                  ? `Cập nhật thông tin cho khách: ${editingTenant.userName}`
                  : "Gán tài khoản người dùng vào phòng thuê tương ứng"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingTenant ? "Lưu thay đổi" : "Tạo khách thuê"}
        cancelText="Hủy"
        width={720}
      >
        <Alert
          showIcon
          type="info"
          message={
            editingTenant
              ? "Cập nhật ngày vào/ra, trạng thái lưu trú hoặc phân loại vai trò trong phòng."
              : "Chọn tài khoản người dùng và phòng tương ứng để thiết lập hồ sơ lưu trú mới."
          }
          style={{ marginBottom: 18, borderRadius: 8 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="tm-form-section">
            <TeamOutlined style={{ color: "#6366f1" }} />
            <span>Thông tin người thuê & Phòng</span>
          </div>
          <Divider style={{ margin: "8px 0 14px" }} />

          <Form.Item
            name="user"
            label="Tài khoản khách thuê"
            rules={[{ required: true, message: "Vui lòng chọn tài khoản khách thuê!" }]}
          >
            <Select
              options={userOptions}
              placeholder="Chọn tài khoản người dùng"
              showSearch
              optionFilterProp="label"
              className="tm-input-rounded"
            />
          </Form.Item>

          <Form.Item
            name="room"
            label="Phòng thuê"
            rules={[{ required: true, message: "Vui lòng chọn phòng!" }]}
          >
            <Select
              options={roomOptions}
              placeholder="Chọn phòng thuê"
              showSearch
              optionFilterProp="label"
              className="tm-input-rounded"
            />
          </Form.Item>

          <div className="tm-form-section">
            <UserSwitchOutlined style={{ color: "#2563eb" }} />
            <span>Thời gian & Vai trò lưu trú</span>
          </div>
          <Divider style={{ margin: "8px 0 14px" }} />

          <div className="tm-form-grid">
            <Form.Item
              name="moveInDate"
              label="Ngày vào ở"
              rules={[{ required: true, message: "Vui lòng chọn ngày vào ở!" }]}
            >
              <DatePicker className="tm-input-rounded" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item name="moveOutDate" label="Ngày rời đi (nếu có)">
              <DatePicker className="tm-input-rounded" format="DD/MM/YYYY" placeholder="Chọn ngày rời" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái thuê"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select options={statusOptions} className="tm-input-rounded" />
            </Form.Item>

            <Form.Item
              name="roomRole"
              label="Phân loại vai trò"
              rules={[{ required: true, message: "Vui lòng chọn phân loại vai trò!" }]}
            >
              <Select options={roomRoleOptions} className="tm-input-rounded" />
            </Form.Item>
          </div>

          <Form.Item name="note" label="Ghi chú bổ sung">
            <Input.TextArea
              rows={3}
              placeholder="Nhập các ghi chú hoặc thông tin bổ sung (nếu có)..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space size={12}>
            <Avatar size={38} style={{ background: "#6366f1" }}>
              {(detailTenant?.userName || "K").charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Hồ sơ chi tiết khách thuê
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {detailTenant?.userName || "Thông tin lưu trú"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={760}
      >
        {detailTenant && (
          <div style={{ marginTop: 8 }}>
            {/* Profile Overview Card */}
            <div className="tm-detail-profile">
              <div className="tm-detail-profile-left">
                <Avatar
                  size={52}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {(detailTenant.userName || "K").charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div className="tm-detail-name">{detailTenant.userName || "-"}</div>
                  <div className="tm-detail-sub">
                    <MailOutlined /> {detailTenant.userEmail || "Chưa có email"} •{" "}
                    <PhoneOutlined /> {detailTenant.userPhone || "Chưa có SĐT"}
                  </div>
                </div>
              </div>

              <Space>
                <Tag
                  bordered={false}
                  style={{
                    background: roomRoleMeta[detailTenant.roomRole]?.bg,
                    color: roomRoleMeta[detailTenant.roomRole]?.textColor,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {roomRoleMeta[detailTenant.roomRole]?.label || "-"}
                </Tag>
                <Tag
                  bordered={false}
                  style={{
                    background: statusMeta[detailTenant.status]?.bg,
                    color: statusMeta[detailTenant.status]?.textColor,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {statusMeta[detailTenant.status]?.label || "-"}
                </Tag>
              </Space>
            </div>

            {/* Thông tin cá nhân */}
            <div className="tm-form-section">
              <TeamOutlined style={{ color: "#6366f1" }} />
              <span>Thông tin cá nhân & Liên hệ</span>
            </div>
            <Divider style={{ margin: "8px 0 14px" }} />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Họ và tên">{detailTenant.userName || "-"}</Descriptions.Item>
              <Descriptions.Item label="CCCD / CMND">
                <span style={{ fontWeight: 600, color: "#334155" }}>
                  {detailTenant.userIdentityNumber || "Chưa cập nhật"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Email liên hệ">{detailTenant.userEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{detailTenant.userPhone || "-"}</Descriptions.Item>
            </Descriptions>

            {/* Thông tin phòng & lưu trú */}
            <div className="tm-form-section" style={{ marginTop: 20 }}>
              <HomeOutlined style={{ color: "#10b981" }} />
              <span>Thông tin phòng & Thời hạn lưu trú</span>
            </div>
            <Divider style={{ margin: "8px 0 14px" }} />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Phòng thuê">
                <span style={{ fontWeight: 700, color: "#15803d" }}>
                  Phòng {detailTenant.roomNumber || "-"} ({detailTenant.roomName || "-"})
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag bordered={false} color={roomRoleMeta[detailTenant.roomRole]?.color}>
                  {roomRoleMeta[detailTenant.roomRole]?.label || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu vào ở">
                {formatDate(detailTenant.moveInDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày trả phòng / Rời đi">
                {formatDate(detailTenant.moveOutDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {detailTenant.note || "Không có ghi chú"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantManagementPage;
