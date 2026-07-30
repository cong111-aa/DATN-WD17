import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const requestTypeMeta = {
  hold_deposit: { color: "gold", label: "Giu phong" },
  rent: { color: "blue", label: "Thue phong" },
};

const requestStatusMeta = {
  pending: { color: "processing", label: "Cho xac nhan" },
  approved: { color: "success", label: "Da xac nhan" },
  rejected: { color: "error", label: "Tu choi" },
  cancelled: { color: "default", label: "Da huy" },
  expired: { color: "warning", label: "Het han" },
};

const paymentStatusMeta = {
  unpaid: { color: "default", label: "Chua thanh toan" },
  pending: { color: "processing", label: "Dang thanh toan" },
  paid: { color: "success", label: "Da thanh toan" },
  failed: { color: "error", label: "That bai" },
  cancelled: { color: "default", label: "Da huy" },
};

const RoomRequestManagementPage = () => {
  const [processForm] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [paymentConfirmRequest, setPaymentConfirmRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [processAction, setProcessAction] = useState("approve");
  const [processLoading, setProcessLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const stats = useMemo(
    () => ({
      approved: requests.filter((item) => item.status === "approved").length,
      pending: requests.filter((item) => item.status === "pending").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
      total: requests.length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((item) => {
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        const matchType = typeFilter === "all" || item.type === typeFilter;
        return matchStatus && matchType;
      }),
    [requests, statusFilter, typeFilter]
  );

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/room-requests");
      setRequests(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach yeu cau phong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openProcessModal = (action, request) => {
    setProcessAction(action);
    setProcessingRequest(request);
    processForm.resetFields();
  };

  const closeProcessModal = () => {
    setProcessingRequest(null);
    processForm.resetFields();
  };

  const closePaymentConfirmModal = () => {
    setPaymentConfirmRequest(null);
    processForm.resetFields();
  };

  const handleConfirmPayment = async (values) => {
    if (!paymentConfirmRequest) {
      return;
    }

    setProcessLoading(true);

    try {
      await http.patch(`/room-requests/${paymentConfirmRequest.id}/payment/paid`, {
        adminNote: values.adminNote,
      });
      message.success("Da xac nhan thanh toan");
      closePaymentConfirmModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xac nhan thanh toan that bai");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleProcessRequest = async (values) => {
    if (!processingRequest) {
      return;
    }

    setProcessLoading(true);

    try {
      await http.patch(`/room-requests/${processingRequest.id}/${processAction}`, {
        adminNote: values.adminNote,
      });
      message.success(processAction === "approve" ? "Da xac nhan yeu cau" : "Da tu choi yeu cau");
      closeProcessModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xu ly yeu cau that bai");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleOpenContractFile = async (request) => {
    if (!request.contract) {
      message.warning("Yeu cau nay chua tao hop dong");
      return;
    }

    try {
      const { data } = await http.get(`/contracts/${request.contract}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong mo duoc hop dong");
    }
  };

  const columns = [
    {
      title: "Ma yeu cau",
      dataIndex: "requestCode",
      key: "requestCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.userName || "-"} - {record.userPhone || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Phong",
      key: "room",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.roomNumber || "-"}</Typography.Text>
          <Typography.Text type="secondary">{record.roomName || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Loai",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const meta = requestTypeMeta[type] || requestTypeMeta.rent;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "So tien",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
    },
    {
      title: "Thanh toan",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => {
        const meta = paymentStatusMeta[status] || paymentStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = requestStatusMeta[status] || requestStatusMeta.pending;
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
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => setDetailRequest(record)}>
            Chi tiet
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => openProcessModal("approve", record)}
            disabled={record.status !== "pending" || record.paymentStatus !== "paid"}
          >
            Xac nhan
          </Button>
          <Button onClick={() => handleOpenContractFile(record)} disabled={!record.contract}>
            Hop dong
          </Button>
          <Button
            onClick={() => setPaymentConfirmRequest(record)}
            disabled={record.status !== "pending" || record.paymentStatus === "paid"}
          >
            Da nhan tien
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openProcessModal("reject", record)}
            disabled={record.status !== "pending"}
          >
            Tu choi
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly yeu cau phong</Typography.Title>
          <Typography.Text type="secondary">
            Xem, xac nhan hoac tu choi yeu cau dat coc giu phong va thue phong cua nguoi dung.
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchRequests} loading={loading}>
          Tai lai
        </Button>
      </div>

      <div className="stats-grid">
        <Card>
          <Statistic title="Tong yeu cau" value={stats.total} />
        </Card>
        <Card>
          <Statistic title="Cho xac nhan" value={stats.pending} />
        </Card>
        <Card>
          <Statistic title="Da xac nhan" value={stats.approved} />
        </Card>
        <Card>
          <Statistic title="Tu choi" value={stats.rejected} />
        </Card>
      </div>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { label: "Tat ca trang thai", value: "all" },
              { label: "Cho xac nhan", value: "pending" },
              { label: "Da xac nhan", value: "approved" },
              { label: "Tu choi", value: "rejected" },
              { label: "Da huy", value: "cancelled" },
              { label: "Het han", value: "expired" },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 180 }}
            options={[
              { label: "Tat ca loai", value: "all" },
              { label: "Giu phong", value: "hold_deposit" },
              { label: "Thue phong", value: "rent" },
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Chi tiet yeu cau phong"
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Dong
          </Button>,
        ]}
        width={920}
      >
        {detailRequest && (
          <Space direction="vertical" size={16} className="page-stack">
            {(detailRequest.roomImages || []).length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailRequest.roomImages.map((image) => (
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
            ) : null}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ma yeu cau">{detailRequest.requestCode}</Descriptions.Item>
              <Descriptions.Item label="Loai">
                <Tag color={requestTypeMeta[detailRequest.type]?.color}>
                  {requestTypeMeta[detailRequest.type]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nguoi gui">{detailRequest.userName || "-"}</Descriptions.Item>
              <Descriptions.Item label="So dien thoai">{detailRequest.userPhone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{detailRequest.userEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="CCCD">{detailRequest.userIdentityNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phong">
                {detailRequest.roomNumber} - {detailRequest.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Gia phong">{formatCurrency(detailRequest.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="So tien can thanh toan">
                {formatCurrency(detailRequest.amount)}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toan">
                <Tag color={paymentStatusMeta[detailRequest.paymentStatus]?.color}>
                  {paymentStatusMeta[detailRequest.paymentStatus]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngan hang">{detailRequest.paymentBankName || "-"}</Descriptions.Item>
              <Descriptions.Item label="So tai khoan">
                <Typography.Text copyable>{detailRequest.paymentBankAccountNumber || "-"}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chu tai khoan">{detailRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Noi dung CK">
                <Typography.Text copyable strong>
                  {detailRequest.paymentContent || detailRequest.paymentOrderCode || detailRequest.requestCode}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={requestStatusMeta[detailRequest.status]?.color}>
                  {requestStatusMeta[detailRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hop dong">
                {detailRequest.contractCode ? (
                  <Button type="link" onClick={() => handleOpenContractFile(detailRequest)}>
                    {detailRequest.contractCode}
                  </Button>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Han giu phong">{formatDate(detailRequest.holdExpiresAt)}</Descriptions.Item>
              <Descriptions.Item label="Thoi han thue">{detailRequest.durationMonths || "-"} thang</Descriptions.Item>
              <Descriptions.Item label="So nguoi o">{detailRequest.occupantCount || "-"}</Descriptions.Item>
              <Descriptions.Item label="Loi nhan" span={2}>
                {detailRequest.message || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chu admin" span={2}>
                {detailRequest.adminNote || "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailRequest.type === "rent" ? (
              <Card size="small" title="Thong tin nguoi o">
                <Table
                  rowKey={(_, index) => index}
                  dataSource={detailRequest.occupants || []}
                  pagination={false}
                  scroll={{ x: 900 }}
                  columns={[
                    { title: "Ho ten", dataIndex: "name", key: "name" },
                    { title: "So dien thoai", dataIndex: "phone", key: "phone" },
                    { title: "So CCCD", dataIndex: "identityNumber", key: "identityNumber" },
                    {
                      title: "CCCD mat truoc",
                      dataIndex: "identityFrontImage",
                      key: "identityFrontImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover" }} /> : "-"),
                    },
                    {
                      title: "CCCD mat sau",
                      dataIndex: "identityBackImage",
                      key: "identityBackImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover" }} /> : "-"),
                    },
                  ]}
                />
              </Card>
            ) : null}
            {detailRequest.paymentQrCode ? (
              <Card size="small" title="QR thanh toan">
                <Space direction="vertical" align="center" className="page-stack">
                  <Image src={detailRequest.paymentQrCode} width={260} />
                  <Typography.Text type="secondary">
                    Kiem tra sao ke theo dung so tien va noi dung chuyen khoan truoc khi xac nhan thanh toan.
                  </Typography.Text>
                </Space>
              </Card>
            ) : null}
          </Space>
        )}
      </Modal>

      <Modal
        title="Xac nhan da nhan tien"
        open={Boolean(paymentConfirmRequest)}
        onCancel={closePaymentConfirmModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText="Xac nhan thanh toan"
        cancelText="Dong"
      >
        <Form form={processForm} layout="vertical" onFinish={handleConfirmPayment}>
          <Typography.Paragraph type="secondary">
            {paymentConfirmRequest?.requestCode} - {formatCurrency(paymentConfirmRequest?.amount)}
          </Typography.Paragraph>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Nguoi gui">{paymentConfirmRequest?.userName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Noi dung CK">
              <Typography.Text copyable strong>
                {paymentConfirmRequest?.paymentContent ||
                  paymentConfirmRequest?.paymentOrderCode ||
                  paymentConfirmRequest?.requestCode}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Form.Item name="adminNote" label="Ghi chu admin">
            <Input.TextArea rows={4} placeholder="VD: Da doi soat sao ke ngan hang" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={processAction === "approve" ? "Xac nhan yeu cau" : "Tu choi yeu cau"}
        open={Boolean(processingRequest)}
        onCancel={closeProcessModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText={processAction === "approve" ? "Xac nhan" : "Tu choi"}
        okButtonProps={{ danger: processAction === "reject" }}
        cancelText="Dong"
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcessRequest}>
          <Typography.Paragraph type="secondary">
            {processingRequest?.requestCode} - {processingRequest?.roomNumber} - {processingRequest?.roomName}
          </Typography.Paragraph>
          <Form.Item name="adminNote" label="Ghi chu admin">
            <Input.TextArea rows={4} placeholder="Nhap ghi chu xu ly neu can" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default RoomRequestManagementPage;
