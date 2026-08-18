import {
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
  const [form] = Form.useForm();
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
    form.setFieldsValue(user);
    setIdentityBackFileList(toIdentityFileList(user?.identityBackImage));
    setIdentityFrontFileList(toIdentityFileList(user?.identityFrontImage));
  }, [form, user]);

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
      setPaymentRequest(data);
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
      <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
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

      {/* ====== STAT WIDGETS ====== */}
      <div className="stat-widget-grid">
        <div className="stat-widget teal-border" onClick={() => navigate("/user/my-rooms")} style={{ cursor: "pointer" }}>
          <div className="stat-widget-icon teal"><HomeOutlined /></div>
          <div className="stat-widget-info">
            <span className="stat-widget-value">{activeTenancies.length}</span>
            <span className="stat-widget-label">Phòng đang ở</span>
          </div>
        </div>
        <div className="stat-widget blue-border" onClick={() => navigate("/user/contracts")} style={{ cursor: "pointer" }}>
          <div className="stat-widget-icon blue"><FileProtectOutlined /></div>
          <div className="stat-widget-info">
            <span className="stat-widget-value">{contracts.filter((c) => c.status === "active").length}</span>
            <span className="stat-widget-label">Hợp đồng hiệu lực</span>
          </div>
        </div>
        <div className="stat-widget amber-border" onClick={() => navigate("/user/invoices")} style={{ cursor: "pointer" }}>
          <div className="stat-widget-icon amber"><FileTextOutlined /></div>
          <div className="stat-widget-info">
            <span className="stat-widget-value" style={{ color: unpaidInvoicesCount > 0 ? "#b45309" : undefined }}>{unpaidInvoicesCount}</span>
            <span className="stat-widget-label">Hóa đơn cần TT</span>
          </div>
        </div>
        <div className="stat-widget rose-border" onClick={() => navigate("/user/repair-requests")} style={{ cursor: "pointer" }}>
          <div className="stat-widget-icon rose"><ToolOutlined /></div>
          <div className="stat-widget-info">
            <span className="stat-widget-value">{pendingRepairCount}</span>
            <span className="stat-widget-label">Sự cố chờ xử lý</span>
          </div>
        </div>
      </div>

      {/* ====== QUICK ACTIONS ====== */}
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-dot" /> Thao tác nhanh</h3>
      </div>
      <div className="quick-action-grid">
        <div className="quick-action-card" onClick={() => navigate("/")}>
          <div className="quick-action-icon" style={{ background: "#ecfdf5", color: "#0f766e" }}><HomeOutlined /></div>
          <div className="quick-action-text">
            <span className="quick-action-label">Tìm phòng trống</span>
            <span className="quick-action-desc">Duyệt danh sách phòng khả dụng & đặt cọc</span>
          </div>
        </div>
        <div className="quick-action-card" onClick={activeRoomOptions.length > 0 ? openRepairModal : undefined} style={activeRoomOptions.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
          <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#b45309" }}><ToolOutlined /></div>
          <div className="quick-action-text">
            <span className="quick-action-label">Báo sự cố mới</span>
            <span className="quick-action-desc">Gửi yêu cầu sửa chữa cho chủ trọ</span>
          </div>
        </div>
        <div className="quick-action-card" onClick={() => navigate("/user/invoices")}>
          <div className="quick-action-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}><FileTextOutlined /></div>
          <div className="quick-action-text">
            <span className="quick-action-label">Xem hóa đơn</span>
            <span className="quick-action-desc">Tra cứu hóa đơn điện nước hàng tháng</span>
          </div>
        </div>
        <div className="quick-action-card" onClick={() => navigate("/user/profile")}>
          <div className="quick-action-icon" style={{ background: "#ffe4e6", color: "#be123c" }}><UserOutlined /></div>
          <div className="quick-action-text">
            <span className="quick-action-label">Cập nhật hồ sơ</span>
            <span className="quick-action-desc">Thông tin cá nhân & ảnh CCCD</span>
          </div>
        </div>
      </div>

      {/* ====== AVAILABLE ROOMS SECTION ====== */}
      {availableRooms.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-header">
            <h3 className="section-title"><span className="section-title-dot" style={{ background: "#0d9488" }} /> Phòng trống khả dụng</h3>
            <Button type="link" onClick={() => navigate("/")} style={{ color: "#0f766e", fontWeight: 600, padding: 0 }}>
              Xem tất cả →
            </Button>
          </div>
          <div className="rooms-horizontal-scroll">
            {availableRooms.map((room) => (
              <div key={room.id} className="rooms-h-card">
                <img
                  className="rooms-h-card-img"
                  alt={`${room.roomNumber} - ${room.name}`}
                  src={room.images?.[0] ? toImageUrl(room.images[0]) : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"}
                />
                <div className="rooms-h-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 15 }}>Phòng {room.roomNumber}</Text>
                    <Tag color="success" style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>Trống</Tag>
                  </div>
                  <Title level={4} style={{ margin: "0 0 6px 0", color: "#0f766e", fontSize: 18 }}>
                    {formatCurrency(room.price)}<span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>/tháng</span>
                  </Title>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    <span className="room-spec-chip" style={{ fontSize: 12 }}>📐 {room.area || 0}m²</span>
                    <span className="room-spec-chip" style={{ fontSize: 12 }}>👥 {room.capacity || 1}</span>
                    <span className="room-spec-chip" style={{ fontSize: 12 }}>🏢 T{room.floor ?? "-"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button size="small" type="primary" onClick={() => navigate(`/user/rooms/${room.id}`)} style={{ flex: 1, background: "#0f766e", borderColor: "#0f766e", borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                      Chi tiết
                    </Button>
                    <Button size="small" icon={<HeartOutlined />} onClick={() => handleInterestedRoom(room)} style={{ borderRadius: 6, color: "#e11d48", borderColor: "#fecdd3", fontSize: 12 }} />
                    <Button size="small" onClick={() => openRoomRequestModal("hold_deposit", room)} style={{ flex: 1, borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                      Đặt cọc
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
