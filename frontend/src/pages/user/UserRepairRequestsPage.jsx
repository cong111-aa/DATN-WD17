import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ToolOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
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
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const { Title, Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chưa xử lý");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const repairPriorityOptions = [
  { label: "Thấp", value: "low" },
  { label: "Trung bình", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khẩn cấp", value: "urgent" },
];

const repairPriorityMeta = {
  low: { color: "default", label: "Thấp" },
  medium: { color: "blue", label: "Trung bình" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khẩn cấp" },
};

const repairStatusMeta = {
  pending: { color: "warning", label: "Chờ xử lý" },
  processing: { color: "processing", label: "Đang xử lý" },
  resolved: { color: "success", label: "Đã xử lý" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const toUploadedImageUrls = (fileList = []) =>
  fileList.flatMap((file) => file.response?.urls || (file.rawUrl ? [file.rawUrl] : file.url ? [file.url] : []));

const toRepairImageFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    rawUrl: url,
    status: "done",
    url: toImageUrl(url),
  }));

const UserRepairRequestsPage = () => {
  const [repairForm] = Form.useForm();
  const [repairRequests, setRepairRequests] = useState([]);
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [editingRepairRequest, setEditingRepairRequest] = useState(null);
  const [detailRepairRequest, setDetailRepairRequest] = useState(null);
  const [repairImageFileList, setRepairImageFileList] = useState([]);

  const activeTenancies = useMemo(
    () => tenancies.filter((tenancy) => tenancy.status === "active"),
    [tenancies]
  );

  const activeRoomOptions = useMemo(
    () =>
      activeTenancies.map((tenancy) => ({
        label: `Phòng ${tenancy.roomNumber} - ${tenancy.roomName}`,
        value: tenancy.room,
      })),
    [activeTenancies]
  );

  const fetchRepairRequests = async () => {
    setLoading(true);
    try {
      const [{ data: repairData }, { data: tenancyData }] = await Promise.all([
        http.get("/me/repair-requests"),
        http.get("/me/tenancies"),
      ]);
      setRepairRequests(repairData || []);
      setTenancies(tenancyData || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được dữ liệu báo sự cố");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairRequests();
  }, []);

  const openRepairModal = () => {
    setEditingRepairRequest(null);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      priority: "medium",
      room: activeRoomOptions[0]?.value,
    });
    setRepairImageFileList([]);
    setRepairModalOpen(true);
  };

  const openEditRepairModal = (request) => {
    setEditingRepairRequest(request);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      description: request.description,
      priority: request.priority,
      room: request.room,
      title: request.title,
    });
    setRepairImageFileList(toRepairImageFileList(request.images || []));
    setRepairModalOpen(true);
  };

  const closeRepairModal = () => {
    setRepairModalOpen(false);
    setEditingRepairRequest(null);
    repairForm.resetFields();
    setRepairImageFileList([]);
  };

  const handleRepairImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);
    try {
      const { data } = await http.post("/uploads/repair-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload hình ảnh hư hỏng thất bại");
      onError(error);
    }
  };

  const handleRepairSubmit = async (values) => {
    setRepairSubmitting(true);
    try {
      const payload = {
        description: values.description,
        images: toUploadedImageUrls(repairImageFileList),
        priority: values.priority,
        room: values.room,
        title: values.title,
      };

      if (editingRepairRequest) {
        await http.put(`/me/repair-requests/${editingRepairRequest.id}`, payload);
        message.success("Đã cập nhật báo cáo sự cố");
      } else {
        await http.post("/me/repair-requests", payload);
        message.success("Đã gửi báo cáo sự cố thành công");
      }
      closeRepairModal();
      fetchRepairRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi báo cáo sự cố thất bại");
    } finally {
      setRepairSubmitting(false);
    }
  };

  const handleDeleteRepairRequest = async (request) => {
    try {
      await http.delete(`/me/repair-requests/${request.id}`);
      message.success("Đã xóa báo cáo sự cố");
      fetchRepairRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa báo cáo sự cố thất bại");
    }
  };

  const repairRequestColumns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => `Phòng ${record.roomNumber} - ${record.roomName}`,
    },
    {
      title: "Độ ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (p) => <Tag color={repairPriorityMeta[p]?.color}>{repairPriorityMeta[p]?.label || p}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={repairStatusMeta[s]?.color}>{repairStatusMeta[s]?.label || s}</Tag>,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRepairRequest(record)} style={{ borderRadius: 6 }}>
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditRepairModal(record)}
            disabled={record.status !== "pending"}
            style={{ borderRadius: 6 }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa báo cáo sự cố này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteRepairRequest(record)}
            disabled={record.status !== "pending"}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.status !== "pending"} style={{ borderRadius: 6 }}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Space>
              <ToolOutlined style={{ color: "#e11d48", fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>
                Quản lý Báo sự cố & Sửa chữa
              </Title>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openRepairModal}
              disabled={activeRoomOptions.length === 0}
              style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 600 }}
            >
              Tạo báo sự cố mới
            </Button>
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={repairRequestColumns}
          dataSource={repairRequests}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 950 }}
          locale={{ emptyText: "Chưa có báo cáo sự cố" }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>

      {/* Repair Modal */}
      <Modal
        title={editingRepairRequest ? "Cập Nhật Báo Sự Cố" : "Báo Sự Cố Mới"}
        open={repairModalOpen}
        onCancel={closeRepairModal}
        footer={null}
        destroyOnClose
        width={650}
      >
        <Form form={repairForm} layout="vertical" onFinish={handleRepairSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="room" label="Phòng trọ xảy ra sự cố" rules={[{ required: true, message: "Chọn phòng" }]}>
            <Select options={activeRoomOptions} placeholder="Chọn phòng" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề sự cố" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
            <Input placeholder="Ví dụ: Hư bóng đèn phòng khách, Nghẹt cống nhà vệ sinh..." size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên" rules={[{ required: true, message: "Chọn độ ưu tiên" }]}>
            <Select options={repairPriorityOptions} size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết sự cố" rules={[{ required: true, message: "Nhập mô tả chi tiết" }]}>
            <Input.TextArea rows={4} placeholder="Mô tả hiện trạng hư hỏng..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="Hình ảnh thực tế hư hỏng">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleRepairImageUpload}
              fileList={repairImageFileList}
              listType="picture-card"
              maxCount={5}
              onChange={({ fileList }) => setRepairImageFileList(fileList)}
            >
              {repairImageFileList.length >= 5 ? null : (
                <button type="button" className="upload-card-button">
                  <UploadOutlined />
                  <span>Tải ảnh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
            <Button onClick={closeRepairModal} style={{ borderRadius: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={repairSubmitting} style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 600 }}>
              {editingRepairRequest ? "Cập nhật" : "Gửi yêu cầu"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Repair Detail Modal */}
      <Modal
        title="Chi Tiết Báo Cáo Sự Cố"
        open={Boolean(detailRepairRequest)}
        onCancel={() => setDetailRepairRequest(null)}
        footer={[<Button key="close" onClick={() => setDetailRepairRequest(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={750}
      >
        {detailRepairRequest && (
          <div>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Tiêu đề">{detailRepairRequest.title}</Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {detailRepairRequest.roomNumber} - {detailRepairRequest.roomName}</Descriptions.Item>
              <Descriptions.Item label="Ưu tiên">
                <Tag color={repairPriorityMeta[detailRepairRequest.priority]?.color}>{repairPriorityMeta[detailRepairRequest.priority]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={repairStatusMeta[detailRepairRequest.status]?.color}>{repairStatusMeta[detailRepairRequest.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(detailRepairRequest.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày xử lý xong">{formatResolvedDate(detailRepairRequest.resolvedAt)}</Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>{detailRepairRequest.description}</Descriptions.Item>
              <Descriptions.Item label="Phản hồi chủ nhà" span={2}>{detailRepairRequest.notes || "Chưa có ghi chú phản hồi"}</Descriptions.Item>
            </Descriptions>

            {detailRepairRequest.images && detailRepairRequest.images.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Hình ảnh đính kèm:</Title>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {detailRepairRequest.images.map((img, idx) => (
                    <Image key={idx} width={100} height={100} src={toImageUrl(img)} style={{ borderRadius: 8, objectFit: "cover" }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserRepairRequestsPage;
