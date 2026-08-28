import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UploadOutlined,
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
  pending_user_signature: { color: "warning", label: "Chờ khách ký" },
  revision_requested: { color: "orange", label: "Khách yêu cầu sửa" },
  signed_pending_payment: { color: "gold", label: "Chờ thanh toán đầu kỳ" },
  active: { color: "success", label: "Đang hiệu lực" },
  renewal_requested: { color: "blue", label: "Yêu cầu gia hạn" },
  checkout_requested: { color: "orange", label: "Yêu cầu trả phòng" },
  expired_pending: { color: "red", label: "Quá hạn chờ xử lý" },
  renewed: { color: "cyan", label: "Đã gia hạn" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const defaultFormValues = {
  durationMonths: 12,
  status: "pending_user_signature",
};

const panelStyle = {
  border: "1px solid #eef1f7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const heroStyle = {
  ...panelStyle,
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #5b21b6 0%, #7c2dff 46%, #2563eb 100%)",
  backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto",
};

const statIconStyle = { alignItems: "center", borderRadius: 8, display: "flex", height: 42, justifyContent: "center", width: 42 };
const toolbarInputStyle = { borderRadius: 8, height: 40 };
const mutedTextStyle = { color: "#64748b" };
const sectionTitleStyle = { color: "#0f172a", fontSize: 16 };

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
    const expired = contracts.filter((item) => item.status === "expired").length;
    return { active, expired, total: contracts.length };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return contracts.filter((item) => {
      const matchesSearch = !keyword || [item.contractCode, item.roomNumber, item.roomName, item.tenantName]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
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
      message.error(error.response?.data?.message || "Khong tai duoc hop dong sap het han");
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
        note: "Admin nhac khach xu ly hop dong sap het han.",
      });
      message.success("Da gui nhac nho");
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Gui nhac nho that bai");
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
      message.warning(error.response?.data?.message || "Khong tai duoc thong tin tra phong moi nhat");
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
      message.error(error.response?.data?.message || "Upload bien lai hoan coc that bai");
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
      message.warning(error.response?.data?.message || "Khong tai duoc chi so cu");
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
      message.success("Da tao hoa don chot tra phong");
      closeFinalInvoiceModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Tao hoa don chot tra phong that bai");
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
      message.success("Da hoan tat checkout");
      closeCompleteCheckoutModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Hoan tat checkout that bai");
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
        message.success("Da xu ly gia han");
      } else {
        await http.post(`/contracts/${lifecycleContract.id}/checkout`, {
          checkoutDate: lifecycleForm.checkoutDate,
          note: lifecycleForm.note,
          refundBankAccountName: lifecycleForm.refundBankAccountName,
          refundBankAccountNumber: lifecycleForm.refundBankAccountNumber,
          refundBankName: lifecycleForm.refundBankName,
        });
        message.success("Da tao thu tuc tra phong");
      }

      closeLifecycleModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Xu ly that bai");
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const expiryBucketMeta = {
    expiring: { color: "gold", label: "Sap het han" },
    no_response: { color: "orange", label: "Chua phan hoi" },
    urgent: { color: "red", label: "Can xu ly gap" },
    overdue: { color: "red", label: "Qua han" },
  };

  const expiringColumns = [
    {
      title: "Hop dong",
      key: "contract",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.contractCode}</Typography.Text>
          <Typography.Text type="secondary">
            Phong {record.roomNumber || "-"} - {record.tenantName || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Het han",
      key: "endDate",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{formatDate(record.endDate)}</Typography.Text>
          <Typography.Text type={Number(record.daysUntilEnd || 0) <= 7 ? "danger" : "secondary"}>
            {record.daysUntilEnd < 0 ? `Qua han ${Math.abs(record.daysUntilEnd)} ngay` : `Con ${record.daysUntilEnd} ngay`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Phan loai",
      dataIndex: "expiryBucket",
      key: "expiryBucket",
      render: (value) => {
        const meta = expiryBucketMeta[value] || expiryBucketMeta.expiring;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Phan hoi",
      key: "request",
      render: (_, record) =>
        record.pendingLifecycleRequest ? (
          <Tag color={record.pendingLifecycleRequest.type === "renewal" ? "blue" : "orange"}>
            {record.pendingLifecycleRequest.type === "renewal" ? "Yeu cau gia han" : "Yeu cau tra phong"}
          </Tag>
        ) : (
          <Tag>Chua co</Tag>
        ),
    },
    {
      title: "Thao tac",
      key: "actions",
      width: 320,
      render: (_, record) => (
        <Space wrap size={6}>
          <Button size="small" onClick={() => handleViewDetail(record)} style={{ borderRadius: 6 }}>
            Xem
          </Button>
          <Button size="small" onClick={() => handleSendReminder(record)} style={{ borderRadius: 6 }}>
            Nhac
          </Button>
          <Button size="small" type="primary" onClick={() => openLifecycleModal(record, "renew")} style={{ borderRadius: 6 }}>
            Gia han
          </Button>
          <Button size="small" danger onClick={() => openLifecycleModal(record, "checkout")} style={{ borderRadius: 6 }}>
            Tra phong
          </Button>
          {["checkout_requested", "expired_pending"].includes(record.status) ? (
            <>
              <Button size="small" onClick={() => openFinalInvoiceModal(record)} style={{ borderRadius: 6 }}>
                Hoa don cuoi
              </Button>
              <Button size="small" onClick={() => openCompleteCheckoutModal(record)} style={{ borderRadius: 6 }}>
                Hoan tat
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
        render: (value) => <Typography.Text strong style={{ color: "#334155" }}>{value}</Typography.Text>,
      },
      {
        title: "PHÒNG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 190,
        render: (value, record) => <Typography.Text style={{ color: "#475569" }}>{value || "-"} - {record.roomName || "-"}</Typography.Text>,
      },
      {
        title: "NGƯỜI ĐẠI DIỆN",
        dataIndex: "tenantName",
        key: "tenantName",
        width: 205,
        render: (value) => <Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text>,
      },
      {
        title: "THÀNH VIÊN",
        dataIndex: "memberCount",
        key: "memberCount",
        width: 110,
      },
      {
        title: "GIÁ THUÊ",
        dataIndex: "monthlyRent",
        key: "monthlyRent",
        render: formatCurrency,
      },
      {
        title: "TIỀN CỌC",
        dataIndex: "deposit",
        key: "deposit",
        render: formatCurrency,
      },
      {
        title: "NGÀY TẠO",
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: "NGÀY VÀO",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "THỜI HẠN",
        dataIndex: "durationMonths",
        key: "durationMonths",
        render: (value) => `${value} tháng`,
      },
      {
        title: "HẾT HẠN",
        dataIndex: "endDate",
        key: "endDate",
        render: formatDate,
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || { label: status };
          return <Tag bordered={false} icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />} style={{ background: status === "active" ? "#dcfce7" : status === "terminated" ? "#fee2e2" : "#f1f5f9", borderRadius: 5, color: status === "active" ? "#15803d" : status === "terminated" ? "#dc2626" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 175,
        render: (_, record) => (
          <Space size={7}>
            <Tooltip title="Xem chi tiết"><Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Tooltip title="Xem file hợp đồng"><Button size="small" icon={<FileTextOutlined />} onClick={() => handleViewFile(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Tooltip title="Sửa hợp đồng"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Popconfirm
              title="Xóa hợp đồng này?"
              description="Không thể xóa hợp đồng đang hiệu lực."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
              disabled={record.status === "active"}
            >
              <Tooltip title="Xóa hợp đồng"><Button danger size="small" icon={<DeleteOutlined />} disabled={record.status === "active"} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>TRỌ PLUS ADMIN</Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>Quản lý hợp đồng</Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Tạo, cập nhật, theo dõi thời hạn và xem chi tiết hợp đồng thuê phòng.</Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.total} hợp đồng</Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.active} đang hiệu lực</Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.expired} hết hạn</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tải lại</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 8, boxShadow: "none", fontWeight: 800, height: 40 }}>Thêm hợp đồng</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bộ lọc hợp đồng</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tìm nhanh theo mã, phòng, người đại diện</Typography.Text></div></Space></Col>
          <Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm mã hợp đồng, phòng, người đại diện" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Đặt lại</Button></Col></Row></Col>
        </Row>
      </Card>

      <Card
        title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><FileProtectOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sách hợp đồng</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Theo dõi các hợp đồng thuê phòng trong hệ thống</Typography.Text></div></Space>}
        extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hiển thị {filteredContracts.length}/{contracts.length}</Tag>}
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredContracts}
          loading={loading}
          size="middle"
          rowClassName={() => "contract-management-row"}
          locale={{ emptyText: <Empty description="Không có hợp đồng phù hợp" /> }}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} hợp đồng` }}
        />
      </Card>

      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: "#f97316" }} />
            <Typography.Text strong style={sectionTitleStyle}>Hop dong sap het han</Typography.Text>
          </Space>
        }
        extra={<Tag color="orange">{expiringContracts.length} can theo doi</Tag>}
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="id"
          columns={expiringColumns}
          dataSource={expiringContracts}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="Khong co hop dong sap het han" /> }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={lifecycleMode === "renew" ? "Xu ly gia han hop dong" : "Tao thu tuc tra phong"}
        open={Boolean(lifecycleContract)}
        onCancel={closeLifecycleModal}
        onOk={submitLifecycleAction}
        confirmLoading={lifecycleSubmitting}
        okText="Xac nhan"
        cancelText="Dong"
        width={640}
      >
        {lifecycleContract ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Hop dong">{lifecycleContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phong">
                {lifecycleContract.roomNumber || "-"} - {lifecycleContract.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Nguoi thue">{lifecycleContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Het han">{formatDate(lifecycleContract.endDate)}</Descriptions.Item>
            </Descriptions>

            {lifecycleMode === "renew" ? (
              <div className="form-grid">
                <Form.Item label="Thoi han moi (thang)">
                  <InputNumber
                    min={1}
                    value={lifecycleForm.durationMonths}
                    onChange={(value) => setLifecycleForm((current) => ({ ...current, durationMonths: value || 1 }))}
                    className="full-width-input"
                  />
                </Form.Item>
                <Form.Item label="Gia thue moi">
                  <InputNumber
                    min={0}
                    value={lifecycleForm.monthlyRent}
                    onChange={(value) => setLifecycleForm((current) => ({ ...current, monthlyRent: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </div>
            ) : (
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Form.Item label="Ngay tra phong">
                  <Input
                    type="date"
                    value={lifecycleForm.checkoutDate}
                    onChange={(event) => setLifecycleForm((current) => ({ ...current, checkoutDate: event.target.value }))}
                  />
                </Form.Item>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Tai khoan nhan hoan coc">
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Input
                        placeholder="Ten ngan hang"
                        value={lifecycleForm.refundBankName}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankName: event.target.value }))}
                      />
                      <Input
                        placeholder="So tai khoan"
                        value={lifecycleForm.refundBankAccountNumber}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankAccountNumber: event.target.value }))}
                      />
                      <Input
                        placeholder="Chu tai khoan"
                        value={lifecycleForm.refundBankAccountName}
                        onChange={(event) => setLifecycleForm((current) => ({ ...current, refundBankAccountName: event.target.value }))}
                      />
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            )}

            <Form.Item label="Ghi chu">
              <Input.TextArea
                rows={3}
                value={lifecycleForm.note}
                onChange={(event) => setLifecycleForm((current) => ({ ...current, note: event.target.value }))}
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="Chot dien nuoc va tao hoa don cuoi"
        open={Boolean(finalInvoiceContract)}
        onCancel={closeFinalInvoiceModal}
        onOk={handleCreateFinalInvoice}
        confirmLoading={finalInvoiceLoading}
        okText="Tao hoa don cuoi"
        cancelText="Dong"
        width={760}
      >
        {finalInvoiceContract ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Alert
              showIcon
              type="info"
              message="Hoa don cuoi dung de chot dien nuoc, phi hu hong/phat sinh truoc khi hoan tat tra phong."
              style={{ borderRadius: 8 }}
            />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Hop dong">{finalInvoiceContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phong">{finalInvoiceContract.roomNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nguoi thue">{finalInvoiceContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">{statusMeta[finalInvoiceContract.status]?.label || finalInvoiceContract.status}</Descriptions.Item>
            </Descriptions>

            <Row gutter={12}>
              <Col xs={24} md={6}>
                <Form.Item label="Thang">
                  <InputNumber
                    min={1}
                    max={12}
                    value={finalInvoiceForm.month}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, month: value || 1 }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Nam">
                  <InputNumber
                    min={2000}
                    value={finalInvoiceForm.year}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, year: value || new Date().getFullYear() }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Han thanh toan">
                  <Input
                    type="date"
                    value={finalInvoiceForm.dueDate}
                    onChange={(event) => setFinalInvoiceForm((current) => ({ ...current, dueDate: event.target.value }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chi so dien cu">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.electricityOld}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, electricityOld: value || 0 }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chi so dien moi">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.electricityNew}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, electricityNew: value || 0 }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chi so nuoc cu">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.waterOld}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, waterOld: value || 0 }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chi so nuoc moi">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.waterNew}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, waterNew: value || 0 }))}
                    className="full-width-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Tien phong phat sinh">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.rentAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, rentAmount: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Phi dich vu phat sinh">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.serviceAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, serviceAmount: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Phi khac/hu hong">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.otherAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, otherAmount: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Giam tru">
                  <InputNumber
                    min={0}
                    value={finalInvoiceForm.discountAmount}
                    onChange={(value) => setFinalInvoiceForm((current) => ({ ...current, discountAmount: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Ghi chu hoa don cuoi">
              <Input.TextArea
                rows={3}
                value={finalInvoiceForm.note}
                onChange={(event) => setFinalInvoiceForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="VD: chot dien nuoc ngay ban giao, phi ve sinh, hu hong..."
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="Hoan tat tra phong va doi soat coc"
        open={Boolean(completeCheckoutContract)}
        onCancel={closeCompleteCheckoutModal}
        onOk={handleCompleteCheckout}
        confirmLoading={completeCheckoutLoading}
        okText="Hoan tat tra phong"
        cancelText="Dong"
        width={720}
      >
        {completeCheckoutContract ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Alert
              showIcon
              type="warning"
              message="Chi hoan tat tra phong sau khi da chot hoa don cuoi, khach khong con cong no va admin da doi soat tien coc."
              style={{ borderRadius: 8 }}
            />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Hop dong">{completeCheckoutContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Phong">{completeCheckoutContract.roomNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nguoi thue">{completeCheckoutContract.tenantName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tien coc hop dong">{formatCurrency(completeCheckoutContract.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Ngan hang">{completeCheckoutForm.refundBankName || "-"}</Descriptions.Item>
              <Descriptions.Item label="So tai khoan">{completeCheckoutForm.refundBankAccountNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Chu tai khoan" span={2}>
                {completeCheckoutForm.refundBankAccountName || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label="Trang thai hoan coc">
                  <Select
                    value={completeCheckoutForm.refundStatus}
                    onChange={(value) => setCompleteCheckoutForm((current) => ({ ...current, refundStatus: value }))}
                    options={[
                      { label: "Khong can hoan", value: "not_required" },
                      { label: "Cho hoan coc", value: "pending" },
                      { label: "Da hoan coc", value: "refunded" },
                      { label: "Da khau tru het coc", value: "deducted" },
                      { label: "Khach con phai tra them", value: "extra_charge_required" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="So tien hoan coc">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundAmount}
                    onChange={(value) => setCompleteCheckoutForm((current) => ({ ...current, refundAmount: value || 0 }))}
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="So tien khau tru">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundDeductionAmount}
                    onChange={(value) =>
                      setCompleteCheckoutForm((current) => ({ ...current, refundDeductionAmount: value || 0 }))
                    }
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Tien khach con phai tra them">
                  <InputNumber
                    min={0}
                    value={completeCheckoutForm.refundExtraChargeAmount}
                    onChange={(value) =>
                      setCompleteCheckoutForm((current) => ({ ...current, refundExtraChargeAmount: value || 0 }))
                    }
                    className="full-width-input"
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Cap nhat tai khoan nhan hoan coc neu can">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Input
                  placeholder="Ten ngan hang"
                  value={completeCheckoutForm.refundBankName}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankName: event.target.value }))
                  }
                />
                <Input
                  placeholder="So tai khoan"
                  value={completeCheckoutForm.refundBankAccountNumber}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankAccountNumber: event.target.value }))
                  }
                />
                <Input
                  placeholder="Chu tai khoan"
                  value={completeCheckoutForm.refundBankAccountName}
                  onChange={(event) =>
                    setCompleteCheckoutForm((current) => ({ ...current, refundBankAccountName: event.target.value }))
                  }
                />
              </Space>
            </Form.Item>

            <Form.Item label="Bien lai chuyen khoan hoan coc">
              <Upload
                accept="image/png,image/jpeg,image/webp"
                customRequest={handleRefundProofUpload}
                fileList={refundProofFileList}
                listType="picture-card"
                multiple
                onChange={({ fileList }) => setRefundProofFileList(fileList)}
              >
                {refundProofFileList.length >= 5 ? null : (
                  <button type="button" style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Tai bien lai</div>
                  </button>
                )}
              </Upload>
            </Form.Item>

            <Form.Item label="Ghi chu doi soat">
              <Input.TextArea
                rows={3}
                value={completeCheckoutForm.note}
                onChange={(event) => setCompleteCheckoutForm((current) => ({ ...current, note: event.target.value }))}
              />
            </Form.Item>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} />
            <div><Typography.Text strong>{editingContract ? "Sửa hợp đồng" : "Thêm hợp đồng"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingContract ? editingContract.contractCode : "Tạo hợp đồng mới cho phòng"}</Typography.Text></div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingContract ? "Lưu" : "Tạo hợp đồng"}
        cancelText="Hủy"
        width={820}
      >
        <Alert showIcon type="info" message={editingContract ? "Cập nhật thông tin hợp đồng" : "Chọn người đại diện để tự động điền thông tin phòng"} style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin người thuê</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Form.Item name="representativePicker" label="Phòng - Người đại diện">
            <Select
              options={representativeOptions}
              placeholder="Chọn người đại diện phòng"
              showSearch
              optionFilterProp="label"
              onChange={handleRepresentativeChange}
            />
          </Form.Item>
          <Form.Item name="tenant" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="room" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Space><CalendarOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thông tin hợp đồng</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="contractCode" label="Mã hợp đồng" rules={[{ required: true }]}>
              <Input placeholder="VD: HDT-2026-001" />
            </Form.Item>
            <Form.Item name="memberCount" label="Tổng thành viên">
              <InputNumber min={1} className="full-width-input" disabled />
            </Form.Item>
            <Form.Item name="monthlyRent" label="Giá thuê" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="deposit" label="Tiền cọc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="moveInDate" label="Ngày vào ở" rules={[{ required: true }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" onChange={updateEndDate} />
            </Form.Item>
            <Form.Item name="durationMonths" label="Thời hạn hợp đồng" rules={[{ required: true }]}>
              <InputNumber min={1} className="full-width-input" addonAfter="tháng" onChange={updateEndDate} />
            </Form.Item>
            <Form.Item name="endDate" label="Hết hạn hợp đồng" rules={[{ required: true }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          <Form.Item name="terms" label="Điều khoản / ghi chú">
            <Input.TextArea rows={4} />
          </Form.Item>
          {editingContract?.status === "revision_requested" ? (
            <Form.Item name="revisionResponse" label="Phản hồi yêu cầu chỉnh sửa">
              <Input.TextArea rows={3} placeholder="VD: Đã cập nhật điều khoản theo nội dung khách yêu cầu" />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} /><div><Typography.Text strong>Chi tiết hợp đồng</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailContract?.contractCode || "Thông tin hợp đồng thuê phòng"}</Typography.Text></div></Space>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {detailContract && (
          <>
          <Alert showIcon type={detailContract.status === "active" ? "success" : "info"} message={`Trạng thái: ${statusMeta[detailContract.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} />
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thông tin người thuê và phòng</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã hợp đồng">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag bordered={false} color={statusMeta[detailContract.status]?.color}>
                {statusMeta[detailContract.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng">
              {detailContract.roomNumber} - {detailContract.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Tầng">{detailContract.roomFloor}</Descriptions.Item>
            <Descriptions.Item label="Người đại diện">{detailContract.tenantName}</Descriptions.Item>
            <Descriptions.Item label="Liên hệ">
              {detailContract.tenantPhone || detailContract.tenantEmail || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng thành viên">{detailContract.memberCount}</Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 20 }}><CalendarOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Giá trị và thời hạn</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
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
          </>
        )}
      </Modal>
    </Space>
  );
};

export default ContractManagementPage;
