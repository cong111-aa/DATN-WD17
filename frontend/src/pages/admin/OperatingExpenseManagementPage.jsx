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
  { label: "Ve sinh", value: "cleaning" },
  { label: "Bao tri", value: "maintenance" },
  { label: "Bao ve", value: "security" },
  { label: "Dien chung", value: "common_electricity" },
  { label: "Nuoc chung", value: "common_water" },
  { label: "Rac thai", value: "garbage" },
  { label: "Quan ly", value: "management" },
  { label: "Khac", value: "other" },
];

const statusOptions = [
  { label: "Cho chi", value: "pending" },
  { label: "Da chi", value: "paid" },
  { label: "Da huy", value: "cancelled" },
];

const statusMeta = {
  pending: { bg: "#fef3c7", color: "#b45309", label: "Cho chi" },
  paid: { bg: "#dcfce7", color: "#15803d", label: "Da chi" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Da huy" },
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Thang ${index + 1}`,
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
    title: `${option.label} thang ${month}/${year}`,
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
      message.error(error.response?.data?.message || "Khong tai duoc danh sach chi phi");
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
        message.success("Da cap nhat chi phi");
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
          message.warning("Can nhap it nhat mot khoan chi co so tien lon hon 0");
          return;
        }

        await http.post("/operating-expenses/bulk", { items });
        message.success("Da tao danh sach chi phi");
      }

      setModalOpen(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Khong luu duoc chi phi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/operating-expenses/${record._id}`);
      message.success("Da xoa chi phi");
      fetchExpenses();
    } catch (error) {
      message.error(error.response?.data?.message || "Khong xoa duoc chi phi");
    }
  };

  const groupColumns = [
    {
      dataIndex: "month",
      key: "period",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong style={{ color: "#0f172a" }}>
            Thang {record.month}/{record.year}
          </Typography.Text>
          <Typography.Text style={mutedTextStyle}>Ky chi phi van hanh</Typography.Text>
        </Space>
      ),
      title: "KY CHI PHI",
      width: 220,
    },
    {
      dataIndex: "itemCount",
      key: "itemCount",
      render: (value) => <Typography.Text strong>{value}</Typography.Text>,
      title: "SO KHOAN",
      width: 120,
    },
    {
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      title: "TONG CHI",
      width: 170,
    },
    {
      dataIndex: "pendingAmount",
      key: "pendingAmount",
      render: (value) => <Typography.Text style={{ color: "#b45309" }}>{currencyFormatter(value)}</Typography.Text>,
      title: "CHO CHI",
      width: 150,
    },
    {
      dataIndex: "cancelledAmount",
      key: "cancelledAmount",
      render: (value) => <Typography.Text style={mutedTextStyle}>{currencyFormatter(value)}</Typography.Text>,
      title: "DA HUY",
      width: 150,
    },
    {
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Chi tiet chi phi">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            shape="circle"
            size="small"
            style={{ borderColor: "#dbeafe", color: "#2563eb" }}
          />
        </Tooltip>
      ),
      title: "THAO TAC",
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
      title: "LOAI CHI PHI",
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
      title: "TIEU DE",
      width: 260,
    },
    {
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      title: "SO TIEN",
      width: 150,
    },
    {
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: formatDate,
      title: "NGAY CHI",
      width: 130,
    },
    {
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
      title: "TRANG THAI",
      width: 130,
    },
    {
      dataIndex: "createdByName",
      key: "createdByName",
      render: (value) => value || "-",
      title: "NGUOI TAO",
      width: 150,
    },
    {
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Sua chi phi">
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              shape="circle"
              size="small"
              style={{ borderColor: "#fde68a", color: "#b45309" }}
            />
          </Tooltip>
          <Popconfirm
            cancelText="Huy"
            disabled={record.status === "paid"}
            okText="Xoa"
            onConfirm={() => handleDelete(record)}
            title="Xoa chi phi nay?"
          >
            <Tooltip title={record.status === "paid" ? "Chi phi da chi khong the xoa" : "Xoa chi phi"}>
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
      title: "THAO TAC",
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
                    Quan ly chi phi van hanh
                  </Typography.Title>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.78)" }}>
                    Theo doi chi phi theo tung thang, xem chi tiet va cap nhat tung khoan chi.
                  </Typography.Text>
                </div>
              </Space>
            </Space>
          </Col>
          <Col xs={24} lg={13}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>So khoan chi</Typography.Text>
                  <Typography.Title level={3} style={{ color: "#fff", margin: "4px 0 0" }}>
                    {expenses.length}
                  </Typography.Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>Tong chi</Typography.Text>
                  <Typography.Title level={4} style={{ color: "#fff", margin: "6px 0 0" }}>
                    {currencyFormatter(summary.total)}
                  </Typography.Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bodyStyle={{ padding: 14 }} style={{ background: "rgba(255,255,255,0.12)", border: 0, borderRadius: 8 }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>Cho chi</Typography.Text>
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
              placeholder="Tim theo tieu de, ghi chu, nguoi tao..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              style={toolbarInputStyle}
              value={searchText}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              onChange={setCategoryFilter}
              options={[{ label: "Tat ca loai chi", value: "all" }, ...categoryOptions]}
              style={{ width: "100%" }}
              value={categoryFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              onChange={setStatusFilter}
              options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]}
              style={{ width: "100%" }}
              value={statusFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={3}>
            <Select
              onChange={setMonthFilter}
              options={[{ label: "Tat ca thang", value: "all" }, ...monthOptions]}
              style={{ width: "100%" }}
              value={monthFilter}
            />
          </Col>
          <Col xs={24} sm={12} lg={3}>
            <InputNumber
              min={2000}
              onChange={(value) => setYearFilter(value || "")}
              placeholder="Nam"
              style={{ width: "100%" }}
              value={yearFilter || null}
            />
          </Col>
          <Col xs={24} lg={3}>
            <Space style={{ justifyContent: "flex-end", width: "100%" }}>
              <Tooltip title="Xoa loc">
                <Button icon={<FilterOutlined />} onClick={resetFilters} shape="circle" />
              </Tooltip>
              <Tooltip title="Tai lai">
                <Button icon={<ReloadOutlined />} onClick={fetchExpenses} shape="circle" />
              </Tooltip>
              <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
                Them
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        bodyStyle={{ padding: 0 }}
        extra={
          <Typography.Text style={mutedTextStyle}>
            {groupedExpenses.length} ky / {filteredExpenses.length} khoan chi
          </Typography.Text>
        }
        style={panelStyle}
        title={
          <Space size={10}>
            <DollarOutlined style={{ color: "#2563eb" }} />
            <span>Danh sach chi phi</span>
          </Space>
        }
      >
        <Table
          columns={groupColumns}
          dataSource={groupedExpenses}
          loading={loading}
          locale={{ emptyText: <Empty description="Chua co chi phi nao" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
            <Typography.Text strong>{editingExpense ? "Sua chi phi" : "Them chi phi"}</Typography.Text>
          </Space>
        }
        width={editingExpense ? 760 : 980}
      >
        <Alert
          message={
            editingExpense
              ? "Cap nhat thong tin khoan chi, trang thai va ngay phat sinh."
              : "Nhap cac khoan chi trong cung mot ky. He thong chi tao nhung dong co so tien lon hon 0."
          }
          showIcon
          style={{ marginBottom: 18 }}
          type="info"
        />

        <Form form={form} initialValues={defaultFormValues} layout="vertical" onFinish={handleSubmit}>
          <Typography.Text strong style={sectionTitleStyle}>
            Thong tin ky chi phi
          </Typography.Text>
          <Divider style={{ margin: "10px 0 18px" }} />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Ngay phat sinh" name="expenseDate" rules={[{ required: true, message: "Chon ngay phat sinh" }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Thang" name="month" rules={[{ required: true, message: "Chon thang" }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Nam" name="year" rules={[{ required: true, message: "Nhap nam" }]}>
                <InputNumber min={2000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Trang thai" name="status" rules={[{ required: true, message: "Chon trang thai" }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          {editingExpense ? (
            <>
              <Typography.Text strong style={sectionTitleStyle}>
                Thong tin khoan chi
              </Typography.Text>
              <Divider style={{ margin: "10px 0 18px" }} />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Loai chi phi" name="category" rules={[{ required: true, message: "Chon loai chi phi" }]}>
                    <Select options={categoryOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tieu de" name="title" rules={[{ required: true, message: "Nhap tieu de" }]}>
                    <Input placeholder="VD: Tien internet thang nay" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="So tien" name="amount" rules={[{ required: true, message: "Nhap so tien" }]}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Ghi chu" name="note">
                    <Input.TextArea placeholder="Ghi chu them neu co" rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Typography.Text strong style={sectionTitleStyle}>
                Danh sach khoan chi
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
                              rules={[{ required: true, message: "Chon loai" }]}
                              style={{ margin: 0 }}
                            >
                              <Select options={categoryOptions} />
                            </Form.Item>
                          ),
                          title: "Loai chi phi",
                          width: 180,
                        },
                        {
                          key: "title",
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, "title"]}
                              rules={[{ required: true, message: "Nhap tieu de" }]}
                              style={{ margin: 0 }}
                            >
                              <Input placeholder="Tieu de" />
                            </Form.Item>
                          ),
                          title: "Tieu de",
                          width: 230,
                        },
                        {
                          key: "amount",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "amount"]} style={{ margin: 0 }}>
                              <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                          ),
                          title: "So tien",
                          width: 150,
                        },
                        {
                          key: "note",
                          render: (_, field) => (
                            <Form.Item name={[field.name, "note"]} style={{ margin: 0 }}>
                              <Input placeholder="Ghi chu" />
                            </Form.Item>
                          ),
                          title: "Ghi chu",
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
                      Them dong chi phi
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
              Huy
            </Button>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingExpense ? "Luu thay doi" : "Tao chi phi"}
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
            <Typography.Text strong>Chi tiet chi phi</Typography.Text>
          </Space>
        }
        width={1050}
      >
        {detailGroup ? (
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Descriptions bordered column={{ md: 2, sm: 1, xs: 1 }} size="small">
              <Descriptions.Item label="Ky chi phi">
                Thang {detailGroup.month}/{detailGroup.year}
              </Descriptions.Item>
              <Descriptions.Item label="So khoan chi">{detailGroup.itemCount}</Descriptions.Item>
              <Descriptions.Item label="Tong chi">{currencyFormatter(detailGroup.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="Da chi">{currencyFormatter(detailGroup.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Cho chi">{currencyFormatter(detailGroup.pendingAmount)}</Descriptions.Item>
              <Descriptions.Item label="Da huy">{currencyFormatter(detailGroup.cancelledAmount)}</Descriptions.Item>
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
          <Empty description="Khong tim thay chi tiet chi phi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </Space>
  );
}

export default OperatingExpenseManagementPage;
