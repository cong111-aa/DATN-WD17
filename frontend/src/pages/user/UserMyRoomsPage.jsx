import {
  AppstoreOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExpandOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Image,
  Input,
  Modal,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const roomRoleMeta = {
  representative: {
    color: "gold",
    bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    textColor: "#92400e",
    border: "#fcd34d",
    label: "Đại diện phòng",
    icon: <CrownOutlined style={{ color: "#d97706" }} />,
  },
  member: {
    color: "green",
    bg: "#f0fdf4",
    textColor: "#166534",
    border: "#bbf7d0",
    label: "Thành viên",
    icon: <UserOutlined style={{ color: "#16a34a" }} />,
  },
};

const tenantStatusMeta = {
  active: {
    color: "success",
    label: "Đang thuê",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    text: "#059669",
    border: "rgba(16, 185, 129, 0.3)",
  },
  inactive: {
    color: "default",
    label: "Đã kết thúc",
    badgeBg: "rgba(100, 116, 139, 0.15)",
    text: "#64748b",
    border: "rgba(100, 116, 139, 0.3)",
  },
};

const UserMyRoomsPage = () => {
  const navigate = useNavigate();
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [detailTenancy, setDetailTenancy] = useState(null);

  const fetchTenancies = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/tenancies");
      setTenancies(data || []);
    } catch (err) {
      // Error handled globally by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenancies();
  }, []);

  // Filtered tenancies
  const filteredTenancies = useMemo(() => {
    return tenancies.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
        (item.roomName && item.roomName.toLowerCase().includes(q)) ||
        (item.roomDescription && item.roomDescription.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [tenancies, statusFilter, searchQuery]);

  // Statistics summaries
  const stats = useMemo(() => {
    const activeRooms = tenancies.filter((t) => t.status === "active");
    const totalRent = activeRooms.reduce((acc, t) => acc + (t.roomPrice || 0), 0);
    const repCount = activeRooms.filter((t) => t.roomRole === "representative").length;
    return {
      totalActive: activeRooms.length,
      totalRent,
      repCount,
      totalCount: tenancies.length,
    };
  }, [tenancies]);

  // Table Columns Setup
  const tenancyColumns = [
    {
      title: "Phòng trọ",
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (value, record) => {
        const coverImg = record.roomImages?.[0] ? toImageUrl(record.roomImages[0]) : null;
        return (
          <Space size={14}>
            {coverImg ? (
              <img
                src={coverImg}
                alt={`Phòng ${value}`}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                }}
              />
            ) : (
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0f766e",
                  fontSize: 22,
                }}
              >
                <HomeOutlined />
              </div>
            )}
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
                Phòng {value || "-"}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {record.roomName || "Phòng trọ tiện nghi"} • Tầng {record.roomFloor ?? "-"}
              </Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: "Vai trò",
      dataIndex: "roomRole",
      key: "roomRole",
      render: (role) => {
        const meta = roomRoleMeta[role] || roomRoleMeta.member;
        return (
          <Tag
            icon={meta.icon}
            style={{
              background: meta.bg,
              color: meta.textColor,
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
      title: "Ngày chuyển vào",
      dataIndex: "moveInDate",
      key: "moveInDate",
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "#64748b" }} />
          <span>{formatDate(date)}</span>
        </Space>
      ),
    },
    {
      title: "Giá thuê hàng tháng",
      dataIndex: "roomPrice",
      key: "roomPrice",
      render: (val) => (
        <Text strong style={{ color: "#0d9488", fontSize: 15 }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = tenantStatusMeta[status] || tenantStatusMeta.inactive;
        return (
          <Tag
            color={meta.color}
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailTenancy(record)}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<ToolOutlined />}
            onClick={() => navigate("/user/repair-requests")}
            style={{ borderRadius: 6 }}
          >
            Báo hỏng
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="my-rooms-container">
      {/* Hero Header Section */}
      <div className="my-rooms-hero">
        <div className="my-rooms-hero-badge">
          <HomeOutlined />
          <span>PORTAL NGƯỜI THUÊ • TRO PLUS</span>
        </div>
        <Title level={2} className="my-rooms-hero-title">
          Phòng Trọ Của Tôi
        </Title>
        <p className="my-rooms-hero-desc">
          Quản lý không gian sống, theo dõi thông tin thuê phòng, báo sự cố kỹ thuật và kiểm tra hóa đơn dịch vụ hàng tháng của bạn một cách minh bạch & nhanh chóng.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-rooms-stats-grid">
          <div className="my-rooms-stat-card">
            <div className="my-rooms-stat-icon teal">
              <HomeOutlined />
            </div>
            <div>
              <div className="my-rooms-stat-val">{stats.totalActive}</div>
              <div className="my-rooms-stat-lbl">Phòng đang ở</div>
            </div>
          </div>

          <div className="my-rooms-stat-card amber">
            <div className="my-rooms-stat-icon amber">
              <DollarOutlined />
            </div>
            <div>
              <div className="my-rooms-stat-val">
                {stats.totalRent > 0 ? `${(stats.totalRent / 1000000).toFixed(1)} tr/th` : "0 đ"}
              </div>
              <div className="my-rooms-stat-lbl">Tổng giá thuê</div>
            </div>
          </div>

          <div className="my-rooms-stat-card blue">
            <div className="my-rooms-stat-icon blue">
              <CrownOutlined />
            </div>
            <div>
              <div className="my-rooms-stat-val">{stats.repCount}</div>
              <div className="my-rooms-stat-lbl">Vai trò đại diện</div>
            </div>
          </div>

          <div className="my-rooms-stat-card purple">
            <div className="my-rooms-stat-icon purple">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="my-rooms-stat-val">Hoạt động</div>
              <div className="my-rooms-stat-lbl">Hợp đồng điện tử</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-rooms-control-bar">
        <Space wrap size={12}>
          <Input
            placeholder="Tìm theo số phòng hoặc tên..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="my-rooms-search-input"
          />

          <Segmented
            options={[
              { label: `Tất cả (${tenancies.length})`, value: "all" },
              {
                label: `Đang thuê (${tenancies.filter((t) => t.status === "active").length})`,
                value: "active",
              },
              {
                label: `Đã kết thúc (${tenancies.filter((t) => t.status === "inactive").length})`,
                value: "inactive",
              },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ borderRadius: 10, background: "#f1f5f9" }}
          />
        </Space>

        <Space size={12}>
          <Button
            type="primary"
            icon={<ToolOutlined />}
            onClick={() => navigate("/user/repair-requests")}
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Báo sự cố khẩn cấp
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
            Đang tải thông tin phòng của bạn...
          </div>
        </div>
      ) : filteredTenancies.length === 0 ? (
        /* Empty Sales State */
        <div className="my-rooms-empty-sales-card">
          <div className="my-rooms-empty-icon-wrapper">
            <HomeOutlined />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy phòng phù hợp"
              : "Bạn chưa có phòng trọ nào đang thuê"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc thay đổi bộ lọc trạng thái."
              : "Khám phá danh sách hàng trăm phòng trọ hiện đại, đầy đủ tiện nghi, vị trí đẹp với mức giá minh bạch cùng TRO PLUS ngay hôm nay!"}
          </Paragraph>

          <Space size={14} wrap style={{ justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => navigate("/")}
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                borderRadius: 12,
                height: 48,
                padding: "0 28px",
                fontWeight: 700,
              }}
            >
              Tìm phòng trọ ngay
            </Button>
            <Button
              size="large"
              icon={<FileProtectOutlined />}
              onClick={() => navigate("/user/contracts")}
              style={{ borderRadius: 12, height: 48, padding: "0 24px", fontWeight: 600 }}
            >
              Xem hợp đồng của tôi
            </Button>
          </Space>

          {/* Sales Trust Badges Grid */}
          <div className="my-rooms-trust-grid">
            <div className="my-rooms-trust-item">
              <SafetyCertificateOutlined className="my-rooms-trust-icon" />
              <div>
                <Text strong style={{ display: "block", color: "#0f172a" }}>
                  Hợp đồng Pháp Lý
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ký kết trực tuyến & minh bạch 100%
                </Text>
              </div>
            </div>

            <div className="my-rooms-trust-item">
              <ThunderboltOutlined className="my-rooms-trust-icon" />
              <div>
                <Text strong style={{ display: "block", color: "#0f172a" }}>
                  Thanh Toán VietQR
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tự động gạch nợ 24/7 tức thì
                </Text>
              </div>
            </div>

            <div className="my-rooms-trust-item">
              <ToolOutlined className="my-rooms-trust-icon" />
              <div>
                <Text strong style={{ display: "block", color: "#0f172a" }}>
                  Bảo Trì Tận Tâm
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Xử lý sự cố kỹ thuật siêu tốc
                </Text>
              </div>
            </div>

            <div className="my-rooms-trust-item">
              <CustomerServiceOutlined className="my-rooms-trust-icon" />
              <div>
                <Text strong style={{ display: "block", color: "#0f172a" }}>
                  Hỗ Trợ 24/7
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ban quản lý đồng hành liên tục
                </Text>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Sales Grid View */
        <div className="my-rooms-grid">
          {filteredTenancies.map((tenancy) => {
            const roleMeta = roomRoleMeta[tenancy.roomRole] || roomRoleMeta.member;
            const statusMeta = tenantStatusMeta[tenancy.status] || tenantStatusMeta.inactive;
            const coverImage = tenancy.roomImages?.[0]
              ? toImageUrl(tenancy.roomImages[0])
              : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80";

            return (
              <div key={tenancy.id} className="my-rooms-card">
                {/* Image Cover */}
                <div className="my-rooms-card-cover">
                  <img src={coverImage} alt={`Phòng ${tenancy.roomNumber}`} className="my-rooms-card-img" />

                  {/* Status Badge */}
                  <div
                    className="my-rooms-status-tag"
                    style={{
                      background: statusMeta.badgeBg,
                      color: statusMeta.text,
                      border: `1px solid ${statusMeta.border}`,
                    }}
                  >
                    {tenancy.status === "active" && <span className="pulse-dot" />}
                    <span>{statusMeta.label}</span>
                  </div>

                  {/* Role Badge */}
                  <div
                    className="my-rooms-role-tag"
                    style={{
                      background: roleMeta.bg,
                      color: roleMeta.textColor,
                      border: `1px solid ${roleMeta.border}`,
                    }}
                  >
                    <Space size={4}>
                      {roleMeta.icon}
                      <span>{roleMeta.label}</span>
                    </Space>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="my-rooms-card-price-overlay">
                    {formatCurrency(tenancy.roomPrice)} <span style={{ fontSize: 12, fontWeight: 500 }}>/ tháng</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="my-rooms-card-body">
                  <div className="my-rooms-title-row">
                    <div>
                      <h3 className="my-rooms-room-name">
                        Phòng {tenancy.roomNumber || "-"}
                      </h3>
                      <div className="my-rooms-sub-title">
                        {tenancy.roomName || "Phòng trọ cao cấp"} • Tầng {tenancy.roomFloor ?? 1}
                      </div>
                    </div>
                    {tenancy.roomArea && (
                      <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>
                        {tenancy.roomArea} m²
                      </Tag>
                    )}
                  </div>

                  {/* Room Spec Grid */}
                  <div className="my-rooms-specs-grid">
                    <div className="my-rooms-spec-item">
                      <ExpandOutlined />
                      <span>Diện tích: {tenancy.roomArea || 25} m²</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <TeamOutlined />
                      <span>Sức chứa: {tenancy.roomCapacity || 2} người</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <ThunderboltOutlined />
                      <span>Điện: {formatCurrency(tenancy.roomElectricityPrice || 3500)}/kWh</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <InfoCircleOutlined />
                      <span>Nước: {formatCurrency(tenancy.roomWaterPrice || 20000)}/m³</span>
                    </div>
                  </div>

                  {/* Dates & Role Note */}
                  <div style={{ fontSize: 13, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      Vào ở: <strong>{formatDate(tenancy.moveInDate)}</strong>
                    </span>
                    {tenancy.roomDeposit > 0 && (
                      <span>Cọc: <strong>{formatCurrency(tenancy.roomDeposit)}</strong></span>
                    )}
                  </div>

                  {/* Quick Action Navigation Strip */}
                  <div className="my-rooms-quick-links">
                    <span className="my-rooms-quick-link-btn" onClick={() => navigate("/user/contracts")}>
                      <FileProtectOutlined /> Hợp đồng
                    </span>
                    <span className="my-rooms-quick-link-btn" onClick={() => navigate("/user/invoices")}>
                      <FileTextOutlined /> Hóa đơn
                    </span>
                    {tenancy.room && (
                      <span className="my-rooms-quick-link-btn" onClick={() => navigate(`/rooms/${tenancy.room}`)}>
                        <ArrowRightOutlined /> Trang phòng
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="my-rooms-card-actions">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => setDetailTenancy(tenancy)}
                      style={{
                        background: "#0f766e",
                        borderColor: "#0f766e",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      Chi tiết phòng
                    </Button>
                    <Button
                      icon={<ToolOutlined />}
                      onClick={() => navigate("/user/repair-requests")}
                      style={{ borderRadius: 10, fontWeight: 600, borderColor: "#cbd5e1" }}
                    >
                      Báo sự cố
                    </Button>
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
            columns={tenancyColumns}
            dataSource={filteredTenancies}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* Modal Detail Room */}
      <Modal
        open={Boolean(detailTenancy)}
        onCancel={() => setDetailTenancy(null)}
        footer={null}
        width={840}
        className="my-rooms-detail-modal"
        centered
      >
        {detailTenancy && (
          <div>
            <div className="my-rooms-detail-header">
              <Space size={12}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#ccfbf1",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  <HomeOutlined />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                    Chi Tiết Phòng {detailTenancy.roomNumber} - {detailTenancy.roomName || "Phòng trọ đang thuê"}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Tầng {detailTenancy.roomFloor ?? 1} • Diện tích {detailTenancy.roomArea || 0} m²
                  </Text>
                </div>
              </Space>

              <Tag
                color={tenantStatusMeta[detailTenancy.status]?.color || "default"}
                style={{ borderRadius: 8, padding: "4px 12px", fontWeight: 700, fontSize: 13 }}
              >
                {tenantStatusMeta[detailTenancy.status]?.label}
              </Tag>
            </div>

            {/* Photo Gallery Grid */}
            {(detailTenancy.roomImages || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                  Hình ảnh thực tế của phòng ({detailTenancy.roomImages.length} ảnh):
                </Text>
                <Image.PreviewGroup>
                  <div className="my-rooms-gallery-grid">
                    {detailTenancy.roomImages.map((imgUrl, idx) => (
                      <Image
                        key={idx}
                        src={toImageUrl(imgUrl)}
                        className="my-rooms-gallery-img"
                        alt={`Ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}

            {/* Price & Service Fee Summary Box */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                💰 Bảng Chi Phí & Phí Dịch Vụ
              </Text>
              <div className="my-rooms-cost-table">
                <div className="my-rooms-cost-row">
                  <span>Giá thuê phòng cố định:</span>
                  <Text strong style={{ color: "#0d9488", fontSize: 16 }}>
                    {formatCurrency(detailTenancy.roomPrice)} / tháng
                  </Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Tiền đặt cọc phòng:</span>
                  <Text strong>{formatCurrency(detailTenancy.roomDeposit)}</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Giá điện tiêu thụ:</span>
                  <Text strong>{formatCurrency(detailTenancy.roomElectricityPrice || 3500)} / kWh</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Giá nước sinh hoạt:</span>
                  <Text strong>{formatCurrency(detailTenancy.roomWaterPrice || 20000)} / m³</Text>
                </div>
                <div className="my-rooms-cost-row">
                  <span>Phí dịch vụ chung (vệ sinh, rác, wifi...):</span>
                  <Text strong>{formatCurrency(detailTenancy.roomServiceFee || 0)} / tháng</Text>
                </div>
              </div>
            </div>

            {/* Room Descriptions Details */}
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
              <Descriptions.Item label="Sức chứa tối đa">
                {detailTenancy.roomCapacity || 0} người
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò của bạn">
                <Tag color={roomRoleMeta[detailTenancy.roomRole]?.color}>
                  {roomRoleMeta[detailTenancy.roomRole]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày chuyển vào">
                {formatDate(detailTenancy.moveInDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc hợp đồng">
                {formatDate(detailTenancy.moveOutDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả & tiện ích" span={2}>
                {detailTenancy.roomDescription || "Chưa có ghi chú bổ sung về tiện ích phòng."}
              </Descriptions.Item>
            </Descriptions>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
              <Space>
                <Button
                  icon={<FileProtectOutlined />}
                  onClick={() => {
                    setDetailTenancy(null);
                    navigate("/user/contracts");
                  }}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Xem Hợp Đồng
                </Button>
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    setDetailTenancy(null);
                    navigate("/user/invoices");
                  }}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Xem Hóa Đơn
                </Button>
                <Button
                  icon={<ToolOutlined />}
                  onClick={() => {
                    setDetailTenancy(null);
                    navigate("/user/repair-requests");
                  }}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Báo Sự Cố
                </Button>
              </Space>

              <Button onClick={() => setDetailTenancy(null)} style={{ borderRadius: 8 }}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserMyRoomsPage;
