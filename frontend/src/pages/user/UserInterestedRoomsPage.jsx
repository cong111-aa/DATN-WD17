import {
  AppstoreOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  ExpandOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const UserInterestedRoomsPage = () => {
  const navigate = useNavigate();
  const [interestedRooms, setInterestedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const fetchInterestedRooms = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/interested-rooms");
      setInterestedRooms(data || []);
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterestedRooms();
  }, []);

  const handleRemoveInterestedRoom = async (room) => {
    try {
      const roomId = room.room || room.id;
      await http.delete(`/me/interested-rooms/${roomId}`);
      message.success("Đã bỏ phòng khỏi danh sách yêu thích!");
      fetchInterestedRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Bỏ lưu phòng thất bại");
    }
  };

  // Filtered List
  const filteredRooms = useMemo(() => {
    return interestedRooms.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "available"
          ? item.roomStatus === "available"
          : item.roomStatus !== "available";

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [interestedRooms, statusFilter, searchQuery]);

  // Stats Summary
  const stats = useMemo(() => {
    const availableCount = interestedRooms.filter((r) => r.roomStatus === "available").length;
    const occupiedCount = interestedRooms.length - availableCount;
    const total = interestedRooms.length;
    return { availableCount, occupiedCount, total };
  }, [interestedRooms]);

  // Table Columns
  const columns = [
    {
      title: "Phòng Trọ Yêu Thích",
      key: "room",
      render: (_, record) => {
        const coverImg = record.images?.[0] ? toImageUrl(record.images[0]) : null;
        return (
          <Space size={12}>
            {coverImg ? (
              <img
                src={coverImg}
                alt={`Phòng ${record.roomNumber}`}
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
                  background: "#ffe4e6",
                  color: "#e11d48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <HeartFilled />
              </div>
            )}
            <div>
              <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                Phòng {record.roomNumber || "-"}
              </Text>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {record.name || "Phòng trọ tiện nghi"} • Tầng {record.floor ?? "-"}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Diện tích",
      dataIndex: "area",
      key: "area",
      render: (val) => (val ? `${val} m²` : "-"),
    },
    {
      title: "Giá thuê hàng tháng",
      dataIndex: "price",
      key: "price",
      render: (val) => (
        <Text strong style={{ color: "#e11d48", fontSize: 15 }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
    {
      title: "Trạng thái phòng",
      dataIndex: "roomStatus",
      key: "roomStatus",
      render: (status) => (
        <Tag
          color={status === "available" ? "success" : "default"}
          style={{ borderRadius: 6, fontWeight: 700, padding: "2px 8px" }}
        >
          {status === "available" ? "Còn trống" : "Đã cho thuê"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size={8} wrap>
          <Button
            type="primary"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(`/rooms/${record.room || record.id}`)}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              background: "#0f766e",
              borderColor: "#0f766e",
            }}
          >
            Xem phòng
          </Button>

          <Popconfirm
            title="Bỏ phòng khỏi danh sách yêu thích?"
            okText="Bỏ lưu"
            cancelText="Hủy"
            onConfirm={() => handleRemoveInterestedRoom(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
              Bỏ lưu
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="my-favorites-container">
      {/* Hero Header Section */}
      <div className="my-favorites-hero">
        <div className="my-favorites-hero-badge">
          <HeartFilled style={{ color: "#fb7185" }} />
          <span>BỘ SƯU TẬP PHÒNG TRỌ YÊU THÍCH • TRO PLUS</span>
        </div>
        <Title level={2} className="my-favorites-hero-title">
          Danh Sách Phòng Yêu Thích
        </Title>
        <p className="my-favorites-hero-desc">
          Lưu giữ không gian sống mơ ước của bạn. Dễ dàng theo dõi tình trạng phòng trống, so sánh tiện nghi & thực hiện giữ chỗ online 1-click ngay khi sẵn sàng.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-favorites-stats-grid">
          <div className="my-favorites-stat-card">
            <div className="my-favorites-stat-icon rose">
              <HeartFilled />
            </div>
            <div>
              <div className="my-favorites-stat-val">{stats.total}</div>
              <div className="my-favorites-stat-lbl">Tổng số phòng đã lưu</div>
            </div>
          </div>

          <div className="my-favorites-stat-card emerald">
            <div className="my-favorites-stat-icon emerald">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="my-favorites-stat-val">{stats.availableCount}</div>
              <div className="my-favorites-stat-lbl">Đang còn phòng trống</div>
            </div>
          </div>

          <div className="my-favorites-stat-card slate">
            <div className="my-favorites-stat-icon slate">
              <HomeOutlined />
            </div>
            <div>
              <div className="my-favorites-stat-val">{stats.occupiedCount}</div>
              <div className="my-favorites-stat-lbl">Đã hết / Có người ở</div>
            </div>
          </div>

          <div className="my-favorites-stat-card teal">
            <div className="my-favorites-stat-icon teal">
              <CreditCardOutlined />
            </div>
            <div>
              <div className="my-favorites-stat-val">1-Click</div>
              <div className="my-favorites-stat-lbl">Giữ cọc trực tuyến</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-favorites-control-bar">
        <Space wrap size={12}>
          <Input
            placeholder="Tìm theo số phòng, tên phòng..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 300, width: "100%", borderRadius: 10 }}
          />

          <Segmented
            options={[
              { label: `Tất cả (${interestedRooms.length})`, value: "all" },
              {
                label: `Còn trống (${stats.availableCount})`,
                value: "available",
              },
              {
                label: `Đã hết (${stats.occupiedCount})`,
                value: "occupied",
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
            icon={<SearchOutlined />}
            onClick={() => navigate("/")}
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            Tìm thêm phòng mới
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

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#64748b", fontWeight: 500 }}>
            Đang nạp bộ sưu tập phòng yêu thích...
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        /* Empty Sales State */
        <div className="my-rooms-empty-sales-card">
          <div
            className="my-rooms-empty-icon-wrapper"
            style={{ background: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)", color: "#e11d48" }}
          >
            <HeartFilled />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy phòng yêu thích phù hợp"
              : "Bạn chưa lưu phòng yêu thích nào"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng thử tìm kiếm lại với số phòng hoặc bộ lọc khác."
              : "Khi xem các phòng trọ trên TRO PLUS, bấm biểu tượng trái tim 💖 để lưu phòng vào danh sách so sánh & theo dõi nhanh chóng!"}
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
              Khám phá phòng trọ ngay
            </Button>
          </Space>
        </div>
      ) : viewMode === "grid" ? (
        /* Sales Card Grid */
        <div className="my-favorites-grid">
          {filteredRooms.map((room) => {
            const isAvailable = room.roomStatus === "available";
            const coverImage = room.images?.[0]
              ? toImageUrl(room.images[0])
              : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80";

            return (
              <div key={room.id} className="my-favorite-card">
                {/* Cover Image */}
                <div className="my-favorite-card-cover">
                  <img src={coverImage} alt={`Phòng ${room.roomNumber}`} className="my-favorite-card-img" />

                  {/* Heart Delete Button */}
                  <Popconfirm
                    title="Bỏ lưu phòng này?"
                    okText="Bỏ lưu"
                    cancelText="Hủy"
                    onConfirm={() => handleRemoveInterestedRoom(room)}
                  >
                    <Tooltip title="Bỏ khỏi danh sách yêu thích">
                      <div className="my-favorite-unheart-btn">
                        <HeartFilled />
                      </div>
                    </Tooltip>
                  </Popconfirm>

                  {/* Status Badge */}
                  <div
                    className="my-rooms-status-tag"
                    style={{
                      background: isAvailable ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
                      color: isAvailable ? "#059669" : "#64748b",
                      border: `1px solid ${isAvailable ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                    }}
                  >
                    {isAvailable && <span className="pulse-dot" />}
                    <span>{isAvailable ? "Còn trống" : "Đã hết phòng"}</span>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="my-favorite-price-overlay">
                    {formatCurrency(room.price)} <span style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1" }}>/ tháng</span>
                  </div>
                </div>

                {/* Body */}
                <div className="my-favorite-card-body">
                  <div className="my-rooms-title-row">
                    <div>
                      <h3 className="my-rooms-room-name">
                        Phòng {room.roomNumber || "-"}
                      </h3>
                      <div className="my-rooms-sub-title">
                        {room.name || "Phòng trọ cao cấp"} • Tầng {room.floor ?? 1}
                      </div>
                    </div>

                    {room.area && (
                      <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>
                        {room.area} m²
                      </Tag>
                    )}
                  </div>

                  {/* Room Specs Grid */}
                  <div className="my-rooms-specs-grid">
                    <div className="my-rooms-spec-item">
                      <ExpandOutlined />
                      <span>Diện tích: {room.area || 25} m²</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <TeamOutlined />
                      <span>Sức chứa: {room.capacity || 2} người</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <ThunderboltOutlined />
                      <span>Điện: {formatCurrency(room.electricityPrice || 3500)}/kWh</span>
                    </div>
                    <div className="my-rooms-spec-item">
                      <InfoCircleOutlined />
                      <span>Nước: {formatCurrency(room.waterPrice || 20000)}/m³</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="my-favorite-card-actions">
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      onClick={() => navigate(`/rooms/${room.room || room.id}`)}
                      style={{
                        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                        borderRadius: 10,
                        fontWeight: 700,
                      }}
                    >
                      Xem chi tiết phòng
                    </Button>

                    <Popconfirm
                      title="Bạn muốn bỏ phòng này khỏi danh sách yêu thích?"
                      okText="Bỏ lưu"
                      cancelText="Giữ lại"
                      onConfirm={() => handleRemoveInterestedRoom(room)}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 10, fontWeight: 600 }}
                      >
                        Bỏ lưu
                      </Button>
                    </Popconfirm>
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
            dataSource={filteredRooms}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}
    </div>
  );
};

export default UserInterestedRoomsPage;
