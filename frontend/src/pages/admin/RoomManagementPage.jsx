import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BarsOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
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
  { label: "Bảo trì", value: "maintenance" },
];

const statusMeta = {
  payment_pending: { color: "processing", label: "Đang thanh toán" },
  reserved: { color: "gold", label: "Đã giữ chỗ" },
  available: { color: "success", label: "Còn trống" },
  occupied: { color: "blue", label: "Đang thuê" },
  maintenance: { color: "warning", label: "Bảo trì" },
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
    const occupied = rooms.filter((room) => room.status === "occupied");
    return {
      total: rooms.length,
      occupied: occupied.length,
    };
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return rooms
      .filter((room) => {
        const matchesKeyword = !keyword || [room.roomNumber, room.name, room.description, room.address]
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
        message.success("Đã cập nhật phòng");
      } else {
        await http.post("/rooms", payload);
        message.success("Đã tạo phòng");
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
      message.success("Đã xóa phòng");
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa phòng thất bại");
    }
  };

  const handleViewContract = async (record) => {
    try {
      const { data: contracts } = await http.get("/contracts", {
        params: {
          room: record.id,
          status: "active",
        },
      });
      const contract = contracts?.[0];

      if (!contract) {
        message.info("Phòng này chưa có hợp đồng đang hiệu lực");
        return;
      }

      const { data } = await http.get(`/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được hợp đồng của phòng");
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
    <div className="room-management">
      <style>{`
        .room-management { color: #152d4e; max-width: 1280px; margin: 0 auto; padding: 6px 4px 32px; }
        .room-management * { box-sizing: border-box; }
        .room-topbar { display:flex; align-items:center; gap:18px; margin-bottom:18px; }
        .room-search { width: 300px; }
        .room-search .ant-input-affix-wrapper { border:0; background:#f4f7fa; border-radius:8px; padding:9px 13px; }
        .room-spacer { flex:1; }
        .room-add { background:#10365f; border-color:#10365f; border-radius:7px; height:38px; font-weight:600; box-shadow:none; }
        .room-overview { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:24px; }
        .room-count { min-height:110px; border-radius:7px; padding:18px 22px; }
        .room-count { background:#fff; box-shadow:0 3px 14px rgba(24,46,78,.05); }
        .overview-label { color:#7d8b9d; font-size:12px; font-weight:600; }
        .overview-number { font-size:31px; font-weight:750; line-height:1.1; margin:5px 0 8px; color:#102f55; }
        .overview-note { color:#24a77e; font-size:12px; font-weight:600; }
        .room-filters { display:flex; align-items:center; gap:14px; padding:0 4px 17px; }
        .room-filters .ant-select { min-width:160px; } .room-filters .ant-select-selector { border:0!important; box-shadow:none!important; background:transparent!important; font-size:12px; color:#526274; }
        .room-view { margin-left:auto; display:flex; gap:4px; } .room-view .ant-btn { border:0; color:#617187; } .room-view .active { color:#10365f; background:#edf6f4; }
        .room-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .room-card { border:1px solid #edf0f3; border-radius:7px; overflow:hidden; background:#fff; box-shadow:0 1px 5px rgba(26,45,71,.04); }
        .room-photo { height:142px; background:linear-gradient(135deg,#d8c7ae,#f0eee8); overflow:hidden; } .room-photo img { width:100%; height:100%; object-fit:cover; display:block; }
        .room-card-body { padding:11px 13px 13px; } .room-card-title { display:flex; align-items:center; gap:7px; } .room-card-title strong { font-size:17px; color:#213b59; }
        .room-card-title .ant-tag { border:0; border-radius:12px; padding:1px 8px; margin:0; font-size:10px; font-weight:700; }
        .room-menu { margin-left:auto; color:#738297; }
        .room-info { display:grid; gap:7px; margin:12px 0; color:#556579; font-size:11px; } .room-info span { display:flex; align-items:center; gap:7px; } .room-info .anticon { color:#6d7d8f; }
        .room-actions { display:flex; gap:7px; } .room-actions .ant-btn { flex:1; border:0; background:#f5f5f6; color:#536174; font-size:11px; height:30px; padding:0 5px; } .room-actions .ant-btn-primary { background:#168761; color:#fff; } .room-actions .room-delete { flex:0 0 30px; color:#d95454; background:#fff1f1; } .room-actions .room-delete:disabled { color:#b9c1ca; background:#f5f6f7; }
        .room-card-add { min-height:290px; border:1px dashed #cbd4de; display:flex; align-items:center; justify-content:center; background:#fbfcfd; } .room-card-add .ant-btn { border:0; background:#eef1f4; color:#68778a; width:42px; height:42px; border-radius:8px; font-size:18px; }
        .room-empty { grid-column:1/-1; padding:50px; text-align:center; color:#748397; background:#fff; border-radius:8px; }
        .room-modal .ant-modal-content { padding:0; overflow:hidden; border-radius:14px; }
        .room-modal .ant-modal-header { padding:22px 26px 16px; margin:0; border-bottom:1px solid #edf1f5; }
        .room-modal .ant-modal-title { color:#17385d; } .room-modal .ant-modal-close { top:19px; right:20px; }
        .room-modal .ant-modal-body { padding:22px 26px; background:#fbfcfe; }
        .room-modal .ant-modal-footer { padding:14px 26px 20px; margin:0; border-top:1px solid #edf1f5; background:#fff; }
        .room-modal .ant-modal-footer .ant-btn { height:36px; border-radius:7px; font-weight:600; }
        .room-modal .ant-modal-footer .ant-btn-primary { background:#12375f; border-color:#12375f; }
        .modal-heading { display:flex; align-items:center; gap:11px; } .modal-heading-icon { display:grid; place-items:center; width:34px; height:34px; color:#fff; background:#12375f; border-radius:9px; } .modal-heading-text { display:grid; gap:2px; } .modal-heading-text strong { font-size:17px; } .modal-heading-text span { color:#7a899b; font-size:12px; font-weight:400; }
        .room-form .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 14px; } .room-form .ant-form-item { margin-bottom:14px; } .room-form .ant-form-item-label > label { color:#455b74; font-weight:600; font-size:12px; }
        .room-form .ant-input, .room-form .ant-input-number, .room-form .ant-select-selector { min-height:38px!important; border-radius:7px!important; border-color:#dfe6ee!important; box-shadow:none!important; } .room-form .ant-input-number { width:100%; } .room-form .ant-input-number-input { height:36px; } .room-form .ant-input:focus, .room-form .ant-input-number-focused, .room-form .ant-select-focused .ant-select-selector { border-color:#2b836a!important; }
        .modal-section { margin:4px 0 17px; color:#17385d; font-weight:700; font-size:13px; } .modal-section::after { content:""; display:block; height:1px; background:#e8edf3; margin-top:9px; }
        .room-form .ant-upload-wrapper .ant-upload-select { border-radius:8px!important; background:#fff!important; } .room-form .upload-card-button { color:#466078; }
        .room-detail .ant-descriptions { overflow:hidden; border-radius:9px; } .room-detail .ant-descriptions-view { border-color:#e1e8ef!important; } .room-detail .ant-descriptions-item-label { background:#f4f7fa!important; color:#536b84!important; font-size:12px; font-weight:600; } .room-detail .ant-descriptions-item-content { background:#fff!important; color:#17385d; }
        .room-detail .ant-divider { margin:21px 0 13px; color:#17385d; font-size:13px; font-weight:700; } .room-detail .ant-list { overflow:hidden; border-radius:9px; border-color:#e1e8ef; background:#fff; } .room-detail .ant-list-item { padding:12px 15px; }
        .room-detail .ant-image { border:1px solid #e5eaf0; padding:3px; background:#fff; } .detail-status { display:inline-flex; align-items:center; gap:8px; padding:10px 13px; border-radius:9px; background:#eef8f4; color:#217b61; font-size:12px; font-weight:600; margin-bottom:16px; }
        @media (max-width: 1050px) { .room-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } } @media (max-width: 760px) { .room-overview { grid-template-columns:1fr; } .room-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .room-topbar { flex-wrap:wrap; } .room-spacer { display:none; } .room-search { width:100%; order:3; } .room-filters { flex-wrap:wrap; } .room-view { margin-left:0; } } @media (max-width: 480px) { .room-grid { grid-template-columns:1fr; } }
      `}</style>
      <div className="room-topbar">
        <Input className="room-search" prefix={<SearchOutlined />} placeholder="Tìm kiếm phòng, khách thuê..." value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        <div className="room-spacer" />
        <Button className="room-add" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>Thêm Phòng</Button>
      </div>

      <div className="room-overview">
        <div className="room-count"><div className="overview-label">TỔNG SỐ PHÒNG</div><div className="overview-number">{roomOverview.total}</div><div className="overview-note">↗ {roomOverview.occupied} phòng đang thuê</div></div>
      </div>

      <div className="room-filters">
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ label: "Trạng thái: Tất cả trạng thái", value: "all" }, ...statusOptions.map((option) => ({ ...option, label: `Trạng thái: ${option.label}` }))]} />
        <Select value={sortBy} onChange={setSortBy} options={[{ label: "Sắp xếp: Số phòng (Tăng dần)", value: "roomNumber" }, { label: "Sắp xếp: Giá thuê", value: "price" }, { label: "Sắp xếp: Trạng thái", value: "status" }]} />
        <div className="room-view"><Button className={display === "grid" ? "active" : ""} icon={<AppstoreOutlined />} onClick={() => setDisplay("grid")} /><Button className={display === "list" ? "active" : ""} icon={<BarsOutlined />} onClick={() => setDisplay("list")} /></div>
      </div>

      <div className="room-grid" style={display === "list" ? { gridTemplateColumns: "1fr" } : undefined}>
        {visibleRooms.map((room) => {
          const meta = statusMeta[room.status] || statusMeta.available;
          const isOccupied = room.status === "occupied";
          return <article className="room-card" key={room.id}>
            <div className="room-photo">{room.images?.[0] && <img src={toAbsoluteImageUrl(room.images[0])} alt={`Phòng ${room.roomNumber}`} />}</div>
            <div className="room-card-body"><div className="room-card-title"><strong>P.{room.roomNumber}</strong><Tag color={meta.color}>{meta.label}</Tag><MoreOutlined className="room-menu" /></div>
              <div className="room-info"><span><UserOutlined />{room.name || (isOccupied ? "Đang có khách thuê" : "Sẵn sàng ngay lập tức")}</span><span><FileTextOutlined />{formatCurrency(room.price)}</span></div>
              <div className="room-actions">
                <Button onClick={() => openDetailModal(room)}>Chi tiết</Button>
                <Button type={isOccupied ? "primary" : "default"} icon={<EditOutlined />} onClick={() => openEditModal(room)}>{isOccupied ? "Cập nhật" : "Chỉnh sửa"}</Button>
                <Popconfirm title="Xóa phòng này?" description="Không thể xóa phòng đang có người thuê." okText="Xóa" cancelText="Hủy" onConfirm={() => handleDelete(room)} disabled={isOccupied}>
                  <Button className="room-delete" aria-label={`Xóa phòng ${room.roomNumber}`} danger icon={<DeleteOutlined />} disabled={isOccupied} />
                </Popconfirm>
              </div>
            </div>
          </article>;
        })}
        {!loading && !visibleRooms.length && <div className="room-empty">Không tìm thấy phòng phù hợp.</div>}
        <div className="room-card room-card-add"><Button icon={<PlusOutlined />} onClick={openCreateModal} /></div>
      </div>

      <Modal
        className="room-modal"
        title={<div className="modal-heading"><div className="modal-heading-icon"><PlusOutlined /></div><div className="modal-heading-text"><strong>{editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</strong><span>{editingRoom ? "Cập nhật thông tin và dịch vụ của phòng" : "Tạo phòng và thiết lập thông tin cơ bản"}</span></div></div>}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Lưu" : "Tạo phòng"}
        cancelText="Hủy"
        width={720}
      >
        <Form className="room-form" form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="modal-section">Thông tin phòng</div>
          <div className="form-grid">
            <Form.Item name="roomNumber" label="Số phòng" rules={[{ required: true, message: "Vui lòng nhập số phòng!" }]}>
              <Input placeholder="VD: 101" />
            </Form.Item>
            <Form.Item name="name" label="Tên phòng" rules={[{ required: true, message: "Vui lòng nhập tên phòng!" }]}>
              <Input placeholder="VD: Phòng 101" />
            </Form.Item>
            <Form.Item name="floor" label="Tầng" rules={[{ required: true, message: "Vui lòng nhập tầng!" }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="area" label="Diện tích">
              <InputNumber min={0} className="full-width-input" addonAfter="m²" />
            </Form.Item>
            <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="price" label="Giá thuê" rules={[{ required: true, message: "Vui lòng nhập giá thuê!" }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VNĐ" />
            </Form.Item>
            <Form.Item name="deposit" label="Tiền cọc">
              <InputNumber min={0} className="full-width-input" addonAfter="VNĐ" />
            </Form.Item>
            <Form.Item name="serviceFee" label="Phí dịch vụ">
              <InputNumber min={0} className="full-width-input" addonAfter="VNĐ" />
            </Form.Item>
            <Form.Item name="electricityPrice" label="Giá điện">
              <InputNumber min={0} className="full-width-input" addonAfter="VNĐ" />
            </Form.Item>
            <Form.Item name="waterPrice" label="Giá nước">
              <InputNumber min={0} className="full-width-input" addonAfter="VNĐ" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
              <Select options={roomStatusOptions} />
            </Form.Item>
          </div>

          <div className="modal-section">Vị trí phòng</div>
          <Form.Item name="address" label="Địa chỉ phòng">
            <Input placeholder="VD: Số 12 ngõ 34 Cầu Giấy, Hà Nội" />
          </Form.Item>

          <div className="modal-section">Mô tả và hình ảnh</div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Ảnh phòng">
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
                <button type="button" className="upload-card-button">
                  <UploadOutlined />
                  <span>Tải ảnh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="room-modal"
        title={<div className="modal-heading"><div className="modal-heading-icon"><FileTextOutlined /></div><div className="modal-heading-text"><strong>Chi tiết phòng {detailRoom?.roomNumber ? `P.${detailRoom.roomNumber}` : ""}</strong><span>Thông tin phòng, dịch vụ và người thuê</span></div></div>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {detailRoom && (
          <Space direction="vertical" size={16} className="page-stack room-detail">
            <div className="detail-status"><UserOutlined /> {statusMeta[detailRoom.status]?.label || "Sẵn sàng"} · Tầng {detailRoom.floor || "-"} · {detailRoom.area || 0} m²</div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Số phòng">{detailRoom.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Tên phòng">{detailRoom.name}</Descriptions.Item>
              <Descriptions.Item label="Tầng">{detailRoom.floor}</Descriptions.Item>
              <Descriptions.Item label="Diện tích">{detailRoom.area || 0} m²</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{detailRoom.capacity}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMeta[detailRoom.status]?.color}>
                  {statusMeta[detailRoom.status]?.label}
                </Tag>
              </Descriptions.Item>
              {detailRoom.status === "payment_pending" ? (
                <Descriptions.Item label="Khóa thanh toán đến">
                  {formatDate(detailRoom.paymentHoldExpiresAt)}{" "}
                  {detailRoom.paymentHoldExpiresAt
                    ? new Date(detailRoom.paymentHoldExpiresAt).toLocaleTimeString("vi-VN")
                    : ""}
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <Divider orientation="left">Vị trí phòng</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Địa chỉ" span={2}>{detailRoom.address || "-"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Giá và dịch vụ</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Giá thuê">{formatCurrency(detailRoom.price)}</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatCurrency(detailRoom.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Giá điện">{formatCurrency(detailRoom.electricityPrice)}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">{formatCurrency(detailRoom.waterPrice)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailRoom.serviceFee)}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Mô tả">{detailRoom.description || "-"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Người thuê phòng</Divider>
            <List
              bordered
              dataSource={detailData?.tenants || []}
              loading={detailLoading}
              locale={{ emptyText: "Chưa có người thuê trong phòng" }}
              renderItem={(tenant) => {
                const roleMeta = roomRoleMeta[tenant.roomRole] || roomRoleMeta.member;
                const tenantMeta = tenantStatusMeta[tenant.status] || tenantStatusMeta.active;

                return (
                  <List.Item>
                    <Space direction="vertical" size={4} className="page-stack">
                      <Space wrap>
                        <Typography.Text strong>{tenant.userName || "-"}</Typography.Text>
                        <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
                        <Tag color={tenantMeta.color}>{tenantMeta.label}</Tag>
                      </Space>
                      <Typography.Text type="secondary">
                        {tenant.userPhone || tenant.userEmail || "-"} | Vào: {formatDate(tenant.moveInDate)} | Rời:{" "}
                        {formatDate(tenant.moveOutDate)}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                );
              }}
            />

            <Divider orientation="left">Hợp đồng</Divider>
            {detailData?.activeContract ? (
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Mã hợp đồng">
                  {detailData.activeContract.contractCode}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={contractStatusMeta[detailData.activeContract.status]?.color}>
                    {contractStatusMeta[detailData.activeContract.status]?.label || detailData.activeContract.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Người đại diện">
                  {detailData.activeContract.tenantName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Điện thoại">
                  {detailData.activeContract.tenantPhone || detailData.activeContract.tenantEmail || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu">
                  {formatDate(detailData.activeContract.startDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">
                  {formatDate(detailData.activeContract.endDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Hiệu lực còn lại">
                  {getRemainingTimeLabel(detailData.activeContract.endDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Xem hợp đồng">
                  <Button size="small" onClick={() => handleOpenContractFile(detailData.activeContract.id)}>
                    Xem hợp đồng
                  </Button>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">Chưa có hợp đồng cho phòng này.</Typography.Text>
            )}

            <Divider orientation="left">Khách giữ phòng</Divider>
            {detailData?.holdRequest ? (
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Khách giữ phòng">
                  {detailData.holdRequest.userName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Liên hệ">
                  {detailData.holdRequest.userPhone || detailData.holdRequest.userEmail || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền đã cọc">
                  {formatCurrency(detailData.holdRequest.amount)}
                </Descriptions.Item>
                <Descriptions.Item label="Thanh toán">
                  <Tag color={paymentProviderMeta[detailData.holdRequest.paymentProvider]?.color}>
                    {paymentProviderMeta[detailData.holdRequest.paymentProvider]?.label || detailData.holdRequest.paymentProvider}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày thanh toán">
                  {formatDate(detailData.holdRequest.paidAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Hiệu lực giữ phòng">
                  {getRemainingTimeLabel(detailData.holdRequest.holdExpiresAt)}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">Chưa có khách giữ phòng đang hiệu lực.</Typography.Text>
            )}

            <Divider orientation="left">Hóa đơn gần đây</Divider>
            <List
              bordered
              dataSource={detailData?.recentInvoices || []}
              loading={detailLoading}
              locale={{ emptyText: "Chưa có hóa đơn cho phòng này" }}
              renderItem={(invoice) => {
                const meta = invoiceStatusMeta[invoice.status] || invoiceStatusMeta.unpaid;

                return (
                  <List.Item>
                    <Space direction="vertical" size={4} className="page-stack">
                      <Space wrap>
                        <Typography.Text strong>
                          {invoice.invoiceCode} - Tháng {invoice.month}/{invoice.year}
                        </Typography.Text>
                        <Tag color={meta.color}>{meta.label}</Tag>
                      </Space>
                      <Typography.Text type="secondary">
                        Người thuê: {invoice.tenantName || "-"} | Tổng tiền: {formatCurrency(invoice.totalAmount)} | Đã thanh toán:{" "}
                        {formatCurrency(invoice.paidAmount)} | Hạn: {formatDate(invoice.dueDate)}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                );
              }}
            />

            <Divider orientation="left">Ảnh phòng</Divider>
            {detailRoom.images?.length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailRoom.images.map((url, index) => (
                    <Image
                      key={`${url}-${index}`}
                      src={toAbsoluteImageUrl(url)}
                      width={120}
                      height={90}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">Chưa có ảnh phòng</Typography.Text>
            )}

            <Divider orientation="left">Thời gian</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailRoom.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật">{formatDate(detailRoom.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagementPage;
