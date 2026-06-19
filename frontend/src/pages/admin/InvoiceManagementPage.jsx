import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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

const statusOptions = [
  { label: "Chua thanh toan", value: "unpaid" },
  { label: "Thanh toan mot phan", value: "partial" },
  { label: "Da thanh toan", value: "paid" },
  { label: "Qua han", value: "overdue" },
];

const statusMeta = {
  unpaid: { color: "default", label: "Chua thanh toan" },
  partial: { color: "warning", label: "Thanh toan mot phan" },
  paid: { color: "success", label: "Da thanh toan" },
  overdue: { color: "error", label: "Qua han" },
};

const defaultFormValues = {
  discountAmount: 0,
  electricityAmount: 0,
  month: new Date().getMonth() + 1,
  otherAmount: 0,
  paidAmount: 0,
  rentAmount: 0,
  serviceAmount: 0,
  status: "unpaid",
  waterAmount: 0,
  year: new Date().getFullYear(),
};

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const toFormValues = (record) => ({
  ...record,
  dueDate: record.dueDate ? dayjs(record.dueDate) : undefined,
});

const toPayload = (values) => ({
  ...values,
  dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
});

const InvoiceManagementPage = () => {
  const [form] = Form.useForm();
  const [invoices, setInvoices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [meterReadingInfo, setMeterReadingInfo] = useState(null);
  const [calculatingUtilities, setCalculatingUtilities] = useState(false);
  const watchedRoom = Form.useWatch("room", form);
  const watchedMonth = Form.useWatch("month", form);
  const watchedYear = Form.useWatch("year", form);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.buildingCode || "Toa nha"} - ${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const tenantOptions = useMemo(
    () =>
      tenants.map((tenant) => ({
        label: `${tenant.userName} - ${tenant.roomNumber || "Chua co phong"} (${tenant.status === "active" ? "dang thue" : "da ket thuc"})`,
        room: tenant.room,
        user: tenant.user,
        value: `${tenant.user}-${tenant.room}-${tenant.id}`,
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

  const refreshAll = () => {
    fetchOptions();
    fetchInvoices();
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
    setMeterReadingInfo(null);
    form.resetFields();
  };

  const calculateUtilities = async ({ silent = false } = {}) => {
    const room = form.getFieldValue("room");
    const month = form.getFieldValue("month");
    const year = form.getFieldValue("year");

    if (!room || !month || !year) {
      if (!silent) {
        message.warning("Chon phong, thang va nam truoc khi tinh dien nuoc");
      }
      return;
    }

    setCalculatingUtilities(true);

    try {
      const { data } = await http.get("/meter-readings", {
        params: { room, month, year },
      });
      const reading = data?.[0];

      if (!reading) {
        setMeterReadingInfo(null);
        if (!silent) {
          message.info("Chua co chi so dien nuoc cho phong trong ky nay");
        }
        return;
      }

      const selectedRoom = rooms.find((item) => item.id === room);
      const electricityPrice = Number(selectedRoom?.electricityPrice || 0);
      const waterPrice = Number(selectedRoom?.waterPrice || 0);
      const electricityAmount = Number(reading.electricityUsage || 0) * electricityPrice;
      const waterAmount = Number(reading.waterUsage || 0) * waterPrice;

      form.setFieldsValue({
        electricityAmount,
        waterAmount,
      });
      setMeterReadingInfo({
        ...reading,
        electricityAmount,
        electricityPrice,
        waterAmount,
        waterPrice,
      });
      if (!silent) {
        message.success("Da tu tinh tien dien nuoc");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tinh duoc tien dien nuoc");
    } finally {
      setCalculatingUtilities(false);
    }
  };

  useEffect(() => {
    if (!modalOpen || !watchedRoom || !watchedMonth || !watchedYear) {
      return;
    }

    calculateUtilities({ silent: true });
  }, [modalOpen, watchedMonth, watchedRoom, watchedYear]);

  const handleTenantChange = (value) => {
    const selectedTenant = tenantOptions.find((item) => item.value === value);
    const selectedRoom = rooms.find((room) => room.id === selectedTenant?.room);

    form.setFieldsValue({
      room: selectedTenant?.room,
      tenant: selectedTenant?.user,
      rentAmount: selectedRoom?.price ?? form.getFieldValue("rentAmount"),
      serviceAmount: selectedRoom?.serviceFee ?? form.getFieldValue("serviceAmount"),
    });
    setMeterReadingInfo(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = toPayload(values);

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

  const handleStatusChange = async (record, status) => {
    try {
      await http.patch(`/invoices/${record.id}/status`, { status });
      message.success("Da cap nhat trang thai hoa don");
      fetchInvoices();
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
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
        title: "Ma hoa don",
        dataIndex: "invoiceCode",
        key: "invoiceCode",
        render: (value) => <Typography.Text strong>{value}</Typography.Text>,
      },
      {
        title: "Khach thue",
        dataIndex: "tenantName",
        key: "tenantName",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{value || "-"}</Typography.Text>
            <Typography.Text type="secondary">{record.tenantPhone || record.tenantEmail || "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Phong",
        dataIndex: "roomNumber",
        key: "roomNumber",
        render: (value, record) => `${record.buildingCode || "-"} - ${value || "-"} - ${record.roomName || "-"}`,
      },
      {
        title: "Ky",
        key: "period",
        render: (_, record) => `${record.month}/${record.year}`,
      },
      {
        title: "Tong tien",
        dataIndex: "totalAmount",
        key: "totalAmount",
        render: (value) => <Typography.Text strong>{currencyFormatter(value)}</Typography.Text>,
      },
      {
        title: "Da thanh toan",
        dataIndex: "paidAmount",
        key: "paidAmount",
        render: currencyFormatter,
      },
      {
        title: "Han TT",
        dataIndex: "dueDate",
        key: "dueDate",
        render: formatDate,
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status, record) => {
          const meta = statusMeta[status] || statusMeta.unpaid;

          return (
            <Select
              value={status}
              size="small"
              style={{ width: 160 }}
              options={statusOptions}
              onChange={(value) => handleStatusChange(record, value)}
              suffixIcon={null}
              popupMatchSelectWidth={false}
              optionRender={(option) => {
                const optionMeta = statusMeta[option.value] || statusMeta.unpaid;
                return <Tag color={optionMeta.color}>{optionMeta.label}</Tag>;
              }}
              labelRender={() => <Tag color={meta.color}>{meta.label}</Tag>}
            />
          );
        },
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
            <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Sua
            </Button>
            <Popconfirm
              title="Xoa hoa don nay?"
              description="Chi xoa duoc hoa don chua co thanh toan."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
              disabled={Number(record.paidAmount || 0) > 0}
            >
              <Button danger icon={<DeleteOutlined />} disabled={Number(record.paidAmount || 0) > 0}>
                Xoa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [tenantOptions]
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly hoa don</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat va xem chi tiet hoa don theo khach thue.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them hoa don
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>{editingInvoice ? "Sua hoa don" : "Them hoa don"}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingInvoice ? "Luu" : "Tao hoa don"}
        cancelText="Huy"
        width={860}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="tenantPicker" label="Chon khach thue">
            <Select
              options={tenantOptions}
              placeholder="Chon khach thue de tu dien phong"
              showSearch
              optionFilterProp="label"
              onChange={handleTenantChange}
            />
          </Form.Item>
          <Form.Item name="tenant" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
            <Select
              options={roomOptions}
              placeholder="Chon phong"
              showSearch
              optionFilterProp="label"
              onChange={() => setMeterReadingInfo(null)}
            />
          </Form.Item>

          <div className="form-grid">
            <Form.Item name="invoiceCode" label="Ma hoa don" rules={[{ required: true }]}>
              <Input placeholder="VD: HD-2026-001" />
            </Form.Item>
            <Form.Item name="dueDate" label="Han thanh toan">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="month" label="Thang" rules={[{ required: true }]}>
              <InputNumber min={1} max={12} className="full-width-input" onChange={() => setMeterReadingInfo(null)} />
            </Form.Item>
            <Form.Item name="year" label="Nam" rules={[{ required: true }]}>
              <InputNumber min={2000} className="full-width-input" onChange={() => setMeterReadingInfo(null)} />
            </Form.Item>
            <Form.Item name="rentAmount" label="Tien phong">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="electricityAmount" label="Tien dien">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="waterAmount" label="Tien nuoc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="serviceAmount" label="Phi dich vu">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="otherAmount" label="Chi phi khac">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="discountAmount" label="Giam tru">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="paidAmount" label="Da thanh toan">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai">
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          <Space direction="vertical" size={8} className="page-stack">
            <Button loading={calculatingUtilities} onClick={calculateUtilities}>
              Tu tinh tien dien nuoc
            </Button>
            {meterReadingInfo && (
              <Typography.Text type="secondary">
                Dien: {meterReadingInfo.electricityUsage} x {currencyFormatter(meterReadingInfo.electricityPrice)} ={" "}
                {currencyFormatter(meterReadingInfo.electricityAmount)}. Nuoc: {meterReadingInfo.waterUsage} x{" "}
                {currencyFormatter(meterReadingInfo.waterPrice)} = {currencyFormatter(meterReadingInfo.waterAmount)}.
              </Typography.Text>
            )}
          </Space>
          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={3} />
          </Form.Item>
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
        width={820}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ma hoa don">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={statusMeta[detailInvoice.status]?.color}>
                  {statusMeta[detailInvoice.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Khach thue">{detailInvoice.tenantName}</Descriptions.Item>
              <Descriptions.Item label="Lien he">
                {detailInvoice.tenantPhone || detailInvoice.tenantEmail || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phong">
                {detailInvoice.buildingCode} - {detailInvoice.roomNumber} - {detailInvoice.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Ky hoa don">
                {detailInvoice.month}/{detailInvoice.year}
              </Descriptions.Item>
              <Descriptions.Item label="Han thanh toan">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngay tao">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Chi tiet tien</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tien phong">{currencyFormatter(detailInvoice.rentAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tien dien">{currencyFormatter(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tien nuoc">{currencyFormatter(detailInvoice.waterAmount)}</Descriptions.Item>
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

            {detailInvoice.electricityUsage !== undefined && (
              <>
                <Divider orientation="left">Chi so dien nuoc</Divider>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="Dien cu">{detailInvoice.electricityOld}</Descriptions.Item>
                  <Descriptions.Item label="Dien moi">{detailInvoice.electricityNew}</Descriptions.Item>
                  <Descriptions.Item label="Dien tieu thu">{detailInvoice.electricityUsage}</Descriptions.Item>
                  <Descriptions.Item label="Tien dien">{currencyFormatter(detailInvoice.electricityAmount)}</Descriptions.Item>
                  <Descriptions.Item label="Nuoc cu">{detailInvoice.waterOld}</Descriptions.Item>
                  <Descriptions.Item label="Nuoc moi">{detailInvoice.waterNew}</Descriptions.Item>
                  <Descriptions.Item label="Nuoc tieu thu">{detailInvoice.waterUsage}</Descriptions.Item>
                  <Descriptions.Item label="Tien nuoc">{currencyFormatter(detailInvoice.waterAmount)}</Descriptions.Item>
                </Descriptions>
              </>
            )}

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
