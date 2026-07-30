import { ArrowLeftOutlined, HeartOutlined, LogoutOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Image, Layout, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const UserRoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);

  const fetchRoom = async () => {
    setLoading(true);

    try {
      const { data } = await http.get(`/me/available-rooms/${id}`);
      setRoom(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet phong");
      navigate("/user", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const handleInterestedRoom = async () => {
    try {
      await http.post("/me/interested-rooms", { room: id });
      message.success("Da them phong vao danh sach quan tam");
    } catch (error) {
      message.error(error.response?.data?.message || "Khong them duoc phong quan tam");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand">Tro Plus</div>
        <Space>
          <Typography.Text className="header-user">{user?.name}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Dang xuat
          </Button>
        </Space>
      </Header>
      <Content className="app-content">
        <Space direction="vertical" size={16} className="page-stack">
          <div className="page-toolbar">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/user")}>
              Quay lai
            </Button>
            <Button type="primary" icon={<HeartOutlined />} onClick={handleInterestedRoom} disabled={!room}>
              Quan tam phong nay
            </Button>
          </div>

          <Card loading={loading}>
            {room && (
              <Space direction="vertical" size={18} className="page-stack">
                <div className="page-title">
                  <Typography.Title level={2}>
                    {room.roomNumber} - {room.name}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Phong dang con trong, co the lien he admin de duoc ho tro doi phong hoac thue phong.
                  </Typography.Text>
                </div>

                {(room.images || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      }}
                    >
                      {room.images.map((image) => (
                        <Image
                          key={image}
                          src={toImageUrl(image)}
                          height={150}
                          style={{ borderRadius: 8, objectFit: "cover", width: "100%" }}
                        />
                      ))}
                    </div>
                  </Image.PreviewGroup>
                ) : null}

                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Trang thai">
                    <Tag color="success">Con trong</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Gia thue">
                    <Typography.Text strong>{formatCurrency(room.price)}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tien coc">{formatCurrency(room.deposit)}</Descriptions.Item>
                  <Descriptions.Item label="Phi dich vu">{formatCurrency(room.serviceFee)}</Descriptions.Item>
                  <Descriptions.Item label="Tang">{room.floor ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="Dien tich">{room.area || 0} m2</Descriptions.Item>
                  <Descriptions.Item label="Suc chua">{room.capacity || 0} nguoi</Descriptions.Item>
                  <Descriptions.Item label="Gia dien">{formatCurrency(room.electricityPrice)}</Descriptions.Item>
                  <Descriptions.Item label="Gia nuoc">{formatCurrency(room.waterPrice)}</Descriptions.Item>
                  <Descriptions.Item label="Mo ta" span={2}>
                    {room.description || "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default UserRoomDetailPage;
