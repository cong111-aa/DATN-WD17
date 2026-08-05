import { CreditCardOutlined, HeartOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const UserInterestedRoomsPage = () => {
  const navigate = useNavigate();
  const [interestedRooms, setInterestedRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInterestedRooms = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/interested-rooms");
      setInterestedRooms(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách phòng yêu thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterestedRooms();
  }, []);

  const handleRemoveInterestedRoom = async (room) => {
    try {
      await http.delete(`/me/interested-rooms/${room.room}`);
      message.success("Đã bỏ quan tâm phòng");
      fetchInterestedRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Không bỏ quan tâm được phòng");
    }
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <HeartOutlined style={{ color: "#e11d48", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Danh sách phòng yêu thích đã lưu
            </Title>
          </Space>
        }
      >
        {interestedRooms.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 15 }}>Bạn chưa lưu phòng yêu thích nào</Text>}>
              <Button type="primary" onClick={() => navigate("/")} style={{ background: "#0f766e", borderRadius: 8 }}>
                Xem phòng trống ngay
              </Button>
            </Empty>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {interestedRooms.map((room) => (
              <div key={room.id} className="rooms-h-card" style={{ maxWidth: "100%" }}>
                {room.images?.[0] ? (
                  <img className="rooms-h-card-img" alt={`${room.roomNumber}`} src={toImageUrl(room.images[0])} />
                ) : (
                  <div style={{ height: 160, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text type="secondary">Không có ảnh</Text>
                  </div>
                )}
                <div className="rooms-h-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 15 }}>Phòng {room.roomNumber}</Text>
                    <Tag color={room.roomStatus === "available" ? "success" : "default"} style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>
                      {room.roomStatus === "available" ? "Còn trống" : "Đã hết"}
                    </Tag>
                  </div>
                  <Title level={4} style={{ margin: "0 0 8px 0", color: "#0f766e" }}>{formatCurrency(room.price)}</Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>{room.area || 0}m² • Tầng {room.floor ?? "-"}</Text>
                  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                    <Button size="small" onClick={() => navigate(`/user/rooms/${room.room}`)} disabled={room.roomStatus !== "available"} style={{ flex: 1, borderRadius: 6, fontWeight: 600 }}>
                      Chi tiết
                    </Button>
                    <Button size="small" danger type="text" onClick={() => handleRemoveInterestedRoom(room)} style={{ borderRadius: 6 }}>
                      Bỏ lưu
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserInterestedRoomsPage;
