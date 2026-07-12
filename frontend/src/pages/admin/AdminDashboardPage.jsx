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
    return `${(amount / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ty`;
  }

  if (amount >= 1000000) {
    return `${(amount / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }

  return amount.toLocaleString("vi-VN");
};
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const invoiceStatusMeta = {
  overdue: { color: "error", label: "Qua han" },
  paid: { color: "success", label: "Da thanh toan" },
  partial: { color: "warning", label: "Thanh toan mot phan" },
  unpaid: { color: "default", label: "Chua thanh toan" },
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
      message.error(error.response?.data?.message || "Khong tai duoc du lieu tong quan");
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
      title: "Hop dong",
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
      title: "Khach thue",
      dataIndex: "tenantName",
      key: "tenantName",
      render: (value) => value || "-",
    },
    {
      title: "Het han",
      dataIndex: "endDate",
      key: "endDate",
      render: (value) => <Typography.Text type="warning">{formatDate(value)}</Typography.Text>,
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Tong quan</Typography.Title>
          <Typography.Text type="secondary">
            Bao cao nhanh ve phong, doanh thu, hoa don va hop dong.
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => fetchDashboard(selectedYear)} loading={loading}>
          Tai lai
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Tong so phong" value={dashboard?.rooms?.total || 0} prefix={<HomeOutlined />} />
            <Typography.Text type="secondary">
              {dashboard?.rooms?.occupied || 0} dang thue, {dashboard?.rooms?.maintenance || 0} bao tri
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Phong con trong" value={dashboard?.rooms?.available || 0} prefix={<HomeOutlined />} />
            <Progress percent={occupancyPercent} size="small" strokeColor="#0f766e" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic title="Ti le lap day" value={occupancyPercent} suffix="%" prefix={<ArrowUpOutlined />} />
            <Typography.Text type="secondary">
              Tinh theo phong dang thue / tong phong
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading} style={metricCardStyle}>
            <Statistic
              title={`Doanh thu thang ${dashboard?.period?.month || new Date().getMonth() + 1}`}
              value={currentMonthRevenue}
              formatter={currencyFormatter}
              prefix={<WalletOutlined />}
            />
            {currentMonthGrowth === null ? (
              <Typography.Text type="secondary">Chua co moc so sanh</Typography.Text>
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
              title={`Loi nhuan thang ${dashboard?.period?.month || new Date().getMonth() + 1}`}
              value={currentMonthProfit}
              formatter={currencyFormatter}
              prefix={<DollarOutlined />}
              valueStyle={{ color: Number(currentMonthProfit || 0) >= 0 ? "#0f766e" : "#dc2626" }}
            />
            <Typography.Text type="secondary">Doanh thu da thu - chi phi da chi</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card
        loading={loading}
        title={
          <Space direction="vertical" size={0}>
            <Typography.Text strong>Doanh thu theo thang</Typography.Text>
            <Typography.Text type="secondary">
              Nam {selectedYear}: thu {currencyFormatter(dashboard?.revenue?.yearlyCollectedAmount || 0)} - loi nhuan{" "}
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
          <Tag color="blue">Doanh thu da thu</Tag>
          <Tag color="success">Loi nhuan duong</Tag>
          <Tag color="error">Loi nhuan am</Tag>
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
                    title={`Doanh thu thang ${item.month}: ${currencyFormatter(item.collectedAmount)}`}
                    style={{
                      background: isCurrentMonth ? "#0f766e" : "#1677ff",
                      borderRadius: "6px 6px 2px 2px",
                      boxShadow: isCurrentMonth ? "0 8px 18px rgba(15, 118, 110, 0.24)" : "none",
                      height: revenueHeight,
                      width: 16,
                    }}
                  />
                  <div
                    title={`Loi nhuan thang ${item.month}: ${currencyFormatter(item.profitAmount)}`}
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
          <Card loading={loading} title="Trang thai hoa don">
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
                <Tag color="blue">Tong hoa don: {invoiceTotal}</Tag>
                <Tag color="red">Con no: {currencyFormatter(dashboard?.invoices?.outstandingAmount || 0)}</Tag>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            loading={loading}
            title="Hop dong sap het han"
            extra={<Button type="link" onClick={() => navigate("/admin/contracts")}>Xem tat ca</Button>}
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
