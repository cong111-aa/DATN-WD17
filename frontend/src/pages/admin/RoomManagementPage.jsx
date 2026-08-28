import {
  AppstoreOutlined,
  BarsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  area: 0,
  capacity: 1,
  deposit: 0,
  electricityPrice: 3500,
  floor: 1,
  serviceFee: 0,
  images: [],
  address: "",
  status: "available",
  waterPrice: 15000,
};

const statusOptions = [
  { label: "Đang thanh toán", value: "payment_pending", disabled: true },
  { label: "Đã giữ chỗ", value: "reserved" },
  { label: "Còn trống", value: "available" },
  { label: "Đang thuê", value: "occupied" },
  { label: "Sắp trống", value: "coming_available" },
  { label: "Bảo trì", value: "maintenance" },
];

const statusMeta = {
  payment_pending: { color: "processing", label: "Đang thanh toán", badgeColor: "#0284c7" },
  reserved: { color: "gold", label: "Đã giữ chỗ", badgeColor: "#f59e0b" },
  available: { color: "success", label: "Còn trống", badgeColor: "#10b981" },
  occupied: { color: "blue", label: "Đang thuê", badgeColor: "#3b82f6" },
  coming_available: { color: "orange", label: "Sắp trống", badgeColor: "#f97316" },
  maintenance: { color: "warning", label: "Bảo trì", badgeColor: "#ef4444" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Đang thuê" },
  inactive: { color: "default", label: "Đã kết thúc" },
};

const roomRoleMeta = {
  representative: { color: "gold", label: "Đại diện phòng" },
  member: { color: "green", label: "Người thuê phòng" },
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toAbsoluteImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const contractStatusMeta = {
  pending_user_signature: { color: "gold", label: "Chờ khách ký" },
  revision_requested: { color: "orange", label: "Khách yêu cầu sửa" },
  active: { color: "success", label: "Đang hiệu lực" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const invoiceStatusMeta = {
  unpaid: { color: "error", label: "Chưa thanh toán" },
  partial: { color: "warning", label: "Thanh toán một phần" },
  paid: { color: "success", label: "Đã thanh toán" },
  overdue: { color: "error", label: "Quá hạn" },
};

const paymentProviderMeta = {
  manual_qr: { color: "cyan", label: "QR thủ công" },
  vnpay: { color: "blue", label: "VNPay" },
};

const getRemainingTimeLabel = (value) => {
  if (!value) return "Quá hạn";

  const diffMs = new Date(value).getTime() - Date.now();

  if (diffMs <= 0) return "Quá hạn";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) parts.push(`${days} ngày`);
  if (hours) parts.push(`${hours} giờ`);
  if (!days && minutes) parts.push(`${minutes} phút`);

  return parts.join(" ") || "Dưới 1 phút";
};

const toUploadFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    status: "done",
    url: url.startsWith("http") ? url : `${apiOrigin}${url}`,
    response: { urls: [url] },
  }));

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

const RoomManagementPage = () => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("roomNumber");
  const [display, setDisplay] = useState("grid");

  const roomStatusOptions = useMemo(
    () =>
      statusOptions.map((option) => ({
        ...option,
        disabled:
          option.disabled ||
          (editingRoom?.status === "occupied" && option.value === "available"),
      })),
    [editingRoom]
  );

  const fetchRooms = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const roomOverview = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const available = rooms.filter((room) => room.status === "available").length;
    const reserved = rooms.filter((room) => room.status === "reserved").length;
    const comingAvailable = rooms.filter((room) => room.status === "coming_available").length;
    const maintenance = rooms.filter((room) => room.status === "maintenance").length;
    const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;

    return {
      total,
      occupied,
      available,
      comingAvailable,
      reserved,
      maintenance,
      occupancyRate,
    };
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return rooms
      .filter((room) => {
        const matchesKeyword =
          !keyword ||
          [room.roomNumber, room.name, room.description, room.address]
            .some((value) => String(value || "").toLowerCase().includes(keyword));
        return matchesKeyword && (statusFilter === "all" || room.status === statusFilter);
      })
      .sort((a, b) => {
        if (sortBy === "price") return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === "status") return String(a.status).localeCompare(String(b.status));
        return String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, { numeric: true });
      });
  }, [rooms, searchText, statusFilter, sortBy]);

  const openCreateModal = () => {
    setEditingRoom(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setImageFileList([]);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRoom(record);
    form.resetFields();
    form.setFieldsValue(record);
    setImageFileList(toUploadFileList(record.images));
    setModalOpen(true);
  };

  const openDetailModal = async (record) => {
    setDetailRoom(record);
    setDetailData(null);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const { data } = await http.get(`/rooms/${record.id}/detail`);
      setDetailRoom(data.room || record);
      setDetailData(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết phòng");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setImageFileList([]);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        images: toImageUrls(imageFileList),
      };

      if (editingRoom) {
        await http.put(`/rooms/${editingRoom.id}`, payload);
        message.success("Đã cập nhật phòng thành công");
      } else {
        await http.post("/rooms", payload);
        message.success("Đã tạo phòng mới thành công");
      }

      closeModal();
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/rooms/${record.id}`);
      message.success("Đã xóa phòng thành công");
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa phòng thất bại");
    }
  };

  const handleOpenContractFile = async (contractId) => {
    if (!contractId) {
      message.info("Phòng này chưa có hợp đồng");
      return;
    }

    try {
      const { data } = await http.get(`/contracts/${contractId}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được hợp đồng của phòng");
    }
  };

  const handleImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/rooms", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload ảnh thất bại");
      onError(error);
    }
  };

  return (
    <div className="rm-page-wrapper">
      <style>{`
        /* Root & Page Wrapper */
        .rm-page-wrapper {
          color: #0f172a;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: rmFadeIn 0.35s ease-out;
        }
        @keyframes rmFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Banner */
        .rm-hero-banner {
          background: linear-gradient(135deg, #0f172a 0%, #134e4a 55%, #0f766e 100%);
          border-radius: 16px;
          padding: 26px 30px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(15, 118, 110, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rm-hero-banner::before {
          content: "";
          position: absolute;
          top: -70px;
          right: -50px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(45, 212, 191, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .rm-hero-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: relative;
          z-index: 2;
          flex-wrap: wrap;
        }
        .rm-hero-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rm-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 3px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          color: #5eead4;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rm-hero-badge .pulse-dot {
          width: 7px;
          height: 7px;
          background-color: #2dd4bf;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7);
          animation: rmPulse 2s infinite;
        }
        @keyframes rmPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 7px rgba(45, 212, 191, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
        }
        .rm-hero-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff !important;
          margin: 0 !important;
          letter-spacing: -0.5px;
        }
        .rm-hero-subtitle {
          color: #cbd5e1 !important;
          font-size: 13px;
          margin: 0 !important;
          max-width: 600px;
        }
        .rm-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rm-btn-reload {
          background: rgba(255, 255, 255, 0.12) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          font-weight: 600;
          height: 40px !important;
        }
        .rm-btn-reload:hover {
          background: rgba(255, 255, 255, 0.22) !important;
          color: #ffffff !important;
        }
        .rm-btn-add {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
          border: none !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          font-weight: 700;
          height: 40px !important;
          padding: 0 20px !important;
          box-shadow: 0 4px 14px rgba(15, 118, 110, 0.4) !important;
        }
        .rm-btn-add:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(15, 118, 110, 0.5) !important;
        }

        /* 5-Stats KPI Grid */
        .rm-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .rm-stat-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .rm-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1;
        }
        .rm-stat-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rm-stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rm-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .rm-stat-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .rm-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        /* Filter Toolbar */
        .rm-filter-bar {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .rm-filter-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 260px;
        }
        .rm-search-input {
          border-radius: 10px !important;
          height: 40px !important;
        }
        .rm-filter-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .rm-filter-select {
          min-width: 170px;
        }
        .rm-filter-select .ant-select-selector {
          border-radius: 10px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
        }
        .rm-view-toggle {
          display: inline-flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 10px;
        }
        .rm-view-toggle .ant-btn {
          border: none !important;
          background: transparent !important;
          color: #64748b !important;
          height: 34px !important;
          width: 36px !important;
          border-radius: 8px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .rm-view-toggle .ant-btn.active {
          background: #ffffff !important;
          color: #0f766e !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
          font-weight: 700;
        }

        /* Room Grid & Cards */
        .rm-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }
        .rm-room-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .rm-room-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 25px -5px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }
        .rm-card-cover {
          position: relative;
          height: 160px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .rm-card-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .rm-room-card:hover .rm-card-cover img {
          transform: scale(1.05);
        }
        .rm-cover-status {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
        }
        .rm-cover-price {
          position: absolute;
          bottom: 10px;
          left: 12px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(6px);
          color: #38bdf8;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .rm-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .rm-card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .rm-room-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rm-room-name-sub {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .rm-specs-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }
        .rm-specs-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .rm-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .rm-btn-detail {
          flex: 1;
          height: 34px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #334155 !important;
        }
        .rm-btn-detail:hover {
          background: #f1f5f9 !important;
          color: #0f766e !important;
          border-color: #5eead4 !important;
        }
        .rm-btn-edit {
          flex: 1;
          height: 34px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
        }
        .rm-btn-delete {
          width: 34px !important;
          height: 34px !important;
          border-radius: 8px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 !important;
        }

        /* Quick Add Card */
        .rm-card-add-placeholder {
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          color: #64748b;
        }
        .rm-card-add-placeholder:hover {
          background: #f0fdfa;
          border-color: #14b8a6;
          color: #0f766e;
          transform: translateY(-3px);
        }
        .rm-add-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #0f766e;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        /* Modal Styles */
        .rm-modal .ant-modal-content {
          border-radius: 18px !important;
          overflow: hidden;
          padding: 0 !important;
        }
        .rm-modal .ant-modal-header {
          padding: 20px 24px !important;
          margin: 0 !important;
          border-bottom: 1px solid #f1f5f9;
        }
        .rm-modal .ant-modal-body {
          padding: 24px !important;
          max-height: 75vh;
          overflow-y: auto;
        }
        .rm-modal .ant-modal-footer {
          padding: 16px 24px !important;
          margin: 0 !important;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .rm-modal-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rm-modal-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0f766e, #14b8a6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .rm-modal-title-text {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .rm-modal-subtitle-text {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .rm-form-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f766e;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        .rm-form-divider {
          margin: 8px 0 18px 0 !important;
        }

        /* Detail Modal */
        .rm-detail-hero-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%);
          border: 1px solid #ccfbf1;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .rm-detail-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f766e;
          margin: 0;
        }
        .rm-detail-price {
          font-size: 18px;
          font-weight: 800;
          color: #059669;
        }

        /* Upload styling */
        .rm-upload-card-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          height: 100%;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rm-page-wrapper {
            padding: 14px;
            gap: 14px;
          }
          .rm-hero-banner {
            padding: 20px 22px;
          }
          .rm-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .rm-filter-right {
            width: 100%;
          }
          .rm-filter-select {
            flex: 1;
          }
          .rm-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Hero Welcome Banner */}
      <div className="rm-hero-banner">
        <div className="rm-hero-inner">
          <div className="rm-hero-left">
            <div className="rm-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN LÝ PHÒNG TRỌ</span>
            </div>
            <Typography.Title level={2} className="rm-hero-title">
              Quản Lý Danh Sách Phòng Trọ
            </Typography.Title>
            <Typography.Paragraph className="rm-hero-subtitle">
              Theo dõi tình trạng lấp đầy, giá thuê, hợp đồng và dịch vụ của từng phòng trong hệ thống.
            </Typography.Paragraph>
          </div>

          <div className="rm-hero-actions">
            <Button
              className="rm-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchRooms}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              className="rm-btn-add"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm Phòng Mới
            </Button>
          </div>
        </div>
      </div>

      {/* 5-Stats Overview Grid */}
      <div className="rm-stats-grid">
        {/* Total Rooms */}
        <div className="rm-stat-card">
          <div className="rm-stat-info">
            <span className="rm-stat-label">Tổng số phòng</span>
            <span className="rm-stat-value">{roomOverview.total}</span>
            <span className="rm-stat-sub">Toàn bộ phòng trọ</span>
          </div>
          <div className="rm-stat-icon" style={{ background: "#f0fdfa", color: "#0f766e" }}>
            <HomeOutlined />
          </div>
        </div>

        {/* Occupied */}
        <div className="rm-stat-card">
          <div className="rm-stat-info">
            <span className="rm-stat-label">Đang cho thuê</span>
            <span className="rm-stat-value" style={{ color: "#2563eb" }}>
              {roomOverview.occupied}
            </span>
            <span className="rm-stat-sub">Có khách đang ở</span>
          </div>
          <div className="rm-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <UserOutlined />
          </div>
        </div>

        {/* Available */}
        <div className="rm-stat-card">
          <div className="rm-stat-info">
            <span className="rm-stat-label">Phòng còn trống</span>
            <span className="rm-stat-value" style={{ color: "#059669" }}>
              {roomOverview.available}
            </span>
            <span className="rm-stat-sub">Sẵn sàng đón khách</span>
          </div>
          <div className="rm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <CheckCircleOutlined />
          </div>
        </div>

        {/* Reserved, Coming Available & Maintenance */}
        <div className="rm-stat-card">
          <div className="rm-stat-info">
            <span className="rm-stat-label">Giữ chỗ / Sắp trống / Bảo trì</span>
            <span className="rm-stat-value" style={{ color: "#d97706" }}>
              {roomOverview.reserved + roomOverview.comingAvailable + roomOverview.maintenance}
            </span>
            <span className="rm-stat-sub">
              {roomOverview.reserved} giữ chỗ · {roomOverview.comingAvailable} sắp trống · {roomOverview.maintenance} bảo trì
            </span>
          </div>
          <div className="rm-stat-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
            <ToolOutlined />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="rm-stat-card">
          <div className="rm-stat-info">
            <span className="rm-stat-label">Tỷ lệ lấp đầy</span>
            <span className="rm-stat-value" style={{ color: "#0f766e" }}>
              {roomOverview.occupancyRate}%
            </span>
            <Progress
              percent={roomOverview.occupancyRate}
              size="small"
              strokeColor="#0f766e"
              showInfo={false}
              style={{ margin: "2px 0 0 0", width: 100 }}
            />
          </div>
          <div className="rm-stat-icon" style={{ background: "#f0fdfa", color: "#0f766e" }}>
            <RiseOutlined />
          </div>
        </div>
      </div>

      {/* Floating Filter & Search Toolbar */}
      <div className="rm-filter-bar">
        <div className="rm-filter-left">
          <Input
            allowClear
            className="rm-search-input"
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Tìm kiếm số phòng, tên phòng, địa chỉ..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="rm-filter-right">
          <Select
            className="rm-filter-select"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              ...statusOptions.map((option) => ({
                ...option,
                label: `Trạng thái: ${option.label}`,
              })),
            ]}
          />
          <Select
            className="rm-filter-select"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Sắp xếp: Số phòng (Tăng dần)", value: "roomNumber" },
              { label: "Sắp xếp: Giá thuê (Cao đến thấp)", value: "price" },
              { label: "Sắp xếp: Trạng thái", value: "status" },
            ]}
          />
          <div className="rm-view-toggle">
            <Button
              className={display === "grid" ? "active" : ""}
              icon={<AppstoreOutlined />}
              onClick={() => setDisplay("grid")}
              title="Xem dạng lưới"
            />
            <Button
              className={display === "list" ? "active" : ""}
              icon={<BarsOutlined />}
              onClick={() => setDisplay("list")}
              title="Xem dạng danh sách"
            />
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div
        className="rm-cards-grid"
        style={display === "list" ? { gridTemplateColumns: "1fr" } : undefined}
      >
        {visibleRooms.map((room) => {
          const meta = statusMeta[room.status] || statusMeta.available;
          const isOccupied = room.status === "occupied";

          return (
            <article className="rm-room-card" key={room.id}>
              {/* Photo Cover */}
              <div className="rm-card-cover">
                {room.images?.[0] ? (
                  <img
                    src={toAbsoluteImageUrl(room.images[0])}
                    alt={`Phòng ${room.roomNumber}`}
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                      color: "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    <HomeOutlined style={{ fontSize: 32, opacity: 0.5 }} />
                  </div>
                )}
                <div className="rm-cover-status">
                  <Tag
                    color={meta.color}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      padding: "2px 10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    {meta.label}
                  </Tag>
                </div>
                <div className="rm-cover-price">{formatCurrency(room.price)}/tháng</div>
              </div>

              {/* Card Body */}
              <div className="rm-card-body">
                <div className="rm-card-header-row">
                  <div>
                    <h3 className="rm-room-title">
                      <span>P.{room.roomNumber}</span>
                      <span className="rm-room-name-sub">({room.name || "Chưa đặt tên"})</span>
                    </h3>
                  </div>
                </div>

                {/* Specs Strip */}
                <div className="rm-specs-strip">
                  <span className="rm-specs-item">
                    <HomeOutlined style={{ color: "#0f766e" }} />
                    Tầng {room.floor || 1}
                  </span>
                  <span>•</span>
                  <span className="rm-specs-item">
                    <EnvironmentOutlined style={{ color: "#2563eb" }} />
                    {room.area || 0} m²
                  </span>
                  <span>•</span>
                  <span className="rm-specs-item">
                    <TeamOutlined style={{ color: "#7c3aed" }} />
                    Tối đa {room.capacity || 1} người
                  </span>
                </div>

                {/* Address & Note */}
                <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <EnvironmentOutlined style={{ color: "#94a3b8" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {room.address || "Chưa có địa chỉ cụ thể"}
                  </span>
                </div>

                {/* Actions */}
                <div className="rm-card-actions">
                  <Button
                    className="rm-btn-detail"
                    icon={<EyeOutlined />}
                    onClick={() => openDetailModal(room)}
                  >
                    Chi tiết
                  </Button>
                  <Button
                    className="rm-btn-edit"
                    type={isOccupied ? "primary" : "default"}
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(room)}
                    style={
                      isOccupied
                        ? { background: "#0f766e", borderColor: "#0f766e" }
                        : {}
                    }
                  >
                    {isOccupied ? "Cập nhật" : "Sửa"}
                  </Button>
                  <Popconfirm
                    title="Xác nhận xóa phòng này?"
                    description="Không thể xóa phòng đang có người thuê."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(room)}
                    disabled={isOccupied}
                  >
                    <Tooltip title={isOccupied ? "Không thể xóa phòng đang thuê" : "Xóa phòng"}>
                      <Button
                        className="rm-btn-delete"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={isOccupied}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            </article>
          );
        })}

        {/* Quick Add Placeholder Card */}
        <div className="rm-card-add-placeholder" onClick={openCreateModal}>
          <div className="rm-add-icon-circle">
            <PlusOutlined />
          </div>
          <div style={{ textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: 15, color: "#0f172a" }}>Thêm Phòng Mới</strong>
            <span style={{ fontSize: 12, color: "#64748b" }}>Nhấn để tạo phòng trọ mới vào hệ thống</span>
          </div>
        </div>
      </div>

      {!loading && !visibleRooms.length && (
        <Empty
          style={{ padding: "40px 0", background: "#ffffff", borderRadius: 16 }}
          description="Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại"
        />
      )}

      {/* Modal Thêm / Chỉnh sửa phòng (Cập nhật) */}
      <Modal
        className="rm-modal"
        title={
          <div className="rm-modal-heading">
            <div className="rm-modal-icon-badge">
              <HomeOutlined />
            </div>
            <div>
              <h4 className="rm-modal-title-text">
                {editingRoom ? `Chỉnh sửa thông tin phòng P.${editingRoom.roomNumber}` : "Tạo phòng trọ mới"}
              </h4>
              <p className="rm-modal-subtitle-text">
                {editingRoom
                  ? "Cập nhật thông tin chi tiết, biểu phí dịch vụ và hình ảnh phòng"
                  : "Thiết lập thông số cơ bản và bảng giá dịch vụ cho phòng mới"}
              </p>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Lưu thay đổi" : "Tạo phòng mới"}
        cancelText="Hủy bỏ"
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Section 1: Thông tin cơ bản */}
          <div className="rm-form-section-title">
            <InfoCircleOutlined />
            <span>Thông tin cơ bản & Quy mô phòng</span>
          </div>
          <Divider className="rm-form-divider" />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="roomNumber"
                label="Số phòng"
                rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
              >
                <Input placeholder="Ví dụ: 101" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="name"
                label="Tên / Mã phòng"
                rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
              >
                <Input placeholder="Ví dụ: Phòng Studio 101" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="floor"
                label="Tầng"
                rules={[{ required: true, message: "Vui lòng nhập tầng" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="area" label="Diện tích (m²)">
                <InputNumber min={0} style={{ width: "100%" }} addonAfter="m²" placeholder="25" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="capacity"
                label="Sức chứa tối đa"
                rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} addonAfter="Người" placeholder="2" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="status"
                label="Trạng thái phòng"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select options={roomStatusOptions} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section 2: Giá & Phí dịch vụ */}
          <div className="rm-form-section-title">
            <DollarOutlined />
            <span>Bảng giá thuê & Phí dịch vụ hàng tháng</span>
          </div>
          <Divider className="rm-form-divider" />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="price"
                label="Giá thuê niêm yết (VNĐ/tháng)"
                rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}
              >
                <InputNumber
                  min={0}
                  step={100000}
                  style={{ width: "100%" }}
                  addonAfter="VNĐ"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => val.replace(/,/g, "")}
                  placeholder="3,500,000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="deposit" label="Tiền đặt cọc (VNĐ)">
                <InputNumber
                  min={0}
                  step={100000}
                  style={{ width: "100%" }}
                  addonAfter="VNĐ"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => val.replace(/,/g, "")}
                  placeholder="3,500,000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="electricityPrice" label="Giá điện (VNĐ/kWh)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="đ/kWh"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => val.replace(/,/g, "")}
                  placeholder="3,500"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="waterPrice" label="Giá nước (VNĐ/tháng hoặc khối)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="VNĐ"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => val.replace(/,/g, "")}
                  placeholder="15,000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="serviceFee" label="Phí dịch vụ chung (VNĐ/tháng)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="VNĐ"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => val.replace(/,/g, "")}
                  placeholder="150,000"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Section 3: Vị trí, Mô tả & Hình ảnh */}
          <div className="rm-form-section-title">
            <EnvironmentOutlined />
            <span>Địa chỉ, Mô tả chi tiết & Hình ảnh phòng</span>
          </div>
          <Divider className="rm-form-divider" />

          <Form.Item name="address" label="Địa chỉ cụ thể của phòng">
            <Input placeholder="Ví dụ: Số 12 ngõ 34 Cầu Giấy, Hà Nội" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả tiện ích, nội thất của phòng">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả chi tiết: Điều hòa, bình nóng lạnh, giường tủ, ban công thoáng mát..."
            />
          </Form.Item>

          <Form.Item label="Thư viện ảnh phòng (Tối đa 10 ảnh)">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleImageUpload}
              fileList={imageFileList}
              listType="picture-card"
              multiple
              onChange={({ fileList }) => setImageFileList(fileList)}
              onRemove={(file) => {
                setImageFileList((current) => current.filter((item) => item.uid !== file.uid));
              }}
            >
              {imageFileList.length >= 10 ? null : (
                <button type="button" className="rm-upload-card-button">
                  <UploadOutlined style={{ fontSize: 18, color: "#0f766e" }} />
                  <span>Tải ảnh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chi tiết phòng (Detail & Status Management) */}
      <Modal
        className="rm-modal"
        title={
          <div className="rm-modal-heading">
            <div className="rm-modal-icon-badge" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
              <FileTextOutlined />
            </div>
            <div>
              <h4 className="rm-modal-title-text">
                Chi tiết phòng {detailRoom?.roomNumber ? `P.${detailRoom.roomNumber}` : ""}
              </h4>
              <p className="rm-modal-subtitle-text">
                Hồ sơ thông tin phòng, hợp đồng, dịch vụ, người thuê và lịch sử hóa đơn
              </p>
            </div>
          </div>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { setDetailOpen(false); openEditModal(detailRoom); }}>
            Chỉnh sửa thông tin phòng
          </Button>,
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={860}
      >
        {detailRoom && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* Top Detail Hero Card */}
            <div className="rm-detail-hero-card">
              <div>
                <h3 className="rm-detail-title">
                  Phòng {detailRoom.roomNumber} - {detailRoom.name || "Phòng trọ"}
                </h3>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Tầng {detailRoom.floor || 1} • Diện tích: {detailRoom.area || 0} m² • Sức chứa: {detailRoom.capacity || 1} người
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="rm-detail-price">{formatCurrency(detailRoom.price)}/tháng</div>
                <Tag
                  color={statusMeta[detailRoom.status]?.color}
                  style={{ fontWeight: 700, borderRadius: 6, margin: "4px 0 0 0" }}
                >
                  {statusMeta[detailRoom.status]?.label}
                </Tag>
              </div>
            </div>

            {/* Detailed Tabs View */}
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: "info",
                  label: (
                    <span>
                      <InfoCircleOutlined style={{ marginRight: 6 }} />
                      Thông tin & Dịch vụ
                    </span>
                  ),
                  children: (
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Số phòng">{detailRoom.roomNumber}</Descriptions.Item>
                        <Descriptions.Item label="Tên phòng">{detailRoom.name}</Descriptions.Item>
                        <Descriptions.Item label="Tầng">{detailRoom.floor}</Descriptions.Item>
                        <Descriptions.Item label="Diện tích">{detailRoom.area || 0} m²</Descriptions.Item>
                        <Descriptions.Item label="Sức chứa">{detailRoom.capacity} người</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                          <Tag color={statusMeta[detailRoom.status]?.color}>
                            {statusMeta[detailRoom.status]?.label}
                          </Tag>
                        </Descriptions.Item>
                        {detailRoom.status === "payment_pending" && (
                          <Descriptions.Item label="Khóa thanh toán đến" span={2}>
                            {formatDate(detailRoom.paymentHoldExpiresAt)}{" "}
                            {detailRoom.paymentHoldExpiresAt
                              ? new Date(detailRoom.paymentHoldExpiresAt).toLocaleTimeString("vi-VN")
                              : ""}
                          </Descriptions.Item>
                        )}
                        {detailRoom.status === "coming_available" && (
                          <Descriptions.Item label="Dự kiến trống từ" span={2}>
                            {formatDate(detailRoom.availableFrom)}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Địa chỉ cụ thể" span={2}>
                          {detailRoom.address || "Chưa cập nhật"}
                        </Descriptions.Item>
                      </Descriptions>

                      <Divider orientation="left" style={{ margin: "10px 0" }}>Bảng giá & Chi phí</Divider>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Giá thuê phòng">{formatCurrency(detailRoom.price)}</Descriptions.Item>
                        <Descriptions.Item label="Tiền đặt cọc">{formatCurrency(detailRoom.deposit)}</Descriptions.Item>
                        <Descriptions.Item label="Đơn giá điện">{formatCurrency(detailRoom.electricityPrice)}/kWh</Descriptions.Item>
                        <Descriptions.Item label="Đơn giá nước">{formatCurrency(detailRoom.waterPrice)}</Descriptions.Item>
                        <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailRoom.serviceFee)}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả" span={2}>
                          {detailRoom.description || "Chưa có mô tả chi tiết."}
                        </Descriptions.Item>
                      </Descriptions>
                    </Space>
                  ),
                },
                {
                  key: "tenants_contracts",
                  label: (
                    <span>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      Người thuê & Hợp đồng ({detailData?.tenants?.length || 0})
                    </span>
                  ),
                  children: (
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      <Typography.Text strong>Danh sách người đang thuê trong phòng</Typography.Text>
                      <List
                        bordered
                        dataSource={detailData?.tenants || []}
                        loading={detailLoading}
                        locale={{ emptyText: "Chưa có người thuê nào trong phòng này" }}
                        renderItem={(tenant) => {
                          const roleMeta = roomRoleMeta[tenant.roomRole] || roomRoleMeta.member;
                          const tenantMeta = tenantStatusMeta[tenant.status] || tenantStatusMeta.active;

                          return (
                            <List.Item>
                              <Space direction="vertical" size={2} style={{ width: "100%" }}>
                                <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
                                  <Space>
                                    <Avatar icon={<UserOutlined />} style={{ background: "#0f766e" }} />
                                    <Typography.Text strong>{tenant.userName || "-"}</Typography.Text>
                                  </Space>
                                  <Space>
                                    <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
                                    <Tag color={tenantMeta.color}>{tenantMeta.label}</Tag>
                                  </Space>
                                </Space>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Liên hệ: {tenant.userPhone || tenant.userEmail || "-"} • Ngày vào: {formatDate(tenant.moveInDate)} • Ngày rời: {formatDate(tenant.moveOutDate)}
                                </Typography.Text>
                              </Space>
                            </List.Item>
                          );
                        }}
                      />

                      <Divider orientation="left" style={{ margin: "14px 0 10px 0" }}>Hợp đồng thuê đang hiệu lực</Divider>
                      {detailData?.activeContract ? (
                        <Descriptions bordered size="small" column={2}>
                          <Descriptions.Item label="Mã hợp đồng">
                            <span style={{ fontWeight: 700, color: "#0f766e" }}>
                              {detailData.activeContract.contractCode}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Trạng thái">
                            <Tag color={contractStatusMeta[detailData.activeContract.status]?.color}>
                              {contractStatusMeta[detailData.activeContract.status]?.label || detailData.activeContract.status}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Người đại diện">{detailData.activeContract.tenantName || "-"}</Descriptions.Item>
                          <Descriptions.Item label="Điện thoại">{detailData.activeContract.tenantPhone || detailData.activeContract.tenantEmail || "-"}</Descriptions.Item>
                          <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailData.activeContract.startDate)}</Descriptions.Item>
                          <Descriptions.Item label="Ngày kết thúc">{formatDate(detailData.activeContract.endDate)}</Descriptions.Item>
                          <Descriptions.Item label="Thời hạn còn lại" span={2}>
                            <Tag color="warning" icon={<ClockCircleOutlined />}>
                              {getRemainingTimeLabel(detailData.activeContract.endDate)}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Hợp đồng gốc" span={2}>
                            <Button size="small" type="primary" icon={<FileProtectOutlined />} onClick={() => handleOpenContractFile(detailData.activeContract.id)}>
                              Mở file hợp đồng ký
                            </Button>
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Empty description="Phòng này hiện chưa có hợp đồng thuê nào đang kích hoạt" />
                      )}
                    </Space>
                  ),
                },
                {
                  key: "invoices_hold",
                  label: (
                    <span>
                      <FileTextOutlined style={{ marginRight: 6 }} />
                      Giữ phòng & Hóa đơn ({detailData?.recentInvoices?.length || 0})
                    </span>
                  ),
                  children: (
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      {detailData?.holdRequest && (
                        <>
                          <Typography.Text strong style={{ color: "#d97706" }}>Yêu cầu đặt cọc giữ chỗ</Typography.Text>
                          <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Khách giữ phòng">{detailData.holdRequest.userName || "-"}</Descriptions.Item>
                            <Descriptions.Item label="Liên hệ">{detailData.holdRequest.userPhone || detailData.holdRequest.userEmail || "-"}</Descriptions.Item>
                            <Descriptions.Item label="Số tiền đã cọc">{formatCurrency(detailData.holdRequest.amount)}</Descriptions.Item>
                            <Descriptions.Item label="Phương thức">
                              <Tag color={paymentProviderMeta[detailData.holdRequest.paymentProvider]?.color}>
                                {paymentProviderMeta[detailData.holdRequest.paymentProvider]?.label || detailData.holdRequest.paymentProvider}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày thanh toán">{formatDate(detailData.holdRequest.paidAt)}</Descriptions.Item>
                            <Descriptions.Item label="Hiệu lực giữ phòng">
                              {getRemainingTimeLabel(detailData.holdRequest.holdExpiresAt)}
                            </Descriptions.Item>
                          </Descriptions>
                          <Divider style={{ margin: "10px 0" }} />
                        </>
                      )}

                      <Typography.Text strong>Lịch sử hóa đơn gần đây</Typography.Text>
                      <List
                        bordered
                        dataSource={detailData?.recentInvoices || []}
                        loading={detailLoading}
                        locale={{ emptyText: "Chưa có hóa đơn nào cho phòng này" }}
                        renderItem={(invoice) => {
                          const meta = invoiceStatusMeta[invoice.status] || invoiceStatusMeta.unpaid;

                          return (
                            <List.Item>
                              <Space direction="vertical" size={2} style={{ width: "100%" }}>
                                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                                  <Typography.Text strong style={{ color: "#0f766e" }}>
                                    {invoice.invoiceCode} - Tháng {invoice.month}/{invoice.year}
                                  </Typography.Text>
                                  <Tag color={meta.color}>{meta.label}</Tag>
                                </Space>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Người thuê: {invoice.tenantName || "-"} • Tổng tiền: {formatCurrency(invoice.totalAmount)} • Đã trả: {formatCurrency(invoice.paidAmount)} • Hạn đóng: {formatDate(invoice.dueDate)}
                                </Typography.Text>
                              </Space>
                            </List.Item>
                          );
                        }}
                      />
                    </Space>
                  ),
                },
                {
                  key: "gallery",
                  label: (
                    <span>
                      <UploadOutlined style={{ marginRight: 6 }} />
                      Thư viện ảnh ({detailRoom.images?.length || 0})
                    </span>
                  ),
                  children: (
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      {detailRoom.images?.length ? (
                        <Image.PreviewGroup>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                            {detailRoom.images.map((url, index) => (
                              <Image
                                key={`${url}-${index}`}
                                src={toAbsoluteImageUrl(url)}
                                height={100}
                                style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }}
                              />
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      ) : (
                        <Empty description="Phòng này chưa có hình ảnh nào được tải lên" />
                      )}

                      <Divider style={{ margin: "14px 0 10px 0" }} />
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Ngày tạo phòng">{formatDate(detailRoom.createdAt)}</Descriptions.Item>
                        <Descriptions.Item label="Lần cập nhật cuối">{formatDate(detailRoom.updatedAt)}</Descriptions.Item>
                      </Descriptions>
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagementPage;
