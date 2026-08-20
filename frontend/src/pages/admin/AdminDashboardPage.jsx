import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  ReloadOutlined,
  RightOutlined,
  RiseOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  UserSwitchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./AdminDashboard.css";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => {
  const year = currentYear - index;
  return { label: `Năm ${year}`, value: year };
});

const currencyFormatter = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const compactCurrencyFormatter = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }

  if (amount >= 1000000) {
    return `${(amount / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} k`;
  }

  return amount.toLocaleString("vi-VN");
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const invoiceStatusMeta = {
  paid: { color: "#10b981", label: "Đã thanh toán", tagColor: "success" },
  partial: { color: "#f59e0b", label: "Thanh toán 1 phần", tagColor: "warning" },
  unpaid: { color: "#64748b", label: "Chưa thanh toán", tagColor: "default" },
  overdue: { color: "#ef4444", label: "Quá hạn", tagColor: "error" },
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("expiringContracts");

  const fetchDashboard = async (year = selectedYear) => {
    setLoading(true);

    try {
      const { data } = await http.get("/dashboard/admin", { params: { year } });
      setDashboard(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear]);

  const totalRooms = Number(dashboard?.rooms?.total || 0);
  const occupiedRooms = Number(dashboard?.rooms?.occupied || 0);
  const availableRooms = Number(dashboard?.rooms?.available || 0);
  const reservedRooms = Number(dashboard?.rooms?.reserved || 0);
  const maintenanceRooms = Number(dashboard?.rooms?.maintenance || 0);

  const occupancyPercent = useMemo(() => {
    return totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  }, [totalRooms, occupiedRooms]);

  const revenueByMonth = dashboard?.revenue?.byMonth || [];
  const maxChartAmount = Math.max(
    ...revenueByMonth.flatMap((item) => [
      Number(item.collectedAmount || 0),
      Math.abs(Number(item.profitAmount || 0)),
    ]),
    1
  );

  const currentPeriodMonth = dashboard?.period?.month || new Date().getMonth() + 1;
  const currentPeriodYear = dashboard?.period?.year || new Date().getFullYear();

  const currentMonthRevenue =
    revenueByMonth.find((item) => Number(item.month) === Number(dashboard?.period?.month))?.collectedAmount ||
    dashboard?.invoices?.collectedThisMonth ||
    0;

  const currentMonthProfit =
    revenueByMonth.find((item) => Number(item.month) === Number(dashboard?.period?.month))?.profitAmount ??
    dashboard?.profit?.currentMonth ??
    0;

  const currentMonthGrowth =
    revenueByMonth.find((item) => Number(item.month) === Number(dashboard?.period?.month))?.growthRate ?? null;

  const invoiceTotal = useMemo(
    () =>
      Number(dashboard?.invoices?.unpaid || 0) +
      Number(dashboard?.invoices?.partial || 0) +
      Number(dashboard?.invoices?.paid || 0) +
      Number(dashboard?.invoices?.overdue || 0),
    [dashboard]
  );

  const invoiceSegments = useMemo(
    () =>
      ["paid", "partial", "unpaid", "overdue"].map((status) => ({
        ...invoiceStatusMeta[status],
        count: Number(dashboard?.invoices?.[status] || 0),
        percent: invoiceTotal ? Math.round((Number(dashboard?.invoices?.[status] || 0) / invoiceTotal) * 100) : 0,
        status,
      })),
    [dashboard, invoiceTotal]
  );

  // Table columns for expiring contracts
  const expiringContractColumns = [
    {
      title: "Mã Hợp Đồng",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (value) => (
        <span className="adm-table-code">
          <FileProtectOutlined style={{ marginRight: 6 }} />
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => (
        <span className="adm-table-room-badge">
          <HomeOutlined />
          {record.roomNumber ? `P.${record.roomNumber}` : "-"}
          {record.roomName ? ` (${record.roomName})` : ""}
        </span>
      ),
    },
    {
      title: "Khách thuê",
      dataIndex: "tenantName",
      key: "tenantName",
      render: (value) => (
        <Space size={6}>
          <UserOutlined style={{ color: "#64748b" }} />
          <Typography.Text strong>{value || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "endDate",
      key: "endDate",
      render: (value) => (
        <Tag color="warning" icon={<ClockCircleOutlined />}>
          {formatDate(value)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate("/admin/contracts")}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  // Table columns for overdue invoices
  const overdueInvoiceColumns = [
    {
      title: "Mã Hóa Đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      render: (value) => (
        <span className="adm-table-code" style={{ color: "#e11d48" }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Phòng & Khách",
      key: "roomTenant",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span className="adm-table-room-badge">
            <HomeOutlined /> P.{record.roomNumber || "-"}
          </span>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.tenantName || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (val) => currencyFormatter(val),
    },
    {
      title: "Còn nợ",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (val) => (
        <Typography.Text strong style={{ color: "#dc2626" }}>
          {currencyFormatter(val)}
        </Typography.Text>
      ),
    },
    {
      title: "Hạn đóng",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (value) => (
        <Tag color="error" icon={<ExclamationCircleOutlined />}>
          {formatDate(value)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate("/admin/invoices")}
        >
          Thu tiền
        </Button>
      ),
    },
  ];

  // Table columns for available rooms
  const availableRoomColumns = [
    {
      title: "Số phòng",
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (value) => (
        <span className="adm-table-room-badge" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
          <HomeOutlined /> P.{value}
        </span>
      ),
    },
    {
      title: "Tên phòng",
      dataIndex: "name",
      key: "name",
      render: (value) => value || "-",
    },
    {
      title: "Tầng",
      dataIndex: "floor",
      key: "floor",
      render: (value) => (value ? `Tầng ${value}` : "-"),
    },
    {
      title: "Giá niêm yết",
      dataIndex: "price",
      key: "price",
      render: (value) => (
        <Typography.Text strong style={{ color: "#0f766e" }}>
          {currencyFormatter(value)}
        </Typography.Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: () => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Sẵn sàng đón khách
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate("/admin/rooms")}
        >
          Xem phòng
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-dashboard-wrapper">
      {/* Hero / Header Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-inner">
          <div className="adm-hero-left">
            <div className="adm-hero-badge">
              <span className="pulse-dot" />
              <span>HỆ THỐNG QUẢN LÝ TRO PLUS</span>
            </div>
            <Typography.Title level={2} className="adm-hero-title">
              Báo Cáo Tổng Quan Hoạt Động
            </Typography.Title>
            <Typography.Paragraph className="adm-hero-subtitle">
              Theo dõi tình hình kinh doanh, dòng tiền, tình trạng lấp đầy phòng và các cảnh báo quan trọng trong thời gian thực.
            </Typography.Paragraph>
            <div className="adm-hero-chips">
              <div className="adm-hero-chip-item">
                <CalendarOutlined />
                <span>Tháng {currentPeriodMonth} / Năm {currentPeriodYear}</span>
              </div>
              <div className="adm-hero-chip-item">
                <HomeOutlined />
                <span>{occupiedRooms}/{totalRooms || 0} phòng đang thuê ({occupancyPercent}%)</span>
              </div>
              <div className="adm-hero-chip-item">
                <TeamOutlined />
                <span>{dashboard?.tenants?.active || 0} khách thuê đang ở</span>
              </div>
            </div>
          </div>

          <div className="adm-hero-right">
            <Select
              className="adm-year-select"
              value={selectedYear}
              options={yearOptions}
              onChange={setSelectedYear}
              size="large"
            />
            <Button
              className="adm-reload-btn"
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => fetchDashboard(selectedYear)}
              loading={loading}
              size="large"
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Strip */}
      <div className="adm-quick-actions-bar">
        <span className="adm-quick-actions-label">
          <RiseOutlined style={{ marginRight: 6 }} />
          Lối tắt nhanh:
        </span>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/rooms")}>
          <HomeOutlined /> Quản lý phòng
        </button>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/invoices")}>
          <FileTextOutlined /> Quản lý hóa đơn
        </button>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/contracts")}>
          <FileProtectOutlined /> Quản lý hợp đồng
        </button>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/operating-expenses")}>
          <DollarOutlined /> Chi phí vận hành
        </button>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/repair-requests")}>
          <ToolOutlined /> Xử lý sự cố
        </button>
        <button className="adm-quick-btn" onClick={() => navigate("/admin/tenants")}>
          <UserSwitchOutlined /> Khách thuê
        </button>
      </div>

      {/* Top 5 KPI Cards Grid */}
      <div className="adm-kpi-grid">
        {/* KPI 1: Doanh thu tháng */}
        <div className="adm-kpi-card kpi-teal">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Doanh thu T{currentPeriodMonth}</span>
            <div className="adm-kpi-icon-wrap icon-teal">
              <WalletOutlined />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <div className="adm-kpi-main-val">
              {compactCurrencyFormatter(currentMonthRevenue)}
            </div>
            {currentMonthGrowth === null ? (
              <span className="adm-kpi-badge badge-neutral">Mới</span>
            ) : (
              <span
                className={`adm-kpi-badge ${
                  currentMonthGrowth >= 0 ? "badge-success" : "badge-danger"
                }`}
              >
                {currentMonthGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(currentMonthGrowth)}%
              </span>
            )}
          </div>
          <div className="adm-kpi-bottom">
            <span>Chi tiết: {currencyFormatter(currentMonthRevenue)}</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Đã thu thực tế
            </Typography.Text>
          </div>
        </div>

        {/* KPI 2: Lợi nhuận tháng */}
        <div className="adm-kpi-card kpi-emerald">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Lợi nhuận ròng T{currentPeriodMonth}</span>
            <div className={`adm-kpi-icon-wrap ${Number(currentMonthProfit) >= 0 ? "icon-emerald" : "icon-rose"}`}>
              <DollarOutlined />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <div
              className="adm-kpi-main-val"
              style={{ color: Number(currentMonthProfit) >= 0 ? "#059669" : "#e11d48" }}
            >
              {compactCurrencyFormatter(currentMonthProfit)}
            </div>
            <span
              className={`adm-kpi-badge ${
                Number(currentMonthProfit) >= 0 ? "badge-success" : "badge-danger"
              }`}
            >
              {Number(currentMonthProfit) >= 0 ? "Lợi nhuận +" : "Lợi nhuận -"}
            </span>
          </div>
          <div className="adm-kpi-bottom">
            <span>Đã chi: {compactCurrencyFormatter(dashboard?.expenses?.paidThisMonth || 0)}</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Thu trừ chi phí
            </Typography.Text>
          </div>
        </div>

        {/* KPI 3: Tỷ lệ lấp đầy */}
        <div className="adm-kpi-card kpi-blue">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Tỷ lệ lấp đầy</span>
            <div className="adm-kpi-icon-wrap icon-blue">
              <HomeOutlined />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <div className="adm-kpi-main-val">{occupancyPercent}%</div>
            <span className="adm-kpi-badge badge-success">
              {availableRooms} phòng trống
            </span>
          </div>
          <div>
            <Progress
              percent={occupancyPercent}
              size="small"
              strokeColor={{ "0%": "#3b82f6", "100%": "#0f766e" }}
              showInfo={false}
            />
          </div>
          <div className="adm-kpi-bottom">
            <span>Đang thuê: {occupiedRooms}/{totalRooms} phòng</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Bảo trì: {maintenanceRooms}
            </Typography.Text>
          </div>
        </div>

        {/* KPI 4: Hóa đơn & Công nợ */}
        <div className="adm-kpi-card kpi-amber">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Công nợ cần thu</span>
            <div className="adm-kpi-icon-wrap icon-amber">
              <FileTextOutlined />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <div className="adm-kpi-main-val" style={{ color: "#d97706" }}>
              {compactCurrencyFormatter(dashboard?.invoices?.outstandingAmount || 0)}
            </div>
            <span className="adm-kpi-badge badge-danger">
              {dashboard?.invoices?.overdue || 0} quá hạn
            </span>
          </div>
          <div className="adm-kpi-bottom">
            <span>Tổng hóa đơn: {invoiceTotal}</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Chưa thu: {dashboard?.invoices?.unpaid || 0}
            </Typography.Text>
          </div>
        </div>

        {/* KPI 5: Khách thuê & Hợp đồng */}
        <div className="adm-kpi-card kpi-purple">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Khách thuê & Hợp đồng</span>
            <div className="adm-kpi-icon-wrap icon-purple">
              <UserSwitchOutlined />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <div className="adm-kpi-main-val">
              {dashboard?.tenants?.active || 0}
              <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b", marginLeft: 4 }}>
                khách
              </span>
            </div>
            <span className="adm-kpi-badge badge-neutral">
              {dashboard?.contracts?.expiringSoon || 0} HĐ sắp hết
            </span>
          </div>
          <div className="adm-kpi-bottom">
            <span>HĐ hiệu lực: {dashboard?.contracts?.active || 0}</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Tài khoản: {dashboard?.tenants?.totalUsers || 0}
            </Typography.Text>
          </div>
        </div>
      </div>

      {/* Yearly Financial Analytics Chart */}
      <div className="adm-chart-card">
        <div className="adm-chart-header">
          <div className="adm-chart-title-area">
            <h3 className="adm-chart-title">
              <RiseOutlined style={{ color: "#0f766e" }} />
              Diễn Biến Doanh Thu & Lợi Nhuận Năm {selectedYear}
            </h3>
            <p className="adm-chart-subtitle">
              Biểu đồ trực quan so sánh doanh thu đã thu và lợi nhuận ròng từng tháng trong năm {selectedYear}.
            </p>
          </div>

          <div className="adm-chart-yearly-stats">
            <div className="adm-stat-pill pill-revenue">
              <span>Tổng thu {selectedYear}:</span>
              <strong>{compactCurrencyFormatter(dashboard?.revenue?.yearlyCollectedAmount || 0)}</strong>
            </div>
            <div className="adm-stat-pill pill-expense">
              <span>Tổng chi {selectedYear}:</span>
              <strong>{compactCurrencyFormatter(dashboard?.revenue?.yearlyPaidExpenseAmount || 0)}</strong>
            </div>
            <div
              className={`adm-stat-pill ${
                Number(dashboard?.revenue?.yearlyProfitAmount || 0) >= 0
                  ? "pill-profit-pos"
                  : "pill-profit-neg"
              }`}
            >
              <span>Lợi nhuận ròng:</span>
              <strong>{compactCurrencyFormatter(dashboard?.revenue?.yearlyProfitAmount || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="adm-chart-legends">
          <div className="adm-legend-item">
            <div className="adm-legend-dot" style={{ background: "#2563eb" }} />
            <span>Doanh thu đã thu</span>
          </div>
          <div className="adm-legend-item">
            <div className="adm-legend-dot" style={{ background: "#0f766e" }} />
            <span>Tháng hiện tại ({currentPeriodMonth}/{selectedYear})</span>
          </div>
          <div className="adm-legend-item">
            <div className="adm-legend-dot" style={{ background: "#10b981" }} />
            <span>Lợi nhuận dương</span>
          </div>
          <div className="adm-legend-item">
            <div className="adm-legend-dot" style={{ background: "#f43f5e" }} />
            <span>Lợi nhuận âm</span>
          </div>
        </div>

        {/* Dynamic Visual Bars Grid */}
        <div className="adm-chart-container">
          {revenueByMonth.map((item) => {
            const isCurrentMonth =
              Number(item.month) === Number(dashboard?.period?.month) &&
              Number(selectedYear) === Number(dashboard?.period?.year);

            const revenueHeight = Math.max(
              (Number(item.collectedAmount || 0) / maxChartAmount) * 170,
              item.collectedAmount ? 20 : 6
            );
            const profitHeight = Math.max(
              (Math.abs(Number(item.profitAmount || 0)) / maxChartAmount) * 170,
              item.profitAmount ? 20 : 6
            );

            return (
              <div
                key={item.month}
                className={`adm-month-col ${isCurrentMonth ? "is-current-month" : ""}`}
              >
                {/* Collected Amount preview */}
                <Tooltip
                  title={
                    <div>
                      <div>
                        <strong>Tháng {item.month}/{selectedYear}</strong>
                      </div>
                      <div>Doanh thu: {currencyFormatter(item.collectedAmount)}</div>
                      <div>Đã chi: {currencyFormatter(item.paidExpenseAmount)}</div>
                      <div>Lợi nhuận: {currencyFormatter(item.profitAmount)}</div>
                      {item.growthRate !== null && <div>Tăng trưởng: {item.growthRate}%</div>}
                    </div>
                  }
                >
                  <span className="adm-month-col-amt">
                    {compactCurrencyFormatter(item.collectedAmount)}
                  </span>
                </Tooltip>

                {/* Bars Pair */}
                <div className="adm-bars-pair">
                  {/* Revenue Bar */}
                  <Tooltip title={`Doanh thu T${item.month}: ${currencyFormatter(item.collectedAmount)}`}>
                    <div
                      className={`adm-bar adm-bar-revenue ${isCurrentMonth ? "current" : ""}`}
                      style={{ height: `${revenueHeight}px` }}
                    />
                  </Tooltip>

                  {/* Profit Bar */}
                  <Tooltip title={`Lợi nhuận T${item.month}: ${currencyFormatter(item.profitAmount)}`}>
                    <div
                      className={`adm-bar ${
                        Number(item.profitAmount || 0) >= 0
                          ? "adm-bar-profit-pos"
                          : "adm-bar-profit-neg"
                      }`}
                      style={{
                        height: `${profitHeight}px`,
                        opacity: item.profitAmount ? 1 : 0.4,
                      }}
                    />
                  </Tooltip>
                </div>

                {/* Growth indicator badge */}
                <span
                  className="adm-month-growth-tag"
                  style={{
                    background:
                      item.growthRate === null
                        ? "#f1f5f9"
                        : item.growthRate >= 0
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      item.growthRate === null
                        ? "#94a3b8"
                        : item.growthRate >= 0
                        ? "#15803d"
                        : "#b91c1c",
                  }}
                >
                  {item.growthRate === null
                    ? "--"
                    : `${item.growthRate >= 0 ? "+" : ""}${item.growthRate}%`}
                </span>

                {/* Month label */}
                <span className="adm-month-label">
                  {isCurrentMonth ? `★ T${item.month}` : `T${item.month}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Invoices Breakdown & Room Breakdown */}
      <div className="adm-two-col-grid">
        {/* Left: Invoice Breakdown & Cash Flow */}
        <div className="adm-section-card">
          <div className="adm-section-header">
            <h4 className="adm-section-title">
              <FileTextOutlined style={{ color: "#2563eb" }} />
              Cơ Cấu Trạng Thái Hóa Đơn
            </h4>
            <Button
              type="link"
              size="small"
              onClick={() => navigate("/admin/invoices")}
            >
              Xem tất cả <RightOutlined />
            </Button>
          </div>

          <div className="adm-invoice-status-list">
            {invoiceSegments.map((item) => (
              <div key={item.status} className="adm-invoice-status-item">
                <div className="adm-invoice-status-item-top">
                  <div className="adm-status-left">
                    <div
                      className="adm-status-dot"
                      style={{ background: item.color }}
                    />
                    <span className="adm-status-name">{item.label}</span>
                  </div>
                  <div>
                    <span className="adm-status-count">{item.count}</span>
                    <span className="adm-status-pct">({item.percent}%)</span>
                  </div>
                </div>
                <Progress
                  percent={item.percent}
                  size="small"
                  strokeColor={item.color}
                  showInfo={false}
                />
              </div>
            ))}
          </div>

          <div className="adm-invoice-summary-banner">
            <div>
              <div className="adm-summary-label">Tổng công nợ chưa thu hồi</div>
              <div className="adm-summary-val">
                {currencyFormatter(dashboard?.invoices?.outstandingAmount || 0)}
              </div>
            </div>
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => navigate("/admin/invoices")}
            >
              Đôn đốc thu nợ
            </Button>
          </div>
        </div>

        {/* Right: Room Occupancy Status Breakdown */}
        <div className="adm-section-card">
          <div className="adm-section-header">
            <h4 className="adm-section-title">
              <HomeOutlined style={{ color: "#0f766e" }} />
              Phân Bổ Tình Trạng Phòng Trọ
            </h4>
            <Button
              type="link"
              size="small"
              onClick={() => navigate("/admin/rooms")}
            >
              Quản lý phòng <RightOutlined />
            </Button>
          </div>

          <div className="adm-room-breakdown-grid">
            {/* Occupied */}
            <div className="adm-room-breakdown-box">
              <div className="adm-room-box-header">
                <span>ĐANG THUÊ</span>
                <Tag color="blue">{totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%</Tag>
              </div>
              <div className="adm-room-box-val" style={{ color: "#2563eb" }}>
                {occupiedRooms}
              </div>
              <div className="adm-room-box-bar">
                <div
                  className="adm-room-box-bar-fill"
                  style={{
                    background: "#2563eb",
                    width: `${totalRooms ? (occupiedRooms / totalRooms) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Available */}
            <div className="adm-room-breakdown-box">
              <div className="adm-room-box-header">
                <span>CÒN TRỐNG</span>
                <Tag color="success">{totalRooms ? Math.round((availableRooms / totalRooms) * 100) : 0}%</Tag>
              </div>
              <div className="adm-room-box-val" style={{ color: "#10b981" }}>
                {availableRooms}
              </div>
              <div className="adm-room-box-bar">
                <div
                  className="adm-room-box-bar-fill"
                  style={{
                    background: "#10b981",
                    width: `${totalRooms ? (availableRooms / totalRooms) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Reserved */}
            <div className="adm-room-breakdown-box">
              <div className="adm-room-box-header">
                <span>ĐÃ GIỮ CHỖ</span>
                <Tag color="warning">{totalRooms ? Math.round((reservedRooms / totalRooms) * 100) : 0}%</Tag>
              </div>
              <div className="adm-room-box-val" style={{ color: "#f59e0b" }}>
                {reservedRooms}
              </div>
              <div className="adm-room-box-bar">
                <div
                  className="adm-room-box-bar-fill"
                  style={{
                    background: "#f59e0b",
                    width: `${totalRooms ? (reservedRooms / totalRooms) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Maintenance */}
            <div className="adm-room-breakdown-box">
              <div className="adm-room-box-header">
                <span>BẢO TRÌ</span>
                <Tag color="error">{totalRooms ? Math.round((maintenanceRooms / totalRooms) * 100) : 0}%</Tag>
              </div>
              <div className="adm-room-box-val" style={{ color: "#ef4444" }}>
                {maintenanceRooms}
              </div>
              <div className="adm-room-box-bar">
                <div
                  className="adm-room-box-bar-fill"
                  style={{
                    background: "#ef4444",
                    width: `${totalRooms ? (maintenanceRooms / totalRooms) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #f1f5f9",
            }}
          >
            <Typography.Text type="secondary">
              Tổng số phòng trong hệ thống:
            </Typography.Text>
            <Typography.Text strong style={{ fontSize: 16, color: "#0f766e" }}>
              {totalRooms} phòng
            </Typography.Text>
          </div>
        </div>
      </div>

      {/* Bottom Tabs & Urgent Operational Lists */}
      <div className="adm-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "expiringContracts",
              label: (
                <span>
                  <FileProtectOutlined style={{ marginRight: 6 }} />
                  Hợp đồng sắp hết hạn ({dashboard?.recent?.expiringContracts?.length || 0})
                </span>
              ),
              children: (
                <Table
                  className="adm-table"
                  rowKey="id"
                  columns={expiringContractColumns}
                  dataSource={dashboard?.recent?.expiringContracts || []}
                  pagination={false}
                  size="middle"
                  locale={{
                    emptyText: <Empty description="Không có hợp đồng nào sắp hết hạn trong 30 ngày tới" />,
                  }}
                />
              ),
            },
            {
              key: "overdueInvoices",
              label: (
                <span>
                  <ExclamationCircleOutlined style={{ marginRight: 6, color: "#ef4444" }} />
                  Hóa đơn quá hạn / Cần thu ({dashboard?.recent?.overdueInvoices?.length || 0})
                </span>
              ),
              children: (
                <Table
                  className="adm-table"
                  rowKey="id"
                  columns={overdueInvoiceColumns}
                  dataSource={dashboard?.recent?.overdueInvoices || []}
                  pagination={false}
                  size="middle"
                  locale={{
                    emptyText: <Empty description="Hiện không có hóa đơn quá hạn cần thu" />,
                  }}
                />
              ),
            },
            {
              key: "availableRooms",
              label: (
                <span>
                  <CheckCircleOutlined style={{ marginRight: 6, color: "#10b981" }} />
                  Phòng trống sẵn sàng cho thuê ({dashboard?.recent?.availableRooms?.length || 0})
                </span>
              ),
              children: (
                <Table
                  className="adm-table"
                  rowKey="id"
                  columns={availableRoomColumns}
                  dataSource={dashboard?.recent?.availableRooms || []}
                  pagination={false}
                  size="middle"
                  locale={{
                    emptyText: <Empty description="Hiện tại không có phòng nào còn trống" />,
                  }}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;