import { HistoryOutlined } from "@ant-design/icons";
import { Card, Empty, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import http from "../../api/http";

const { Title, Text } = Typography;
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "-");

const UserPaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const { data } = await http.get("/me/payment-history");
        setPayments(data || []);
      } catch (error) {
        message.error(error.response?.data?.message || "Không tải được lịch sử thanh toán");
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const columns = [
    {
      title: "Phòng / hóa đơn",
      key: "target",
      render: (_, record) => (
        <div>
          <Text strong>{record.roomNumber ? `Phòng ${record.roomNumber}` : record.invoiceCode || "Giao dịch"}</Text>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {record.targetType === "invoice"
              ? `Hóa đơn ${record.invoiceMonth || "-"}/${record.invoiceYear || "-"}`
              : record.requestCode || "Yêu cầu phòng"}
          </div>
        </div>
      ),
    },
    {
      title: "Số tiền thanh toán",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Text strong style={{ color: "#0284c7" }}>{formatCurrency(value)}</Text>,
    },
    {
      title: "Phương thức",
      key: "provider",
      render: (_, record) => <Tag color={record.provider === "vnpay" ? "blue" : "cyan"}>{record.provider === "vnpay" ? "VNPay" : "QR thủ công"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "success" ? "success" : "error"}>{status === "success" ? "Thanh toán thành công" : "Thanh toán thất bại"}</Tag>,
    },
    {
      title: "Thời gian",
      key: "date",
      render: (_, record) => formatDate(record.paidAt || record.createdAt),
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <Card style={{ borderRadius: 16, marginBottom: 20, background: "linear-gradient(135deg, #0f172a, #0f766e)" }}>
        <Space size={12} align="center">
          <HistoryOutlined style={{ fontSize: 28, color: "#a7f3d0" }} />
          <div>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Lịch sử thanh toán</Title>
            <Text style={{ color: "#d1fae5" }}>Theo dõi toàn bộ giao dịch thanh toán của bạn.</Text>
          </div>
        </Space>
      </Card>
      <Card style={{ borderRadius: 16, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={payments}
          loading={loading}
          locale={{ emptyText: <Empty description="Chưa có lịch sử thanh toán" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default UserPaymentHistoryPage;
