import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  FileProtectOutlined,
  HomeOutlined,
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Progress, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => {
  const year = currentYear - index;
  return { label: year, value: year };
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

  return amount.toLocaleString("vi-VN");
};
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const invoiceStatusMeta = {
  overdue: { color: "error", label: "Quá hạn" },
  paid: { color: "success", label: "Đã thanh toán" },
  partial: { color: "warning", label: "Thanh toán một phần" },
  unpaid: { color: "default", label: "Chưa thanh toán" },
};

const metricCardStyle = {
  borderRadius: 8,
  minHeight: 132,
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  const occupancyPercent = useMemo(() => {
    const total = Number(dashboard?.rooms?.total || 0);
    return total ? Math.round((Number(dashboard?.rooms?.occupied || 0) / total) * 100) : 0;
  }, [dashboard]);

  const revenueByMonth = dashboard?.revenue?.byMonth || [];
  const maxChartAmount = Math.max(
    ...revenueByMonth.flatMap((item) => [
      Number(item.collectedAmount || 0),
      Math.abs(Number(item.profitAmount || 0)),
    ]),
    1
  );
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

  const expiringContractColumns = [
    {
      title: "Hợp đồng",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.roomNumber || "-"} - {record.roomName || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Khách thuê",
      dataIndex: "tenantName",
      key: "tenantName",
      render: (value) => value || "-",
    },
    {
      title: "Hết hạn",
      dataIndex: "endDate",
      key: "endDate",
      render: (value) => <Typography.Text type="warning">{formatDate(value)}</Typography.Text>,
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Tổng quan</Typography.Title>
          <Typography.Text type="secondary">
            Báo cáo nhanh về phòng, doanh thu, hóa đơn và hợp đồng.
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => fetchDashboard(selectedYear)} loading={loading}>
          Tải lại
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Tổng số phòng" value={dashboard?.rooms?.total || 0} prefix={<HomeOutlined />} />
            <Typography.Text type="secondary">
              {dashboard?.rooms?.occupied || 0} đang thuê, {dashboard?.rooms?.maintenance || 0} bảo trì
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Phòng còn trống" value={dashboard?.rooms?.available || 0} prefix={<HomeOutlined />} />
            <Progress percent={occupancyPercent} size="small" strokeColor="#0f766e" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Tỷ lệ lấp đầy" value={occupancyPercent} suffix="%" prefix={<ArrowUpOutlined />} />
            <Typography.Text type="secondary">
              Tính theo phòng đang thuê / tổng phòng
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic
              title={`Doanh thu tháng ${dashboard?.period?.month || new Date().getMonth() + 1}`}
              value={currentMonthRevenue}
              formatter={currencyFormatter}
              prefix={<WalletOutlined />}
            />
            {currentMonthGrowth === null ? (
              <Typography.Text type="secondary">Chưa có mốc so sánh</Typography.Text>
            ) : (
              <Tag color={currentMonthGrowth >= 0 ? "success" : "error"}>
                {currentMonthGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(currentMonthGrowth)}%
              </Tag>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic
              title={`Lợi nhuận tháng ${dashboard?.period?.month || new Date().getMonth() + 1}`}
              value={currentMonthProfit}
              formatter={currencyFormatter}
              prefix={<DollarOutlined />}
              valueStyle={{ color: Number(currentMonthProfit || 0) >= 0 ? "#0f766e" : "#dc2626" }}
            />
            <Typography.Text type="secondary">Doanh thu đã thu - chi phí đã chi</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card
        loading={loading}
        title={
          <Space direction="vertical" size={0}>
            <Typography.Text strong>Doanh thu theo tháng</Typography.Text>
            <Typography.Text type="secondary">
              Năm {selectedYear}: thu {currencyFormatter(dashboard?.revenue?.yearlyCollectedAmount || 0)} - lợi nhuận{" "}
              {currencyFormatter(dashboard?.revenue?.yearlyProfitAmount || 0)}
            </Typography.Text>
          </Space>
        }
        extra={
          <Select
            value={selectedYear}
            options={yearOptions}
            onChange={setSelectedYear}
            style={{ width: 120 }}
          />
        }
      >
        <Space wrap size={8}>
          <Tag color="blue">Doanh thu đã thu</Tag>
          <Tag color="success">Lợi nhuận dương</Tag>
          <Tag color="error">Lợi nhuận âm</Tag>
        </Space>
        <div
          style={{
            alignItems: "end",
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(12, minmax(42px, 1fr))",
            minHeight: 280,
            overflowX: "auto",
            paddingTop: 16,
          }}
        >
          {revenueByMonth.map((item) => {
            const revenueHeight = Math.max((Number(item.collectedAmount || 0) / maxChartAmount) * 190, item.collectedAmount ? 18 : 4);
            const profitHeight = Math.max((Math.abs(Number(item.profitAmount || 0)) / maxChartAmount) * 190, item.profitAmount ? 18 : 4);
            const isCurrentMonth =
              Number(item.month) === Number(dashboard?.period?.month) && Number(selectedYear) === Number(dashboard?.period?.year);

            return (
              <Space key={item.month} direction="vertical" align="center" size={6} style={{ minWidth: 42 }}>
                <Typography.Text style={{ fontSize: 12 }}>
                  {compactCurrencyFormatter(item.collectedAmount)}
                </Typography.Text>
                <div
                  style={{
                    alignItems: "end",
                    display: "flex",
                    gap: 4,
                    height: 196,
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <div
                    title={`Doanh thu tháng ${item.month}: ${currencyFormatter(item.collectedAmount)}`}
                    style={{
                      background: isCurrentMonth ? "#0f766e" : "#1677ff",
                      borderRadius: "6px 6px 2px 2px",
                      boxShadow: isCurrentMonth ? "0 8px 18px rgba(15, 118, 110, 0.24)" : "none",
                      height: revenueHeight,
                      width: 16,
                    }}
                  />
                  <div
                    title={`Lợi nhuận tháng ${item.month}: ${currencyFormatter(item.profitAmount)}`}
                    style={{
                      background: Number(item.profitAmount || 0) >= 0 ? "#16a34a" : "#dc2626",
                      borderRadius: "6px 6px 2px 2px",
                      height: profitHeight,
                      opacity: item.profitAmount ? 1 : 0.35,
                      width: 16,
                    }}
                  />
                </div>
                <Typography.Text type={Number(item.profitAmount || 0) >= 0 ? "success" : "danger"} style={{ fontSize: 12 }}>
                  {compactCurrencyFormatter(item.profitAmount)}
                </Typography.Text>
                <Tag color={item.growthRate === null ? "default" : item.growthRate >= 0 ? "success" : "error"}>
                  {item.growthRate === null ? "--" : `${item.growthRate >= 0 ? "+" : ""}${item.growthRate}%`}
                </Tag>
                <Typography.Text type={isCurrentMonth ? "success" : "secondary"}>T{item.month}</Typography.Text>
              </Space>
            );
          })}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card loading={loading} title="Trạng thái hóa đơn">
            <Space direction="vertical" size={14} className="page-stack">
              {invoiceSegments.map((item) => (
                <div key={item.status}>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <Tag color={item.color}>{item.label}</Tag>
                    <Typography.Text strong>{item.count}</Typography.Text>
                  </Space>
                  <Progress percent={item.percent} size="small" strokeColor={item.status === "overdue" ? "#dc2626" : undefined} />
                </div>
              ))}
              <Space wrap>
                <Tag color="blue">Tổng hóa đơn: {invoiceTotal}</Tag>
                <Tag color="red">Còn nợ: {currencyFormatter(dashboard?.invoices?.outstandingAmount || 0)}</Tag>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            loading={loading}
            title="Hợp đồng sắp hết hạn"
            extra={<Button type="link" onClick={() => navigate("/admin/contracts")}>Xem tất cả</Button>}
          >
            <Table
              rowKey="id"
              columns={expiringContractColumns}
              dataSource={dashboard?.recent?.expiringContracts || []}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default AdminDashboardPage;