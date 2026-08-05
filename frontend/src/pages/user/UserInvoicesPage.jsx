import { CreditCardOutlined, EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Image, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import http from "../../api/http";

const { Title, Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const invoiceStatusMeta = {
  unpaid: { color: "error", label: "Chưa thanh toán" },
  partial: { color: "warning", label: "Thanh toán một phần" },
  paid: { color: "success", label: "Đã thanh toán" },
  overdue: { color: "error", label: "Quá hạn" },
};

const paymentStatusMeta = {
  unpaid: { color: "default", label: "Chưa thanh toán" },
  pending: { color: "processing", label: "Đang thanh toán" },
  paid: { color: "success", label: "Đã thanh toán" },
  failed: { color: "error", label: "Thất bại" },
  cancelled: { color: "default", label: "Đã hủy" },
};

const UserInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/invoices");
      setInvoices(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleViewInvoice = async (invoice) => {
    try {
      const { data } = await http.get(`/me/invoices/${invoice.id}`);
      setDetailInvoice(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết hóa đơn");
    }
  };

  const invoiceColumns = [
    {
      title: "Mã hóa đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => `Phòng ${record.roomNumber} - ${record.roomName}`,
    },
    {
      title: "Tháng/Năm",
      key: "period",
      render: (_, record) => `Tháng ${record.billingMonth}/${record.billingYear}`,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (val) => <Text strong style={{ color: "#d97706" }}>{formatCurrency(val)}</Text>,
    },
    {
      title: "Đã trả",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Hạn TT",
      dataIndex: "dueDate",
      key: "dueDate",
      render: formatDate,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={invoiceStatusMeta[status]?.color || "default"} style={{ borderRadius: 6 }}>
          {invoiceStatusMeta[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewInvoice(record)} style={{ borderRadius: 6 }}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <FileTextOutlined style={{ color: "#d97706", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Hóa đơn tiền nhà & Điện nước
            </Title>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={invoiceColumns}
          dataSource={invoices}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "Chưa có hóa đơn điện nước" }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        title={detailInvoice ? `Chi Tiết Hóa Đơn - ${detailInvoice.invoiceCode}` : "Chi Tiết Hóa Đơn"}
        open={Boolean(detailInvoice)}
        onCancel={() => setDetailInvoice(null)}
        footer={[
          detailInvoice?.paymentRequest ? (
            <Button
              key="payment"
              type="primary"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setPaymentRequest(detailInvoice.paymentRequest);
                setDetailInvoice(null);
              }}
              style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}
            >
              Xem QR / Thanh toán
            </Button>
          ) : null,
          <Button key="close" onClick={() => setDetailInvoice(null)} style={{ borderRadius: 6 }}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailInvoice && (
          <div>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã HĐ">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={invoiceStatusMeta[detailInvoice.status]?.color}>{invoiceStatusMeta[detailInvoice.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {detailInvoice.roomNumber} - {detailInvoice.roomName}</Descriptions.Item>
              <Descriptions.Item label="Kỳ thanh toán">Tháng {detailInvoice.billingMonth}/{detailInvoice.billingYear}</Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">{formatCurrency(detailInvoice.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán">{formatCurrency(detailInvoice.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Còn nợ">{formatCurrency(detailInvoice.remainingAmount)}</Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
            </Descriptions>

            {detailInvoice.items && detailInvoice.items.length > 0 && (
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  Chi tiết dịch vụ
                </Title>
                <Table
                  rowKey="id"
                  pagination={false}
                  size="small"
                  dataSource={detailInvoice.items}
                  columns={[
                    { title: "Dịch vụ", dataIndex: "serviceName", key: "serviceName" },
                    { title: "Chỉ số cũ", dataIndex: "oldReading", key: "oldReading", render: (v) => v ?? "-" },
                    { title: "Chỉ số mới", dataIndex: "newReading", key: "newReading", render: (v) => v ?? "-" },
                    { title: "Sử dụng", dataIndex: "quantity", key: "quantity" },
                    { title: "Đơn giá", dataIndex: "unitPrice", key: "unitPrice", render: (v) => formatCurrency(v) },
                    { title: "Thành tiền", dataIndex: "totalPrice", key: "totalPrice", render: (v) => <Text strong>{formatCurrency(v)}</Text> },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Request Modal */}
      <Modal
        title="Thông Tin Thanh Toán Quét QR VietQR"
        open={Boolean(paymentRequest)}
        onCancel={() => setPaymentRequest(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPaymentRequest(null)} style={{ background: "#0f766e", borderRadius: 6 }}>
            Đã hiểu
          </Button>,
        ]}
        width={500}
      >
        {paymentRequest && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            {paymentRequest.qrCodeUrl ? (
              <Image src={paymentRequest.qrCodeUrl} alt="VietQR Code" width={260} style={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            ) : (
              <Text type="secondary">Chưa tạo được ảnh VietQR</Text>
            )}

            <div style={{ marginTop: 16, textAlign: "left" }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Ngân hàng">{paymentRequest.bankName || paymentRequest.bankCode}</Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">{paymentRequest.accountNumber}</Descriptions.Item>
                <Descriptions.Item label="Chủ tài khoản">{paymentRequest.accountName}</Descriptions.Item>
                <Descriptions.Item label="Số tiền">{formatCurrency(paymentRequest.amount)}</Descriptions.Item>
                <Descriptions.Item label="Nội dung chuyển khoản">
                  <Text copyable strong style={{ color: "#0f766e" }}>
                    {paymentRequest.description}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={paymentStatusMeta[paymentRequest.status]?.color}>
                    {paymentStatusMeta[paymentRequest.status]?.label || paymentRequest.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserInvoicesPage;
