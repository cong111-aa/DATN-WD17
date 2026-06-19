import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
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
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  area: 0,
  capacity: 1,
  deposit: 0,
  electricityPrice: 3500,
  floor: 1,
  serviceFee: 0,
  status: "available",
  waterPrice: 15000,
};

const statusOptions = [
  { label: "Con trong", value: "available" },
  { label: "Dang thue", value: "occupied" },
  { label: "Bao tri", value: "maintenance" },
];

const statusMeta = {
  available: { color: "success", label: "Con trong" },
  occupied: { color: "blue", label: "Dang thue" },
  maintenance: { color: "warning", label: "Bao tri" },
};

const currencyFormatter = (value) =>
  typeof value === "number" ? value.toLocaleString("vi-VN") : value || "-";

const RoomManagementPage = () => {
  const [form] = Form.useForm();
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const buildingOptions = useMemo(
    () =>
      buildings.map((building) => ({
        label: `${building.code} - ${building.name}`,
        value: building.id,
      })),
    [buildings]
  );

  const roomStatusOptions = useMemo(
    () =>
      statusOptions.map((option) => ({
        ...option,
        disabled: editingRoom?.status === "occupied" && option.value === "available",
      })),
    [editingRoom]
  );

  const fetchBuildings = async () => {
    try {
      const { data } = await http.get("/buildings");
      setBuildings(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach toa nha");
    }
  };

  const fetchRooms = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRoom(record);
    form.resetFields();
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingRoom) {
        await http.put(`/rooms/${editingRoom.id}`, values);
        message.success("Da cap nhat phong");
      } else {
        await http.post("/rooms", values);
        message.success("Da tao phong");
      }

      closeModal();
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu phong that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/rooms/${record.id}`);
      message.success("Da xoa phong");
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa phong that bai");
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
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{record.name}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Toa nha",
        dataIndex: "buildingName",
        key: "buildingName",
        render: (value, record) =>
          record.buildingCode ? `${record.buildingCode} - ${value}` : value || "-",
      },
      {
        title: "Tang",
        dataIndex: "floor",
        key: "floor",
        width: 90,
      },
      {
        title: "Dien tich",
        dataIndex: "area",
        key: "area",
        width: 110,
        render: (value) => `${value || 0} m2`,
      },
      {
        title: "Suc chua",
        dataIndex: "capacity",
        key: "capacity",
        width: 110,
      },
      {
        title: "Gia thue",
        dataIndex: "price",
        key: "price",
        render: (value) => currencyFormatter(value),
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.available;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Ngay tao",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => {
          const isOccupied = record.status === "occupied";

          return (
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Sua
              </Button>
              <Popconfirm
                title="Xoa phong nay?"
                description="Khong the xoa phong dang co nguoi thue."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isOccupied}
              >
                <Button danger icon={<DeleteOutlined />} disabled={isOccupied}>
                  Xoa
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly phong</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat hoac xoa phong theo tung toa nha.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Them phong
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rooms}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editingRoom ? "Sua phong" : "Them phong"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Luu" : "Tao phong"}
        cancelText="Huy"
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="building" label="Toa nha" rules={[{ required: true }]}>
            <Select
              options={buildingOptions}
              placeholder="Chon toa nha"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <div className="form-grid">
            <Form.Item name="roomNumber" label="So phong" rules={[{ required: true }]}>
              <Input placeholder="VD: 101" />
            </Form.Item>
            <Form.Item name="name" label="Ten phong" rules={[{ required: true }]}>
              <Input placeholder="VD: Phong 101" />
            </Form.Item>
            <Form.Item name="floor" label="Tang" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="area" label="Dien tich">
              <InputNumber min={0} className="full-width-input" addonAfter="m2" />
            </Form.Item>
            <Form.Item name="capacity" label="Suc chua" rules={[{ required: true }]}>
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="price" label="Gia thue" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="deposit" label="Tien coc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="serviceFee" label="Phi dich vu">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="electricityPrice" label="Gia dien">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="waterPrice" label="Gia nuoc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={roomStatusOptions} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default RoomManagementPage;
