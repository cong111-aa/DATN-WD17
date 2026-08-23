import {
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  PhoneOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const fallbackRoomImage =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80";

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chưa xử lý");

const roomRoleMeta = {
  member: { color: "green", label: "Thành viên" },
  representative: { color: "gold", label: "Đại diện phòng" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Đang thuê" },
  inactive: { color: "default", label: "Đã kết thúc" },
};

const contractStatusMeta = {
  pending_user_signature: { color: "gold", label: "Chờ khách ký" },
  active: { color: "blue", label: "Đang hiệu lực" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const invoiceStatusMeta = {
  unpaid: { color: "error", label: "Chưa thanh toán" },
  partial: { color: "warning", label: "Thanh toán một phần" },
  paid: { color: "success", label: "Đã thanh toán" },
  overdue: { color: "error", label: "Quá hạn" },
};

const roomRequestTypeMeta = {
  hold_deposit: { color: "gold", label: "Giữ phòng" },
  rent: { color: "blue", label: "Thuê phòng" },
};

const roomRequestStatusMeta = {
  pending: { color: "processing", label: "Chờ xác nhận" },
  approved: { color: "success", label: "Đã xác nhận" },
  rejected: { color: "error", label: "Từ chối" },
  cancelled: { color: "default", label: "Đã hủy" },
  expired: { color: "warning", label: "Hết hạn" },
};

const requestStatusMeta = roomRequestStatusMeta;

const paymentStatusMeta = {
  unpaid: { color: "default", label: "Chưa thanh toán" },
  pending: { color: "processing", label: "Đang thanh toán" },
  paid: { color: "success", label: "Đã thanh toán" },
  failed: { color: "error", label: "Thất bại" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const repairPriorityOptions = [
  { label: "Thấp", value: "low" },
  { label: "Trung bình", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khẩn cấp", value: "urgent" },
];

const repairPriorityMeta = {
  low: { color: "default", label: "Thấp" },
  medium: { color: "blue", label: "Trung bình" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khẩn cấp" },
};

const repairStatusMeta = {
  pending: { color: "warning", label: "Chờ xử lý" },
  processing: { color: "processing", label: "Đang xử lý" },
  resolved: { color: "success", label: "Đã xử lý" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const repairStatusOptions = [
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đã xử lý", value: "resolved" },
  { label: "Đã hủy", value: "cancelled" },
];

const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toUploadedImageUrls = (fileList = []) =>
  fileList.flatMap((file) => file.response?.urls || (file.rawUrl ? [file.rawUrl] : file.url ? [file.url] : []));

const toUploadedImageUrl = (fileList = []) =>
  fileList[0]?.response?.urls?.[0] || fileList[0]?.rawUrl || fileList[0]?.url || "";

const toRepairImageFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    rawUrl: url,
    status: "done",
    url: toImageUrl(url),
  }));

const toIdentityFileList = (url) =>
  url
    ? [
        {
          uid: url,
          name: url.split("/").pop() || "identity-image",
          rawUrl: url,
          status: "done",
          url: toImageUrl(url),
        },
      ]
    : [];

const UserHomePage = () => {
  const [repairForm] = Form.useForm();
  const [roomRequestForm] = Form.useForm();
  const { logout, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "rooms";

  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
    setTimeout(() => {
      const el = document.getElementById("portal-active-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const scrollToAvailableRooms = () => {
    const el = document.getElementById("available-rooms-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMyRooms = () => {
    const el = document.getElementById("my-rooms-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToInterestedRooms = () => {
    const el = document.getElementById("interested-rooms-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToInvoices = () => {
    const el = document.getElementById("invoices-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToRoomRequests = () => {
    const el = document.getElementById("room-requests-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToRepairRequests = () => {
    const el = document.getElementById("repair-requests-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContracts = () => {
    const el = document.getElementById("contracts-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const [payingInvoiceId, setPayingInvoiceId] = useState("");

  const handleCreateVnpayPayment = async (invoice) => {
    setPayingInvoiceId(invoice.id);
    try {
      const { data } = await http.post("/payments/vnpay/create", {
        targetId: invoice.id,
        targetType: "invoice",
      });
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không tạo được giao dịch VNPay");
    } finally {
      setPayingInvoiceId("");
    }
  };

  const [tenancies, setTenancies] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [interestedRooms, setInterestedRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [roomRequests, setRoomRequests] = useState([]);
  const [identityBackFileList, setIdentityBackFileList] = useState([]);
  const [identityFrontFileList, setIdentityFrontFileList] = useState([]);
  const [repairImageFileList, setRepairImageFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [roomRequestSubmitting, setRoomRequestSubmitting] = useState(false);
  const [detailAvailableRoom, setDetailAvailableRoom] = useState(null);
  const [detailTenancy, setDetailTenancy] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [detailRepairRequest, setDetailRepairRequest] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [editingRepairRequest, setEditingRepairRequest] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [roomRequestModalOpen, setRoomRequestModalOpen] = useState(false);
  const [roomRequestType, setRoomRequestType] = useState("hold_deposit");
  const [selectedRequestRoom, setSelectedRequestRoom] = useState(null);

  const activeTenancies = useMemo(
    () => tenancies.filter((tenancy) => tenancy.status === "active"),
    [tenancies]
  );

  const activeRoomOptions = useMemo(
    () =>
      activeTenancies.map((tenancy) => ({
        label: `Phòng ${tenancy.roomNumber} - ${tenancy.roomName}`,
        value: tenancy.room,
      })),
    [activeTenancies]
  );

  useEffect(() => {
    setIdentityBackFileList(toIdentityFileList(user?.identityBackImage));
    setIdentityFrontFileList(toIdentityFileList(user?.identityFrontImage));
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      const [
        { data: tenancyData },
        { data: contractData },
        { data: invoiceData },
        { data: repairRequestData },
        { data: roomRequestData },
        { data: availableRoomData },
        { data: interestedRoomData },
      ] = await Promise.all([
        http.get("/me/tenancies"),
        http.get("/me/contracts"),
        http.get("/me/invoices"),
        http.get("/me/repair-requests"),
        http.get("/me/room-requests"),
        http.get("/me/available-rooms"),
        http.get("/me/interested-rooms"),
      ]);

      setTenancies(tenancyData);
      setAvailableRooms(availableRoomData);
      setInterestedRooms(interestedRoomData);
      setContracts(contractData);
      setInvoices(invoiceData);
      setRepairRequests(repairRequestData);
      setRoomRequests(roomRequestData);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được dữ liệu người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleUpdate = async (values) => {
    try {
      await http.put("/auth/profile", values);
      await refreshProfile();
      message.success("Đã cập nhật thông tin thành công");
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleIdentityImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/identity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload ảnh CCCD thất bại");
      onError(error);
    }
  };

  const handleIdentityFileChange = (fieldName, setFileList) => ({ fileList }) => {
    const nextFileList = fileList.slice(-1);
    setFileList(nextFileList);
    form.setFieldValue(fieldName, toUploadedImageUrl(nextFileList));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenContractFile = async (contract) => {
    try {
      const { data } = await http.get(`/me/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được file hợp đồng");
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      const { data } = await http.get(`/me/invoices/${invoice.id}`);
      setDetailInvoice(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết hóa đơn");
    }
  };

  const handleInterestedRoom = async (room) => {
    if (!room) {
      return;
    }

    try {
      await http.post("/me/interested-rooms", { room: room.id || room.room });
      message.success(`Đã thêm phòng ${room.roomNumber} vào danh sách quan tâm`);
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Không thêm được phòng quan tâm");
    }
  };

  const handleRemoveInterestedRoom = async (room) => {
    try {
      await http.delete(`/me/interested-rooms/${room.room}`);
      message.success("Đã bỏ quan tâm phòng");
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Không bỏ quan tâm được phòng");
    }
  };

  const openRoomRequestModal = (type, room) => {
    const resolvedRoom = {
      ...room,
      id: room.id || room.room,
      images: room.images || room.roomImages || [],
      price: room.price || room.roomPrice,
    };

    setRoomRequestType(type);
    setSelectedRequestRoom(resolvedRoom);
    roomRequestForm.resetFields();
    roomRequestForm.setFieldsValue(
      type === "rent"
        ? {
            durationMonths: 12,
            occupantCount: 1,
            occupants: [
              {
                name: user?.name || "",
                phone: user?.phone || "",
                identityNumber: user?.identityNumber || "",
                identityFrontImage: user?.identityFrontImage || "",
                identityBackImage: user?.identityBackImage || "",
              },
            ],
          }
        : {}
    );
    setRoomRequestModalOpen(true);
  };

  const closeRoomRequestModal = () => {
    setRoomRequestModalOpen(false);
    setSelectedRequestRoom(null);
    roomRequestForm.resetFields();
  };

  const handleRoomRequestSubmit = async (values) => {
    if (!selectedRequestRoom) {
      return;
    }

    setRoomRequestSubmitting(true);

    try {
      const payload = {
        message: values.message,
        room: selectedRequestRoom.id,
      };

      if (roomRequestType === "rent") {
        payload.durationMonths = values.durationMonths;
        payload.occupantCount = values.occupantCount;
        payload.occupants = values.occupants || [];
      }

      const { data } = await http.post(
        roomRequestType === "hold_deposit"
          ? "/me/room-requests/hold-deposit"
          : "/me/room-requests/rent",
        payload
      );
      message.success("Đã gửi yêu cầu phòng thành công");
      closeRoomRequestModal();
      setPaymentRequest(roomRequestType === "hold_deposit" ? data : null);
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi yêu cầu phòng thất bại");
    } finally {
      setRoomRequestSubmitting(false);
    }
  };

  const handleCancelRoomRequest = async (request) => {
    try {
      await http.patch(`/me/room-requests/${request.id}/cancel`);
      message.success("Đã hủy yêu cầu");
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Hủy yêu cầu thất bại");
    }
  };

  const openRepairModal = () => {
    setEditingRepairRequest(null);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      priority: "medium",
      room: activeRoomOptions[0]?.value,
    });
    setRepairImageFileList([]);
    setRepairModalOpen(true);
  };

  const openEditRepairModal = (request) => {
    setEditingRepairRequest(request);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      description: request.description,
      priority: request.priority,
      requestedResolveDate: request.requestedResolveDate
        ? dayjs(request.requestedResolveDate)
        : undefined,
      room: request.room,
      status: request.status,
      title: request.title,
    });
    setRepairImageFileList(toRepairImageFileList(request.images));
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
        message.success("Đã cập nhật sự cố");
      } else {
        await http.post("/me/repair-requests", payload);
        message.success("Đã gửi báo cáo sự cố");
      }

      closeRepairModal();
      fetchUserData();
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
      message.success("Đã xóa sự cố");
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa sự cố thất bại");
    }
  };

  const tenancyColumns = [
    {
      title: "Phòng",
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 15 }}>Phòng {value || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.roomName || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roomRole",
      key: "roomRole",
      render: (role) => {
        const meta = roomRoleMeta[role] || roomRoleMeta.member;
        return <Tag color={meta.color} style={{ borderRadius: 4, fontWeight: 600 }}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày vào ở",
      dataIndex: "moveInDate",
      key: "moveInDate",
      render: formatDate,
    },
    {
      title: "Giá thuê",
      dataIndex: "roomPrice",
      key: "roomPrice",
      render: (val) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = tenantStatusMeta[status] || tenantStatusMeta.inactive;
        return <Tag color={meta.color} style={{ borderRadius: 4 }}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button size="small" onClick={() => setDetailTenancy(record)} style={{ borderRadius: 6 }}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const contractColumns = [
    {
      title: "Mã HĐ",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#0f766e" }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Thời hạn",
      key: "period",
      render: (_, record) => `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`,
    },
    {
      title: "Tiền thuê",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      render: formatCurrency,
    },
    {
      title: "Tiền cọc",
      dataIndex: "deposit",
      key: "deposit",
      render: formatCurrency,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = contractStatusMeta[status] || contractStatusMeta.expired;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailContract(record)} style={{ borderRadius: 6 }}>Chi tiết</Button>
          <Button size="small" type="primary" onClick={() => handleOpenContractFile(record)} style={{ background: "#0f766e", borderRadius: 6 }}>
            Xem hợp đồng
          </Button>
        </Space>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: "Mã hóa đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Kỳ HĐ",
      key: "period",
      render: (_, record) => `Tháng ${record.month}/${record.year}`,
    },
    {
      title: "Điện / Nước",
      key: "utilities",
      render: (_, record) => `${record.electricityUsage ?? 0} số / ${record.waterUsage ?? 0} khối`,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <Text strong style={{ fontSize: 15 }}>{formatCurrency(value)}</Text>,
    },
    {
      title: "Còn lại",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (value) => (
        <Text type={Number(value || 0) > 0 ? "danger" : "success"} strong>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Hạn TT",
      dataIndex: "dueDate",
      key: "dueDate",
      render: formatDate,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = invoiceStatusMeta[status] || invoiceStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button size="small" onClick={() => handleViewInvoice(record)} style={{ borderRadius: 6 }}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const roomRequestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "requestCode",
      key: "requestCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#0f766e" }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"} - {record.roomName || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const meta = roomRequestTypeMeta[type] || roomRequestTypeMeta.rent;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Số tiền cọc",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => {
        const meta = paymentStatusMeta[status] || paymentStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = roomRequestStatusMeta[status] || roomRequestStatusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" type="primary" onClick={() => setPaymentRequest(record)} style={{ background: "#0f766e", borderRadius: 6 }}>
            QR Chuyển khoản
          </Button>
          <Popconfirm
            title="Hủy yêu cầu giữ phòng này?"
            okText="Hủy ngay"
            cancelText="Đóng"
            onConfirm={() => handleCancelRoomRequest(record)}
            disabled={record.status !== "pending"}
          >
            <Button size="small" danger disabled={record.status !== "pending"} style={{ borderRadius: 6 }}>
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const repairRequestColumns = [
    {
      title: "Tiêu đề sự cố",
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = repairPriorityMeta[priority] || repairPriorityMeta.medium;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = repairStatusMeta[status] || repairStatusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày báo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => handleViewRepairRequest(record)} style={{ borderRadius: 6 }}>
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditRepairModal(record)}
            disabled={record.status !== "pending"}
            style={{ borderRadius: 6 }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa báo cáo sự cố này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteRepairRequest(record)}
            disabled={record.status !== "pending"}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.status !== "pending"} style={{ borderRadius: 6 }}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const unpaidInvoicesCount = useMemo(
    () => invoices.filter((inv) => inv.status === "unpaid" || inv.status === "overdue").length,
    [invoices]
  );

  const pendingRepairCount = useMemo(
    () => repairRequests.filter((req) => req.status === "pending" || req.status === "processing").length,
    [repairRequests]
  );

  return (
    <>
      <div className="user-portal-container" style={{ paddingTop: 20, paddingBottom: 40 }}>
        
        {/* ====== WELCOME BANNER ====== */}
        <div className="user-welcome-banner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, position: "relative", zIndex: 2 }}>
            <Space align="center" size="large">
              <Avatar size={64} icon={<UserOutlined />} style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", fontSize: 28 }} />
              <div>
                <Title level={3} style={{ color: "#ffffff", margin: 0, letterSpacing: "-0.5px" }}>
                  Xin chào, {user?.name || "Khách hàng"} 👋
                </Title>
                <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                  {user?.email} {user?.phone ? `• SĐT: ${user.phone}` : ""}
                </Text>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {activeTenancies.length > 0 && (
                    <Tag style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#6ee7b7", borderRadius: 6, fontWeight: 600 }}>
                      <CheckCircleOutlined /> Đang thuê {activeTenancies.length} phòng
                    </Tag>
                  )}
                  {unpaidInvoicesCount > 0 && (
                    <Tag style={{ background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#fcd34d", borderRadius: 6, fontWeight: 600 }}>
                      <ClockCircleOutlined /> {unpaidInvoicesCount} hóa đơn chưa TT
                    </Tag>
                  )}
                </div>
              </div>
            </Space>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUserData}
              loading={loading}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", borderRadius: 8, fontWeight: 600, height: 40 }}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* ====== 2. 4 STAT KPI WIDGETS (Item 3) ====== */}
        <div className="stat-widget-grid" style={{ marginBottom: 24 }}>
          <div className="stat-widget teal-border" onClick={scrollToMyRooms} style={{ cursor: "pointer" }}>
            <div className="stat-widget-icon teal"><HomeOutlined /></div>
            <div className="stat-widget-info">
              <span className="stat-widget-value">{activeTenancies.length}</span>
              <span className="stat-widget-label">Phòng đang ở</span>
            </div>
          </div>
          <div className="stat-widget blue-border" onClick={scrollToContracts} style={{ cursor: "pointer" }}>
            <div className="stat-widget-icon blue"><FileProtectOutlined /></div>
            <div className="stat-widget-info">
              <span className="stat-widget-value">{contracts.filter((c) => c.status === "active").length}</span>
              <span className="stat-widget-label">Hợp đồng hiệu lực</span>
            </div>
          </div>
          <div className="stat-widget amber-border" onClick={scrollToInvoices} style={{ cursor: "pointer" }}>
            <div className="stat-widget-icon amber"><FileTextOutlined /></div>
            <div className="stat-widget-info">
              <span className="stat-widget-value" style={{ color: unpaidInvoicesCount > 0 ? "#b45309" : undefined }}>{unpaidInvoicesCount}</span>
              <span className="stat-widget-label">Hóa đơn cần TT</span>
            </div>
          </div>
          <div className="stat-widget rose-border" onClick={scrollToRepairRequests} style={{ cursor: "pointer" }}>
            <div className="stat-widget-icon rose"><ToolOutlined /></div>
            <div className="stat-widget-info">
              <span className="stat-widget-value">{pendingRepairCount}</span>
              <span className="stat-widget-label">Sự cố chờ xử lý</span>
            </div>
          </div>
        </div>

        {/* ====== 3. ⚡ VIỆC CẦN LÀM (ACTION REQUIRED BLOCK - Item 14 & 6) ====== */}
        {(unpaidInvoicesCount > 0 || pendingRepairCount > 0) && (
          <div className="action-required-container">
            <div className="action-required-header">
              <span style={{ fontSize: 18 }}>⚡</span> VIỆC CẦN LÀM ({unpaidInvoicesCount + pendingRepairCount})
            </div>
            <div className="action-required-list">
              {invoices.filter((inv) => inv.status === "unpaid" || inv.status === "overdue").map((inv) => (
                <div key={inv.id} className="action-required-item danger">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Tag color="error" style={{ margin: 0, borderRadius: 6, fontWeight: 700 }}>
                      {inv.status === "overdue" ? "HÓA ĐƠN QUÁ HẠN" : "HÓA ĐƠN CHƯA TT"}
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 14, color: "#9f1239" }}>
                        Hóa đơn Tháng {inv.month}/{inv.year} - Phòng {inv.roomNumber} ({inv.invoiceCode})
                      </Text>
                      <div style={{ fontSize: 13, color: "#be123c" }}>
                        Số tiền: <strong>{formatCurrency(inv.totalAmount)}</strong> • Hạn: {formatDate(inv.dueDate)}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    danger
                    icon={<CreditCardOutlined />}
                    loading={payingInvoiceId === inv.id}
                    onClick={() => handleCreateVnpayPayment(inv)}
                    style={{ borderRadius: 8, fontWeight: 600, background: "#e11d48", borderColor: "#e11d48" }}
                  >
                    Thanh toán ngay
                  </Button>
                </div>
              ))}

              {repairRequests.filter((req) => req.status === "pending" || req.status === "processing").map((req) => (
                <div key={req.id} className="action-required-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Tag color="warning" style={{ margin: 0, borderRadius: 6, fontWeight: 700 }}>
                      SỰ CỐ ĐANG XỬ LÝ
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 14, color: "#92400e" }}>
                        Sự cố: "{req.title}" - Phòng {req.roomNumber}
                      </Text>
                      <div style={{ fontSize: 12, color: "#b45309" }}>
                        Mô tả: {req.description?.slice(0, 50)}... • Gửi ngày: {formatDate(req.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => setDetailRepairRequest(req)}
                    style={{ borderRadius: 8, fontWeight: 600, borderColor: "#fcd34d", color: "#92400e" }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== 4. 🎯 QUẢN LÝ NHANH (COMPACT FUNCTION HUB - Item 4, 5) ====== */}
        <div className="dashboard-section" style={{ marginBottom: 32 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <h3 className="section-title" style={{ fontSize: 16 }}>
              <span className="section-title-dot" style={{ background: "#0f766e" }} /> QUẢN LÝ NHANH
            </h3>
          </div>

          <div className="hub-card-grid">
            {/* Card 1: Phòng của tôi */}
            <div className="hub-function-card" onClick={scrollToMyRooms}>
              <div className="hub-card-top">
                <div className="hub-card-icon teal">
                  <HomeOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Phòng của tôi</div>
                <div className="hub-card-desc">{activeTenancies.length} phòng đang ở</div>
              </div>
              <span className="hub-smart-badge success">
                🟢 {activeTenancies.length} active
              </span>
            </div>

            {/* Card 2: Hóa đơn */}
            <div className="hub-function-card" onClick={scrollToInvoices}>
              <div className="hub-card-top">
                <div className="hub-card-icon amber">
                  <FileTextOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Hóa đơn</div>
                <div className="hub-card-desc">{unpaidInvoicesCount} chưa thanh toán</div>
              </div>
              <span className={`hub-smart-badge ${unpaidInvoicesCount > 0 ? "warning" : "success"}`}>
                {unpaidInvoicesCount > 0 ? `⚠️ ${unpaidInvoicesCount} chưa TT` : "✅ Hoàn tất"}
              </span>
            </div>

            {/* Card 3: Đặt cọc */}
            <div className="hub-function-card" onClick={scrollToRoomRequests}>
              <div className="hub-card-top">
                <div className="hub-card-icon purple">
                  <CreditCardOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Đặt cọc</div>
                <div className="hub-card-desc">{roomRequests.length} yêu cầu</div>
              </div>
              <span className="hub-smart-badge info">
                🔑 {roomRequests.length} phiếu cọc
              </span>
            </div>

            {/* Card 4: Báo sự cố */}
            <div className="hub-function-card" onClick={scrollToRepairRequests}>
              <div className="hub-card-top">
                <div className="hub-card-icon rose">
                  <ToolOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Báo sự cố</div>
                <div className="hub-card-desc">{pendingRepairCount} đang xử lý</div>
              </div>
              <span className={`hub-smart-badge ${pendingRepairCount > 0 ? "warning" : "info"}`}>
                {pendingRepairCount > 0 ? `🔧 ${pendingRepairCount} chờ xử lý` : "✅ Bình thường"}
              </span>
            </div>

            {/* Card 5: Hợp đồng */}
            <div className="hub-function-card" onClick={scrollToContracts}>
              <div className="hub-card-top">
                <div className="hub-card-icon blue">
                  <FileProtectOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Hợp đồng</div>
                <div className="hub-card-desc">{contracts.length} hợp đồng</div>
              </div>
              <span className="hub-smart-badge info">
                📄 {contracts.length} file HĐ
              </span>
            </div>

            {/* Card 6: Phòng đã lưu */}
            <div className="hub-function-card" onClick={scrollToInterestedRooms}>
              <div className="hub-card-top">
                <div className="hub-card-icon rose">
                  <HeartOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Phòng đã lưu</div>
                <div className="hub-card-desc">{interestedRooms.length} phòng yêu thích</div>
              </div>
              <span className="hub-smart-badge info">
                ❤️ {interestedRooms.length} yêu thích
              </span>
            </div>

            {/* Card 7: Thông báo */}
            <div className="hub-function-card" onClick={() => navigate("/user/profile")}>
              <div className="hub-card-top">
                <div className="hub-card-icon teal">
                  <BellOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Thông báo</div>
                <div className="hub-card-desc">Nhắc nhở hệ thống</div>
              </div>
              <span className="hub-smart-badge info">
                🔔 Liên tục
              </span>
            </div>

            {/* Card 8: Hỗ trợ */}
            <div className="hub-function-card" onClick={() => navigate("/")}>
              <div className="hub-card-top">
                <div className="hub-card-icon teal">
                  <InfoCircleOutlined />
                </div>
                <ArrowRightOutlined className="hub-card-arrow" />
              </div>
              <div>
                <div className="hub-card-title">Hỗ trợ</div>
                <div className="hub-card-desc">Quy định & Hướng dẫn</div>
              </div>
              <span className="hub-smart-badge info">
                💬 Hỗ trợ 24/7
              </span>
            </div>
          </div>
        </div>

        {/* ====== 5. 🔎 PHÒNG TRỐNG ĐỀ XUẤT (Item 7, 8, 9) ====== */}
        {availableRooms.length > 0 && (
          <div id="available-rooms-section" className="dashboard-section">
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h3 className="section-title">
                  <span className="section-title-dot" style={{ background: "#0d9488" }} /> Phòng trống đề xuất ({availableRooms.length})
                </h3>
                <Text type="secondary" style={{ fontSize: 13 }}>Dựa trên tiêu chí bạn quan tâm</Text>
              </div>
              <Button type="link" onClick={() => navigate("/")} style={{ color: "#0f766e", fontWeight: 600, padding: 0 }}>
                Xem tất cả phòng →
              </Button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {availableRooms.slice(0, 8).map((room) => {
                const roomCover = room.images?.[0] ? toImageUrl(room.images[0]) : fallbackRoomImage;
                return (
                  <Card
                    key={room.id}
                    hoverable
                    className="property-listing-card"
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.03)",
                    }}
                    styles={{ body: { padding: 14 } }}
                    cover={
                      <div style={{ position: "relative", height: 145, background: "#f1f5f9" }}>
                        <img
                          alt={`Phòng ${room.roomNumber}`}
                          src={roomCover}
                          onError={(e) => { e.target.onerror = null; e.target.src = fallbackRoomImage; }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Tag
                          color="success"
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: "1px 7px",
                            margin: 0,
                            fontSize: 11,
                          }}
                        >
                          🟢 Đang trống
                        </Tag>
                      </div>
                    }
                  >
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                        Phòng {room.roomNumber} - {room.name || "Phòng trọ cao cấp"}
                      </Text>
                    </div>

                    <Title level={4} style={{ margin: "0 0 8px 0", color: "#0f766e", fontSize: 18, fontWeight: 700 }}>
                      {formatCurrency(room.price)}<span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}> / tháng</span>
                    </Title>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        📐 {room.area || 0} m²
                      </span>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        👥 {room.capacity || 1} người
                      </span>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        🏢 Tầng {room.floor ?? "-"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate(`/user/rooms/${room.id}`)}
                        style={{ flex: 1, background: "#0f766e", borderColor: "#0f766e", borderRadius: 6, fontWeight: 600, height: 30, fontSize: 12 }}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        size="small"
                        onClick={() => openRoomRequestModal("hold_deposit", room)}
                        style={{ flex: 1, borderRadius: 6, fontWeight: 600, height: 30, fontSize: 12 }}
                      >
                        Đặt cọc
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== 6. 🏠 PHÒNG ĐANG Ở CỦA TÔI (Item 1, 16) ====== */}
        <div id="my-rooms-section" className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#0f766e" }} /> Phòng đang ở của tôi ({activeTenancies.length})
            </h3>
          </div>

          {activeTenancies.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {activeTenancies.map((tenancy) => {
                const coverImg = tenancy.roomImages?.[0] ? toImageUrl(tenancy.roomImages[0]) : fallbackRoomImage;
                const roleMeta = roomRoleMeta[tenancy.roomRole] || roomRoleMeta.member;
                return (
                  <Card
                    key={tenancy.id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.03)",
                    }}
                    styles={{ body: { padding: 16 } }}
                    cover={
                      <div style={{ position: "relative", height: 155, overflow: "hidden", background: "#f1f5f9" }}>
                        <img
                          src={coverImg}
                          alt={`Phòng ${tenancy.roomNumber}`}
                          onError={(e) => { e.target.onerror = null; e.target.src = fallbackRoomImage; }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                          <Tag color="success" style={{ fontWeight: 600, borderRadius: 6, padding: "1px 7px", margin: 0, fontSize: 11 }}>
                            <CheckCircleOutlined /> Đang thuê
                          </Tag>
                          <Tag color={roleMeta.color} style={{ fontWeight: 600, borderRadius: 6, padding: "1px 7px", margin: 0, fontSize: 11 }}>
                            {roleMeta.label}
                          </Tag>
                        </div>
                      </div>
                    }
                  >
                    <div style={{ marginBottom: 6 }}>
                      <Title level={4} style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
                        Phòng {tenancy.roomNumber} - {tenancy.roomName}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Ngày chuyển vào: {formatDate(tenancy.moveInDate)}
                      </Text>
                    </div>

                    <Title level={4} style={{ margin: "6px 0 10px 0", color: "#0f766e", fontSize: 18, fontWeight: 700 }}>
                      {formatCurrency(tenancy.roomPrice)}<span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>/tháng</span>
                    </Title>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "3px 7px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        📐 {tenancy.roomArea || 0} m²
                      </span>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "3px 7px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        👥 {tenancy.roomCapacity || 1} người
                      </span>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#f8fafc", padding: "3px 7px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        🏢 Tầng {tenancy.roomFloor ?? "-"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        type="primary"
                        onClick={() => setDetailTenancy(tenancy)}
                        style={{ flex: 1, background: "#0f766e", borderColor: "#0f766e", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Chi tiết phòng
                      </Button>
                      <Button
                        icon={<ToolOutlined />}
                        onClick={() => openRepairModal(tenancy.room)}
                        style={{ borderRadius: 6, color: "#b45309", borderColor: "#fcd34d", background: "#fffbeb", fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Báo hỏng
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text strong style={{ fontSize: 15, color: "#334155", display: "block", marginBottom: 4 }}>
                      🏠 Bạn chưa thuê phòng nào
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Tìm phòng phù hợp với nhu cầu của bạn và bắt đầu thuê ngay hôm nay.
                    </Text>
                  </div>
                }
              >
                <Button type="primary" onClick={() => navigate("/")} style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 600, marginTop: 8 }}>
                  Tìm phòng ngay
                </Button>
              </Empty>
            </Card>
          )}
        </div>

        {/* ====== 7. 💰 HÓA ĐƠN & THANH TOÁN (Item 6) ====== */}
        <div id="invoices-section" className="dashboard-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#d97706" }} /> Hóa đơn dịch vụ & tiền trọ ({invoices.length})
            </h3>
            <Button type="link" onClick={() => navigate("/user/invoices")} style={{ color: "#0f766e", fontWeight: 600, padding: 0 }}>
              Quản lý hóa đơn →
            </Button>
          </div>

          {invoices.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {invoices.map((inv) => {
                const meta = invoiceStatusMeta[inv.status] || { color: "default", label: inv.status };
                const isPending = inv.status === "unpaid" || inv.status === "overdue";
                return (
                  <Card
                    key={inv.id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: isPending ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                      background: isPending ? "#fffdf5" : "#ffffff",
                      boxShadow: isPending ? "0 4px 14px rgba(245, 158, 11, 0.1)" : "0 3px 10px rgba(0,0,0,0.03)",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: "0 0 4px 0" }}>
                          {inv.invoiceCode}
                        </Tag>
                        <Title level={4} style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
                          Phòng {inv.roomNumber} - {inv.roomName}
                        </Title>
                      </div>
                      <Tag color={meta.color} style={{ fontWeight: 700, borderRadius: 6, padding: "2px 8px", margin: 0 }}>
                        {meta.label}
                      </Tag>
                    </div>

                    <div style={{ background: isPending ? "#fffbe6" : "#f8fafc", padding: "10px 12px", borderRadius: 8, marginBottom: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Kỳ thanh toán:</Text>
                        <Text strong style={{ fontSize: 13 }}>Tháng {inv.month}/{inv.year}</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Tổng số tiền:</Text>
                        <Text strong style={{ fontSize: 16, color: isPending ? "#b45309" : "#0f766e" }}>{formatCurrency(inv.totalAmount)}</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Hạn thanh toán:</Text>
                        <Text type={isPending ? "danger" : "secondary"} style={{ fontSize: 13, fontWeight: isPending ? 600 : 400 }}>
                          {formatDate(inv.dueDate)}
                        </Text>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        size="small"
                        onClick={() => setDetailInvoice(inv)}
                        style={{ flex: 1, borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Chi tiết
                      </Button>
                      {isPending && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CreditCardOutlined />}
                          loading={payingInvoiceId === inv.id}
                          onClick={() => handleCreateVnpayPayment(inv)}
                          style={{ flex: 1, background: "#d97706", borderColor: "#d97706", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                        >
                          Thanh toán VNPay
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#fffbeb", border: "1px dashed #fde68a" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">Chưa có hóa đơn nào phát sinh</Text>}
              />
            </Card>
          )}
        </div>

        {/* ====== 8. 🔧 SỰ CỐ & SỬA CHỮA (Item 9, 16, 17) ====== */}
        <div id="repair-requests-section" className="dashboard-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#e11d48" }} /> Yêu cầu sửa chữa & sự cố ({repairRequests.length})
            </h3>
            <Space>
              {activeRoomOptions.length > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openRepairModal()}
                  style={{ background: "#e11d48", borderColor: "#e11d48", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 13 }}
                >
                  Báo sự cố mới
                </Button>
              )}
              <Button type="link" onClick={() => navigate("/user/repair-requests")} style={{ color: "#e11d48", fontWeight: 600, padding: 0 }}>
                Quản lý báo hỏng →
              </Button>
            </Space>
          </div>

          {repairRequests.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {repairRequests.map((req) => {
                const meta = repairStatusMeta[req.status] || { color: "default", label: req.status };
                const priority = repairPriorityMeta[req.priority] || repairPriorityMeta.medium;
                return (
                  <Card
                    key={req.id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: "1px solid #ffe4e6",
                      boxShadow: "0 3px 10px rgba(225, 29, 72, 0.03)",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <Tag color={priority.color} style={{ borderRadius: 6, fontWeight: 700, margin: "0 0 4px 0" }}>
                          {priority.label}
                        </Tag>
                        <Title level={4} style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
                          {req.title}
                        </Title>
                      </div>
                      <Tag color={meta.color} style={{ fontWeight: 700, borderRadius: 6, padding: "2px 8px", margin: 0 }}>
                        {meta.label}
                      </Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                      📍 Phòng {req.roomNumber} - {req.roomName} • Ngày gửi: {formatDate(req.createdAt)}
                    </Text>

                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 8, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                      <Text style={{ fontSize: 13, color: "#334155" }}>{req.description}</Text>
                      {req.adminNote && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #cbd5e1" }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>💬 Phản hồi chủ trọ:</Text>
                          <Text strong style={{ fontSize: 12, color: "#0f766e", display: "block" }}>{req.adminNote}</Text>
                        </div>
                      )}
                    </div>

                    <Button
                      size="small"
                      onClick={() => setDetailRepairRequest(req)}
                      style={{ width: "100%", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                    >
                      Xem chi tiết xử lý
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#fff1f2", border: "1px dashed #fecdd3" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text strong style={{ fontSize: 15, color: "#9f1239", display: "block", marginBottom: 4 }}>
                      🔧 Chưa có yêu cầu sửa chữa
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Mọi thứ đang hoạt động bình thường ✓
                    </Text>
                  </div>
                }
              />
            </Card>
          )}
        </div>

        {/* ====== 9. 🔑 YÊU CẦU ĐẶT CỌC (Item 15) ====== */}
        <div id="room-requests-section" className="dashboard-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#7c3aed" }} /> Yêu cầu đặt cọc & giữ phòng ({roomRequests.length})
            </h3>
            <Button type="link" onClick={() => navigate("/user/room-requests")} style={{ color: "#7c3aed", fontWeight: 600, padding: 0 }}>
              Xem tất cả yêu cầu →
            </Button>
          </div>

          {roomRequests.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {roomRequests.map((req) => {
                const meta = requestStatusMeta[req.status] || { color: "default", label: req.status };
                const isHold = req.requestType === "hold_deposit";
                return (
                  <Card
                    key={req.id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: "1px solid #f3e8ff",
                      boxShadow: "0 3px 10px rgba(124, 58, 237, 0.03)",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <Tag color={isHold ? "purple" : "cyan"} style={{ borderRadius: 6, fontWeight: 700, margin: "0 0 4px 0" }}>
                          {isHold ? "Giữ phòng" : "Thuê phòng"}
                        </Tag>
                        <Title level={4} style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
                          Phòng {req.roomNumber} - {req.roomName}
                        </Title>
                      </div>
                      <Tag color={meta.color} style={{ fontWeight: 700, borderRadius: 6, padding: "2px 8px", margin: 0 }}>
                        {meta.label}
                      </Tag>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 8, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Số tiền cọc:</Text>
                        <Text strong style={{ fontSize: 15, color: "#7c3aed" }}>{formatCurrency(req.depositAmount)}</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái thanh toán:</Text>
                        <Tag color={req.paymentStatus === "paid" ? "success" : "warning"} style={{ margin: 0, borderRadius: 4 }}>
                          {req.paymentStatus === "paid" ? "Đã cọc" : "Chưa cọc"}
                        </Tag>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Ngày tạo yêu cầu:</Text>
                        <Text style={{ fontSize: 13 }}>{formatDate(req.createdAt)}</Text>
                      </div>
                    </div>

                    {req.paymentStatus !== "paid" && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<QrcodeOutlined />}
                        onClick={() => setPaymentRequest(req)}
                        style={{ width: "100%", background: "#7c3aed", borderColor: "#7c3aed", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Mở QR Thanh toán
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#f3e8ff", border: "1px dashed #d8b4fe" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">Chưa có yêu cầu đặt cọc giữ phòng nào</Text>}
              />
            </Card>
          )}
        </div>

        {/* ====== 10. ❤️ PHÒNG ĐÃ LƯU (Item 15, 16) ====== */}
        <div id="interested-rooms-section" className="dashboard-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#e11d48" }} /> Phòng trọ đã lưu / yêu thích ({interestedRooms.length})
            </h3>
            <Button type="link" onClick={() => navigate("/user/interested-rooms")} style={{ color: "#e11d48", fontWeight: 600, padding: 0 }}>
              Xem tất cả phòng lưu →
            </Button>
          </div>

          {interestedRooms.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {interestedRooms.map((item) => {
                const coverImg = item.roomImages?.[0] || item.images?.[0] ? toImageUrl(item.roomImages?.[0] || item.images?.[0]) : fallbackRoomImage;
                const isAvailable = item.roomStatus === "available" || item.status === "available";
                return (
                  <Card
                    key={item.id || item._id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #ffe4e6",
                      boxShadow: "0 3px 10px rgba(225, 29, 72, 0.03)",
                    }}
                    styles={{ body: { padding: 14 } }}
                    cover={
                      <div style={{ position: "relative", height: 145, background: "#fff1f2" }}>
                        <img
                          alt={`Phòng ${item.roomNumber}`}
                          src={coverImg}
                          onError={(e) => { e.target.onerror = null; e.target.src = fallbackRoomImage; }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Tag
                          color={isAvailable ? "success" : "default"}
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: "1px 7px",
                            margin: 0,
                            fontSize: 11,
                          }}
                        >
                          {isAvailable ? "🟢 Đang trống" : "⚪ Đã thuê"}
                        </Tag>
                      </div>
                    }
                  >
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                        Phòng {item.roomNumber} - {item.name || item.roomName || "Phòng trọ đã lưu"}
                      </Text>
                    </div>

                    <Title level={4} style={{ margin: "0 0 8px 0", color: "#e11d48", fontSize: 18, fontWeight: 700 }}>
                      {formatCurrency(item.price || item.roomPrice)}<span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}> / tháng</span>
                    </Title>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#fff1f2", color: "#be123c", padding: "2px 6px", borderRadius: 4, border: "1px solid #fecdd3" }}>
                        📐 {item.area || item.roomArea || 0} m²
                      </span>
                      <span className="room-spec-chip" style={{ fontSize: 11, background: "#fff1f2", color: "#be123c", padding: "2px 6px", borderRadius: 4, border: "1px solid #fecdd3" }}>
                        👥 {item.capacity || item.roomCapacity || 1} người
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate(`/user/rooms/${item.room || item.id}`)}
                        style={{ flex: 1, background: "#e11d48", borderColor: "#e11d48", borderRadius: 6, fontWeight: 600, height: 30, fontSize: 12 }}
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveInterestedRoom(item)}
                        style={{ borderRadius: 6, height: 30, fontSize: 12 }}
                      >
                        Bỏ lưu
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#fff1f2", border: "1px dashed #fecdd3" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text strong style={{ fontSize: 15, color: "#be123c", display: "block", marginBottom: 4 }}>
                      ❤️ Chưa có phòng yêu thích
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Khám phá danh sách phòng trọ phù hợp ngay.
                    </Text>
                  </div>
                }
              >
                <Button type="primary" onClick={() => navigate("/")} style={{ background: "#e11d48", borderColor: "#e11d48", borderRadius: 8, fontWeight: 600, marginTop: 8 }}>
                  Khám phá phòng ngay
                </Button>
              </Empty>
            </Card>
          )}
        </div>

        {/* ====== 11. 📄 HỢP ĐỒNG (Item 15) ====== */}
        <div id="contracts-section" className="dashboard-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">
              <span className="section-title-dot" style={{ background: "#2563eb" }} /> Hợp đồng thuê phòng ({contracts.length})
            </h3>
            <Button type="link" onClick={() => navigate("/user/contracts")} style={{ color: "#2563eb", fontWeight: 600, padding: 0 }}>
              Quản lý hợp đồng →
            </Button>
          </div>

          {contracts.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {contracts.map((c) => {
                const meta = contractStatusMeta[c.status] || { color: "default", label: c.status };
                return (
                  <Card
                    key={c.id}
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: "1px solid #dbeafe",
                      boxShadow: "0 3px 10px rgba(37, 99, 235, 0.03)",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: "0 0 4px 0" }}>
                          {c.contractCode}
                        </Tag>
                        <Title level={4} style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
                          Phòng {c.roomNumber} - {c.roomName}
                        </Title>
                      </div>
                      <Tag color={meta.color} style={{ fontWeight: 700, borderRadius: 6, padding: "2px 8px", margin: 0 }}>
                        {meta.label}
                      </Tag>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 8, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Giá thuê phòng:</Text>
                        <Text strong style={{ fontSize: 15, color: "#2563eb" }}>{formatCurrency(c.monthlyRent)}/tháng</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Thời hạn hợp đồng:</Text>
                        <Text style={{ fontSize: 13 }}>{c.durationMonths} tháng</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Hiệu lực:</Text>
                        <Text style={{ fontSize: 13 }}>{formatDate(c.startDate)} - {formatDate(c.endDate)}</Text>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        size="small"
                        onClick={() => setDetailContract(c)}
                        style={{ flex: 1, borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Chi tiết HĐ
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleOpenContractFile(c)}
                        style={{ flex: 1, background: "#2563eb", borderColor: "#2563eb", borderRadius: 6, fontWeight: 600, height: 32, fontSize: 12 }}
                      >
                        Xem file PDF
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "28px 20px", background: "#eff6ff", border: "1px dashed #bfdbfe" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">Bạn chưa ký hợp đồng thuê phòng nào</Text>}
              />
            </Card>
          )}
        </div>

      </div>

      {/* ====== ALL MODALS ====== */}

      {/* Tenancy Detail Modal */}
      <Modal
        title="Chi Tiết Phòng Đang Thuê"
        open={Boolean(detailTenancy)}
        onCancel={() => setDetailTenancy(null)}
        footer={[<Button key="close" onClick={() => setDetailTenancy(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={800}
      >
        {detailTenancy && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {(detailTenancy.roomImages || []).length > 0 && (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailTenancy.roomImages.map((image) => (
                    <Image key={image} src={toImageUrl(image)} width={120} height={86} style={{ objectFit: "cover", borderRadius: 8 }} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            )}
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">Phòng {detailTenancy.roomNumber} - {detailTenancy.roomName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={tenantStatusMeta[detailTenancy.status]?.color}>{tenantStatusMeta[detailTenancy.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={roomRoleMeta[detailTenancy.roomRole]?.color}>{roomRoleMeta[detailTenancy.roomRole]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày vào">{formatDate(detailTenancy.moveInDate)}</Descriptions.Item>
              <Descriptions.Item label="Tầng">{detailTenancy.roomFloor ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Diện tích">{detailTenancy.roomArea || 0} m²</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{detailTenancy.roomCapacity || 0} người</Descriptions.Item>
              <Descriptions.Item label="Giá thuê">{formatCurrency(detailTenancy.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatCurrency(detailTenancy.roomDeposit)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailTenancy.roomServiceFee)}</Descriptions.Item>
              <Descriptions.Item label="Giá điện">{formatCurrency(detailTenancy.roomElectricityPrice)}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">{formatCurrency(detailTenancy.roomWaterPrice)}</Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>{detailTenancy.roomDescription || "-"}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>

      {/* Contract Detail Modal */}
      <Modal
        title="Chi Tiết Hợp Đồng"
        open={Boolean(detailContract)}
        onCancel={() => setDetailContract(null)}
        footer={[
          <Button key="file" type="primary" onClick={() => handleOpenContractFile(detailContract)} style={{ background: "#0f766e", borderRadius: 6 }}>Mở File Hợp Đồng</Button>,
          <Button key="close" onClick={() => setDetailContract(null)} style={{ borderRadius: 6 }}>Đóng</Button>,
        ]}
        width={780}
      >
        {detailContract && (
          <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
            <Descriptions.Item label="Mã HĐ">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={contractStatusMeta[detailContract.status]?.color}>{contractStatusMeta[detailContract.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng">Phòng {detailContract.roomNumber} - {detailContract.roomName}</Descriptions.Item>
            <Descriptions.Item label="Đại diện thuê">{detailContract.tenantName}</Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailContract.startDate)}</Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">{formatDate(detailContract.endDate)}</Descriptions.Item>
            <Descriptions.Item label="Thời hạn">{detailContract.durationMonths} tháng</Descriptions.Item>
            <Descriptions.Item label="Số thành viên">{detailContract.memberCount} người</Descriptions.Item>
            <Descriptions.Item label="Tiền thuê">{formatCurrency(detailContract.monthlyRent)}/tháng</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{formatCurrency(detailContract.deposit)}</Descriptions.Item>
            <Descriptions.Item label="Điều khoản" span={2}>{detailContract.terms || "Theo quy định nhà trọ."}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        title="Chi Tiết Hóa Đơn Hàng Tháng"
        open={Boolean(detailInvoice)}
        onCancel={() => setDetailInvoice(null)}
        footer={[<Button key="close" onClick={() => setDetailInvoice(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={820}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã hóa đơn">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={invoiceStatusMeta[detailInvoice.status]?.color}>{invoiceStatusMeta[detailInvoice.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {detailInvoice.roomNumber} - {detailInvoice.roomName}</Descriptions.Item>
              <Descriptions.Item label="Kỳ hóa đơn">Tháng {detailInvoice.month}/{detailInvoice.year}</Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày xuất HĐ">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="Chỉ số điện nước" bordered size="small" column={2}>
              <Descriptions.Item label="Điện cũ → mới">{detailInvoice.electricityOld ?? 0} → {detailInvoice.electricityNew ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Tiêu thụ">{detailInvoice.electricityUsage ?? 0} kWh</Descriptions.Item>
              <Descriptions.Item label="Tiền điện">{formatCurrency(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Nước cũ → mới">{detailInvoice.waterOld ?? 0} → {detailInvoice.waterNew ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Tiêu thụ">{detailInvoice.waterUsage ?? 0} m³</Descriptions.Item>
              <Descriptions.Item label="Tiền nước">{formatCurrency(detailInvoice.waterAmount)}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="Tổng kết chi phí" bordered size="small" column={2}>
              <Descriptions.Item label="Tiền phòng">{formatCurrency(detailInvoice.rentAmount)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailInvoice.serviceAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">
                <Text strong style={{ fontSize: 16, color: "#0f766e" }}>{formatCurrency(detailInvoice.totalAmount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại phải trả">
                <Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong style={{ fontSize: 16 }}>
                  {formatCurrency(detailInvoice.remainingAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>

      {/* Room Request Modal */}
      <Modal
        title={roomRequestType === "hold_deposit" ? "Đặt Cọc Giữ Phòng" : "Yêu Cầu Thuê Phòng"}
        open={roomRequestModalOpen}
        onCancel={closeRoomRequestModal}
        onOk={() => roomRequestForm.submit()}
        confirmLoading={roomRequestSubmitting}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        width={860}
        okButtonProps={{ style: { background: "#0f766e", borderColor: "#0f766e" } }}
      >
        {selectedRequestRoom && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">Phòng {selectedRequestRoom.roomNumber} - {selectedRequestRoom.name}</Descriptions.Item>
              <Descriptions.Item label="Giá thuê">{formatCurrency(selectedRequestRoom.price)}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cần thanh toán">
                <Text strong style={{ color: "#0f766e" }}>
                  {formatCurrency(roomRequestType === "hold_deposit" ? Math.ceil(Number(selectedRequestRoom.price || 0) / 3) : selectedRequestRoom.price)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {roomRequestType === "hold_deposit" ? "Giữ phòng trong 7 ngày sau khi thanh toán cọc." : "Tiền cọc bằng 1 tháng tiền phòng."}
              </Descriptions.Item>
            </Descriptions>
            <Form form={roomRequestForm} layout="vertical" onFinish={handleRoomRequestSubmit}>
              {roomRequestType === "rent" ? (
                <>
                  <div className="form-grid">
                    <Form.Item name="durationMonths" label="Thời hạn thuê (tháng)" rules={[{ required: true, message: "Nhập thời hạn thuê" }]}>
                      <InputNumber className="full-width-input" min={1} style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="occupantCount" label="Số người ở" rules={[{ required: true, message: "Nhập số người ở" }]}>
                      <InputNumber className="full-width-input" min={1} style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </div>
                  <Form.List name="occupants">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        {fields.map((field, index) => (
                          <Card key={field.key} size="small" title={`Người ở ${index + 1}`} extra={fields.length > 1 ? <Button type="link" danger onClick={() => remove(field.name)}>Xóa</Button> : null} style={{ borderRadius: 8 }}>
                            <div className="form-grid">
                              <Form.Item {...field} name={[field.name, "name"]} label="Họ tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "phone"]} label="Số điện thoại" rules={[{ required: true, message: "Nhập SĐT" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "identityNumber"]} label="Số CCCD" rules={[{ required: true, message: "Nhập CCCD" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "identityFrontImage"]} label="Ảnh CCCD mặt trước" rules={[{ required: true, message: "Nhập đường dẫn ảnh" }]}>
                                <Input placeholder="/uploads/identity/..." style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "identityBackImage"]} label="Ảnh CCCD mặt sau" rules={[{ required: true, message: "Nhập đường dẫn ảnh" }]}>
                                <Input placeholder="/uploads/identity/..." style={{ borderRadius: 6 }} />
                              </Form.Item>
                            </div>
                          </Card>
                        ))}
                        <Button onClick={() => add()} style={{ borderRadius: 6 }}>Thêm người ở</Button>
                      </Space>
                    )}
                  </Form.List>
                </>
              ) : null}
              <Form.Item name="message" label="Lời nhắn cho chủ trọ">
                <Input.TextArea rows={3} placeholder="VD: Em muốn hẹn xem phòng vào cuối tuần này" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      {/* Repair Request Modal */}
      <Modal
        title={editingRepairRequest ? "Sửa Báo Cáo Sự Cố" : "Báo Cáo Sự Cố Thiết Bị"}
        open={repairModalOpen}
        onCancel={closeRepairModal}
        onOk={() => repairForm.submit()}
        confirmLoading={repairSubmitting}
        okText={editingRepairRequest ? "Cập nhật" : "Gửi báo cáo"}
        cancelText="Hủy"
        width={720}
        okButtonProps={{ style: { background: "#0f766e", borderColor: "#0f766e" } }}
      >
        <Form form={repairForm} layout="vertical" onFinish={handleCreateRepairRequest}>
          <div className="form-grid">
            <Form.Item name="room" label="Chọn phòng trọ" rules={[{ required: true, message: "Chọn phòng trọ đang ở" }]}>
              <Select options={activeRoomOptions} placeholder="Chọn phòng" />
            </Form.Item>
            <Form.Item name="priority" label="Mức độ khẩn cấp" rules={[{ required: true }]}>
              <Select options={repairPriorityOptions} />
            </Form.Item>
            <Form.Item name="requestedResolveDate" label="Ngày mong muốn hỗ trợ">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Tiêu đề sự cố" rules={[{ required: true, message: "Nhập tiêu đề sự cố" }]}>
            <Input placeholder="VD: Máy giặt tầng 2 không vắt, vòi nước rò rỉ" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true, message: "Mô tả sự cố" }]}>
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết để kỹ thuật viên chuẩn bị..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="Hình ảnh hiện trạng sự cố">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleRepairImageUpload}
              fileList={repairImageFileList}
              listType="picture-card"
              multiple
              onChange={({ fileList }) => setRepairImageFileList(fileList)}
            >
              {repairImageFileList.length >= 10 ? null : (
                <button type="button" className="upload-card-button">
                  <UploadOutlined />
                  <span>Tải ảnh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Repair Detail Modal */}
      <Modal
        title="Chi Tiết Báo Cáo Sự Cố"
        open={Boolean(detailRepairRequest)}
        onCancel={() => setDetailRepairRequest(null)}
        footer={[<Button key="close" onClick={() => setDetailRepairRequest(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={760}
      >
        {detailRepairRequest && (
          <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
            <Descriptions.Item label="Tiêu đề" span={2}><Text strong>{detailRepairRequest.title}</Text></Descriptions.Item>
            <Descriptions.Item label="Phòng">Phòng {detailRepairRequest.roomNumber}</Descriptions.Item>
            <Descriptions.Item label="Mức độ">
              <Tag color={repairPriorityMeta[detailRepairRequest.priority]?.color}>{repairPriorityMeta[detailRepairRequest.priority]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={repairStatusMeta[detailRepairRequest.status]?.color}>{repairStatusMeta[detailRepairRequest.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày gửi">{formatDate(detailRepairRequest.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Mô tả sự cố" span={2}>{detailRepairRequest.description}</Descriptions.Item>
            <Descriptions.Item label="Phản hồi từ chủ trọ" span={2}>{detailRepairRequest.adminNote || "Chưa có phản hồi mới."}</Descriptions.Item>
            <Descriptions.Item label="Ảnh sự cố" span={2}>
              {(detailRepairRequest.images || []).length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailRepairRequest.images.map((image) => (
                      <Image key={image} src={toImageUrl(image)} width={120} height={86} style={{ objectFit: "cover", borderRadius: 8 }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Payment QR Code Modal */}
      <Modal
        title="Mã QR Chuyển Khoản Thanh Toán"
        open={Boolean(paymentRequest)}
        onCancel={() => setPaymentRequest(null)}
        footer={[<Button key="close" type="primary" onClick={() => setPaymentRequest(null)} style={{ background: "#0f766e", borderRadius: 8 }}>Đóng</Button>]}
        width={720}
      >
        {paymentRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã yêu cầu">{paymentRequest.requestCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {paymentRequest.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cọc">
                <Text strong style={{ color: "#0f766e", fontSize: 16 }}>{formatCurrency(paymentRequest.amount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{paymentRequest.paymentBankName || "MB Bank"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản"><Text copyable strong>{paymentRequest.paymentBankAccountNumber || "-"}</Text></Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{paymentRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung CK" span={2}>
                <Text copyable strong style={{ color: "#e11d48", fontSize: 15 }}>
                  {paymentRequest.paymentContent || paymentRequest.paymentOrderCode || paymentRequest.requestCode}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            {paymentRequest.paymentQrCode ? (
              <div style={{ textAlign: "center", padding: 20, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <Image src={paymentRequest.paymentQrCode} width={260} style={{ borderRadius: 8 }} />
                <Paragraph type="secondary" style={{ marginTop: 10, fontSize: 13 }}>
                  Mở app Ngân hàng quét mã QR để chuyển khoản chính xác nội dung & số tiền.
                </Paragraph>
              </div>
            ) : (
              <Text type="danger">Chưa cấu hình thông tin ngân hàng để tạo QR thanh toán.</Text>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default UserHomePage;
