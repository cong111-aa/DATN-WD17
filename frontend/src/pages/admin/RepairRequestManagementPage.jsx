import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Image,
  Input,
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

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const priorityOptions = [
  { label: "Thap", value: "low" },
  { label: "Trung binh", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khan cap", value: "urgent" },
];

const priorityMeta = {
  low: { color: "default", label: "Thap" },
  medium: { color: "blue", label: "Trung binh" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khan cap" },
};

const statusOptions = [
  { label: "Cho xu ly", value: "pending" },
  { label: "Dang xu ly", value: "processing" },
  { label: "Da xu ly", value: "resolved" },
  { label: "Da huy", value: "cancelled" },
];

const statusMeta = {
  pending: { color: "warning", label: "Cho xu ly" },
  processing: { color: "processing", label: "Dang xu ly" },
  resolved: { color: "success", label: "Da xu ly" },
  cancelled: { color: "default", label: "Da huy" },
};

const creatorRoleMeta = {
  admin: { color: "purple", label: "Admin" },
  user: { color: "green", label: "Nguoi dung" },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chua xu ly");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toFormValues = (record) => ({
  adminNote: record.adminNote,
  description: record.description,
  priority: record.priority,
  resolvedAt: record.resolvedAt ? dayjs(record.resolvedAt) : undefined,
  room: record.room,
  status: record.status,
  title: record.title,
});

const toPayload = (values) => ({
  ...values,
  resolvedAt: values.resolvedAt ? values.resolvedAt.toISOString() : undefined,
});

const RepairRequestManagementPage = () => {
  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.roomNumber} - ${room.name}`,
        value: room.id,
      })),
    [rooms]
  );

  const fetchRooms = async () => {
    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
    }
  };

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/repair-requests");
      setRequests(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach su co");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRequests();
  }, []);

  const refreshAll = () => {
    fetchRooms();
    fetchRequests();
  };

  const openEditModal = (record) => {
    setEditingRequest(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRequest(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      await http.put(`/repair-requests/${editingRequest.id}`, toPayload(values));
      message.success("Da cap nhat xu ly su co");

      closeModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu su co that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/repair-requests/${record.id}`);
      setDetailRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet su co");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/repair-requests/${record.id}`);
      message.success("Da xoa su co");
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa su co that bai");
    }
  };

  const columns = [
    {
      title: "Su co",
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.roomNumber || "-"} - {record.roomName || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Nguoi tao",
      key: "creator",
      render: (_, record) => {
        const roleMeta = creatorRoleMeta[record.createdByRole] || creatorRoleMeta.user;

        return (
          <Space direction="vertical" size={0}>
            <Typography.Text>{record.createdByName || record.tenantName || "-"}</Typography.Text>
            <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Muc do",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = priorityMeta[priority] || priorityMeta.medium;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = statusMeta[status] || statusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngay tao",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Ngay mong muon",
      dataIndex: "requestedResolveDate",
      key: "requestedResolveDate",
      render: formatDate,
    },
    {
      title: "Ngay xu ly",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: formatResolvedDate,
    },
    {
      title: "Anh",
      dataIndex: "images",
      key: "images",
      render: (images = []) => `${images.length || 0} anh`,
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
            title="Xoa su co nay?"
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
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly su co</Typography.Title>
          <Typography.Text type="secondary">
            Theo doi su co do nguoi dung bao cao va cap nhat ket qua xu ly.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={requests}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Chua co su co" }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <ToolOutlined />
            <span>Cap nhat xu ly su co</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Luu"
        cancelText="Huy"
        width={780}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="form-grid">
            <Form.Item name="priority" label="Muc do" rules={[{ required: true }]}>
              <Select options={priorityOptions} />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="resolvedAt" label="Ngay xu ly">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Ngay user mong muon">
              <Input
                disabled
                value={formatDate(editingRequest?.requestedResolveDate)}
              />
            </Form.Item>
            <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
              <Select options={roomOptions} showSearch optionFilterProp="label" placeholder="Chon phong" />
            </Form.Item>
            <Form.Item label="Nguoi tao">
              <Input
                disabled
                value={
                  editingRequest
                    ? `${editingRequest.createdByName || editingRequest.tenantName || "-"} (${creatorRoleMeta[editingRequest.createdByRole]?.label || "-"})`
                    : ""
                }
              />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Tieu de" rules={[{ required: true }]}>
            <Input placeholder="VD: Dieu hoa khong lanh" />
          </Form.Item>
          <Form.Item name="description" label="Mo ta su co" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="adminNote" label="Ghi chu xu ly">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Anh su co">
            {(editingRequest?.images || []).length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {editingRequest.images.map((image) => (
                    <Image
                      key={image}
                      src={toImageUrl(image)}
                      width={120}
                      height={86}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">Khong co anh</Typography.Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiet su co"
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Dong
          </Button>,
        ]}
        width={820}
      >
        {detailRequest && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Tieu de" span={2}>
              {detailRequest.title}
            </Descriptions.Item>
            <Descriptions.Item label="Phong">
              {detailRequest.roomNumber} - {detailRequest.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Nguoi tao">
              {detailRequest.createdByName || detailRequest.tenantName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vai tro nguoi tao">
              <Tag color={creatorRoleMeta[detailRequest.createdByRole]?.color}>
                {creatorRoleMeta[detailRequest.createdByRole]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Muc do">
              <Tag color={priorityMeta[detailRequest.priority]?.color}>
                {priorityMeta[detailRequest.priority]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trang thai">
              <Tag color={statusMeta[detailRequest.status]?.color}>
                {statusMeta[detailRequest.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngay tao">{formatDate(detailRequest.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Ngay user mong muon">
              {formatDate(detailRequest.requestedResolveDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngay xu ly">{formatResolvedDate(detailRequest.resolvedAt)}</Descriptions.Item>
            <Descriptions.Item label="Mo ta" span={2}>
              {detailRequest.description}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chu xu ly" span={2}>
              {detailRequest.adminNote || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Anh su co" span={2}>
              {(detailRequest.images || []).length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailRequest.images.map((image) => (
                      <Image
                        key={image}
                        src={toImageUrl(image)}
                        width={120}
                        height={86}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
};

export default RepairRequestManagementPage;
