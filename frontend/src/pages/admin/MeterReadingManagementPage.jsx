import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const now = new Date();

const defaultFormValues = {
  electricityNew: 0,
  electricityOld: 0,
  month: now.getMonth() + 1,
  waterNew: 0,
  waterOld: 0,
  year: now.getFullYear(),
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Thang ${index + 1}`,
  value: index + 1,
}));

const numberFormatter = (value) =>
  typeof value === "number" ? value.toLocaleString("vi-VN") : value || 0;

const getPreviousPeriod = (month, year) => {
  if (Number(month) === 1) {
    return { month: 12, year: Number(year) - 1 };
  }

  return { month: Number(month) - 1, year: Number(year) };
};

const MeterReadingManagementPage = () => {
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  const selectedFormRoom = Form.useWatch("room", form);
  const selectedFormMonth = Form.useWatch("month", form);
  const selectedFormYear = Form.useWatch("year", form);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const formRoomOptions = roomOptions;
  const filterRoomOptions = roomOptions;

  const fetchOptions = async () => {
    try {
      const { data: roomData } = await http.get("/rooms");
      setRooms(roomData);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc du lieu lua chon");
    }
  };

  const fetchReadings = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const { data } = await http.get("/meter-readings", { params: nextFilters });
      setReadings(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach dien nuoc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchReadings({});
  }, []);

  useEffect(() => {
    const loadPreviousReading = async () => {
      if (!modalOpen || editingReading || !selectedFormRoom || !selectedFormMonth || !selectedFormYear) {
        return;
      }

      const previousPeriod = getPreviousPeriod(selectedFormMonth, selectedFormYear);

      try {
        const { data } = await http.get("/meter-readings", {
          params: {
            room: selectedFormRoom,
            month: previousPeriod.month,
            year: previousPeriod.year,
          },
        });

        const previousReading = data[0];
        form.setFieldsValue({
          electricityOld: previousReading?.electricityNew ?? 0,
          waterOld: previousReading?.waterNew ?? 0,
        });
      } catch (error) {
        message.error(error.response?.data?.message || "Khong tai duoc chi so thang truoc");
      }
    };

    loadPreviousReading();
  }, [editingReading, form, modalOpen, selectedFormMonth, selectedFormRoom, selectedFormYear]);

  const refreshAll = () => {
    fetchOptions();
    fetchReadings(filters);
  };

  const openCreateModal = () => {
    setEditingReading(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingReading(record);
    form.resetFields();
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingReading(null);
    form.resetFields();
  };

  const handleFilter = (values) => {
    const nextFilters = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );

    setFilters(nextFilters);
    fetchReadings(nextFilters);
  };

  const clearFilters = () => {
    filterForm.resetFields();
    setFilters({});
    fetchReadings({});
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingReading) {
        await http.put(`/meter-readings/${editingReading.id}`, values);
        message.success("Da cap nhat chi so dien nuoc");
      } else {
        await http.post("/meter-readings", values);
        message.success("Da tao chi so dien nuoc");
      }

      closeModal();
      fetchReadings(filters);
    } catch (error) {
      message.error(error.response?.data?.message || "Luu chi so dien nuoc that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/meter-readings/${record.id}`);
      message.success("Da xoa chi so dien nuoc");
      fetchReadings(filters);
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa chi so dien nuoc that bai");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Phong",
        dataIndex: "roomNumber",
        key: "roomNumber",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value || "-"}</Typography.Text>
            <Typography.Text type="secondary">{record.roomName || "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Ky",
        key: "period",
        render: (_, record) => `${record.month}/${record.year}`,
      },
      {
        title: "Dien cu",
        dataIndex: "electricityOld",
        key: "electricityOld",
        render: numberFormatter,
      },
      {
        title: "Dien moi",
        dataIndex: "electricityNew",
        key: "electricityNew",
        render: numberFormatter,
      },
      {
        title: "Dien dung",
        dataIndex: "electricityUsage",
        key: "electricityUsage",
        render: numberFormatter,
      },
      {
        title: "Nuoc cu",
        dataIndex: "waterOld",
        key: "waterOld",
        render: numberFormatter,
      },
      {
        title: "Nuoc moi",
        dataIndex: "waterNew",
        key: "waterNew",
        render: numberFormatter,
      },
      {
        title: "Nuoc dung",
        dataIndex: "waterUsage",
        key: "waterUsage",
        render: numberFormatter,
      },
      {
        title: "Ghi chu",
        dataIndex: "note",
        key: "note",
        ellipsis: true,
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
              title="Xoa chi so nay?"
              description="Hanh dong nay khong the hoan tac."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger icon={<DeleteOutlined />}>
                Xoa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly dien nuoc</Typography.Title>
          <Typography.Text type="secondary">
            Ghi nhan chi so dien nuoc theo phong, thang va nam.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them chi so
          </Button>
        </Space>
      </div>

      <Card>
        <Form form={filterForm} layout="vertical" onFinish={handleFilter}>
          <div className="form-grid">
            <Form.Item name="room" label="Phong">
              <Select
                allowClear
                options={filterRoomOptions}
                placeholder="Tat ca phong"
                showSearch
                optionFilterProp="label"
              />
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
          rowKey="id"
          columns={columns}
          dataSource={readings}
          loading={loading}
          scroll={{ x: 1450 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            <span>{editingReading ? "Sua chi so dien nuoc" : "Them chi so dien nuoc"}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingReading ? "Luu" : "Tao chi so"}
        cancelText="Huy"
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
            <Select
              options={formRoomOptions}
              placeholder="Chon phong"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <div className="form-grid">
            <Form.Item name="month" label="Thang" rules={[{ required: true }]}>
              <Select options={monthOptions} />
            </Form.Item>
            <Form.Item name="year" label="Nam" rules={[{ required: true }]}>
              <InputNumber min={2000} className="full-width-input" />
            </Form.Item>
            <Form.Item name="electricityOld" label="Dien cu" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="electricityNew" label="Dien moi" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="waterOld" label="Nuoc cu" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="waterNew" label="Nuoc moi" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
          </div>

          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default MeterReadingManagementPage;
