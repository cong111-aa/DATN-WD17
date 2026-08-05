import {
  CheckCircleOutlined,
  CompassOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Input, InputNumber, Layout, Modal, Select, Space, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

const { Content, Header, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const PublicHomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [filters, setFilters] = useState({
    areaMax: null,
    areaMin: null,
    capacityMin: null,
    floor: null,
    keyword: "",
    priceMax: null,
    priceMin: null,
    sortBy: "newest",
  });
  const [loading, setLoading] = useState(false);
  const [loginPromptTarget, setLoginPromptTarget] = useState("");
  const [rooms, setRooms] = useState([]);

  const filteredRooms = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return rooms
      .filter((room) => {
        const matchKeyword =
          !keyword ||
          [room.roomNumber, room.name, room.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword));
        const matchPriceMin = filters.priceMin === null || Number(room.price || 0) >= Number(filters.priceMin);
        const matchPriceMax = filters.priceMax === null || Number(room.price || 0) <= Number(filters.priceMax);
        const matchAreaMin = filters.areaMin === null || Number(room.area || 0) >= Number(filters.areaMin);
        const matchAreaMax = filters.areaMax === null || Number(room.area || 0) <= Number(filters.areaMax);
        const matchCapacity = filters.capacityMin === null || Number(room.capacity || 0) >= Number(filters.capacityMin);
        const matchFloor = filters.floor === null || Number(room.floor || 0) === Number(filters.floor);

        return (
          matchKeyword &&
          matchPriceMin &&
          matchPriceMax &&
          matchAreaMin &&
          matchAreaMax &&
          matchCapacity &&
          matchFloor
        );
      })
      .sort((a, b) => {
        if (filters.sortBy === "price_asc") {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        if (filters.sortBy === "price_desc") {
          return Number(b.price || 0) - Number(a.price || 0);
        }
        if (filters.sortBy === "area_desc") {
          return Number(b.area || 0) - Number(a.area || 0);
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [filters, rooms]);

  const floorOptions = useMemo(
    () =>
      [...new Set(rooms.map((room) => room.floor).filter((floor) => floor !== undefined && floor !== null))]
        .sort((a, b) => Number(a) - Number(b))
        .map((floor) => ({ label: `Tầng ${floor}`, value: floor })),
    [rooms]
  );

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value === undefined ? null : value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      areaMax: null,
      areaMin: null,
      capacityMin: null,
      floor: null,
      keyword: "",
      priceMax: null,
      priceMin: null,
      sortBy: "newest",
    });
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/public/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const requireLogin = (target = "/user") => {
    if (user) {
      navigate(target);
      return;
    }
    setLoginPromptTarget(target);
  };

  return (
    <Layout className="app-shell">
      {/* Header Navigation */}
      <Header className="app-header">
        <div className="brand" onClick={() => navigate("/")}>
          <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
          <span>TRO PLUS</span>
          <span className="brand-badge">Premium</span>
        </div>
        <Space size="middle">
          {user ? (
            <Button
              type="primary"
              icon={<UserOutlined />}
              style={{ background: "#0f766e", borderRadius: 8, height: 40, fontWeight: 600 }}
              onClick={() => navigate(isAdmin ? "/admin" : "/user")}
            >
              Trang cá nhân ({user.name})
            </Button>
          ) : (
            <>
              <Button
                icon={<LoginOutlined />}
                style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, height: 40, fontWeight: 600 }}
                onClick={() => navigate("/register")}
              >
                Đăng ký ngay
              </Button>
            </>
          )}
        </Space>
      </Header>
      <Content className="app-content">
        {/* Sales Hero Section */}
        <div className="hero-wrapper">
          <div className="hero-content">
            <Tag color="teal" style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: 0, marginBottom: 16 }}>
              ✨ Hệ thống Thuê Phòng Trọ Hiện Đại & Minh Bạch
            </Tag>
            <Title level={1} className="hero-title">
              Tìm & Đặt Giữ Chỗ Phòng Trọ Ứng Ý Ngay Hôm Nay
            </Title>
            <Paragraph className="hero-subtitle">
              Không lo ép giá - Thông số thực tế 100% - Đặt cọc online nhanh chóng - Hỗ trợ báo sửa chữa tận tâm.
            </Paragraph>
            <div className="hero-stats">
              <div className="hero-stat-item">
                <SafetyCertificateOutlined style={{ color: "#38bdf8", fontSize: 18 }} />
                <span>Hợp đồng minh bạch</span>
              </div>
              <div className="hero-stat-item">
                <ThunderboltOutlined style={{ color: "#f59e0b", fontSize: 18 }} />
                <span>Giữ chỗ online 24/7</span>
              </div>
              <div className="hero-stat-item">
                <CheckCircleOutlined style={{ color: "#4ade80", fontSize: 18 }} />
                <span>Phòng mới & Đầy đủ tiện nghi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligent Floating Search Bar */}
        <Card className="filter-card">
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <FilterOutlined style={{ color: "#0f766e", fontSize: 18 }} />
                <Text strong style={{ fontSize: 16 }}>Bộ lọc tìm kiếm phòng trọ</Text>
              </Space>
              <Space>
                <Tag color="cyan" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6 }}>
                  Tìm thấy {filteredRooms.length}/{rooms.length} phòng khả dụng
                </Tag>
                <Button size="small" type="text" onClick={resetFilters} style={{ color: "#64748b" }}>
                  Đặt lại
                </Button>
              </Space>
            </div>

            <div className="filter-grid">
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Tìm mã phòng, tên phòng..."
                value={filters.keyword}
                onChange={(e) => updateFilter("keyword", e.target.value)}
                style={{ borderRadius: 8 }}
              />
              <InputNumber
                size="large"
                className="full-width-input"
                min={0}
                placeholder="Giá từ (VND)"
                value={filters.priceMin}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                onChange={(value) => updateFilter("priceMin", value)}
                style={{ borderRadius: 8 }}
              />
              <InputNumber
                size="large"
                className="full-width-input"
                min={0}
                placeholder="Giá đến (VND)"
                value={filters.priceMax}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                onChange={(value) => updateFilter("priceMax", value)}
                style={{ borderRadius: 8 }}
              />
              <InputNumber
                size="large"
                className="full-width-input"
                min={0}
                placeholder="Diện tích tối thiểu (m²)"
                value={filters.areaMin}
                onChange={(value) => updateFilter("areaMin", value)}
                style={{ borderRadius: 8 }}
              />
              <InputNumber
                size="large"
                className="full-width-input"
                min={1}
                placeholder="Sức chứa (người)"
                value={filters.capacityMin}
                onChange={(value) => updateFilter("capacityMin", value)}
                style={{ borderRadius: 8 }}
              />
              <Select
                size="large"
                allowClear
                placeholder="Chọn Tầng"
                value={filters.floor}
                options={floorOptions}
                onChange={(value) => updateFilter("floor", value)}
                style={{ borderRadius: 8 }}
              />
              <Select
                size="large"
                value={filters.sortBy}
                options={[
                  { label: "🔥 Mới nhất", value: "newest" },
                  { label: "💵 Giá: Thấp đến Cao", value: "price_asc" },
                  { label: "💎 Giá: Cao đến Thấp", value: "price_desc" },
                  { label: "📐 Diện tích: Rộng nhất", value: "area_desc" },
                ]}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </Space>
        </Card>

        {/* Room Grid */}
        {filteredRooms.length === 0 ? (
          <Card style={{ margin: "0 24px", borderRadius: 16, textAlign: "center", padding: "40px 0" }} loading={loading}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text type="secondary" style={{ fontSize: 16 }}>Không tìm thấy phòng phù hợp với tiêu chí lọc của bạn</Text>}
            >
              <Button type="primary" onClick={resetFilters} style={{ background: "#0f766e", borderRadius: 8 }}>
                Xóa bộ lọc
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card-cover">
                  <span className="room-card-status">
                    <Tag color="success" style={{ padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                      ● Còn trống
                    </Tag>
                  </span>
                  <img
                    alt={`${room.roomNumber} - ${room.name}`}
                    src={room.images?.[0] ? toImageUrl(room.images[0]) : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"}
                  />
                  <div className="room-card-price-badge">
                    {formatCurrency(room.price)}/tháng
                  </div>
                </div>

                <div className="room-card-body">
                  <h3 className="room-card-title">
                    Phòng {room.roomNumber} - {room.name}
                  </h3>

                  <div className="room-specs-list">
                    <span className="room-spec-chip">📐 {room.area || 0} m²</span>
                    <span className="room-spec-chip">👥 Tối đa {room.capacity || 1} người</span>
                    <span className="room-spec-chip">🏢 Tầng {room.floor ?? "-"}</span>
                  </div>

                  <Text type="secondary" style={{ fontSize: 13, margin: "4px 0" }} ellipsis>
                    {room.description || "Phòng đầy đủ ánh sáng, an ninh tốt, giờ giấc tự do."}
                  </Text>

                  <div className="room-card-actions">
                    <Button
                      type="default"
                      icon={<InfoCircleOutlined />}
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      style={{ flex: 1, borderRadius: 8, fontWeight: 600 }}
                    >
                      Chi tiết
                    </Button>
                    <Button
                      icon={<HeartOutlined />}
                      onClick={() => requireLogin(`/rooms/${room.id}`)}
                      style={{ borderRadius: 8, color: "#e11d48", borderColor: "#fecdd3" }}
                    />
                    <Button
                      type="primary"
                      icon={<CreditCardOutlined />}
                      onClick={() => requireLogin(`/rooms/${room.id}`)}
                      style={{ flex: 1.2, background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 700 }}
                    >
                      Đặt cọc
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust & How it works section */}
        <div className="trust-section">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <Title level={3} style={{ marginBottom: 8, color: "#0f172a" }}>
              Quy Trình Thuê Phòng Tại Tro Plus
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              3 bước đơn giản giúp bạn tìm và chuyển vào ở ngay trong ngày
            </Text>
          </div>

          <div className="trust-grid">
            <div className="trust-card">
              <CompassOutlined className="trust-icon" />
              <Title level={4} style={{ fontSize: 16, marginTop: 8 }}>1. Tìm phòng ưng ý</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Duyệt qua danh sách phòng trọ với hình ảnh thực tế, thông tin minh bạch về giá điện, nước, dịch vụ.
              </Text>
            </div>
            <div className="trust-card">
              <CreditCardOutlined className="trust-icon" style={{ color: "#d97706" }} />
              <Title level={4} style={{ fontSize: 16, marginTop: 8 }}>2. Đặt giữ chỗ 24/7</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Gửi yêu cầu và cọc online ngay lập tức qua mã QR chuyển khoản trực tiếp cho chủ trọ.
              </Text>
            </div>
            <div className="trust-card">
              <CheckCircleOutlined className="trust-icon" style={{ color: "#16a34a" }} />
              <Title level={4} style={{ fontSize: 16, marginTop: 8 }}>3. Nhận phòng & An tâm ở</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Ký hợp đồng thuê rõ ràng, theo dõi hóa đơn và gửi yêu cầu sửa chữa thiết bị dễ dàng qua portal.
              </Text>
            </div>
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="app-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="brand" style={{ marginBottom: 12 }}>
              <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
              <span>TRO PLUS</span>
            </div>
            <p>
              Hệ thống quản lý và cho thuê phòng trọ uy tín, hiện đại. Đem lại sự minh bạch và tiện lợi cho người thuê nhà.
            </p>
          </div>

          <div className="footer-col">
            <h4>Dịch vụ khách hàng</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>Xem danh sách phòng trống</li>
              <li>Đặt cọc giữ phòng trực tuyến</li>
              <li>Tra cứu hóa đơn & Hợp đồng</li>
              <li>Báo hỏng & Yêu cầu sửa chữa</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Thông tin liên hệ</h4>
            <p><EnvironmentOutlined style={{ marginRight: 8 }} /> Trụ sở: Tòa nhà Tro Plus, Hà Nội</p>
            <p><PhoneOutlined style={{ marginRight: 8 }} /> Hotline: 0988 123 456</p>
            <p><UserOutlined style={{ marginRight: 8 }} /> Hỗ trợ khách hàng: 08:00 - 21:00 hàng ngày</p>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} TRO PLUS. Bản quyền thuộc về Đồ Án Tốt Nghiệp WD17.
        </div>
      </Footer>

      {/* Login Prompt Modal */}
      <Modal
        title="Yêu cầu Đăng nhập"
        open={Boolean(loginPromptTarget)}
        onCancel={() => setLoginPromptTarget("")}
        onOk={() => navigate(`/login?redirect=${encodeURIComponent(loginPromptTarget)}`)}
        okText="Đăng nhập ngay"
        cancelText="Để sau"
        okButtonProps={{ style: { background: "#0f766e", borderColor: "#0f766e" } }}
      >
        <Text style={{ fontSize: 15 }}>
          Bạn cần đăng nhập tài khoản để thực hiện đặt cọc giữ chỗ hoặc lưu phòng quan tâm. Bạn có muốn chuyển đến trang đăng nhập ngay không?
        </Text>
      </Modal>
    </Layout>
  );
};

export default PublicHomePage;
