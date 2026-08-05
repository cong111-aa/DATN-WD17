import { CreditCardOutlined } from "@ant-design/icons";
import { Button, Descriptions, Image, Modal, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Paragraph, Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const roomRequestTypeMeta = {
  hold_deposit: { color: "gold", label: "Giữ phòng" },
  rent: { color: "blue", label: "Thuê phòng" },
};

const roomRequestStatusMeta = {
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

const UserRoomRequestsPage = () => {
  const navigate = useNavigate();
  const [roomRequests, setRoomRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const fetchRoomRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/room-requests");
      setRoomRequests(data || []);
    } catch (err) {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomRequests();
  }, []);

  const handleOpenPaymentModal = async (record) => {
    try {
      const { data } = await http.get(`/me/room-requests/${record.id}`);
      setPaymentRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không lấy được thông tin thanh toán");
    }
  };

  const handleCancelRoomRequest = async (record) => {
    try {
      await http.put(`/me/room-requests/${record.id}/cancel`);
      message.success("Đã hủy yêu cầu giữ phòng");
      fetchRoomRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Hủy yêu cầu thất bại");
    }
  };

  const roomRequestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "requestCode",
      key: "requestCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#0f766e" }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "requestType",
      key: "requestType",
      render: (type) => {
        const meta = roomRequestTypeMeta[type] || roomRequestTypeMeta.hold_deposit;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Số tiền cọc",
      dataIndex: "amount",
      key: "amount",
      render: formatCurrency,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = roomRequestStatusMeta[status] || roomRequestStatusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => {
        const meta = paymentStatusMeta[status] || paymentStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => handleOpenPaymentModal(record)} style={{ borderRadius: 6 }}>
            Mã QR / CK
          </Button>
          <Popconfirm
            title="Hủy yêu cầu giữ phòng này?"
            okText="Hủy ngay"
            cancelText="Đóng"
            onConfirm={() => handleCancelRoomRequest(record)}
            disabled={record.status !== "pending"}
          >
            <Button size="small" danger disabled={record.status !== "pending"} style={{ borderRadius: 6 }}>
              Hủy
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
            <div className="portal-section-icon"><CreditCardOutlined /></div>
            <span>Yêu cầu thuê & Giữ cọc phòng</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>← Về trang chủ</Button>
        </div>

        <Table
          rowKey="id"
          columns={roomRequestColumns}
          dataSource={roomRequests}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "Chưa có yêu cầu giữ chỗ / thuê phòng" }}
        />
      </div>

      {/* Payment QR Code Modal */}
      <Modal
        title="Mã QR Chuyển Khoản Thanh Toán"
        open={Boolean(paymentRequest)}
        onCancel={() => setPaymentRequest(null)}
        footer={[<Button key="close" type="primary" onClick={() => setPaymentRequest(null)} style={{ background: "#0f766e", borderRadius: 8 }}>Đóng</Button>]}
        width={720}
      >
        {paymentRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã yêu cầu">{paymentRequest.requestCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {paymentRequest.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cọc">
                <Text strong style={{ color: "#0f766e", fontSize: 16 }}>{formatCurrency(paymentRequest.amount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{paymentRequest.paymentBankName || "MB Bank"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản"><Text copyable strong>{paymentRequest.paymentBankAccountNumber || "-"}</Text></Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{paymentRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung CK" span={2}>
                <Text copyable strong style={{ color: "#e11d48", fontSize: 15 }}>
                  {paymentRequest.paymentContent || paymentRequest.paymentOrderCode || paymentRequest.requestCode}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            {paymentRequest.paymentQrCode ? (
              <div style={{ textAlign: "center", padding: 20, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <Image src={paymentRequest.paymentQrCode} width={260} style={{ borderRadius: 8 }} />
                <Paragraph type="secondary" style={{ marginTop: 10, fontSize: 13 }}>
                  Mở app Ngân hàng quét mã QR để chuyển khoản chính xác nội dung & số tiền.
                </Paragraph>
              </div>
            ) : (
              <Text type="danger">Chưa cấu hình thông tin ngân hàng để tạo QR thanh toán.</Text>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserRoomRequestsPage;
