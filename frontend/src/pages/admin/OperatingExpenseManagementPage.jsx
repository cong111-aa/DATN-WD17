import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
  pending: { color: "warning", label: "Cho chi" },
  paid: { color: "success", label: "Da chi" },
  cancelled: { color: "default", label: "Da huy" },
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Thang ${index + 1}`,
  value: index + 1,
}));

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const getCategoryLabel = (value) =>
  categoryOptions.find((option) => option.value === value)?.label || value || "-";

const toFormValues = (record) => ({
  ...record,
  expenseDate: record.expenseDate ? dayjs(record.expenseDate) : undefined,
});

const toPayload = (values) => ({
  ...values,
  expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
});

const createDefaultExpenseItems = (month = now.getMonth() + 1, year = now.getFullYear()) =>
  categoryOptions.map((category) => ({
    amount: 0,
    category: category.value,
    note: "",
    title: `${category.label} thang ${month}/${year}`,
  }));

const OperatingExpenseManagementPage = () => {
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const summary = useMemo(() => {
    const initial = {
      cancelled: 0,
      paid: 0,
      pending: 0,
      total: 0,
    };

    return expenses.reduce((result, expense) => {
      const amount = Number(expense.amount || 0);

      if (expense.status !== "cancelled") {
        result.total += amount;
      }

      if (result[expense.status] !== undefined) {
        result[expense.status] += amount;
      }

      return result;
    }, initial);
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      const key = `${expense.month}-${expense.year}`;

      if (!groups.has(key)) {
        groups.set(key, {
          cancelledAmount: 0,
          itemCount: 0,
          items: [],
          key,
          month: expense.month,
          paidAmount: 0,
          pendingAmount: 0,
          totalAmount: 0,
          year: expense.year,
        });
      }

      const group = groups.get(key);
      const amount = Number(expense.amount || 0);

      group.itemCount += 1;
      group.items.push(expense);

      if (expense.status === "paid") {
        group.paidAmount += amount;
        group.totalAmount += amount;
      }

      if (expense.status === "pending") {
        group.pendingAmount += amount;
        group.totalAmount += amount;
      }

      if (expense.status === "cancelled") {
        group.cancelledAmount += amount;
      }
    });

    return Array.from(groups.values()).sort((first, second) => {
      if (Number(second.year) !== Number(first.year)) {
        return Number(second.year) - Number(first.year);
      }

      if (Number(second.month) !== Number(first.month)) {
        return Number(second.month) - Number(first.month);
      }

      return 0;
    });
  }, [expenses]);

  const detailGroup = useMemo(
    () => groupedExpenses.find((group) => group.key === detailGroupKey),
    [detailGroupKey, groupedExpenses]
  );

  const fetchExpenses = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const { data } = await http.get("/operating-expenses", { params: nextFilters });
      setExpenses(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach chi phi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses({});
  }, []);

  const refreshAll = () => {
    fetchExpenses(filters);
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    form.resetFields();
    form.setFieldsValue({
      expenseDate: dayjs(),
      items: createDefaultExpenseItems(),
      month: now.getMonth() + 1,
      status: "paid",
      year: now.getFullYear(),
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingExpense(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
    form.resetFields();
  };

  const handleFilter = (values) => {
    const nextFilters = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );

    setFilters(nextFilters);
    fetchExpenses(nextFilters);
  };

  const clearFilters = () => {
    filterForm.resetFields();
    setFilters({});
    fetchExpenses({});
  };

  const handleViewDetail = (record) => {
    setDetailGroupKey(record.key);
    setDetailOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = toPayload(values);

      if (editingExpense) {
        await http.put(`/operating-expenses/${editingExpense.id}`, payload);
        message.success("Da cap nhat chi phi");
      } else {
        await http.post("/operating-expenses/bulk", payload);
        message.success("Da tao cac chi phi");
      }

      closeModal();
      fetchExpenses(filters);
    } catch (error) {
      message.error(error.response?.data?.message || "Luu chi phi that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (record, status) => {
    try {
      await http.patch(`/operating-expenses/${record.id}/status`, { status });
      message.success("Da cap nhat trang thai chi phi");
      fetchExpenses(filters);
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/operating-expenses/${record.id}`);
      message.success("Da xoa chi phi");
      fetchExpenses(filters);
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa chi phi that bai");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Ky",
        key: "period",
        render: (_, record) => `${record.month}/${record.year}`,
      },
      {
        title: "So khoan chi",
        dataIndex: "itemCount",
        key: "itemCount",
      },
      {
        title: "Tong da chi",
        dataIndex: "paidAmount",
        key: "paidAmount",
        render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      },
      {
        title: "Cho chi",
        dataIndex: "pendingAmount",
        key: "pendingAmount",
        render: currencyFormatter,
      },
      {
        title: "Da huy",
        dataIndex: "cancelledAmount",
        key: "cancelledAmount",
        render: currencyFormatter,
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => (
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              Chi tiet
            </Button>
          </Space>
        ),
      },
    ],
    [filters]
  );

  const detailColumns = useMemo(
    () => [
      {
        title: "Loai chi phi",
        dataIndex: "category",
        key: "category",
        render: getCategoryLabel,
      },
      {
        title: "Tieu de",
        dataIndex: "title",
        key: "title",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{record.note || "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "So tien",
        dataIndex: "amount",
        key: "amount",
        render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      },
      {
        title: "Ngay chi",
        dataIndex: "expenseDate",
        key: "expenseDate",
        render: formatDate,
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status, record) => {
          const meta = statusMeta[status] || statusMeta.pending;

          return (
            <Select
              value={status}
              size="small"
              style={{ width: 120 }}
              options={statusOptions}
              onChange={(value) => handleStatusChange(record, value)}
              suffixIcon={null}
              popupMatchSelectWidth={false}
              optionRender={(option) => {
                const optionMeta = statusMeta[option.value] || statusMeta.pending;
                return <Tag color={optionMeta.color}>{optionMeta.label}</Tag>;
              }}
              labelRender={() => <Tag color={meta.color}>{meta.label}</Tag>}
            />
          );
        },
      },
      {
        title: "Nguoi tao",
        dataIndex: "createdByName",
        key: "createdByName",
        render: (value) => value || "-",
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => (
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Sua
            </Button>
            <Popconfirm
              title="Xoa chi phi nay?"
              description="Chi xoa duoc chi phi chua o trang thai da chi."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
              disabled={record.status === "paid"}
            >
              <Button danger icon={<DeleteOutlined />} disabled={record.status === "paid"}>
                Xoa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [filters]
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly chi phi van hanh</Typography.Title>
          <Typography.Text type="secondary">
            Theo doi cac khoan chi van hanh theo thang va nam.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them chi phi
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Tong chi phi</Typography.Text>
            <Typography.Title level={4}>{currencyFormatter(summary.total)}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Da chi</Typography.Text>
            <Typography.Title level={4}>{currencyFormatter(summary.paid)}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Cho chi</Typography.Text>
            <Typography.Title level={4}>{currencyFormatter(summary.pending)}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Da huy</Typography.Text>
            <Typography.Title level={4}>{currencyFormatter(summary.cancelled)}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card>
        <Form form={filterForm} layout="vertical" onFinish={handleFilter}>
          <div className="form-grid">
            <Form.Item name="category" label="Loai chi phi">
              <Select allowClear options={categoryOptions} placeholder="Tat ca loai" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai">
              <Select allowClear options={statusOptions} placeholder="Tat ca trang thai" />
            </Form.Item>
            <Form.Item name="month" label="Thang">
              <Select allowClear options={monthOptions} placeholder="Tat ca thang" />
            </Form.Item>
            <Form.Item name="year" label="Nam">
              <InputNumber min={2000} className="full-width-input" placeholder="Tat ca nam" />
            </Form.Item>
          </div>
          <Space wrap>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Loc
            </Button>
            <Button onClick={clearFilters}>Xoa loc</Button>
          </Space>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={groupedExpenses}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>{editingExpense ? "Sua chi phi" : "Them chi phi"}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingExpense ? "Luu" : "Tao chi phi"}
        cancelText="Huy"
        width={editingExpense ? 760 : 980}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="form-grid">
            <Form.Item name="expenseDate" label="Ngay phat sinh">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="month" label="Thang" rules={[{ required: true }]}>
              <Select options={monthOptions} />
            </Form.Item>
            <Form.Item name="year" label="Nam" rules={[{ required: true }]}>
              <InputNumber min={2000} className="full-width-input" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          {editingExpense ? (
            <>
              <div className="form-grid">
                <Form.Item name="category" label="Loai chi phi" rules={[{ required: true }]}>
                  <Select options={categoryOptions} />
                </Form.Item>
                <Form.Item name="title" label="Tieu de" rules={[{ required: true }]}>
                  <Input placeholder="VD: Tien internet thang nay" />
                </Form.Item>
                <Form.Item name="amount" label="So tien" rules={[{ required: true }]}>
                  <InputNumber min={0} className="full-width-input" addonAfter="VND" />
                </Form.Item>
              </div>
              <Form.Item name="note" label="Ghi chu">
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          ) : (
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} className="page-stack">
                  <Table
                    rowKey="key"
                    columns={[
                      {
                        title: "Loai chi phi",
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, "category"]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select options={categoryOptions} />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Tieu de",
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, "title"]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "So tien",
                        width: 180,
                        render: (_, field) => (
                          <Form.Item name={[field.name, "amount"]} style={{ marginBottom: 0 }}>
                            <InputNumber min={0} className="full-width-input" addonAfter="VND" />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Ghi chu",
                        render: (_, field) => (
                          <Form.Item name={[field.name, "note"]} style={{ marginBottom: 0 }}>
                            <Input />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "",
                        width: 64,
                        render: (_, field) => (
                          <Button
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        ),
                      },
                    ]}
                    dataSource={fields}
                    pagination={false}
                    scroll={{ x: 850 }}
                  />
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        amount: 0,
                        category: "other",
                        note: "",
                        title: "",
                      })
                    }
                  >
                    Them dong
                  </Button>
                </Space>
              )}
            </Form.List>
          )}
        </Form>
      </Modal>

      <Modal
        title="Chi tiet chi phi"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetailGroupKey(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailOpen(false);
              setDetailGroupKey(null);
            }}
          >
            Dong
          </Button>,
        ]}
        width={1100}
      >
        {detailGroup && (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ky">
                {detailGroup.month}/{detailGroup.year}
              </Descriptions.Item>
              <Descriptions.Item label="Tong da chi">
                <Typography.Text strong>{currencyFormatter(detailGroup.paidAmount)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cho chi">
                {currencyFormatter(detailGroup.pendingAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Da huy">
                {currencyFormatter(detailGroup.cancelledAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="So khoan chi">
                {detailGroup.itemCount}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="id"
              columns={detailColumns}
              dataSource={detailGroup.items}
              pagination={false}
              scroll={{ x: 1200 }}
            />
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default OperatingExpenseManagementPage;
