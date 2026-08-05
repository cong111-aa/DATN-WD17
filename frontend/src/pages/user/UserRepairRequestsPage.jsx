import { DeleteOutlined, EditOutlined, ToolOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Descriptions, Form, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import http from "../../api/http";

const { Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

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

const UserRepairRequestsPage = () => {
  const [repairForm] = Form.useForm();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const [tenancies, setTenancies] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [editingRepairRequest, setEditingRepairRequest] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenRes, repRes] = await Promise.all([
        http.get("/me/tenancies"),
        http.get("/me/repair-requests"),
      ]);
      setTenancies(tenRes.data || []);
      setRepairRequests(repRes.data || []);
      if (outletContext?.refreshBadgeCounts) {
        outletContext.refreshBadgeCounts();
      }
    } catch (err) {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRepairModal = () => {
    setEditingRepairRequest(null);
    setRepairImageFileList([]);
    repairForm.resetFields();
    setRepairModalOpen(true);
  };

  const openEditRepairModal = (request) => {
    setEditingRepairRequest(request);
    setRepairImageFileList(toRepairImageFileList(request.images || []));
    repairForm.setFieldsValue({
      room: request.room,
      priority: request.priority,
      requestedResolveDate: request.requestedResolveDate ? dayjs(request.requestedResolveDate) : null,
      title: request.title,
      description: request.description,
    });
    setRepairModalOpen(true);
  };

  const closeRepairModal = () => {
    setRepairModalOpen(false);
    setEditingRepairRequest(null);
    setRepairImageFileList([]);
    repairForm.resetFields();
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
      message.error(error.response?.data?.message || "Upload ảnh sự cố thất bại");
      onError(error);
    }
  };

  const handleCreateRepairRequest = async (values) => {
    setRepairSubmitting(true);

    try {
      const payload = {
        ...values,
        images: toUploadedImageUrls(repairImageFileList),
        requestedResolveDate: values.requestedResolveDate
          ? values.requestedResolveDate.toISOString()
          : null,
      };

      if (editingRepairRequest) {
        await http.put(`/me/repair-requests/${editingRepairRequest.id}`, payload);
        message.success("Đã cập nhật sự cố");
      } else {
        await http.post("/me/repair-requests", payload);
        message.success("Đã gửi báo cáo sự cố");
      }

      closeRepairModal();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi báo cáo sự cố thất bại");
    } finally {
      setRepairSubmitting(false);
    }
  };

  const handleViewRepairRequest = async (request) => {
    try {
      const { data } = await http.get(`/me/repair-requests/${request.id}`);
      setDetailRepairRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết sự cố");
    }
  };

  const handleDeleteRepairRequest = async (request) => {
    try {
      await http.delete(`/me/repair-requests/${request.id}`);
      message.success("Đã xóa sự cố");
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa sự cố thất bại");
    }
  };

  const repairRequestColumns = [
    {
      title: "Tiêu đề sự cố",
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = repairPriorityMeta[priority] || repairPriorityMeta.medium;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = repairStatusMeta[status] || repairStatusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày báo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => handleViewRepairRequest(record)} style={{ borderRadius: 6 }}>
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
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon"><ToolOutlined /></div>
            <span>Báo cáo sự cố thiết bị</span>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<ToolOutlined />}
              onClick={openRepairModal}
              disabled={activeRoomOptions.length === 0}
              style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 600 }}
            >
              Báo sự cố mới
            </Button>
            <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>← Về trang chủ</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={repairRequestColumns}
          dataSource={repairRequests}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
          locale={{ emptyText: "Chưa có báo cáo sự cố" }}
        />
      </div>

      {/* Repair Request Modal */}
      <Modal
        title={editingRepairRequest ? "Sửa Báo Cáo Sự Cố" : "Báo Cáo Sự Cố Thiết Bị"}
        open={repairModalOpen}
        onCancel={closeRepairModal}
        onOk={() => repairForm.submit()}
        confirmLoading={repairSubmitting}
        okText={editingRepairRequest ? "Cập nhật" : "Gửi báo cáo"}
        cancelText="Hủy"
        width={720}
        okButtonProps={{ style: { background: "#0f766e", borderColor: "#0f766e" } }}
      >
        <Form form={repairForm} layout="vertical" onFinish={handleCreateRepairRequest}>
          <div className="form-grid">
            <Form.Item name="room" label="Chọn phòng trọ" rules={[{ required: true, message: "Chọn phòng trọ đang ở" }]}>
              <Select options={activeRoomOptions} placeholder="Chọn phòng" />
            </Form.Item>
            <Form.Item name="priority" label="Mức độ khẩn cấp" rules={[{ required: true }]}>
              <Select options={repairPriorityOptions} />
            </Form.Item>
            <Form.Item name="requestedResolveDate" label="Ngày mong muốn hỗ trợ">
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Tiêu đề sự cố" rules={[{ required: true, message: "Nhập tiêu đề sự cố" }]}>
            <Input placeholder="VD: Máy giặt tầng 2 không vắt, vòi nước rò rỉ" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true, message: "Mô tả sự cố" }]}>
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết để kỹ thuật viên chuẩn bị..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="Hình ảnh hiện trạng sự cố">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleRepairImageUpload}
              fileList={repairImageFileList}
              listType="picture-card"
              multiple
              onChange={({ fileList }) => setRepairImageFileList(fileList)}
            >
              {repairImageFileList.length >= 10 ? null : (
                <button type="button" className="upload-card-button">
                  <UploadOutlined />
                  <span>Tải ảnh</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Repair Detail Modal */}
      <Modal
        title="Chi Tiết Báo Cáo Sự Cố"
        open={Boolean(detailRepairRequest)}
        onCancel={() => setDetailRepairRequest(null)}
        footer={[<Button key="close" onClick={() => setDetailRepairRequest(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={760}
      >
        {detailRepairRequest && (
          <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
            <Descriptions.Item label="Tiêu đề" span={2}><Text strong>{detailRepairRequest.title}</Text></Descriptions.Item>
            <Descriptions.Item label="Phòng">Phòng {detailRepairRequest.roomNumber}</Descriptions.Item>
            <Descriptions.Item label="Mức độ">
              <Tag color={repairPriorityMeta[detailRepairRequest.priority]?.color}>{repairPriorityMeta[detailRepairRequest.priority]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={repairStatusMeta[detailRepairRequest.status]?.color}>{repairStatusMeta[detailRepairRequest.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày gửi">{formatDate(detailRepairRequest.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Mô tả sự cố" span={2}>{detailRepairRequest.description}</Descriptions.Item>
            <Descriptions.Item label="Phản hồi từ chủ trọ" span={2}>{detailRepairRequest.adminNote || "Chưa có phản hồi mới."}</Descriptions.Item>
            <Descriptions.Item label="Ảnh sự cố" span={2}>
              {(detailRepairRequest.images || []).length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailRepairRequest.images.map((image) => (
                      <Image key={image} src={toImageUrl(image)} width={120} height={86} style={{ objectFit: "cover", borderRadius: 8 }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserRepairRequestsPage;
