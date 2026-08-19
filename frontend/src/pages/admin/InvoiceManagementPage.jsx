import {
  CalculatorOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
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

const statusOptions = [
  { label: "Chưa thanh toán", value: "unpaid" },
  { label: "Thanh toán một phần", value: "partial" },
  { label: "Đã thanh toán", value: "paid" },
  { label: "Quá hạn", value: "overdue" },
];

const statusMeta = {
  unpaid: { bg: "#f1f5f9", color: "#64748b", label: "Chưa thanh toán" },
  partial: { bg: "#fef3c7", color: "#b45309", label: "Thanh toán một phần" },
  paid: { bg: "#dcfce7", color: "#15803d", label: "Đã thanh toán" },
  overdue: { bg: "#fee2e2", color: "#b91c1c", label: "Quá hạn" },
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

const statIconStyle = {
  alignItems: "center",
  borderRadius: 8,
  display: "flex",
  height: 42,
  justifyContent: "center",
  width: 42,
};

const toolbarInputStyle = {
  borderRadius: 8,
  height: 40,
};

const mutedTextStyle = {
  color: "#64748b",
};

const sectionTitleStyle = {
  color: "#0f172a",
  fontSize: 16,
};

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toNumber = (value) => Number(value || 0);

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

const SummaryItem = ({ label, value, strong, danger }) => (
  <Descriptions.Item label={label}>
    <Typography.Text strong={strong} type={danger ? "danger" : undefined}>
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

  const invoiceStats = useMemo(() => {
    const paid = invoices.filter((item) => item.status === "paid").length;
    const unpaid = invoices.filter((item) => item.status === "unpaid").length;
    const overdue = invoices.filter((item) => item.status === "overdue").length;
    const totalAmountValue = invoices.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    return {
      overdue,
      paid,
      total: invoices.length,
      totalAmountValue,
      unpaid,
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
        width: 180,
        render: (value, record) => (
          <Space size={12}>
            <div style={{ ...statIconStyle, background: "#eef2ff", color: "#4f46e5" }}>
              <FileTextOutlined />
            </div>
            <div>
              <Typography.Text strong style={{ color: "#334155" }}>
                {value}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Kỳ {record.month}/{record.year}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: "KHÁCH THUÊ",
        dataIndex: "tenantName",
        key: "tenantName",
        width: 230,
        render: (value, record) => (
          <div>
            <Typography.Text strong style={{ color: "#334155" }}>
              {value || "-"}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.tenantPhone || record.tenantEmail || "-"}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "PHÒNG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 150,
        render: (value, record) => (
          <Typography.Text style={{ color: "#475569" }}>
            {value || "-"} - {record.roomName || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "ĐIỆN/NƯỚC",
        key: "utilities",
        width: 150,
        render: (_, record) => (
          <Typography.Text style={{ color: "#475569" }}>
            {record.electricityUsage ?? 0} số / {record.waterUsage ?? 0} khối
          </Typography.Text>
        ),
      },
      {
        title: "TỔNG TIỀN",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 170,
        render: (value) => (
          <Typography.Text strong style={{ color: "#0f172a" }}>
            {currencyFormatter(value)}
          </Typography.Text>
        ),
      },
      {
        title: "ĐÃ THANH TOÁN",
        dataIndex: "paidAmount",
        key: "paidAmount",
        width: 170,
        render: (value) => (
          <Typography.Text style={{ color: "#475569" }}>
            {currencyFormatter(value)}
          </Typography.Text>
        ),
      },
      {
        title: "TRẠNG THÁI",
        dataIndex: "status",
        key: "status",
        width: 170,
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.unpaid;

          return (
            <Tag
              bordered={false}
              style={{
                background: meta.bg,
                borderRadius: 5,
                color: meta.color,
                fontWeight: 700,
                padding: "3px 10px",
              }}
            >
              {meta.label}
            </Tag>
          );
        },
      },
      {
        title: "NGÀY TẠO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 140,
        render: (value) => (
          <Typography.Text style={{ color: "#475569" }}>
            {formatDate(value)}
          </Typography.Text>
        ),
      },
      {
        title: "THAO TÁC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => (
          <Space size={8}>
            <Tooltip title="Chi tiết hóa đơn">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
                style={{ borderRadius: 8, height: 32, width: 32 }}
              />
            </Tooltip>
            <Tooltip title="Sửa hóa đơn">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
                style={{ borderRadius: 8, height: 32, width: 32 }}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa hóa đơn này?"
              description="Chỉ xóa được hóa đơn chưa có thanh toán."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
              disabled={Number(record.paidAmount || 0) > 0}
            >
              <Tooltip title="Xóa hóa đơn">
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={Number(record.paidAmount || 0) > 0}
                  style={{ borderRadius: 8, height: 32, width: 32 }}
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
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>
              TRỌ PLUS ADMIN
            </Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>
              Quản lý hóa đơn
            </Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 680 }}>
              Tạo, cập nhật, xem chi tiết và xóa hóa đơn kèm chỉ số điện nước, phí dịch vụ và tổng kết thanh toán.
            </Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {invoiceStats.total} hóa đơn
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {invoiceStats.paid} đã thanh toán
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {currencyFormatter(invoiceStats.totalAmountValue)}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>
                Tải lại
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{
                  background: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  boxShadow: "none",
                  fontWeight: 800,
                  height: 40,
                }}
              >
                Thêm hóa đơn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={7}>
            <Space>
              <div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}>
                <FilterOutlined />
              </div>
              <div>
                <Typography.Text strong style={sectionTitleStyle}>
                  Bộ lọc hóa đơn
                </Typography.Text>
                <br />
                <Typography.Text style={mutedTextStyle}>
                  Tìm nhanh theo mã, khách thuê, phòng và kỳ hóa đơn
                </Typography.Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={17}>
            <Row gutter={[10, 10]} justify="end">
              <Col xs={24} md={8}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tìm mã, khách thuê, phòng"
                  style={toolbarInputStyle}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </Col>
              <Col xs={12} md={5}>
                <Select
                  value={statusFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setStatusFilter}
                  options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={monthFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setMonthFilter}
                  options={[{ label: "Tất cả tháng", value: "all" }, ...monthOptions]}
                />
              </Col>
              <Col xs={12} md={3}>
                <Input
                  allowClear
                  placeholder="Năm"
                  style={toolbarInputStyle}
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                />
              </Col>
              <Col xs={12} md={4}>
                <Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>
                  Đặt lại
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}>
              <CalculatorOutlined />
            </div>
            <div>
              <Typography.Text strong style={sectionTitleStyle}>
                Danh sách hóa đơn
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Quản lý thông tin thanh toán theo phòng và người đại diện
              </Typography.Text>
            </div>
          </Space>
        }
        extra={
          <Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>
            Hiển thị {filteredInvoices.length}/{invoices.length}
          </Tag>
        }
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" },
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredInvoices}
          loading={loading}
          size="middle"
          rowClassName={() => "user-management-row"}
          locale={{
            emptyText: <Empty description="Không có hóa đơn phù hợp" />,
          }}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} hóa đơn`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <div style={{ ...statIconStyle, background: "#eef2ff", color: "#4f46e5", height: 36, width: 36 }}>
              <FileTextOutlined />
            </div>
            <div>
              <Typography.Text strong>{editingInvoice ? "Sửa hóa đơn" : "Thêm hóa đơn"}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingInvoice ? editingInvoice.invoiceCode : "Tạo hóa đơn mới cho phòng"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingInvoice ? "Lưu" : "Tạo hóa đơn"}
        cancelText="Hủy"
        width={980}
      >
        <Alert
          showIcon
          type="info"
          message={editingInvoice ? "Cập nhật thông tin hóa đơn" : "Nhập thông tin để tạo hóa đơn mới"}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space>
            <FileTextOutlined style={{ color: "#1677ff" }} />
            <Typography.Text strong>Thông tin hóa đơn</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="room" label="Phòng" rules={[{ required: true, message: "Vui lòng chọn phòng!" }]}>
                <Select options={roomOptions} placeholder="Chọn phòng" showSearch optionFilterProp="label" onChange={handleRoomChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="invoiceCode" label="Mã hóa đơn" rules={[{ required: true, message: "Vui lòng nhập mã hóa đơn!" }]}>
                <Input placeholder="VD: HD-2026-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="month" label="Tháng" rules={[{ required: true, message: "Vui lòng nhập tháng!" }]}>
                <InputNumber min={1} max={12} className="full-width-input" onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="year" label="Năm" rules={[{ required: true, message: "Vui lòng nhập năm!" }]}>
                <InputNumber min={2000} className="full-width-input" onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dueDate" label="Hạn thanh toán">
                <DatePicker className="full-width-input" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <CalculatorOutlined style={{ color: "#0f766e" }} />
            <Typography.Text strong>Chỉ số điện nước</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message={`Đơn giá hiện tại: điện ${currencyFormatter(selectedRoom?.electricityPrice)} / số, nước ${currencyFormatter(selectedRoom?.waterPrice)} / khối`}
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="electricityOld" label="Chỉ số điện cũ" rules={[{ required: true, message: "Vui lòng nhập chỉ số điện cũ!" }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="electricityNew" label="Chỉ số điện mới" rules={[{ required: true, message: "Vui lòng nhập chỉ số điện mới!" }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterOld" label="Chỉ số nước cũ" rules={[{ required: true, message: "Vui lòng nhập chỉ số nước cũ!" }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterNew" label="Chỉ số nước mới" rules={[{ required: true, message: "Vui lòng nhập chỉ số nước mới!" }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <CalculatorOutlined style={{ color: "#7c3aed" }} />
            <Typography.Text strong>Chi phí và tổng kết</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="rentAmount" label="Tiền phòng">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tiền điện">
                <InputNumber value={electricityAmount} min={0} disabled className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tiền nước">
                <InputNumber value={waterAmount} min={0} disabled className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="serviceAmount" label="Phí dịch vụ">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="otherAmount" label="Chi phí khác">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="discountAmount" label="Giảm trừ">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="paidAmount" label="Đã thanh toán">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Điện tiêu thụ">{electricityUsage} số</Descriptions.Item>
            <Descriptions.Item label="Nước tiêu thụ">{waterUsage} khối</Descriptions.Item>
            <SummaryItem label="Tiền phòng" value={watchedValues.rentAmount} />
            <SummaryItem label="Tiền điện" value={electricityAmount} />
            <SummaryItem label="Tiền nước" value={waterAmount} />
            <SummaryItem label="Phí dịch vụ" value={watchedValues.serviceAmount} />
            <SummaryItem label="Chi phí khác" value={watchedValues.otherAmount} />
            <SummaryItem label="Giảm trừ" value={watchedValues.discountAmount} />
            <SummaryItem label="Tổng tiền" value={totalAmount} strong />
            <SummaryItem label="Đã thanh toán" value={effectivePaidAmount} />
            <SummaryItem label="Còn lại" value={remainingAmount} strong danger={remainingAmount > 0} />
          </Descriptions>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết hóa đơn"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={860}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã hóa đơn">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  bordered={false}
                  style={{
                    background: statusMeta[detailInvoice.status]?.bg,
                    borderRadius: 5,
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
              <Descriptions.Item label="Kỳ hóa đơn">
                {detailInvoice.month}/{detailInvoice.year}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Chỉ số điện nước</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Điện cũ">{detailInvoice.electricityOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Điện mới">{detailInvoice.electricityNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Điện tiêu thụ">{detailInvoice.electricityUsage ?? 0} số</Descriptions.Item>
              <Descriptions.Item label="Tiền điện">{currencyFormatter(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Nước cũ">{detailInvoice.waterOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nước mới">{detailInvoice.waterNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nước tiêu thụ">{detailInvoice.waterUsage ?? 0} khối</Descriptions.Item>
              <Descriptions.Item label="Tiền nước">{currencyFormatter(detailInvoice.waterAmount)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Tổng kết chi phí</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tiền phòng">{currencyFormatter(detailInvoice.rentAmount)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{currencyFormatter(detailInvoice.serviceAmount)}</Descriptions.Item>
              <Descriptions.Item label="Chi phí khác">{currencyFormatter(detailInvoice.otherAmount)}</Descriptions.Item>
              <Descriptions.Item label="Giảm trừ">{currencyFormatter(detailInvoice.discountAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Typography.Text strong>{currencyFormatter(detailInvoice.totalAmount)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán">{currencyFormatter(detailInvoice.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Còn lại">
                <Typography.Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong>
                  {currencyFormatter(detailInvoice.remainingAmount)}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Ghi chú">{detailInvoice.note || "-"}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default InvoiceManagementPage;
