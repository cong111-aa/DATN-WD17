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
  hold_deposit: { color: "gold", label: "Giữ phòng" },
  rent: { color: "blue", label: "Thuê phòng" },
};

const requestStatusMeta = {
  pending: { color: "processing", label: "Chờ xác nhận" },
  approved: { color: "success", label: "Đã xác nhận" },
  rejected: { color: "error", label: "Từ chối" },
  cancelled: { color: "default", label: "Đã hủy" },
  expired: { color: "warning", label: "Hết hạn" },
};

const paymentStatusMeta = {
  unpaid: { color: "default", label: "Chưa thanh toán" },
  pending: { color: "processing", label: "Đang thanh toán" },
  paid: { color: "success", label: "Đã thanh toán" },
  failed: { color: "error", label: "Thất bại" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const paymentProviderMeta = {
  manual_qr: { color: "cyan", label: "QR thủ công" },
  vnpay: { color: "blue", label: "VNPay" },
};

const getPaymentStateMeta = (record) => {
  if (record.paymentProvider === "vnpay") {
    if (record.paymentStatus === "paid") {
      return { color: "success", label: "Thanh toán thành công" };
    }

    if (["failed", "cancelled"].includes(record.paymentStatus)) {
      return { color: "error", label: "Thanh toán thất bại" };
    }

    return { color: "processing", label: "Đang thanh toán" };
  }

  if (record.paymentStatus === "paid") {
    return { color: "success", label: "Đã xác nhận" };
  }

  if (["failed", "cancelled"].includes(record.paymentStatus)) {
    return { color: "error", label: "Thất bại" };
  }

  return { color: "warning", label: "Chờ xác nhận" };
};

const getPaymentProviderMeta = (provider) =>
  provider === "vnpay" ? paymentProviderMeta.vnpay : paymentProviderMeta.manual_qr;

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
      message.error(error.response?.data?.message || "Không tải được danh sách yêu cầu phòng");
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
      message.success("Đã xác nhận thanh toán");
      closePaymentConfirmModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xác nhận thanh toán thất bại");
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
      message.success(processAction === "approve" ? "Đã xác nhận yêu cầu" : "Đã từ chối yêu cầu");
      closeProcessModal();
      fetchRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Xử lý yêu cầu thất bại");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleOpenContractFile = async (request) => {
    if (!request.contract) {
      message.warning("Yêu cầu này chưa tạo hợp đồng");
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
      message.error(error.response?.data?.message || "Không mở được hợp đồng");
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.userName || "-"}</Typography.Text>
          <Typography.Text type="secondary">{record.userPhone || record.userEmail || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.roomNumber || "-"}</Typography.Text>
          <Typography.Text type="secondary">{record.roomName || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const meta = requestTypeMeta[type] || requestTypeMeta.rent;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentProvider",
      key: "paymentProvider",
      render: (provider) => {
        const meta = getPaymentProviderMeta(provider);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      key: "paymentState",
      render: (_, record) => {
        const meta = getPaymentStateMeta(record);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
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
          <Button icon={<EyeOutlined />} onClick={() => setDetailRequest(record)}>
            Chi tiết
          </Button>
          {record.paymentProvider !== "vnpay" ? (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setPaymentConfirmRequest(record)}
              disabled={
                record.status !== "pending" ||
                record.paymentStatus === "paid" ||
                !(record.paymentProofImages || []).length
              }
            >
              Xác nhận đã nhận tiền
            </Button>
          ) : null}
          {record.type === "rent" && record.paymentStatus === "paid" && record.status === "pending" ? (
            <Button
              type="primary"
              onClick={() => openProcessModal("approve", record)}
              style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
            >
              Tạo hợp đồng
            </Button>
          ) : null}
          {record.contract ? (
            <Button onClick={() => handleOpenContractFile(record)}>
              Hợp đồng
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quản lý yêu cầu phòng</Typography.Title>
          <Typography.Text type="secondary">
            Xem, xác nhận hoặc từ chối yêu cầu đặt cọc giữ phòng và thuê phòng của người dùng.
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchRequests} loading={loading}>
          Tải lại
        </Button>
      </div>

      <div className="stats-grid">
        <Card>
          <Statistic title="Tổng yêu cầu" value={stats.total} />
        </Card>
        <Card>
          <Statistic title="Chờ xác nhận" value={stats.pending} />
        </Card>
        <Card>
          <Statistic title="Đã xác nhận" value={stats.approved} />
        </Card>
        <Card>
          <Statistic title="Từ chối" value={stats.rejected} />
        </Card>
      </div>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Chờ xác nhận", value: "pending" },
              { label: "Đã xác nhận", value: "approved" },
              { label: "Từ chối", value: "rejected" },
              { label: "Đã hủy", value: "cancelled" },
              { label: "Hết hạn", value: "expired" },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 180 }}
            options={[
              { label: "Tất cả loại", value: "all" },
              { label: "Giữ phòng", value: "hold_deposit" },
              { label: "Thuê phòng", value: "rent" },
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
        title="Chi tiết yêu cầu phòng"
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)}>
            Đóng
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
              <Descriptions.Item label="Mã yêu cầu">{detailRequest.requestCode}</Descriptions.Item>
              <Descriptions.Item label="Loại">
                <Tag color={requestTypeMeta[detailRequest.type]?.color}>
                  {requestTypeMeta[detailRequest.type]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người gửi">{detailRequest.userName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{detailRequest.userPhone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{detailRequest.userEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="CCCD">{detailRequest.userIdentityNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {detailRequest.roomNumber} - {detailRequest.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng">{formatCurrency(detailRequest.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cần thanh toán">
                {formatCurrency(detailRequest.amount)}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color={getPaymentProviderMeta(detailRequest.paymentProvider).color}>
                  {getPaymentProviderMeta(detailRequest.paymentProvider).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStateMeta(detailRequest).color}>
                  {getPaymentStateMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{detailRequest.paymentBankName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                <Typography.Text copyable>{detailRequest.paymentBankAccountNumber || "-"}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{detailRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung CK">
                <Typography.Text copyable strong>
                  {detailRequest.paymentContent || detailRequest.paymentOrderCode || detailRequest.requestCode}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={requestStatusMeta[detailRequest.status]?.color}>
                  {requestStatusMeta[detailRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hợp đồng">
                {detailRequest.contractCode ? (
                  <Button type="link" onClick={() => handleOpenContractFile(detailRequest)}>
                    {detailRequest.contractCode}
                  </Button>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn giữ phòng">{formatDate(detailRequest.holdExpiresAt)}</Descriptions.Item>
              <Descriptions.Item label="Thời hạn thuê">{detailRequest.durationMonths || "-"} tháng</Descriptions.Item>
              <Descriptions.Item label="Số người ở">{detailRequest.occupantCount || "-"}</Descriptions.Item>
              <Descriptions.Item label="Lời nhắn" span={2}>
                {detailRequest.message || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú admin" span={2}>
                {detailRequest.adminNote || "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailRequest.type === "rent" ? (
              <Card size="small" title="Thông tin người ở">
                <Table
                  rowKey={(_, index) => index}
                  dataSource={detailRequest.occupants || []}
                  pagination={false}
                  scroll={{ x: 900 }}
                  columns={[
                    { title: "Họ tên", dataIndex: "name", key: "name" },
                    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
                    { title: "Số CCCD", dataIndex: "identityNumber", key: "identityNumber" },
                    {
                      title: "CCCD mặt trước",
                      dataIndex: "identityFrontImage",
                      key: "identityFrontImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover" }} /> : "-"),
                    },
                    {
                      title: "CCCD mặt sau",
                      dataIndex: "identityBackImage",
                      key: "identityBackImage",
                      render: (value) => (value ? <Image src={toImageUrl(value)} width={76} height={52} style={{ objectFit: "cover" }} /> : "-"),
                    },
                  ]}
                />
              </Card>
            ) : null}
            {detailRequest.paymentQrCode ? (
              <Card size="small" title="QR thanh toán">
                <Space direction="vertical" align="center" className="page-stack">
                  <Image src={detailRequest.paymentQrCode} width={260} />
                  <Typography.Text type="secondary">
                    Kiểm tra sao kê theo đúng số tiền và nội dung chuyển khoản trước khi xác nhận thanh toán.
                  </Typography.Text>
                </Space>
              </Card>
            ) : null}
            {detailRequest.paymentProvider !== "vnpay" ? (
              <Card size="small" title="Ảnh biên lai chuyển khoản">
                {(detailRequest.paymentProofImages || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {detailRequest.paymentProofImages.map((image) => (
                        <Image
                          key={image}
                          src={toImageUrl(image)}
                          width={132}
                          height={92}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Typography.Text type="secondary">Khách hàng chưa tải ảnh biên lai.</Typography.Text>
                )}
              </Card>
            ) : null}
          </Space>
        )}
      </Modal>

      <Modal
        title="Xác nhận đã nhận tiền"
        open={Boolean(paymentConfirmRequest)}
        onCancel={closePaymentConfirmModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText="Xác nhận thanh toán"
        cancelText="Đóng"
      >
        <Form form={processForm} layout="vertical" onFinish={handleConfirmPayment}>
          <Typography.Paragraph type="secondary">
            {paymentConfirmRequest?.requestCode} - {formatCurrency(paymentConfirmRequest?.amount)}
          </Typography.Paragraph>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Người gửi">{paymentConfirmRequest?.userName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Nội dung CK">
              <Typography.Text copyable strong>
                {paymentConfirmRequest?.paymentContent ||
                  paymentConfirmRequest?.paymentOrderCode ||
                  paymentConfirmRequest?.requestCode}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Form.Item name="adminNote" label="Ghi chú admin">
            <Input.TextArea rows={4} placeholder="VD: Đã đối soát sao kê ngân hàng" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={processAction === "approve" ? "Xác nhận yêu cầu" : "Từ chối yêu cầu"}
        open={Boolean(processingRequest)}
        onCancel={closeProcessModal}
        onOk={() => processForm.submit()}
        confirmLoading={processLoading}
        okText={processAction === "approve" ? "Xác nhận" : "Từ chối"}
        okButtonProps={{ danger: processAction === "reject" }}
        cancelText="Đóng"
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcessRequest}>
          <Typography.Paragraph type="secondary">
            {processingRequest?.requestCode} - {processingRequest?.roomNumber} - {processingRequest?.roomName}
          </Typography.Paragraph>
          <Form.Item name="adminNote" label="Ghi chú admin">
            <Input.TextArea rows={4} placeholder="Nhập ghi chú xử lý nếu cần" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default RoomRequestManagementPage;
