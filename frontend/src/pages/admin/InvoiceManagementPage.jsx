import {
  CalculatorOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
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
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";
import "./InvoiceManagement.css";

const statusOptions = [
  { label: "Chưa thanh toán", value: "unpaid" },
  { label: "Thanh toán một phần", value: "partial" },
  { label: "Đã thanh toán", value: "paid" },
  { label: "Quá hạn", value: "overdue" },
];

const statusMeta = {
  unpaid: { bg: "#f1f5f9", color: "#64748b", icon: <ClockCircleOutlined />, label: "Chưa thanh toán" },
  partial: { bg: "#fef3c7", color: "#b45309", icon: <ExclamationCircleOutlined />, label: "Thanh toán một phần" },
  paid: { bg: "#ecfdf5", color: "#047857", icon: <CheckCircleOutlined />, label: "Đã thanh toán" },
  overdue: { bg: "#fef2f2", color: "#b91c1c", icon: <CloseCircleOutlined />, label: "Quá hạn" },
};

const defaultFormValues = {
  discountAmount: 0,
  electricityAmount: 0,
  electricityNew: 0,
  electricityOld: 0,
  month: new Date().getMonth() + 1,
  otherAmount: 0,
  paidAmount: 0,
  rentAmount: 0,
  serviceAmount: 0,
  status: "unpaid",
  waterAmount: 0,
  waterNew: 0,
  waterOld: 0,
  year: new Date().getFullYear(),
};

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toNumber = (value) => Number(value || 0);

const getNextPeriod = (month, year) => {
  const selectedMonth = Number(month || new Date().getMonth() + 1);
  const selectedYear = Number(year || new Date().getFullYear());

  return selectedMonth === 12
    ? { month: 1, year: selectedYear + 1 }
    : { month: selectedMonth + 1, year: selectedYear };
};

const formatPeriod = (month, year) => (month && year ? `${month}/${year}` : "-");

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Tháng ${index + 1}`,
  value: index + 1,
}));

const toFormValues = (record) => ({
  ...record,
  dueDate: record.dueDate ? dayjs(record.dueDate) : undefined,
  electricityNew: record.electricityNew ?? 0,
  electricityOld: record.electricityOld ?? 0,
  waterNew: record.waterNew ?? 0,
  waterOld: record.waterOld ?? 0,
});

const toPayload = (values) => ({
  ...values,
  dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
});

const SummaryItem = ({ label, value, strong, danger, success }) => (
  <Descriptions.Item label={label}>
    <Typography.Text
      strong={strong}
      type={danger ? "danger" : success ? "success" : undefined}
      style={{ fontWeight: strong ? 700 : 500 }}
    >
      {currencyFormatter(value)}
    </Typography.Text>
  </Descriptions.Item>
);

const InvoiceManagementPage = () => {
  const [form] = Form.useForm();
  const [invoices, setInvoices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");

  const watchedValues = Form.useWatch([], form) || {};

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === watchedValues.room),
    [rooms, watchedValues.room]
  );

  const electricityUsage = Math.max(toNumber(watchedValues.electricityNew) - toNumber(watchedValues.electricityOld), 0);
  const waterUsage = Math.max(toNumber(watchedValues.waterNew) - toNumber(watchedValues.waterOld), 0);
  const electricityAmount = electricityUsage * toNumber(selectedRoom?.electricityPrice);
  const waterAmount = waterUsage * toNumber(selectedRoom?.waterPrice);
  const subtotal =
    toNumber(watchedValues.rentAmount) +
    electricityAmount +
    waterAmount +
    toNumber(watchedValues.serviceAmount) +
    toNumber(watchedValues.otherAmount);
  const totalAmount = Math.max(subtotal - toNumber(watchedValues.discountAmount), 0);
  const effectivePaidAmount = watchedValues.status === "paid" ? totalAmount : toNumber(watchedValues.paidAmount);
  const remainingAmount = Math.max(totalAmount - effectivePaidAmount, 0);
  const nextBillingPeriod = getNextPeriod(watchedValues.month, watchedValues.year);

  const invoiceStats = useMemo(() => {
    const paid = invoices.filter((item) => item.status === "paid").length;
    const unpaid = invoices.filter((item) => item.status === "unpaid").length;
    const partial = invoices.filter((item) => item.status === "partial").length;
    const overdue = invoices.filter((item) => item.status === "overdue").length;
    const totalAmountValue = invoices.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    return {
      overdue,
      paid,
      partial,
      total: invoices.length,
      totalAmountValue,
      unpaid: unpaid + partial,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const normalizedYear = String(yearFilter || "").trim();

    return invoices.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        [item.invoiceCode, item.tenantName, item.tenantPhone, item.tenantEmail, item.roomNumber, item.roomName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchMonth = monthFilter === "all" || Number(item.month) === Number(monthFilter);
      const matchYear = !normalizedYear || String(item.year) === normalizedYear;

      return matchSearch && matchStatus && matchMonth && matchYear;
    });
  }, [invoices, monthFilter, searchText, statusFilter, yearFilter]);

  const fetchOptions = async () => {
    try {
      const { data: roomData } = await http.get("/rooms");
      setRooms(roomData);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được dữ liệu lựa chọn");
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/invoices");
      setInvoices(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    form.setFieldsValue({ electricityAmount, waterAmount });
  }, [electricityAmount, form, modalOpen, waterAmount]);

  const refreshAll = () => {
    fetchOptions();
    fetchInvoices();
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("");
  };

  const loadMeterReadingSeed = async (room, month, year) => {
    if (!room || !month || !year) {
      return;
    }

    try {
      const { data } = await http.get("/invoices/meter-reading-seed", {
        params: { room, month, year },
      });

      form.setFieldsValue({
        electricityOld: data.electricityOld ?? 0,
        electricityNew: data.electricityNew ?? data.electricityOld ?? 0,
        waterOld: data.waterOld ?? 0,
        waterNew: data.waterNew ?? data.waterOld ?? 0,
      });
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chỉ số cũ của kỳ hóa đơn");
    }
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingInvoice(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingInvoice(null);
    form.resetFields();
  };

  const handleRoomChange = (roomId) => {
    const nextRoom = rooms.find((room) => room.id === roomId);

    form.setFieldsValue({
      rentAmount: nextRoom?.price ?? form.getFieldValue("rentAmount"),
      serviceAmount: nextRoom?.serviceFee ?? form.getFieldValue("serviceAmount"),
    });
    loadMeterReadingSeed(roomId, form.getFieldValue("month"), form.getFieldValue("year"));
  };

  const handlePeriodChange = () => {
    loadMeterReadingSeed(
      form.getFieldValue("room"),
      form.getFieldValue("month"),
      form.getFieldValue("year")
    );
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = toPayload({
        ...values,
        electricityAmount,
        rentPeriodMonth: nextBillingPeriod.month,
        rentPeriodYear: nextBillingPeriod.year,
        servicePeriodMonth: nextBillingPeriod.month,
        servicePeriodYear: nextBillingPeriod.year,
        waterAmount,
      });

      if (editingInvoice) {
        await http.put(`/invoices/${editingInvoice.id}`, payload);
        message.success("Đã cập nhật hóa đơn");
      } else {
        await http.post("/invoices", payload);
        message.success("Đã tạo hóa đơn");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Lưu hóa đơn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/invoices/${record.id}`);
      setDetailInvoice(data);
      setDetailOpen(true);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết hóa đơn");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/invoices/${record.id}`);
      message.success("Đã xóa hóa đơn");
      fetchInvoices();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa hóa đơn thất bại");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "MÃ HÓA ĐƠN",
        dataIndex: "invoiceCode",
        key: "invoiceCode",
        width: 190,
        render: (value, record) => (
          <div>
            <span className="im-code-badge">{value}</span>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
              Kỳ {record.month}/{record.year}
            </div>
          </div>
        ),
      },
      {
        title: "KHÁCH THUÊ",
        dataIndex: "tenantName",
        key: "tenantName",
        width: 210,
        render: (value, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size={30} style={{ background: "#f0f9ff", color: "#0284c7", fontWeight: 700 }}>
              {value?.charAt(0)?.toUpperCase() || <UserOutlined />}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: "#334155" }}>{value || "-"}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                {record.tenantPhone || record.tenantEmail || "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "PHÒNG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 160,
        render: (value, record) => (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: "#0f172a" }}>
            <HomeOutlined style={{ color: "#0284c7" }} />
            <span>{value || "-"} {record.roomName ? `(${record.roomName})` : ""}</span>
          </div>
        ),
      },
      {
        title: "ĐIỆN / NƯỚC",
        key: "utilities",
        width: 170,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <span className="im-util-badge">
              <ThunderboltOutlined style={{ color: "#eab308" }} />
              {record.electricityUsage ?? 0} kWh
            </span>
            <span className="im-util-badge">
              <span style={{ color: "#0284c7" }}>💧</span>
              {record.waterUsage ?? 0} m³
            </span>
          </Space>
        ),
      },
      {
        title: "TỔNG TIỀN",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 170,
        render: (value) => (
          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
            {currencyFormatter(value)}
          </span>
        ),
      },
      {
        title: "ĐÃ THANH TOÁN",
        dataIndex: "paidAmount",
        key: "paidAmount",
        width: 170,
        render: (value, record) => {
          const isFullyPaid = Number(value || 0) >= Number(record.totalAmount || 0);
          return (
            <span style={{ fontWeight: 600, color: isFullyPaid ? "#059669" : "#475569" }}>
              {currencyFormatter(value)}
            </span>
          );
        },
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        width: 175,
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.unpaid;
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
        title: "NGÀY TẠO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 135,
        render: (value) => (
          <span style={{ color: "#64748b", fontSize: 13 }}>{formatDate(value)}</span>
        ),
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết hóa đơn">
              <Button
                size="small"
                className="im-action-btn view"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="Chỉnh sửa hóa đơn">
              <Button
                size="small"
                className="im-action-btn edit"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa hóa đơn này?"
              description="Chỉ có thể xóa hóa đơn chưa có thanh toán."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
              disabled={Number(record.paidAmount || 0) > 0}
            >
              <Tooltip title={Number(record.paidAmount || 0) > 0 ? "Không thể xóa hóa đơn đã thanh toán" : "Xóa hóa đơn"}>
                <Button
                  danger
                  size="small"
                  className="im-action-btn delete"
                  icon={<DeleteOutlined />}
                  disabled={Number(record.paidAmount || 0) > 0}
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
    <div className="invoice-mgmt-container">
      {/* Hero Welcome Banner */}
      <div className="im-hero-banner">
        <div className="im-hero-inner">
          <div className="im-hero-left">
            <div className="im-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN TRỊ HÓA ĐƠN</span>
            </div>
            <Typography.Title level={2} className="im-hero-title">
              Quản Lý Hóa Đơn Tiền Phòng & Dịch Vụ
            </Typography.Title>
            <Typography.Paragraph className="im-hero-subtitle">
              Tính toán tiền phòng, điện nước, phí dịch vụ phát sinh và theo dõi tiến độ thanh toán của từng phòng trọ.
            </Typography.Paragraph>
          </div>

          <div className="im-hero-right">
            <Button
              className="im-btn-reload"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refreshAll}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              className="im-btn-add"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm hóa đơn
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="im-stats-grid">
        <div className="im-stat-card">
          <div className="im-stat-info">
            <span className="im-stat-label">Tổng số hóa đơn</span>
            <span className="im-stat-value">{invoiceStats.total}</span>
            <span className="im-stat-sub">Toàn bộ hóa đơn phát hành</span>
          </div>
          <div className="im-stat-icon-wrap icon-blue">
            <FileTextOutlined />
          </div>
        </div>

        <div className="im-stat-card">
          <div className="im-stat-info">
            <span className="im-stat-label">Đã thanh toán</span>
            <span className="im-stat-value" style={{ color: "#059669" }}>{invoiceStats.paid}</span>
            <span className="im-stat-sub">Hóa đơn hoàn tất</span>
          </div>
          <div className="im-stat-icon-wrap icon-emerald">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="im-stat-card">
          <div className="im-stat-info">
            <span className="im-stat-label">Chưa trả / Quá hạn</span>
            <span className="im-stat-value" style={{ color: "#d97706" }}>
              {invoiceStats.unpaid} {invoiceStats.overdue ? `(${invoiceStats.overdue} quá hạn)` : ""}
            </span>
            <span className="im-stat-sub">Cần đôn đốc thu phí</span>
          </div>
          <div className="im-stat-icon-wrap icon-amber">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="im-stat-card">
          <div className="im-stat-info">
            <span className="im-stat-label">Tổng doanh thu kỳ</span>
            <span className="im-stat-value" style={{ color: "#0284c7", fontSize: 20 }}>
              {currencyFormatter(invoiceStats.totalAmountValue)}
            </span>
            <span className="im-stat-sub">Tổng giá trị các hóa đơn</span>
          </div>
          <div className="im-stat-icon-wrap icon-violet">
            <DollarOutlined />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="im-filter-card">
        <div className="im-filter-row">
          <div className="im-filter-left">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm kiếm mã HĐ, tên khách thuê, số phòng..."
              className="im-search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="im-filter-controls">
            <Select
              value={statusFilter}
              className="im-select-filter"
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
            />
            <Select
              value={monthFilter}
              className="im-select-filter"
              style={{ minWidth: 120 }}
              onChange={setMonthFilter}
              options={[{ label: "Tất cả tháng", value: "all" }, ...monthOptions]}
            />
            <Input
              allowClear
              placeholder="Năm (VD: 2026)"
              className="im-year-input"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="im-btn-reset"
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="im-table-card">
        <div className="im-table-header">
          <h3 className="im-table-title">
            <CalculatorOutlined style={{ color: "#0284c7" }} />
            Danh Sách Hóa Đơn Tiền Phòng
          </h3>
          <span className="im-count-pill">
            Hiển thị {filteredInvoices.length} / {invoices.length} hóa đơn
          </span>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredInvoices}
          loading={loading}
          size="middle"
          className="im-table"
          locale={{ emptyText: <Empty description="Không có hóa đơn phù hợp" /> }}
          scroll={{ x: 1450 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
          }}
        />
      </div>

      {/* Modal Tạo / Sửa hóa đơn */}
      <Modal
        title={
          <div className="im-modal-header">
            <Avatar size={36} style={{ background: "#0284c7" }} icon={<FileTextOutlined />} />
            <div>
              <h4 className="im-modal-title">{editingInvoice ? "Chỉnh sửa hóa đơn" : "Tạo hóa đơn tiền phòng mới"}</h4>
              <p className="im-modal-subtitle">{editingInvoice ? editingInvoice.invoiceCode : "Thiết lập kỳ thanh toán và nhập chỉ số điện nước"}</p>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingInvoice ? "Lưu thay đổi" : "Tạo hóa đơn"}
        cancelText="Hủy"
        width={980}
      >
        <Alert
          showIcon
          type="info"
          message={`Kỳ chốt điện nước: ${formatPeriod(watchedValues.month, watchedValues.year)}. Tiền phòng và phí dịch vụ thu trước cho: ${formatPeriod(nextBillingPeriod.month, nextBillingPeriod.year)}.`}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Section 1: General Info */}
          <div className="im-form-section-title">
            <FileTextOutlined style={{ color: "#0284c7" }} /> Thông tin chung
          </div>
          <Divider className="im-form-divider" />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="room" label="Phòng trọ" rules={[{ required: true, message: "Vui lòng chọn phòng!" }]}>
                <Select
                  options={roomOptions}
                  placeholder="Chọn phòng"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleRoomChange}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="invoiceCode" label="Mã hóa đơn" rules={[{ required: true, message: "Vui lòng nhập mã hóa đơn!" }]}>
                <Input placeholder="VD: HD-2026-001" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="month" label="Tháng chốt điện nước" rules={[{ required: true, message: "Vui lòng nhập tháng!" }]}>
                <InputNumber min={1} max={12} style={{ width: "100%", borderRadius: 8 }} onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="year" label="Năm" rules={[{ required: true, message: "Vui lòng nhập năm!" }]}>
                <InputNumber min={2000} style={{ width: "100%", borderRadius: 8 }} onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dueDate" label="Hạn thanh toán">
                <DatePicker style={{ width: "100%", borderRadius: 8 }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={statusOptions} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Section 2: Utilities */}
          <div className="im-form-section-title">
            <ThunderboltOutlined style={{ color: "#eab308" }} /> Chỉ số điện nước
          </div>
          <Divider className="im-form-divider" />
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message={`Đơn giá áp dụng: Điện ${currencyFormatter(selectedRoom?.electricityPrice)} / số, Nước ${currencyFormatter(selectedRoom?.waterPrice)} / khối`}
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="electricityOld" label="Chỉ số điện cũ" rules={[{ required: true, message: "Vui lòng nhập chỉ số điện cũ!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="số" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="electricityNew" label="Chỉ số điện mới" rules={[{ required: true, message: "Vui lòng nhập chỉ số điện mới!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="số" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterOld" label="Chỉ số nước cũ" rules={[{ required: true, message: "Vui lòng nhập chỉ số nước cũ!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="khối" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterNew" label="Chỉ số nước mới" rules={[{ required: true, message: "Vui lòng nhập chỉ số nước mới!" }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="khối" />
              </Form.Item>
            </Col>
          </Row>

          {/* Section 3: Cost breakdown */}
          <div className="im-form-section-title">
            <CalculatorOutlined style={{ color: "#7c3aed" }} /> Chi phí và tổng kết
          </div>
          <Divider className="im-form-divider" />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="rentAmount" label={`Tiền phòng tháng ${formatPeriod(nextBillingPeriod.month, nextBillingPeriod.year)}`}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tiền điện tự tính">
                <InputNumber value={electricityAmount} min={0} disabled style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tiền nước tự tính">
                <InputNumber value={waterAmount} min={0} disabled style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="serviceAmount" label={`Phí dịch vụ tháng ${formatPeriod(nextBillingPeriod.month, nextBillingPeriod.year)}`}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="otherAmount" label="Chi phí khác / phát sinh">
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="discountAmount" label="Giảm trừ / chiết khấu">
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="paidAmount" label="Số tiền khách đã thanh toán">
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} addonAfter="VND" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú hóa đơn">
            <Input.TextArea rows={3} placeholder="Ghi chú chi tiết nếu có..." style={{ borderRadius: 8 }} />
          </Form.Item>

          {/* Realtime summary breakdown */}
          <div className="im-summary-box">
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12 }}>
              Bảng Tổng Kết Dự Tính
            </div>
            <Descriptions bordered size="small" column={2} className="im-descriptions">
              <Descriptions.Item label="Điện tiêu thụ">{electricityUsage} số</Descriptions.Item>
              <Descriptions.Item label="Nước tiêu thụ">{waterUsage} khối</Descriptions.Item>
              <SummaryItem label={`Tiền phòng ${formatPeriod(nextBillingPeriod.month, nextBillingPeriod.year)}`} value={watchedValues.rentAmount} />
              <SummaryItem label="Tiền điện" value={electricityAmount} />
              <SummaryItem label="Tiền nước" value={waterAmount} />
              <SummaryItem label={`Phí dịch vụ ${formatPeriod(nextBillingPeriod.month, nextBillingPeriod.year)}`} value={watchedValues.serviceAmount} />
              <SummaryItem label="Chi phí khác" value={watchedValues.otherAmount} />
              <SummaryItem label="Giảm trừ" value={watchedValues.discountAmount} />
              <SummaryItem label="TỔNG TIỀN PHẢI THU" value={totalAmount} strong />
              <SummaryItem label="Đã thanh toán" value={effectivePaidAmount} />
              <SummaryItem label="CÒN LẠI PHẢI TRẢ" value={remainingAmount} strong danger={remainingAmount > 0} success={remainingAmount === 0} />
            </Descriptions>
          </div>
        </Form>
      </Modal>

      {/* Modal Chi tiết hóa đơn */}
      <Modal
        title={
          <div className="im-modal-header">
            <Avatar size={36} style={{ background: "#0284c7" }} icon={<FileTextOutlined />} />
            <div>
              <h4 className="im-modal-title">Chi tiết hóa đơn</h4>
              <p className="im-modal-subtitle">{detailInvoice?.invoiceCode || "Thông tin hóa đơn thanh toán"}</p>
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
        width={860}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 8 }}>
            <Descriptions bordered size="small" column={2} className="im-descriptions">
              <Descriptions.Item label="Mã hóa đơn">
                <span className="im-code-badge">{detailInvoice.invoiceCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  bordered={false}
                  style={{
                    background: statusMeta[detailInvoice.status]?.bg,
                    borderRadius: 6,
                    color: statusMeta[detailInvoice.status]?.color,
                    fontWeight: 700,
                    padding: "3px 10px",
                  }}
                >
                  {statusMeta[detailInvoice.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người đại diện">{detailInvoice.tenantName}</Descriptions.Item>
              <Descriptions.Item label="Liên hệ">
                {detailInvoice.tenantPhone || detailInvoice.tenantEmail || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {detailInvoice.roomNumber} - {detailInvoice.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ chốt điện nước">
                {detailInvoice.month}/{detailInvoice.year}
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ thu tiền phòng/dịch vụ">
                {formatPeriod(detailInvoice.rentPeriodMonth, detailInvoice.rentPeriodYear)}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>

            <div className="im-form-section-title">
              <ThunderboltOutlined style={{ color: "#eab308" }} /> Chỉ số điện nước chi tiết
            </div>
            <Descriptions bordered size="small" column={2} className="im-descriptions">
              <Descriptions.Item label="Điện cũ">{detailInvoice.electricityOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Điện mới">{detailInvoice.electricityNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Điện tiêu thụ">{detailInvoice.electricityUsage ?? 0} kWh</Descriptions.Item>
              <Descriptions.Item label="Tiền điện">{currencyFormatter(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Nước cũ">{detailInvoice.waterOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nước mới">{detailInvoice.waterNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nước tiêu thụ">{detailInvoice.waterUsage ?? 0} m³</Descriptions.Item>
              <Descriptions.Item label="Tiền nước">{currencyFormatter(detailInvoice.waterAmount)}</Descriptions.Item>
            </Descriptions>

            <div className="im-form-section-title">
              <CalculatorOutlined style={{ color: "#7c3aed" }} /> Tổng kết chi phí thanh toán
            </div>
            <Descriptions bordered size="small" column={2} className="im-descriptions">
              <Descriptions.Item label={`Tiền phòng ${formatPeriod(detailInvoice.rentPeriodMonth, detailInvoice.rentPeriodYear)}`}>
                {currencyFormatter(detailInvoice.rentAmount)}
              </Descriptions.Item>
              <Descriptions.Item label={`Phí dịch vụ ${formatPeriod(detailInvoice.servicePeriodMonth, detailInvoice.servicePeriodYear)}`}>
                {currencyFormatter(detailInvoice.serviceAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Chi phí khác">{currencyFormatter(detailInvoice.otherAmount)}</Descriptions.Item>
              <Descriptions.Item label="Giảm trừ">{currencyFormatter(detailInvoice.discountAmount)}</Descriptions.Item>
              <Descriptions.Item label="TỔNG TIỀN">
                <Typography.Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                  {currencyFormatter(detailInvoice.totalAmount)}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán">{currencyFormatter(detailInvoice.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="CÒN LẠI" span={2}>
                <Typography.Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong style={{ fontSize: 14 }}>
                  {currencyFormatter(detailInvoice.remainingAmount)}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1} className="im-descriptions">
              <Descriptions.Item label="Ghi chú">{detailInvoice.note || "-"}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceManagementPage;
