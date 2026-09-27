import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  HomeOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const formatDateShort = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const getStatusMeta = (status) => {
  switch (status) {
    case "success":
      return {
        color: "success",
        label: "Thành công",
        icon: <CheckCircleFilled style={{ color: "#16a34a" }} />,
        badgeClass: "success",
      };
    case "pending":
      return {
        color: "warning",
        label: "Đang xử lý",
        icon: <ClockCircleFilled style={{ color: "#d97706" }} />,
        badgeClass: "pending",
      };
    case "cancelled":
      return {
        color: "default",
        label: "Đã hủy",
        icon: <CloseCircleFilled style={{ color: "#64748b" }} />,
        badgeClass: "failed",
      };
    case "refunded":
      return {
        color: "purple",
        label: "Đã hoàn tiền",
        icon: <ClockCircleFilled style={{ color: "#9333ea" }} />,
        badgeClass: "pending",
      };
    case "failed":
    default:
      return {
        color: "error",
        label: "Thất bại",
        icon: <CloseCircleFilled style={{ color: "#dc2626" }} />,
        badgeClass: "failed",
      };
  }
};

const getProviderMeta = (provider, method) => {
  const p = (provider || method || "").toLowerCase();
  if (p.includes("vnpay")) {
    return {
      label: "VNPay Online",
      color: "blue",
      icon: <CreditCardOutlined />,
      brand: "VNPay Gateway",
    };
  }
  if (p.includes("qr") || p.includes("manual_qr") || p.includes("bank")) {
    return {
      label: "Chuyển khoản QR",
      color: "cyan",
      icon: <QrcodeOutlined />,
      brand: "VietQR / Ngân hàng",
    };
  }
  if (p.includes("cash")) {
    return {
      label: "Tiền mặt",
      color: "gold",
      icon: <WalletOutlined />,
      brand: "Thanh toán trực tiếp",
    };
  }
  return {
    label: "Chuyển khoản",
    color: "geekblue",
    icon: <CreditCardOutlined />,
    brand: "Cổng thanh toán",
  };
};

const UserPaymentHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  // Selected payment for detail modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/payment-history");
      setPayments(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label || "mã"}!`);
  };

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Target type filter
      if (targetTypeFilter !== "all" && item.targetType !== targetTypeFilter) {
        return false;
      }

      // Provider filter
      if (providerFilter !== "all") {
        const p = (item.provider || item.method || "").toLowerCase();
        if (providerFilter === "vnpay" && !p.includes("vnpay")) return false;
        if (providerFilter === "qr" && !p.includes("qr") && !p.includes("bank")) return false;
        if (providerFilter === "cash" && !p.includes("cash")) return false;
      }

      // Time filter
      if (timeFilter !== "all") {
        const itemDate = new Date(item.paidAt || item.createdAt);
        const now = new Date();
        if (timeFilter === "this_month") {
          if (
            itemDate.getMonth() !== now.getMonth() ||
            itemDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (timeFilter === "last_3_months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          if (itemDate < threeMonthsAgo) return false;
        } else if (timeFilter === "this_year") {
          if (itemDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode =
          (item.providerTxnRef && item.providerTxnRef.toLowerCase().includes(q)) ||
          (item.providerTransactionId && item.providerTransactionId.toLowerCase().includes(q)) ||
          (item.invoiceCode && item.invoiceCode.toLowerCase().includes(q)) ||
          (item.requestCode && item.requestCode.toLowerCase().includes(q));

        const matchesRoom =
          (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
          (item.roomName && item.roomName.toLowerCase().includes(q));

        const matchesNote = item.note && item.note.toLowerCase().includes(q);

        if (!matchesCode && !matchesRoom && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [payments, statusFilter, targetTypeFilter, providerFilter, timeFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const successList = payments.filter((p) => p.status === "success");
    const totalPaid = successList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingList = payments.filter((p) => p.status === "pending");
    const latestSuccess = successList[0] || null;

    return {
      totalPaid,
      totalCount: payments.length,
      successCount: successList.length,
      pendingCount: pendingList.length,
      latestSuccess,
    };
  }, [payments]);

  // Handle open receipt modal
  const handleOpenReceipt = (payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      message.warning("Không có dữ liệu giao dịch để xuất");
      return;
    }

    const headers = [
      "Mã giao dịch / Tham chiếu",
      "Loại giao dịch",
      "Phòng",
      "Số tiền (VNĐ)",
      "Phương thức",
      "Trạng thái",
      "Thời gian",
      "Ghi chú",
    ];

    const rows = filteredPayments.map((p) => {
      const typeLabel =
        p.targetType === "invoice"
          ? `Hóa đơn ${p.invoiceMonth ? `${p.invoiceMonth}/${p.invoiceYear}` : ""}`
          : p.requestType === "rent"
          ? "Tiền thuê ban đầu"
          : "Cọc giữ phòng";

      const roomText = p.roomNumber ? `Phòng ${p.roomNumber}` : "-";
      const statusText =
        p.status === "success"
          ? "Thành công"
          : p.status === "pending"
          ? "Đang xử lý"
          : p.status === "refunded"
          ? "Đã hoàn tiền"
          : "Thất bại";

      const provMeta = getProviderMeta(p.provider, p.method);

      return [
        `"${p.providerTxnRef || p.providerTransactionId || p.id}"`,
        `"${typeLabel}"`,
        `"${roomText}"`,
        p.amount || 0,
        `"${provMeta.label}"`,
        `"${statusText}"`,
        `"${formatDate(p.paidAt || p.createdAt)}"`,
        `"${(p.note || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `lich-su-thanh-toan-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Đã tải xuống file lịch sử giao dịch!");
  };

  // Print individual receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Columns definition for Table view
  const columns = [
    {
      title: "Mã giao dịch / Tham chiếu",
      key: "code",
      width: 220,
      render: (_, record) => {
        const displayCode =
          record.providerTxnRef ||
          record.providerTransactionId ||
          record.requestCode ||
          record.invoiceCode ||
          record.id;
        const provMeta = getProviderMeta(record.provider, record.method);

        return (
          <Space orientation="vertical" size={2}>
            <Space size={6}>
              <Text strong style={{ color: "#0f172a", fontSize: 13 }}>
                {displayCode}
              </Text>
              <Tooltip title="Sao chép mã">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ fontSize: 12, color: "#64748b" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(displayCode, "mã giao dịch");
                  }}
                />
              </Tooltip>
            </Space>
            <Tag color={provMeta.color} icon={provMeta.icon} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
              {provMeta.label}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Khoản thanh toán",
      key: "target",
      render: (_, record) => {
        const isInvoice = record.targetType === "invoice";
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isInvoice ? (
                <FileTextOutlined style={{ color: "#0d9488", fontSize: 15 }} />
              ) : (
                <HomeOutlined style={{ color: "#0284c7", fontSize: 15 }} />
              )}
              <Text strong style={{ fontSize: 14, color: "#1e293b" }}>
                {isInvoice
                  ? `Hóa đơn ${record.invoiceMonth ? `tháng ${record.invoiceMonth}/${record.invoiceYear}` : record.invoiceCode || ""}`
                  : record.requestType === "rent"
                  ? "Thanh toán thuê phòng"
                  : "Cọc giữ phòng"}
              </Text>
            </div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
              {record.roomNumber ? (
                <span>
                  Phòng <b style={{ color: "#0f766e" }}>{record.roomNumber}</b>
                  {record.roomName ? ` (${record.roomName})` : ""}
                </span>
              ) : (
                record.requestCode || record.invoiceCode || "Giao dịch Tro Plus"
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Số tiền thanh toán",
      dataIndex: "amount",
      key: "amount",
      width: 170,
      render: (value, record) => {
        const isSuccess = record.status === "success";
        return (
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: isSuccess ? "#0d9488" : record.status === "pending" ? "#d97706" : "#64748b",
              }}
            >
              {formatCurrency(value)}
            </div>
            {record.invoiceDetails?.rentAmount > 0 && (
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Gồm tiền phòng + dịch vụ
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status) => {
        const meta = getStatusMeta(status);
        return (
          <Tag
            color={meta.color}
            icon={meta.icon}
            style={{
              borderRadius: 8,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian",
      key: "time",
      width: 170,
      render: (_, record) => {
        const displayDate = record.paidAt || record.createdAt;
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
              {formatDate(displayDate)}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {record.paidAt ? "Thanh toán lúc" : "Khởi tạo"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem biên nhận">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenReceipt(record)}
              style={{ borderRadius: 8 }}
            >
              Biên lai
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="payment-history-container">
      {/* Hero Header */}
      <Card className="payment-hero-card" bordered={false} bodyStyle={{ padding: "28px 32px" }}>
        <div className="payment-hero-content">
          <div className="payment-hero-title-group">
            <div className="payment-hero-icon-box">
              <HistoryOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#ffffff", margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>
                Lịch sử thanh toán
              </Title>
              <Text style={{ color: "#a7f3d0", fontSize: 14 }}>
                Theo dõi minh bạch toàn bộ các giao dịch thanh toán tiền phòng, tiền cọc và hóa đơn sinh hoạt.
              </Text>
            </div>
          </div>

          <div className="payment-hero-actions">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchPayments}
              style={{
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.15)",
                borderColor: "rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              Làm mới
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.15)",
                borderColor: "rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              In danh sách
            </Button>
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={handleExportCSV}
              style={{
                borderRadius: 10,
                background: "#10b981",
                borderColor: "#10b981",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
              }}
            >
              Xuất CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metric Stat Cards */}
      <div className="payment-stats-grid">
        <div className="payment-stat-card primary">
          <div className="payment-stat-header">
            <span className="payment-stat-title">Tổng tiền đã thanh toán</span>
            <div className="payment-stat-icon-wrapper" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="payment-stat-value" style={{ color: "#0f766e" }}>
            {formatCurrency(stats.totalPaid)}
          </div>
          <div className="payment-stat-subtext">
            Tích lũy từ <b>{stats.successCount}</b> giao dịch thành công
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-header">
            <span className="payment-stat-title">Giao dịch thành công</span>
            <div className="payment-stat-icon-wrapper" style={{ background: "#e0f2fe", color: "#0284c7" }}>
              <CheckCircleFilled />
            </div>
          </div>
          <div className="payment-stat-value">{stats.successCount}</div>
          <div className="payment-stat-subtext">
            Trên tổng số <b>{stats.totalCount}</b> giao dịch
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-header">
            <span className="payment-stat-title">Đang chờ xử lý</span>
            <div className="payment-stat-icon-wrapper" style={{ background: "#fef3c7", color: "#d97706" }}>
              <ClockCircleFilled />
            </div>
          </div>
          <div className="payment-stat-value" style={{ color: stats.pendingCount > 0 ? "#d97706" : "#64748b" }}>
            {stats.pendingCount}
          </div>
          <div className="payment-stat-subtext">
            {stats.pendingCount > 0 ? "Cần hoàn tất hoặc chờ admin duyệt" : "Không có giao dịch chờ"}
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-header">
            <span className="payment-stat-title">Giao dịch gần nhất</span>
            <div className="payment-stat-icon-wrapper" style={{ background: "#f1f5f9", color: "#475569" }}>
              <CalendarOutlined />
            </div>
          </div>
          <div className="payment-stat-value" style={{ fontSize: 20 }}>
            {stats.latestSuccess ? formatCurrency(stats.latestSuccess.amount) : "Chưa có"}
          </div>
          <div className="payment-stat-subtext">
            {stats.latestSuccess
              ? formatDateShort(stats.latestSuccess.paidAt || stats.latestSuccess.createdAt)
              : "Chưa phát sinh thanh toán"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="payment-filter-card">
        <div className="payment-filter-row">
          <div className="payment-filter-left">
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Tìm theo mã GD, số phòng, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 280, borderRadius: 10 }}
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "success", label: "Thành công" },
                { value: "pending", label: "Đang xử lý" },
                { value: "failed", label: "Thất bại" },
              ]}
            />

            <Select
              value={targetTypeFilter}
              onChange={setTargetTypeFilter}
              style={{ width: 160 }}
              options={[
                { value: "all", label: "Tất cả khoản thu" },
                { value: "invoice", label: "Hóa đơn dịch vụ" },
                { value: "room_request", label: "Cọc / Thuê phòng" },
              ]}
            />

            <Select
              value={providerFilter}
              onChange={setProviderFilter}
              style={{ width: 160 }}
              options={[
                { value: "all", label: "Tất cả phương thức" },
                { value: "vnpay", label: "VNPay Online" },
                { value: "qr", label: "Chuyển khoản QR" },
                { value: "cash", label: "Tiền mặt" },
              ]}
            />

            <Select
              value={timeFilter}
              onChange={setTimeFilter}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "Tất cả thời gian" },
                { value: "this_month", label: "Tháng này" },
                { value: "last_3_months", label: "3 tháng gần đây" },
                { value: "this_year", label: "Năm nay" },
              ]}
            />
          </div>

          <div className="payment-filter-right">
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "table", label: "Bảng" },
                { value: "card", label: "Thẻ" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content: Table or Card View */}
      {viewMode === "table" ? (
        <Card
          style={{ borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredPayments}
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text strong style={{ color: "#475569" }}>
                        Chưa có lịch sử thanh toán
                      </Text>
                      <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                        {searchQuery || statusFilter !== "all"
                          ? "Không có giao dịch nào khớp với bộ lọc của bạn."
                          : "Khi bạn thanh toán tiền thuê, cọc giữ phòng hoặc hóa đơn, các giao dịch sẽ hiển thị tại đây."}
                      </div>
                    </div>
                  }
                />
              ),
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} giao dịch`,
            }}
            scroll={{ x: 980 }}
            onRow={(record) => ({
              onClick: () => handleOpenReceipt(record),
              style: { cursor: "pointer" },
            })}
          />
        </Card>
      ) : (
        <div>
          {filteredPayments.length === 0 ? (
            <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 20px" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không tìm thấy giao dịch nào phù hợp"
              />
            </Card>
          ) : (
            <div className="payment-cards-grid">
              {filteredPayments.map((record) => {
                const statusMeta = getStatusMeta(record.status);
                const provMeta = getProviderMeta(record.provider, record.method);
                const isInvoice = record.targetType === "invoice";

                return (
                  <div key={record.id} className="payment-grid-item">
                    <div>
                      <div className="payment-item-header">
                        <Tag
                          color={isInvoice ? "teal" : "blue"}
                          icon={isInvoice ? <FileTextOutlined /> : <HomeOutlined />}
                          style={{ borderRadius: 8, padding: "2px 8px", fontSize: 12 }}
                        >
                          {isInvoice
                            ? `Hóa đơn ${record.invoiceMonth ? `T${record.invoiceMonth}/${record.invoiceYear}` : ""}`
                            : record.requestType === "rent"
                            ? "Tiền thuê phòng"
                            : "Cọc giữ phòng"}
                        </Tag>
                        <Tag
                          color={statusMeta.color}
                          icon={statusMeta.icon}
                          style={{ borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}
                        >
                          {statusMeta.label}
                        </Tag>
                      </div>

                      <div className="payment-item-amount">
                        {formatCurrency(record.amount)}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ color: "#0f766e" }}>
                          {record.roomNumber ? `Phòng ${record.roomNumber}` : "Hệ thống Tro Plus"}
                        </Text>
                        {record.roomName && (
                          <span style={{ color: "#64748b", fontSize: 12 }}>
                            {" "}
                            • {record.roomName}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="payment-item-detail-row">
                          <span className="payment-item-label">Mã tham chiếu:</span>
                          <span className="payment-item-val" style={{ fontFamily: "monospace" }}>
                            {record.providerTxnRef || record.providerTransactionId || record.id?.slice(-8)}
                          </span>
                        </div>
                        <div className="payment-item-detail-row">
                          <span className="payment-item-label">Phương thức:</span>
                          <span className="payment-item-val">
                            <Tag color={provMeta.color} style={{ margin: 0 }}>
                              {provMeta.label}
                            </Tag>
                          </span>
                        </div>
                        <div className="payment-item-detail-row">
                          <span className="payment-item-label">Thời gian:</span>
                          <span className="payment-item-val">
                            {formatDate(record.paidAt || record.createdAt)}
                          </span>
                        </div>
                        {record.note && (
                          <div className="payment-item-detail-row">
                            <span className="payment-item-label">Ghi chú:</span>
                            <span className="payment-item-val" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {record.note}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="payment-item-actions">
                      <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleOpenReceipt(record)}
                        style={{ borderRadius: 8 }}
                      >
                        Biên lai
                      </Button>
                      {isInvoice && (
                        <Button
                          type="link"
                          size="small"
                          icon={<ArrowRightOutlined />}
                          onClick={() => navigate("/user/invoices")}
                          style={{ padding: 0 }}
                        >
                          Hóa đơn
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Electronic Receipt Modal */}
      <Modal
        open={isReceiptModalOpen}
        onCancel={() => setIsReceiptModalOpen(false)}
        footer={null}
        width={620}
        destroyOnClose
        centered
        wrapClassName="payment-receipt-modal"
      >
        {selectedPayment && (
          <div className="payment-receipt-container">
            {/* Header */}
            <div className="payment-receipt-header">
              <div className="payment-receipt-brand">
                <HomeOutlined /> TRO PLUS TENANT PORTAL
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                BIÊN NHẬN THANH TOÁN ĐIỆN TỬ
              </div>
              <div>
                <span className={`payment-receipt-badge ${getStatusMeta(selectedPayment.status).badgeClass}`}>
                  {getStatusMeta(selectedPayment.status).icon}
                  {getStatusMeta(selectedPayment.status).label}
                </span>
              </div>
            </div>

            {/* Large Amount */}
            <div className="payment-receipt-amount-box">
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Số tiền thanh toán
              </div>
              <div className="payment-receipt-amount">
                {formatCurrency(selectedPayment.amount)}
              </div>
              <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 600 }}>
                Thanh toán thành công vào hệ thống Tro Plus
              </div>
            </div>

            {/* Descriptions Breakdown */}
            <Descriptions
              bordered
              size="small"
              column={1}
              style={{ marginBottom: 20 }}
              labelStyle={{ width: "42%", fontWeight: 600, color: "#475569", background: "#f8fafc" }}
            >
              <Descriptions.Item label="Mã giao dịch / GD No.">
                <Space>
                  <Text copyable={{ text: selectedPayment.providerTxnRef || selectedPayment.providerTransactionId || selectedPayment.id }}>
                    {selectedPayment.providerTxnRef || selectedPayment.providerTransactionId || selectedPayment.id}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Mục đích thanh toán">
                {selectedPayment.targetType === "invoice" ? (
                  <span>
                    Hóa đơn tiền nhà{" "}
                    <b>{selectedPayment.invoiceMonth ? `tháng ${selectedPayment.invoiceMonth}/${selectedPayment.invoiceYear}` : ""}</b>
                    {selectedPayment.invoiceCode ? ` (${selectedPayment.invoiceCode})` : ""}
                  </span>
                ) : selectedPayment.requestType === "rent" ? (
                  <span>Thanh toán tiền thuê phòng ban đầu</span>
                ) : (
                  <span>Đặt cọc giữ phòng trực tuyến</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Căn hộ / Phòng">
                {selectedPayment.roomNumber ? (
                  <span>
                    Phòng <b>{selectedPayment.roomNumber}</b>
                    {selectedPayment.roomName ? ` - ${selectedPayment.roomName}` : ""}
                  </span>
                ) : (
                  "-"
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color={getProviderMeta(selectedPayment.provider, selectedPayment.method).color} style={{ borderRadius: 6 }}>
                  {getProviderMeta(selectedPayment.provider, selectedPayment.method).brand}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Thời gian thực hiện">
                {formatDate(selectedPayment.paidAt || selectedPayment.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Người thanh toán">
                {user?.name || "Khách thuê"} ({user?.phone || user?.email || "-"})
              </Descriptions.Item>

              {selectedPayment.note && (
                <Descriptions.Item label="Ghi chú">
                  {selectedPayment.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Extra invoice line items breakdown if available */}
            {selectedPayment.invoiceDetails && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                  Chi tiết các khoản trong hóa đơn
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "#64748b" }}>Tiền thuê phòng:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayment.invoiceDetails.rentAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "#64748b" }}>Tiền điện sinh hoạt:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayment.invoiceDetails.electricityAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "#64748b" }}>Tiền nước sinh hoạt:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayment.invoiceDetails.waterAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "#64748b" }}>Phí dịch vụ chung:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayment.invoiceDetails.serviceAmount)}</span>
                  </div>
                  {Number(selectedPayment.invoiceDetails.otherAmount || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span style={{ color: "#64748b" }}>Chi phí phát sinh khác:</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayment.invoiceDetails.otherAmount)}</span>
                    </div>
                  )}
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#0f766e" }}>
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(selectedPayment.invoiceDetails.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="payment-receipt-footer">
              Biên lai điện tử có giá trị xác nhận giao dịch thanh toán trên hệ thống Tro Plus.
              <br />
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ quản lý trọ để được hỗ trợ.
            </div>

            {/* Modal Actions */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
                In biên nhận
              </Button>
              {selectedPayment.targetType === "invoice" ? (
                <Button
                  type="primary"
                  ghost
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    navigate("/user/invoices");
                  }}
                >
                  Xem danh sách hóa đơn
                </Button>
              ) : (
                <Button
                  type="primary"
                  ghost
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    navigate("/user/room-requests");
                  }}
                >
                  Xem phòng đã cọc
                </Button>
              )}
              <Button type="primary" onClick={() => setIsReceiptModalOpen(false)} style={{ background: "#0f766e", borderColor: "#0f766e" }}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserPaymentHistoryPage;
