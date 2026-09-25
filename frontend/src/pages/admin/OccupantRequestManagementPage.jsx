import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusMeta = {
  approved: { color: "success", label: "Da duyet" },
  pending: { color: "warning", label: "Cho xu ly" },
  rejected: { color: "error", label: "Da tu choi" },
};

const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const OccupantRequestManagementPage = () => {
  const [actionForm] = Form.useForm();
  const [actionModal, setActionModal] = useState({ open: false, record: null, type: "" });
  const [detailRecord, setDetailRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pendingCount = useMemo(() => requests.filter((item) => item.status === "pending").length, [requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/occupant-requests");
      setRequests(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc yeu cau them nguoi o");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openActionModal = (record, type) => {
    actionForm.resetFields();
    setActionModal({ open: true, record, type });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, record: null, type: "" });
    actionForm.resetFields();
  };

  const handleSubmitAction = async (values) => {
    if (!actionModal.record || !actionModal.type) return;

    setSubmitting(true);
    try {
      await http.patch(`/occupant-requests/${actionModal.record.id}/${actionModal.type}`, {
        adminNote: values.adminNote || "",
      });
      message.success(actionModal.type === "approve" ? "Da duyet yeu cau" : "Da tu choi yeu cau");
      closeActionModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xu ly yeu cau that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Nguoi yeu cau",
      dataIndex: "requestedByName",
      key: "requestedByName",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value || "-"}</Typography.Text>
          <Typography.Text type="secondary">{record.requestedByPhone || record.requestedByEmail || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Phong",
      key: "room",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>Phong {record.roomNumber || "-"}</Typography.Text>
          <Typography.Text type="secondary">
            {record.roomName || "-"} - Toi da {record.roomCapacity || "-"} nguoi
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Nguoi o moi",
      key: "occupant",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">{record.phone} - CCCD {record.identityNumber}</Typography.Text>
        </Space>
      ),
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
      title: "Ngay gui",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tac",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
            Chi tiet
          </Button>
          {record.status === "pending" && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => openActionModal(record, "approve")}>
                Duyet
              </Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => openActionModal(record, "reject")}>
                Tu choi
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Yeu cau them nguoi o</span>
            <Tag color="warning">{pendingCount} cho xu ly</Tag>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchRequests}>
            Tai lai
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          locale={{ emptyText: <Empty description="Chua co yeu cau them nguoi o" /> }}
          pagination={{ pageSize: 8 }}
          rowKey="id"
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal footer={null} onCancel={() => setDetailRecord(null)} open={Boolean(detailRecord)} title="Chi tiet yeu cau" width={820}>
        {detailRecord && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Nguoi gui">{detailRecord.requestedByName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phong">Phong {detailRecord.roomNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nguoi o moi">{detailRecord.name}</Descriptions.Item>
              <Descriptions.Item label="So dien thoai">{detailRecord.phone}</Descriptions.Item>
              <Descriptions.Item label="So CCCD">{detailRecord.identityNumber}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={statusMeta[detailRecord.status]?.color}>{statusMeta[detailRecord.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chu user" span={2}>
                {detailRecord.note || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chu admin" span={2}>
                {detailRecord.adminNote || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Image.PreviewGroup>
              <Space wrap>
                <Image height={180} src={toImageUrl(detailRecord.identityFrontImage)} style={{ borderRadius: 8, objectFit: "cover" }} width={260} />
                <Image height={180} src={toImageUrl(detailRecord.identityBackImage)} style={{ borderRadius: 8, objectFit: "cover" }} width={260} />
              </Space>
            </Image.PreviewGroup>
          </Space>
        )}
      </Modal>

      <Modal
        confirmLoading={submitting}
        okText={actionModal.type === "approve" ? "Duyet" : "Tu choi"}
        onCancel={closeActionModal}
        onOk={() => actionForm.submit()}
        open={actionModal.open}
        title={actionModal.type === "approve" ? "Duyet yeu cau them nguoi o" : "Tu choi yeu cau them nguoi o"}
      >
        <Form form={actionForm} layout="vertical" onFinish={handleSubmitAction}>
          <Form.Item name="adminNote" label="Ghi chu admin">
            <Input.TextArea rows={4} placeholder="Nhap ghi chu neu can" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OccupantRequestManagementPage;
