import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
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
  status: "active",
  totalFloors: 1,
};

const statusOptions = [
  { label: "Hoat dong", value: "active" },
  { label: "Tam ngung", value: "inactive" },
];

const BuildingManagementPage = () => {
  const [form] = Form.useForm();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);

  const fetchBuildings = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/buildings");
      setBuildings(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach toa nha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openCreateModal = () => {
    setEditingBuilding(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingBuilding(record);
    form.resetFields();
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBuilding(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingBuilding) {
        await http.put(`/buildings/${editingBuilding.id}`, values);
        message.success("Da cap nhat toa nha");
      } else {
        await http.post("/buildings", values);
        message.success("Da tao toa nha");
      }

      closeModal();
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu toa nha that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "active" ? "inactive" : "active";

    try {
      await http.patch(`/buildings/${record.id}/status`, { status: nextStatus });
      message.success(nextStatus === "active" ? "Da mo hoat dong toa nha" : "Da tam ngung toa nha");
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/buildings/${record.id}`);
      message.success("Da xoa toa nha");
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa toa nha that bai");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Ten toa nha",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Ma toa nha",
        dataIndex: "code",
        key: "code",
      },
      {
        title: "Dia chi",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
      },
      {
        title: "So tang",
        dataIndex: "totalFloors",
        key: "totalFloors",
        width: 100,
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag color={status === "active" ? "success" : "default"}>
            {status === "active" ? "Hoat dong" : "Tam ngung"}
          </Tag>
        ),
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
          const isActive = record.status === "active";

          return (
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Sua
              </Button>
              <Button
                icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => handleToggleStatus(record)}
              >
                {isActive ? "Tam ngung" : "Mo lai"}
              </Button>
              <Popconfirm
                title="Xoa toa nha nay?"
                description="Chi xoa duoc toa nha chua co phong."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
              >
                <Button danger icon={<DeleteOutlined />}>
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
          <Typography.Title level={3}>Quan ly toa nha</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat, tam ngung hoac xoa toa nha trong he thong.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Them toa nha
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={buildings}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editingBuilding ? "Sua toa nha" : "Them toa nha"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingBuilding ? "Luu" : "Tao toa nha"}
        cancelText="Huy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Ten toa nha" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Ma toa nha" rules={[{ required: true }]}>
            <Input placeholder="VD: TN-A" />
          </Form.Item>
          <Form.Item name="address" label="Dia chi" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="form-grid">
            <Form.Item
              name="totalFloors"
              label="Tong so tang"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
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

export default BuildingManagementPage;
