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
  status: "available",
  waterPrice: 15000,
};

const statusOptions = [
  { label: "Con trong", value: "available" },
  { label: "Dang thue", value: "occupied" },
  { label: "Bao tri", value: "maintenance" },
];

const statusMeta = {
  available: { color: "success", label: "Con trong" },
  occupied: { color: "blue", label: "Dang thue" },
  maintenance: { color: "warning", label: "Bao tri" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Dang thue" },
  inactive: { color: "default", label: "Da ket thuc" },
};

const roomRoleMeta = {
  representative: { color: "gold", label: "Dai dien phong" },
  member: { color: "green", label: "Nguoi thue phong" },
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toAbsoluteImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

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
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailTenants, setDetailTenants] = useState([]);
  const [detailTenantsLoading, setDetailTenantsLoading] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("roomNumber");
  const [display, setDisplay] = useState("grid");

  const roomStatusOptions = useMemo(
    () =>
      statusOptions.map((option) => ({
        ...option,
        disabled: editingRoom?.status === "occupied" && option.value === "available",
      })),
    [editingRoom]
  );

  const fetchRooms = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
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
        const matchesKeyword = !keyword || [room.roomNumber, room.name, room.description]
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
    setDetailTenants([]);
    setDetailOpen(true);
    setDetailTenantsLoading(true);

    try {
      const { data } = await http.get("/tenants", { params: { room: record.id } });
      setDetailTenants(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach nguoi thue");
    } finally {
      setDetailTenantsLoading(false);
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
        message.success("Da cap nhat phong");
      } else {
        await http.post("/rooms", payload);
        message.success("Da tao phong");
      }

      closeModal();
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu phong that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/rooms/${record.id}`);
      message.success("Da xoa phong");
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa phong that bai");
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
        message.info("Phong nay chua co hop dong dang hieu luc");
        return;
      }

      const { data } = await http.get(`/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(error.response?.data?.message || "Khong mo duoc hop dong cua phong");
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
      message.error(error.response?.data?.message || "Upload anh that bai");
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
        <Input className="room-search" prefix={<SearchOutlined />} placeholder="Tim kiem phong, khach thue..." value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        <div className="room-spacer" />
        <Button className="room-add" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>Them Phong</Button>
      </div>

      <div className="room-overview">
        <div className="room-count"><div className="overview-label">TONG SO PHONG</div><div className="overview-number">{roomOverview.total}</div><div className="overview-note">↗ {roomOverview.occupied} phong dang thue</div></div>
      </div>

      <div className="room-filters">
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ label: "Trang thai: Tat ca trang thai", value: "all" }, ...statusOptions.map((option) => ({ ...option, label: `Trang thai: ${option.label}` }))]} />
        <Select value={sortBy} onChange={setSortBy} options={[{ label: "Sap xep: So phong (Tang dan)", value: "roomNumber" }, { label: "Sap xep: Gia thue", value: "price" }, { label: "Sap xep: Trang thai", value: "status" }]} />
        <div className="room-view"><Button className={display === "grid" ? "active" : ""} icon={<AppstoreOutlined />} onClick={() => setDisplay("grid")} /><Button className={display === "list" ? "active" : ""} icon={<BarsOutlined />} onClick={() => setDisplay("list")} /></div>
      </div>

      <div className="room-grid" style={display === "list" ? { gridTemplateColumns: "1fr" } : undefined}>
        {visibleRooms.map((room) => {
          const meta = statusMeta[room.status] || statusMeta.available;
          const isOccupied = room.status === "occupied";
          return <article className="room-card" key={room.id}>
            <div className="room-photo">{room.images?.[0] && <img src={toAbsoluteImageUrl(room.images[0])} alt={`Phong ${room.roomNumber}`} />}</div>
            <div className="room-card-body"><div className="room-card-title"><strong>P.{room.roomNumber}</strong><Tag color={meta.color}>{meta.label}</Tag><MoreOutlined className="room-menu" /></div>
              <div className="room-info"><span><UserOutlined />{room.name || (isOccupied ? "Dang co khach thue" : "San sang ngay lap tuc")}</span><span><FileTextOutlined />{formatCurrency(room.price)}</span></div>
              <div className="room-actions">
                <Button onClick={() => openDetailModal(room)}>Chi tiet</Button>
                <Button type={isOccupied ? "primary" : "default"} icon={<EditOutlined />} onClick={() => openEditModal(room)}>{isOccupied ? "Cap nhat" : "Chinh sua"}</Button>
                <Popconfirm title="Xoa phong nay?" description="Khong the xoa phong dang co nguoi thue." okText="Xoa" cancelText="Huy" onConfirm={() => handleDelete(room)} disabled={isOccupied}>
                  <Button className="room-delete" aria-label={`Xoa phong ${room.roomNumber}`} danger icon={<DeleteOutlined />} disabled={isOccupied} />
                </Popconfirm>
              </div>
            </div>
          </article>;
        })}
        {!loading && !visibleRooms.length && <div className="room-empty">Khong tim thay phong phu hop.</div>}
        <div className="room-card room-card-add"><Button icon={<PlusOutlined />} onClick={openCreateModal} /></div>
      </div>

      <Modal
        className="room-modal"
        title={<div className="modal-heading"><div className="modal-heading-icon"><PlusOutlined /></div><div className="modal-heading-text"><strong>{editingRoom ? "Chinh sua phong" : "Them phong moi"}</strong><span>{editingRoom ? "Cap nhat thong tin va dich vu cua phong" : "Tao phong va thiet lap thong tin co ban"}</span></div></div>}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Luu" : "Tao phong"}
        cancelText="Huy"
        width={720}
      >
        <Form className="room-form" form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="modal-section">Thong tin phong</div>
          <div className="form-grid">
            <Form.Item name="roomNumber" label="So phong" rules={[{ required: true }]}>
              <Input placeholder="VD: 101" />
            </Form.Item>
            <Form.Item name="name" label="Ten phong" rules={[{ required: true }]}>
              <Input placeholder="VD: Phong 101" />
            </Form.Item>
            <Form.Item name="floor" label="Tang" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="area" label="Dien tich">
              <InputNumber min={0} className="full-width-input" addonAfter="m2" />
            </Form.Item>
            <Form.Item name="capacity" label="Suc chua" rules={[{ required: true }]}>
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="price" label="Gia thue" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="deposit" label="Tien coc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="serviceFee" label="Phi dich vu">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="electricityPrice" label="Gia dien">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="waterPrice" label="Gia nuoc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={roomStatusOptions} />
            </Form.Item>
          </div>

          <div className="modal-section">Mo ta va hinh anh</div>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Anh phong">
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
                  <span>Tai anh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="room-modal"
        title={<div className="modal-heading"><div className="modal-heading-icon"><FileTextOutlined /></div><div className="modal-heading-text"><strong>Chi tiet phong {detailRoom?.roomNumber ? `P.${detailRoom.roomNumber}` : ""}</strong><span>Thong tin phong, dich vu va nguoi thue</span></div></div>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Dong
          </Button>,
        ]}
        width={820}
      >
        {detailRoom && (
          <Space direction="vertical" size={16} className="page-stack room-detail">
            <div className="detail-status"><UserOutlined /> {statusMeta[detailRoom.status]?.label || "San sang"} · Tang {detailRoom.floor || "-"} · {detailRoom.area || 0} m2</div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="So phong">{detailRoom.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Ten phong">{detailRoom.name}</Descriptions.Item>
              <Descriptions.Item label="Tang">{detailRoom.floor}</Descriptions.Item>
              <Descriptions.Item label="Dien tich">{detailRoom.area || 0} m2</Descriptions.Item>
              <Descriptions.Item label="Suc chua">{detailRoom.capacity}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={statusMeta[detailRoom.status]?.color}>
                  {statusMeta[detailRoom.status]?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Gia va dich vu</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Gia thue">{formatCurrency(detailRoom.price)}</Descriptions.Item>
              <Descriptions.Item label="Tien coc">{formatCurrency(detailRoom.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Gia dien">{formatCurrency(detailRoom.electricityPrice)}</Descriptions.Item>
              <Descriptions.Item label="Gia nuoc">{formatCurrency(detailRoom.waterPrice)}</Descriptions.Item>
              <Descriptions.Item label="Phi dich vu">{formatCurrency(detailRoom.serviceFee)}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Mo ta">{detailRoom.description || "-"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Nguoi thue phong</Divider>
            <List
              bordered
              dataSource={detailTenants}
              loading={detailTenantsLoading}
              locale={{ emptyText: "Chua co nguoi thue trong phong" }}
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
                        {tenant.userPhone || tenant.userEmail || "-"} | Vao: {formatDate(tenant.moveInDate)} | Roi:{" "}
                        {formatDate(tenant.moveOutDate)}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                );
              }}
            />

            <Divider orientation="left">Anh phong</Divider>
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
              <Typography.Text type="secondary">Chua co anh phong</Typography.Text>
            )}

            <Divider orientation="left">Thoi gian</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ngay tao">{formatDate(detailRoom.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngay cap nhat">{formatDate(detailRoom.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagementPage;
