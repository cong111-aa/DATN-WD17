import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Input,
  Modal,
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import http from "../../api/http";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const invoiceStatusMeta = {
  unpaid: {
    color: "error",
    badgeBg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    label: "Chưa thanh toán",
    icon: <ExclamationCircleOutlined />,
    urgent: true,
  },
  partial: {
    color: "warning",
    badgeBg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    label: "Thanh toán 1 phần",
    icon: <ClockCircleOutlined />,
  },
  paid: {
    color: "success",
    badgeBg: "#f0fdf4",
    text: "#15803d",
    border: "#bbf7d0",
    label: "Đã thanh toán",
    icon: <CheckCircleOutlined />,
  },
  overdue: {
    color: "error",
    badgeBg: "#fff1f2",
    text: "#be123c",
    border: "#fecdd3",
    label: "Quá hạn thanh toán",
    icon: <ExclamationCircleOutlined />,
    urgent: true,
  },
};

const UserInvoicesPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [detailInvoice, setDetailInvoice] = useState(null);
  const [qrModalInvoice, setQrModalInvoice] = useState(null);
  const [payingId, setPayingId] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/invoices");
      setInvoices(data || []);
      outletContext?.refreshBadgeCounts?.();
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách hóa đơn");
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "unpaid"
          ? item.status === "unpaid" || item.status === "overdue" || item.status === "partial"
          : item.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.invoiceCode && item.invoiceCode.toLowerCase().includes(q)) ||
        (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
        (item.roomName && item.roomName.toLowerCase().includes(q)) ||
        (item.month && String(item.month).includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const unpaidList = invoices.filter(
      (i) => i.status === "unpaid" || i.status === "overdue" || i.status === "partial"
    );
    const totalUnpaidAmount = unpaidList.reduce(
      (acc, i) => acc + Number(i.remainingAmount || i.totalAmount || 0),
      0
    );
    const paidCount = invoices.filter((i) => i.status === "paid").length;

    return {
      total: invoices.length,
      unpaidCount: unpaidList.length,
      totalUnpaidAmount,
      paidCount,
    };
  }, [invoices]);

  // Table Columns
  const columns = [
    {
      title: "Mã Hóa Đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      render: (code, record) => (
        <Space size={10}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: record.remainingAmount > 0 ? "#fef2f2" : "#f0fdf4",
              color: record.remainingAmount > 0 ? "#dc2626" : "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
              {code}
            </Text>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Phòng {record.roomNumber || "-"} {record.roomName ? `• ${record.roomName}` : ""}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Kỳ hóa đơn",
      key: "period",
      render: (_, record) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>
          Tháng {record.month}/{record.year}
        </Tag>
      ),
    },
    {
      title: "Tiêu thụ Điện / Nước",
      key: "utility",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 13, color: "#334155" }}>
            ⚡ Điện: <strong>{record.electricityUsage ?? 0} kWh</strong>
          </Text>
          <Text style={{ fontSize: 13, color: "#334155" }}>
            💧 Nước: <strong>{record.waterUsage ?? 0} m³</strong>
          </Text>
        </Space>
      ),
    },
    {
      title: "Tổng số tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => (
        <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Còn lại phải trả",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (value) => (
        <Text
          strong
          style={{
            fontSize: 15,
            color: Number(value || 0) > 0 ? "#dc2626" : "#16a34a",
          }}
        >
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Hạn thanh toán",
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
        return (
          <Tag
            icon={meta.icon}
            style={{
              background: meta.badgeBg,
              color: meta.text,
              borderColor: meta.border,
              borderRadius: 6,
              fontWeight: 600,
              padding: "3px 10px",
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => {
        const canPay = record.status !== "paid" && Number(record.remainingAmount || 0) > 0;
        return (
          <Space size={8} wrap>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailInvoice(record)}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              Bảng kê
            </Button>
            {canPay && (
              <>
                <Button
                  size="small"
                  type="primary"
                  loading={payingId === record.id}
                  icon={<CreditCardOutlined />}
                  onClick={() => handleCreateVnpayPayment(record)}
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  VNPay
                </Button>
                <Button
                  size="small"
                  icon={<QrcodeOutlined />}
                  onClick={() => setQrModalInvoice(record)}
                  style={{ borderRadius: 6, borderColor: "#0f766e", color: "#0f766e" }}
                >
                  VietQR
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="my-invoices-container">
      {/* Hero Header Section */}
      <div className="my-invoices-hero">
        <div className="my-invoices-hero-badge">
          <FileTextOutlined />
          <span>HÓA ĐƠN & THANH TOÁN TỰ ĐỘNG VIETQR • TRO PLUS</span>
        </div>
        <Title level={2} className="my-invoices-hero-title">
          Hóa Đơn Điện Nước & Dịch Vụ
        </Title>
        <p className="my-invoices-hero-desc">
          Theo dõi minh bạch bảng kê chỉ số điện nước, tiền phòng hàng tháng. Thanh toán trực tuyến 24/7 tự động gạch nợ tức thì qua cổng VNPay hoặc quét mã VietQR ngân hàng.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-invoices-stats-grid">
          <div className="my-invoices-stat-card">
            <div className="my-invoices-stat-icon teal">
              <FileTextOutlined />
            </div>
            <div>
              <div className="my-invoices-stat-val">{stats.total}</div>
              <div className="my-invoices-stat-lbl">Tổng số hóa đơn</div>
            </div>
          </div>

          <div className="my-invoices-stat-card rose">
            <div className="my-invoices-stat-icon rose">
              <ExclamationCircleOutlined />
            </div>
            <div>
              <div className="my-invoices-stat-val">{stats.unpaidCount}</div>
              <div className="my-invoices-stat-lbl">Hóa đơn chưa trả</div>
            </div>
          </div>

          <div className="my-invoices-stat-card amber">
            <div className="my-invoices-stat-icon amber">
              <DollarOutlined />
            </div>
            <div>
              <div className="my-invoices-stat-val">
                {stats.totalUnpaidAmount > 0
                  ? `${(stats.totalUnpaidAmount / 1000000).toFixed(2)} tr`
                  : "0 đ"}
              </div>
              <div className="my-invoices-stat-lbl">Tổng tiền chưa trả</div>
            </div>
          </div>

          <div className="my-invoices-stat-card emerald">
            <div className="my-invoices-stat-icon emerald">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="my-invoices-stat-val">{stats.paidCount}</div>
              <div className="my-invoices-stat-lbl">Đã hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-invoices-control-bar">
        <Space wrap size={12}>
          <Input
            placeholder="Tìm theo mã HĐ, số phòng..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 300, width: "100%", borderRadius: 10 }}
          />

          <Segmented
            options={[
              { label: `Tất cả (${invoices.length})`, value: "all" },
              {
                label: `Chưa trả (${stats.unpaidCount})`,
                value: "unpaid",
              },
              {
                label: `Đã trả (${stats.paidCount})`,
                value: "paid",
              },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ borderRadius: 10, background: "#f1f5f9" }}
          />
        </Space>

        <Space size={12}>
          <Button
            icon={<HomeOutlined />}
            onClick={() => navigate("/user/my-rooms")}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Phòng của tôi
          </Button>

          <Segmented
            options={[
              { value: "grid", icon: <AppstoreOutlined /> },
              { value: "table", icon: <UnorderedListOutlined /> },
            ]}
            value={viewMode}
            onChange={setViewMode}
            style={{ borderRadius: 10, background: "#f1f5f9" }}
          />
        </Space>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#64748b", fontWeight: 500 }}>
            Đang tải dữ liệu hóa đơn...
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="my-rooms-empty-sales-card">
          <div
            className="my-rooms-empty-icon-wrapper"
            style={{ background: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)", color: "#0f766e" }}
          >
            <FileTextOutlined />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy hóa đơn phù hợp"
              : "Bạn chưa có hóa đơn thanh toán nào"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng thử tìm kiếm lại với số phòng hoặc từ khóa khác."
              : "Hóa đơn dịch vụ điện nước hàng tháng sẽ tự động xuất hiện tại đây sau khi Ban quản lý chốt chỉ số công tơ."}
          </Paragraph>

          <Space size={14} wrap style={{ justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/user/my-rooms")}
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                borderRadius: 12,
                height: 48,
                padding: "0 28px",
                fontWeight: 700,
              }}
            >
              Về trang phòng của tôi
            </Button>
          </Space>
        </div>
      ) : viewMode === "grid" ? (
        /* Invoice Cards Grid */
        <div className="my-invoices-grid">
          {filteredInvoices.map((invoice) => {
            const statusMeta = invoiceStatusMeta[invoice.status] || invoiceStatusMeta.unpaid;
            const canPay = invoice.status !== "paid" && Number(invoice.remainingAmount || 0) > 0;

            return (
              <div
                key={invoice.id}
                className={`my-invoice-card ${canPay ? "unpaid" : ""}`}
              >
                {/* Header */}
                <div className="my-invoice-card-header">
                  <div>
                    <h3 className="my-invoice-code">{invoice.invoiceCode}</h3>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      Phòng {invoice.roomNumber || "-"} • Tháng {invoice.month}/{invoice.year}
                    </div>
                  </div>

                  <Tag
                    icon={statusMeta.icon}
                    style={{
                      background: statusMeta.badgeBg,
                      color: statusMeta.text,
                      borderColor: statusMeta.border,
                      borderRadius: 8,
                      fontWeight: 700,
                      padding: "4px 10px",
                    }}
                  >
                    {statusMeta.label}
                  </Tag>
                </div>

                {/* Body */}
                <div className="my-invoice-card-body">
                  <div className="my-invoice-breakdown-grid">
                    <div className="my-invoice-item">
                      <span className="my-invoice-item-lbl">🏠 Tiền thuê phòng</span>
                      <span className="my-invoice-item-val">
                        {formatCurrency(invoice.rentAmount)}
                      </span>
                    </div>

                    <div className="my-invoice-item">
                      <span className="my-invoice-item-lbl">🛠️ Phí dịch vụ</span>
                      <span className="my-invoice-item-val">
                        {formatCurrency(invoice.serviceAmount)}
                      </span>
                    </div>

                    <div className="my-invoice-item">
                      <span className="my-invoice-item-lbl">
                        ⚡ Điện ({invoice.electricityUsage ?? 0} kWh)
                      </span>
                      <span className="my-invoice-item-val">
                        {formatCurrency(invoice.electricityAmount)}
                      </span>
                    </div>

                    <div className="my-invoice-item">
                      <span className="my-invoice-item-lbl">
                        💧 Nước ({invoice.waterUsage ?? 0} m³)
                      </span>
                      <span className="my-invoice-item-val">
                        {formatCurrency(invoice.waterAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Total Strip */}
                  <div
                    className="my-invoice-total-strip"
                    style={{
                      background: canPay ? "#fef2f2" : "#f0fdf4",
                      borderColor: canPay ? "#fecaca" : "#bbf7d0",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {canPay ? "Còn lại phải trả" : "Tổng tiền đã trả"}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: canPay ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {formatCurrency(canPay ? invoice.remainingAmount : invoice.totalAmount)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Hạn thanh toán</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                        {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="my-invoice-card-actions">
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => setDetailInvoice(invoice)}
                      style={{ borderRadius: 10, fontWeight: 600, borderColor: "#cbd5e1" }}
                    >
                      Bảng kê chi tiết
                    </Button>

                    {canPay ? (
                      <Button
                        type="primary"
                        loading={payingId === invoice.id}
                        icon={<CreditCardOutlined />}
                        onClick={() => handleCreateVnpayPayment(invoice)}
                        style={{
                          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        Thanh toán VNPay
                      </Button>
                    ) : (
                      <Button
                        disabled
                        icon={<CheckCircleOutlined />}
                        style={{ borderRadius: 10, fontWeight: 600 }}
                      >
                        Hoàn thành
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredInvoices}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* Invoice Detailed Breakdown Modal */}
      <Modal
        title={
          <Space size={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              <FileTextOutlined />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                Bảng Kê Chi Tiết Hóa Đơn #{detailInvoice?.invoiceCode}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Tháng {detailInvoice?.month}/{detailInvoice?.year} • Phòng {detailInvoice?.roomNumber}
              </div>
            </div>
          </Space>
        }
        open={Boolean(detailInvoice)}
        onCancel={() => setDetailInvoice(null)}
        footer={[
          <Button key="close" onClick={() => setDetailInvoice(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
          detailInvoice && detailInvoice.status !== "paid" && Number(detailInvoice.remainingAmount || 0) > 0 ? (
            <Button
              key="vnpay"
              type="primary"
              loading={payingId === detailInvoice.id}
              icon={<CreditCardOutlined />}
              onClick={() => handleCreateVnpayPayment(detailInvoice)}
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              Thanh toán online VNPay
            </Button>
          ) : null,
        ]}
        width={840}
        centered
      >
        {detailInvoice && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Header info */}
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Mã hóa đơn">
                <Text strong>{detailInvoice.invoiceCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={invoiceStatusMeta[detailInvoice.status]?.color}>
                  {invoiceStatusMeta[detailInvoice.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng trọ">
                Phòng {detailInvoice.roomNumber} - {detailInvoice.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ hóa đơn">
                Tháng {detailInvoice.month}/{detailInvoice.year}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">
                {formatDate(detailInvoice.dueDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày xuất hóa đơn">
                {formatDate(detailInvoice.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            {/* Meter Readings Table */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                ⚡ Chỉ Số Công Tơ Điện & Nước Thực Tế:
              </Text>
              <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden" }}>
                <Descriptions.Item label="Chỉ số điện (Cũ ➔ Mới)">
                  {detailInvoice.electricityOld ?? 0} kWh ➔ {detailInvoice.electricityNew ?? 0} kWh
                </Descriptions.Item>
                <Descriptions.Item label="Điện tiêu thụ">
                  <strong>{detailInvoice.electricityUsage ?? 0} kWh</strong> (Thành tiền: {formatCurrency(detailInvoice.electricityAmount)})
                </Descriptions.Item>

                <Descriptions.Item label="Chỉ số nước (Cũ ➔ Mới)">
                  {detailInvoice.waterOld ?? 0} m³ ➔ {detailInvoice.waterNew ?? 0} m³
                </Descriptions.Item>
                <Descriptions.Item label="Nước tiêu thụ">
                  <strong>{detailInvoice.waterUsage ?? 0} m³</strong> (Thành tiền: {formatCurrency(detailInvoice.waterAmount)})
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Total summary breakdown */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                💵 Tổng Kết Chi Phí Hàng Tháng:
              </Text>
              <div className="my-rooms-cost-table">
                <div className="my-rooms-cost-row">
                  <span>Giá thuê phòng cố định:</span>
                  <Text strong>{formatCurrency(detailInvoice.rentAmount)}</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Tiền điện tiêu thụ ({detailInvoice.electricityUsage ?? 0} kWh):</span>
                  <Text strong>{formatCurrency(detailInvoice.electricityAmount)}</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Tiền nước sinh hoạt ({detailInvoice.waterUsage ?? 0} m³):</span>
                  <Text strong>{formatCurrency(detailInvoice.waterAmount)}</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Phí dịch vụ chung (wifi, rác...):</span>
                  <Text strong>{formatCurrency(detailInvoice.serviceAmount)}</Text>
                </div>
                {detailInvoice.otherAmount > 0 && (
                  <div className="my-rooms-cost-row">
                    <span>Chi phí phát sinh khác:</span>
                    <Text strong>{formatCurrency(detailInvoice.otherAmount)}</Text>
                  </div>
                )}
                {detailInvoice.discountAmount > 0 && (
                  <div className="my-rooms-cost-row">
                    <span>Giảm giá / Ưu đãi:</span>
                    <Text type="success" strong>- {formatCurrency(detailInvoice.discountAmount)}</Text>
                  </div>
                )}
                <div className="my-rooms-cost-row" style={{ paddingTop: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: "bold" }}>TỔNG CỘNG HÓA ĐƠN:</span>
                  <Text strong style={{ fontSize: 18, color: "#0f766e" }}>
                    {formatCurrency(detailInvoice.totalAmount)}
                  </Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span style={{ fontSize: 15, fontWeight: "bold" }}>Còn lại phải thanh toán:</span>
                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      color: Number(detailInvoice.remainingAmount || 0) > 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {formatCurrency(detailInvoice.remainingAmount)}
                  </Text>
                </div>
              </div>
            </div>
          </Space>
        )}
      </Modal>

      {/* VietQR Quick Payment Modal */}
      <Modal
        title="Quét Mã VietQR Chuyển Khoản Ngân Hàng"
        open={Boolean(qrModalInvoice)}
        onCancel={() => setQrModalInvoice(null)}
        footer={[
          <Button key="close" onClick={() => setQrModalInvoice(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={540}
        centered
      >
        {qrModalInvoice && (
          <div className="vietqr-box">
            <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16, color: "#0f172a" }}>
              Thanh Toán Hóa Đơn #{qrModalInvoice.invoiceCode}
            </Text>

            <img
              src={`https://img.vietqr.io/image/MB-999988889999-compact2.png?amount=${qrModalInvoice.remainingAmount || qrModalInvoice.totalAmount}&addInfo=HOADON%20${qrModalInvoice.invoiceCode}%20PHONG%20${qrModalInvoice.roomNumber}&accountName=CONG%20TY%20TRO%20PLUS`}
              alt="Mã VietQR Thanh Toán"
              className="vietqr-img"
            />

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ textAlign: "left", fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Ngân hàng:</span>
                <strong>MB Bank (Ngân hàng TMCP Quân Đội)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Số tài khoản:</span>
                <Space size={6}>
                  <strong style={{ fontSize: 15, color: "#0f766e" }}>9999 8888 9999</strong>
                  <Tooltip title="Sao chép STK">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard("999988889999", "Số tài khoản")}
                    />
                  </Tooltip>
                </Space>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Chủ tài khoản:</span>
                <strong>CÔNG TY TRO PLUS</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Nội dung chuyển khoản:</span>
                <Space size={6}>
                  <strong style={{ color: "#2563eb" }}>HOADON {qrModalInvoice.invoiceCode}</strong>
                  <Tooltip title="Sao chép nội dung">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(`HOADON ${qrModalInvoice.invoiceCode}`, "Nội dung chuyển khoản")}
                    />
                  </Tooltip>
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserInvoicesPage;
