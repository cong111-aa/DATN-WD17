import { FileTextOutlined } from "@ant-design/icons";
import { Button, Descriptions, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import http from "../../api/http";

const { Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const invoiceStatusMeta = {
  unpaid: { color: "error", label: "Chưa thanh toán" },
  partial: { color: "warning", label: "Thanh toán một phần" },
  paid: { color: "success", label: "Đã thanh toán" },
  overdue: { color: "error", label: "Quá hạn" },
};

const UserInvoicesPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [payingId, setPayingId] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/invoices");
      setInvoices(data || []);
      outletContext?.refreshBadgeCounts?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateVnpayPayment = async (record) => {
    setPayingId(record.id);
    try {
      const { data } = await http.post("/payments/vnpay/create", {
        targetId: record.id,
        targetType: "invoice",
      });

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không tạo được giao dịch VNPay");
    } finally {
      setPayingId("");
    }
  };

  const columns = [
    {
      title: "Mã hóa đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#0f766e" }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Phòng {record.roomNumber || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Kỳ hóa đơn",
      key: "period",
      render: (_, record) => `Tháng ${record.month}/${record.year}`,
    },
    {
      title: "Điện / nước",
      key: "utility",
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.electricityUsage ?? 0} số / {record.waterUsage ?? 0} khối
        </Text>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Còn lại",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (value) => (
        <Text type={value > 0 ? "danger" : "success"} strong>{formatCurrency(value)}</Text>
      ),
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
      render: (status) => {
        const meta = invoiceStatusMeta[status] || invoiceStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailInvoice(record)} style={{ borderRadius: 6 }}>
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            loading={payingId === record.id}
            disabled={record.status === "paid" || Number(record.remainingAmount || 0) <= 0}
            onClick={() => handleCreateVnpayPayment(record)}
            style={{ background: "#0f766e", borderRadius: 6 }}
          >
            Thanh toán VNPay
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon"><FileTextOutlined /></div>
            <span>Hóa đơn điện nước hằng tháng</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>Về trang chủ</Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: "Chưa có hóa đơn" }}
        />
      </div>

      <Modal
        title="Chi tiết hóa đơn"
        open={Boolean(detailInvoice)}
        onCancel={() => setDetailInvoice(null)}
        footer={[
          <Button key="close" onClick={() => setDetailInvoice(null)} style={{ borderRadius: 6 }}>Đóng</Button>,
          <Button
            key="vnpay"
            type="primary"
            loading={detailInvoice && payingId === detailInvoice.id}
            disabled={!detailInvoice || detailInvoice.status === "paid" || Number(detailInvoice.remainingAmount || 0) <= 0}
            onClick={() => handleCreateVnpayPayment(detailInvoice)}
            style={{ background: "#0f766e", borderRadius: 6 }}
          >
            Thanh toán VNPay
          </Button>,
        ]}
        width={820}
      >
        {detailInvoice && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã hóa đơn">{detailInvoice.invoiceCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={invoiceStatusMeta[detailInvoice.status]?.color}>
                  {invoiceStatusMeta[detailInvoice.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {detailInvoice.roomNumber} - {detailInvoice.roomName}</Descriptions.Item>
              <Descriptions.Item label="Kỳ hóa đơn">Tháng {detailInvoice.month}/{detailInvoice.year}</Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày xuất hóa đơn">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="Chỉ số điện nước" bordered size="small" column={2}>
              <Descriptions.Item label="Điện cũ -> mới">
                {detailInvoice.electricityOld ?? 0} {"->"} {detailInvoice.electricityNew ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu thụ điện">{detailInvoice.electricityUsage ?? 0} kWh</Descriptions.Item>
              <Descriptions.Item label="Tiền điện">{formatCurrency(detailInvoice.electricityAmount)}</Descriptions.Item>
              <Descriptions.Item label="Nước cũ -> mới">
                {detailInvoice.waterOld ?? 0} {"->"} {detailInvoice.waterNew ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu thụ nước">{detailInvoice.waterUsage ?? 0} m3</Descriptions.Item>
              <Descriptions.Item label="Tiền nước">{formatCurrency(detailInvoice.waterAmount)}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="Tổng kết chi phí" bordered size="small" column={2}>
              <Descriptions.Item label="Tiền phòng">{formatCurrency(detailInvoice.rentAmount)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailInvoice.serviceAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">
                <Text strong style={{ fontSize: 16, color: "#0f766e" }}>{formatCurrency(detailInvoice.totalAmount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại phải trả">
                <Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong style={{ fontSize: 16 }}>
                  {formatCurrency(detailInvoice.remainingAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserInvoicesPage;
