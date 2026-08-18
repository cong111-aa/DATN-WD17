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
  { label: "Chua thanh toan", value: "unpaid" },
  { label: "Thanh toan mot phan", value: "partial" },
  { label: "Da thanh toan", value: "paid" },
  { label: "Qua han", value: "overdue" },
];

const statusMeta = {
  unpaid: { bg: "#f1f5f9", color: "#64748b", label: "Chua thanh toan" },
  partial: { bg: "#fef3c7", color: "#b45309", label: "Thanh toan mot phan" },
  paid: { bg: "#dcfce7", color: "#15803d", label: "Da thanh toan" },
  overdue: { bg: "#fee2e2", color: "#b91c1c", label: "Qua han" },
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
  label: `Thang ${index + 1}`,
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
      message.error(error.response?.data?.message || "Khong tai duoc du lieu lua chon");
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/invoices");
      setInvoices(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach hoa don");
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
      message.error(error.response?.data?.message || "Khong tai duoc chi so cu cua ky hoa don");
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
        message.success("Da cap nhat hoa don");
      } else {
        await http.post("/invoices", payload);
        message.success("Da tao hoa don");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu hoa don that bai");
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
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet hoa don");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/invoices/${record.id}`);
      message.success("Da xoa hoa don");
      fetchInvoices();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa hoa don that bai");
    }
  };
  const columns = useMemo(
    () => [
      {
        title: "MA HOA DON",
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
                Ky {record.month}/{record.year}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: "KHACH THUE",
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
        title: "PHONG",
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
        title: "DIEN/NUOC",
        key: "utilities",
        width: 150,
        render: (_, record) => (
          <Typography.Text style={{ color: "#475569" }}>
            {record.electricityUsage ?? 0} so / {record.waterUsage ?? 0} khoi
          </Typography.Text>
        ),
      },
      {
        title: "TONG TIEN",
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
        title: "DA THANH TOAN",
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
        title: "TRANG THAI",
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
        title: "NGAY TAO",
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
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => (
          <Space size={8}>
            <Tooltip title="Chi tiet hoa don">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
                style={{ borderRadius: 8, height: 32, width: 32 }}
              />
            </Tooltip>
            <Tooltip title="Sua hoa don">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
                style={{ borderRadius: 8, height: 32, width: 32 }}
              />
            </Tooltip>
            <Popconfirm
              title="Xoa hoa don nay?"
              description="Chi xoa duoc hoa don chua co thanh toan."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
              disabled={Number(record.paidAmount || 0) > 0}
            >
              <Tooltip title="Xoa hoa don">
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
              TRO PLUS ADMIN
            </Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>
              Quan ly hoa don
            </Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 680 }}>
              Tao, cap nhat, xem chi tiet va xoa hoa don kem chi so dien nuoc, phi dich vu va tong ket thanh toan.
            </Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {invoiceStats.total} hoa don
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {invoiceStats.paid} da thanh toan
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {currencyFormatter(invoiceStats.totalAmountValue)}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>
                Tai lai
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
                Them hoa don
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
                  Bo loc hoa don
                </Typography.Text>
                <br />
                <Typography.Text style={mutedTextStyle}>
                  Tim nhanh theo ma, khach thue, phong va ky hoa don
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
                  placeholder="Tim ma, khach thue, phong"
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
                  options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  value={monthFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setMonthFilter}
                  options={[{ label: "Tat ca thang", value: "all" }, ...monthOptions]}
                />
              </Col>
              <Col xs={12} md={3}>
                <Input
                  allowClear
                  placeholder="Nam"
                  style={toolbarInputStyle}
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                />
              </Col>
              <Col xs={12} md={4}>
                <Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>
                  Dat lai
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
                Danh sach hoa don
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Quan ly thong tin thanh toan theo phong va nguoi dai dien
              </Typography.Text>
            </div>
          </Space>
        }
        extra={
          <Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>
            Hien thi {filteredInvoices.length}/{invoices.length}
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
            emptyText: <Empty description="Khong co hoa don phu hop" />,
          }}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} hoa don`,
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
              <Typography.Text strong>{editingInvoice ? "Sua hoa don" : "Them hoa don"}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingInvoice ? editingInvoice.invoiceCode : "Tao hoa don moi cho phong"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingInvoice ? "Luu" : "Tao hoa don"}
        cancelText="Huy"
        width={980}
      >
        <Alert
          showIcon
          type="info"
          message={editingInvoice ? "Cap nhat thong tin hoa don" : "Nhap thong tin de tao hoa don moi"}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space>
            <FileTextOutlined style={{ color: "#1677ff" }} />
            <Typography.Text strong>Thong tin hoa don</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
                <Select options={roomOptions} placeholder="Chon phong" showSearch optionFilterProp="label" onChange={handleRoomChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="invoiceCode" label="Ma hoa don" rules={[{ required: true }]}>
                <Input placeholder="VD: HD-2026-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="month" label="Thang" rules={[{ required: true }]}>
                <InputNumber min={1} max={12} className="full-width-input" onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="year" label="Nam" rules={[{ required: true }]}>
                <InputNumber min={2000} className="full-width-input" onChange={handlePeriodChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dueDate" label="Han thanh toan">
                <DatePicker className="full-width-input" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Trang thai">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <CalculatorOutlined style={{ color: "#0f766e" }} />
            <Typography.Text strong>Chi so dien nuoc</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message={`Don gia hien tai: dien ${currencyFormatter(selectedRoom?.electricityPrice)} / so, nuoc ${currencyFormatter(selectedRoom?.waterPrice)} / khoi`}
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="electricityOld" label="Chi so dien cu" rules={[{ required: true }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="electricityNew" label="Chi so dien moi" rules={[{ required: true }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterOld" label="Chi so nuoc cu" rules={[{ required: true }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="waterNew" label="Chi so nuoc moi" rules={[{ required: true }]}>
                <InputNumber min={0} className="full-width-input" />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <CalculatorOutlined style={{ color: "#7c3aed" }} />
            <Typography.Text strong>Chi phi va tong ket</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="rentAmount" label="Tien phong">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tien dien">
                <InputNumber value={electricityAmount} min={0} disabled className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tien nuoc">
                <InputNumber value={waterAmount} min={0} disabled className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="serviceAmount" label="Phi dich vu">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="otherAmount" label="Chi phi khac">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="discountAmount" label="Giam tru">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="paidAmount" label="Da thanh toan">
                <InputNumber min={0} className="full-width-input" addonAfter="VND" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Dien tieu thu">{electricityUsage} so</Descriptions.Item>
            <Descriptions.Item label="Nuoc tieu thu">{waterUsage} khoi</Descriptions.Item>
            <SummaryItem label="Tien phong" value={watchedValues.rentAmount} />
            <SummaryItem label="Tien dien" value={electricityAmount} />
            <SummaryItem label="Tien nuoc" value={waterAmount} />
            <SummaryItem label="Phi dich vu" value={watchedValues.serviceAmount} />
            <SummaryItem label="Chi phi khac" value={watchedValues.otherAmount} />
            <SummaryItem label="Giam tru" value={watchedValues.discountAmount} />
            <SummaryItem label="Tong tien" value={totalAmount} strong />
            <SummaryItem label="Da thanh toan" value={effectivePaidAmount} />
            <SummaryItem label="Con lai" value={remainingAmount} strong danger={remainingAmount > 0} />
          </Descriptions>
        </Form>
      </Modal>

      <Modal
        title="Chi tiet hoa don"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Dong
          </Button>,
        ]}
        width={860}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ma hoa don">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
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
              <Descriptions.Item label="Nguoi dai dien">{detailInvoice.tenantName}</Descriptions.Item>
              <Descriptions.Item label="Lien he">
                {detailInvoice.tenantPhone || detailInvoice.tenantEmail || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phong">
                {detailInvoice.roomNumber} - {detailInvoice.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Ky hoa don">
                {detailInvoice.month}/{detailInvoice.year}
              </Descriptions.Item>
              <Descriptions.Item label="Han thanh toan">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngay tao">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Chi so dien nuoc</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Dien cu">{detailInvoice.electricityOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Dien moi">{detailInvoice.electricityNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Dien tieu thu">{detailInvoice.electricityUsage ?? 0} so</Descriptions.Item>
              <Descriptions.Item label="Tien dien">{currencyFormatter(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Nuoc cu">{detailInvoice.waterOld ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nuoc moi">{detailInvoice.waterNew ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Nuoc tieu thu">{detailInvoice.waterUsage ?? 0} khoi</Descriptions.Item>
              <Descriptions.Item label="Tien nuoc">{currencyFormatter(detailInvoice.waterAmount)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Tong ket chi phi</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tien phong">{currencyFormatter(detailInvoice.rentAmount)}</Descriptions.Item>
              <Descriptions.Item label="Phi dich vu">{currencyFormatter(detailInvoice.serviceAmount)}</Descriptions.Item>
              <Descriptions.Item label="Chi phi khac">{currencyFormatter(detailInvoice.otherAmount)}</Descriptions.Item>
              <Descriptions.Item label="Giam tru">{currencyFormatter(detailInvoice.discountAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tong tien">
                <Typography.Text strong>{currencyFormatter(detailInvoice.totalAmount)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Da thanh toan">{currencyFormatter(detailInvoice.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Con lai">
                <Typography.Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong>
                  {currencyFormatter(detailInvoice.remainingAmount)}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Ghi chu">{detailInvoice.note || "-"}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default InvoiceManagementPage;
