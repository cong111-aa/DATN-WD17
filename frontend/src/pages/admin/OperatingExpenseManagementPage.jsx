import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  MinusCircleOutlined,
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

const now = new Date();

const defaultFormValues = {
  amount: 0,
  expenseDate: dayjs(),
  month: now.getMonth() + 1,
  status: "paid",
  year: now.getFullYear(),
};

const categoryOptions = [
  { label: "Internet", value: "internet" },
  { label: "Vệ sinh", value: "cleaning" },
  { label: "Bảo trì", value: "maintenance" },
  { label: "Bảo vệ", value: "security" },
  { label: "Điện chung", value: "common_electricity" },
  { label: "Nước chung", value: "common_water" },
  { label: "Rác thải", value: "garbage" },
  { label: "Quản lý", value: "management" },
  { label: "Khác", value: "other" },
];

const statusOptions = [
  { label: "Chờ chi", value: "pending" },
  { label: "Đã chi", value: "paid" },
  { label: "Đã hủy", value: "cancelled" },
];

const statusMeta = {
  pending: { bg: "#fef3c7", color: "#b45309", label: "Chờ chi" },
  paid: { bg: "#dcfce7", color: "#15803d", label: "Đã chi" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Tháng ${index + 1}`,
  value: index + 1,
}));

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

const getCategoryLabel = (value) =>
  categoryOptions.find((option) => option.value === value)?.label || value || "-";

const renderStatusTag = (status) => {
  const meta = statusMeta[status] || statusMeta.pending;

  return (
    <Tag
      bordered={false}
      style={{
        background: meta.bg,
        borderRadius: 8,
        color: meta.color,
        fontWeight: 600,
        marginInlineEnd: 0,
        padding: "4px 10px",
      }}
    >
      {meta.label}
    </Tag>
  );
};

const toFormValues = (record) => ({
  ...record,
  expenseDate: record.expenseDate ? dayjs(record.expenseDate) : undefined,
});

const toPayload = (values) => ({
  ...values,
  expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
});

const createDefaultExpenseItems = (month = now.getMonth() + 1, year = now.getFullYear()) =>
  categoryOptions.map((option) => ({
    amount: 0,
    category: option.value,
    note: "",
    title: `${option.label} tháng ${month}/${year}`,
  }));

const normalizeText = (value) => String(value || "").trim().toLowerCase();

function OperatingExpenseManagementPage() {
  const [form] = Form.useForm();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");

  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/operating-expenses");
      setExpenses(data.data || data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách chi phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const summary = useMemo(() => {
    return expenses.reduce(
      (result, item) => {
        const amount = Number(item.amount || 0);
        result.total += amount;

        if (item.status === "paid") {
          result.paid += amount;
        }

        if (item.status === "pending") {
          result.pending += amount;
        }

        if (item.status === "cancelled") {
          result.cancelled += amount;
        }

        return result;
      },
      { cancelled: 0, paid: 0, pending: 0, total: 0 },
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const keyword = normalizeText(searchText);

    return expenses.filter((item) => {
      const matchSearch =
        !keyword ||
        [item.title, item.note, item.createdByName, getCategoryLabel(item.category)]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(keyword));
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchMonth = monthFilter === "all" || Number(item.month) === Number(monthFilter);
      const matchYear = !yearFilter || Number(item.year) === Number(yearFilter);

      return matchSearch && matchCategory && matchStatus && matchMonth && matchYear;
    });
  }, [categoryFilter, expenses, monthFilter, searchText, statusFilter, yearFilter]);

  const groupedExpenses = useMemo(() => {
    const groups = filteredExpenses.reduce((result, item) => {
      const key = `${item.year}-${item.month}`;

      if (!result[key]) {
        result[key] = {
          cancelledAmount: 0,
          itemCount: 0,
          items: [],
          key,
          month: item.month,
          paidAmount: 0,
          pendingAmount: 0,
          totalAmount: 0,
          year: item.year,
        };
      }

      const amount = Number(item.amount || 0);
      result[key].items.push(item);
      result[key].itemCount += 1;
      result[key].totalAmount += amount;

      if (item.status === "paid") {
        result[key].paidAmount += amount;
      }

      if (item.status === "pending") {
        result[key].pendingAmount += amount;
      }

      if (item.status === "cancelled") {
        result[key].cancelledAmount += amount;
      }

      return result;
    }, {});

    return Object.values(groups).sort((a, b) => {
      if (b.year !== a.year) {
        return Number(b.year) - Number(a.year);
      }

      return Number(b.month) - Number(a.month);
    });
  }, [filteredExpenses]);

  const detailGroup = useMemo(
    () => groupedExpenses.find((group) => group.key === detailGroupKey),
    [detailGroupKey, groupedExpenses],
  );

  const resetFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("");
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    form.setFieldsValue({
      ...defaultFormValues,
      items: createDefaultExpenseItems(defaultFormValues.month, defaultFormValues.year),
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingExpense(record);
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const handleViewDetail = (record) => {
    setDetailGroupKey(record.key);
    setDetailOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingExpense) {
        await http.put(`/operating-expenses/${editingExpense._id}`, toPayload(values));
        message.success("Đã cập nhật chi phí");
      } else {
        const items = (values.items || [])
          .filter((item) => Number(item.amount || 0) > 0)
          .map((item) => ({
            ...item,
            expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
            month: values.month,
            status: values.status,
            year: values.year,
          }));
        if (!items.length) {
          message.warning("Cần nhập ít nhất một khoản chi có số tiền lớn hơn 0");
          return;
        }

        await http.post("/operating-expenses/bulk", { items });
        message.success("Đã tạo danh sách chi phí");
      }

      setModalOpen(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Không lưu được chi phí");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/operating-expenses/${record._id}`);
      message.success("Đã xóa chi phí");
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Không xóa được chi phí");
    }
  };

  const groupColumns = [
    {
      dataIndex: "month",
      key: "period",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong style={{ color: "#0f172a" }}>
            Tháng {record.month}/{record.year}
          </Typography.Text>
          <Typography.Text style={mutedTextStyle}>Kỳ chi phí vận hành</Typography.Text>
        </Space>
      ),
      title: "KỲ CHI PHÍ",
      width: 220,
    },
    {
      dataIndex: "itemCount",
      key: "itemCount",
      render: (value) => <Typography.Text strong>{value}</Typography.Text>,
      title: "SỐ KHOẢN",
      width: 120,
    },
    {
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      title: "TỔNG CHI",
      width: 170,
    },
    {
      dataIndex: "pendingAmount",
      key: "pendingAmount",
      render: (value) => <Typography.Text style={{ color: "#b45309" }}>{currencyFormatter(value)}</Typography.Text>,
      title: "CHỜ CHI",
      width: 150,
    },
    {
      dataIndex: "cancelledAmount",
      key: "cancelledAmount",
      render: (value) => <Typography.Text style={mutedTextStyle}>{currencyFormatter(value)}</Typography.Text>,
      title: "ĐÃ HỦY",
      width: 150,
    },
    {
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Chi tiết chi phí">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            shape="circle"
            size="small"
            style={{ borderColor: "#dbeafe", color: "#2563eb" }}
          />
        </Tooltip>
      ),
      title: "THAO TÁC",
      width: 110,
    },
  ];

  const detailColumns = [
    {
      dataIndex: "category",
      key: "category",
      render: (value) => (
        <Tag bordered={false} style={{ borderRadius: 8, color: "#475569", padding: "4px 10px" }}>
          {getCategoryLabel(value)}
        </Tag>
      ),
      title: "LOẠI CHI PHÍ",
      width: 160,
    },
    {
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          {record.note ? <Typography.Text style={mutedTextStyle}>{record.note}</Typography.Text> : null}
        </Space>
      ),
      title: "TIÊU ĐỀ",
      width: 260,
    },
    {
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      title: "SỐ TIỀN",
      width: 150,
    },
    {
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: formatDate,
      title: "NGÀY CHI",
      width: 130,
    },
    {
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
      title: "TRẠNG THÁI",
      width: 130,
    },
    {
      dataIndex: "createdByName",
      key: "createdByName",
      render: (value) => value || "-",
      title: "NGƯỜI TẠO",
      width: 150,
    },
    {
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Sửa chi phí">
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              shape="circle"
              size="small"
              style={{ borderColor: "#fde68a", color: "#b45309" }}
            />
          </Tooltip>
          <Popconfirm
            cancelText="Hủy"
            disabled={record.status === "paid"}
            okText="Xóa"
            onConfirm={() => handleDelete(record)}
            title="Xóa chi phí này?"
          >
            <Tooltip title={record.status === "paid" ? "Chi phí đã chi không thể xóa" : "Xóa chi phí"}>
              <Button
                danger
                disabled={record.status === "paid"}
                icon={<DeleteOutlined />}
                shape="circle"
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      title: "THAO TÁC",
      width: 120,
    },
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: "100%" }}>
      <Card bodyStyle={{ padding: 24 }} style={heroStyle}>
        <Row align="middle" gutter={[20, 20]} justify="space-between">
          <Col xs={24} lg={11}>
            <Space direction="vertical" size={8}>
              <Space align="center" size={12}>
                <span
                  style={{
                    ...statIconStyle,
                    background: "rgba(255,255,255,0.16)",
                    color: "#fff",
                    fontSize: 20,
                  }}
                >
                  <DollarOutlined />
                </span>
                <div>
                  <Typography.Title level={3} style={{ color: "#fff", margin: 0 }}>
                    Quản lý chi phí vận hành
                  </Typography.Title>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.78)" }}>
                    Theo dõi chi phí theo từng tháng, xem chi tiết và cập nhật từng khoản chi.
                  </Typography.Text>
                </div>
              </Space>
            </Space>
          </Col>
          <Col xs={24} lg={13}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>Số khoản chi</Typography.Text>
                  <Typography.Title level={3} style={{ color: "#fff", margin: "4px 0 0" }}>
                    {expenses.length}
                  </Typography.Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>Tổng chi</Typography.Text>
                  <Typography.Title level={4} style={{ color: "#fff", margin: "6px 0 0" }}>
                    {currencyFormatter(summary.total)}
                  </Typography.Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>Chờ chi</Typography.Text>
                  <Typography.Title level={4} style={{ color: "#fff", margin: "6px 0 0" }}>
                    {currencyFormatter(summary.pending)}
                  </Typography.Title>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 18 }} style={panelStyle}>
        <Row align="middle" gutter={[12, 12]} justify="space-between">
          <Col xs={24} lg={7}>
            <Input
              allowClear
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm theo tiêu đề, ghi chú, người tạo..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              style={toolbarInputStyle}
              value={searchText}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              onChange={setCategoryFilter}
              options={[{ label: "Tất cả loại chi", value: "all" }, ...categoryOptions]}
              style={{ width: "100%" }}
              value={categoryFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              onChange={setStatusFilter}
              options={[{ label: "Tất cả trạng thái", value: "all" }, ...statusOptions]}
              style={{ width: "100%" }}
              value={statusFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={3}>
            <Select
              onChange={setMonthFilter}
              options={[{ label: "Tất cả tháng", value: "all" }, ...monthOptions]}
              style={{ width: "100%" }}
              value={monthFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={3}>
            <InputNumber
              min={2000}
              onChange={(value) => setYearFilter(value || "")}
              placeholder="Năm"
              style={{ width: "100%" }}
              value={yearFilter || null}
            />
          </Col>
          <Col xs={24} lg={3}>
            <Space style={{ justifyContent: "flex-end", width: "100%" }}>
              <Tooltip title="Xóa lọc">
                <Button icon={<FilterOutlined />} onClick={resetFilters} shape="circle" />
              </Tooltip>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchExpenses} shape="circle" />
              </Tooltip>
              <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
                Thêm
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        bodyStyle={{ padding: 0 }}
        extra={
          <Typography.Text style={mutedTextStyle}>
            {groupedExpenses.length} kỳ / {filteredExpenses.length} khoản chi
          </Typography.Text>
        }
        style={panelStyle}
        title={
          <Space size={10}>
            <DollarOutlined style={{ color: "#2563eb" }} />
            <span>Danh sách chi phí</span>
          </Space>
        }
      >
        <Table
          columns={groupColumns}
          dataSource={groupedExpenses}
          loading={loading}
          locale={{ emptyText: <Empty description="Chưa có chi phí nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          rowKey="key"
          scroll={{ x: 920 }}
        />
      </Card>

      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => {
          setModalOpen(false);
          setEditingExpense(null);
          form.resetFields();
        }}
        open={modalOpen}
        title={
          <Space>
            <DollarOutlined style={{ color: "#2563eb" }} />
            <Typography.Text strong>{editingExpense ? "Sửa chi phí" : "Thêm chi phí"}</Typography.Text>
          </Space>
        }
        width={editingExpense ? 760 : 980}
      >
        <Alert
          message={
            editingExpense
              ? "Cập nhật thông tin khoản chi, trạng thái và ngày phát sinh."
              : "Nhập các khoản chi trong cùng một kỳ. Hệ thống chỉ tạo những dòng có số tiền lớn hơn 0."
          }
          showIcon
          style={{ marginBottom: 18 }}
          type="info"
        />

        <Form form={form} initialValues={defaultFormValues} layout="vertical" onFinish={handleSubmit}>
          <Typography.Text strong style={sectionTitleStyle}>
            Thông tin kỳ chi phí
          </Typography.Text>
          <Divider style={{ margin: "10px 0 18px" }} />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Ngày phát sinh" name="expenseDate" rules={[{ required: true, message: "Chọn ngày phát sinh" }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Tháng" name="month" rules={[{ required: true, message: "Chọn tháng" }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Năm" name="year" rules={[{ required: true, message: "Nhập năm" }]}>
                <InputNumber min={2000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: "Chọn trạng thái" }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          {editingExpense ? (
            <>
              <Typography.Text strong style={sectionTitleStyle}>
                Thông tin khoản chi
              </Typography.Text>
              <Divider style={{ margin: "10px 0 18px" }} />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Loại chi phí" name="category" rules={[{ required: true, message: "Chọn loại chi phí" }]}>
                    <Select options={categoryOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
                    <Input placeholder="VD: Tiền internet tháng này" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Số tiền" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Ghi chú" name="note">
                    <Input.TextArea placeholder="Ghi chú thêm nếu có" rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Typography.Text strong style={sectionTitleStyle}>
                Danh sách khoản chi
              </Typography.Text>
              <Divider style={{ margin: "10px 0 18px" }} />

              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Table
                      columns={[
                        {
                          key: "category",
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, "category"]}
                              rules={[{ required: true, message: "Chọn loại" }]}
                              style={{ margin: 0 }}
                            >
                              <Select options={categoryOptions} />
                            </Form.Item>
                          ),
                          title: "Loại chi phí",
                          width: 180,
                        },
                        {
                          key: "title",
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, "title"]}
                              rules={[{ required: true, message: "Nhập tiêu đề" }]}
                              style={{ margin: 0 }}
                            >
                              <Input placeholder="Tiêu đề" />
                            </Form.Item>
                          ),
                          title: "Tiêu đề",
                          width: 230,
                        },
                        {
                          key: "amount",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "amount"]} style={{ margin: 0 }}>
                              <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                          ),
                          title: "Số tiền",
                          width: 150,
                        },
                        {
                          key: "note",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "note"]} style={{ margin: 0 }}>
                              <Input placeholder="Ghi chú" />
                            </Form.Item>
                          ),
                          title: "Ghi chú",
                        },
                        {
                          key: "actions",
                          render: (_, field) => (
                            <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} shape="circle" />
                          ),
                          title: "",
                          width: 70,
                        },
                      ]}
                      dataSource={fields}
                      pagination={false}
                      rowKey="key"
                      scroll={{ x: 760 }}
                    />
                    <Button block icon={<PlusOutlined />} onClick={() => add({ amount: 0 })}>
                      Thêm dòng chi phí
                    </Button>
                  </Space>
                )}
              </Form.List>
            </>
          )}
          <Space style={{ justifyContent: "flex-end", marginTop: 18, width: "100%" }}>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingExpense(null);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingExpense ? "Lưu thay đổi" : "Tạo chi phí"}
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        footer={null}
        onCancel={() => setDetailOpen(false)}
        open={detailOpen}
        title={
          <Space>
            <EyeOutlined style={{ color: "#2563eb" }} />
            <Typography.Text strong>Chi tiết chi phí</Typography.Text>
          </Space>
        }
        width={1050}
      >
        {detailGroup ? (
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Descriptions bordered column={{ md: 2, sm: 1, xs: 1 }} size="small">
              <Descriptions.Item label="Kỳ chi phí">
                Tháng {detailGroup.month}/{detailGroup.year}
              </Descriptions.Item>
              <Descriptions.Item label="Số khoản chi">{detailGroup.itemCount}</Descriptions.Item>
              <Descriptions.Item label="Tổng chi">{currencyFormatter(detailGroup.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="Đã chi">{currencyFormatter(detailGroup.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Chờ chi">{currencyFormatter(detailGroup.pendingAmount)}</Descriptions.Item>
              <Descriptions.Item label="Đã hủy">{currencyFormatter(detailGroup.cancelledAmount)}</Descriptions.Item>
            </Descriptions>

            <Table
              columns={detailColumns}
              dataSource={detailGroup.items}
              pagination={false}
              rowKey="_id"
              scroll={{ x: 1100 }}
            />
          </Space>
        ) : (
          <Empty description="Không tìm thấy chi tiết chi phí" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </Space>
  );
}

export default OperatingExpenseManagementPage;
