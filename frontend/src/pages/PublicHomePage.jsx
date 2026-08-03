import {
  CreditCardOutlined,
  HeartOutlined,
  HomeOutlined,
  KeyOutlined,
  LoginOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Image, Input, InputNumber, Layout, Modal, Select, Space, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

const { Content, Header } = Layout;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
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
        .map((floor) => ({ label: `Tang ${floor}`, value: floor })),
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
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
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
      <Header className="app-header">
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Tro Plus
        </div>
        <Space>
          {user ? (
            <Button icon={<UserOutlined />} onClick={() => navigate(isAdmin ? "/admin" : "/user")}>
              Tai khoan
            </Button>
          ) : (
            <>
              <Button icon={<LoginOutlined />} onClick={() => navigate("/login")}>
                Dang nhap
              </Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/register")}>
                Dang ky
              </Button>
            </>
          )}
        </Space>
      </Header>
      <Content className="app-content">
        <Space direction="vertical" size={18} className="page-stack">
          <Card>
            <div className="page-toolbar">
              <div className="page-title">
                <Typography.Title level={2}>Tim phong tro phu hop voi ban</Typography.Title>
                <Typography.Text type="secondary">
                  Xem phong con trong, xem chi tiet va dang nhap khi ban muon dat coc hoac thue phong.
                </Typography.Text>
              </div>
              <Tag color="success">Hien thi {filteredRooms.length}/{rooms.length} phong phu hop</Tag>
            </div>
          </Card>

          <Card>
            <Space direction="vertical" size={12} className="page-stack">
              <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
                <Typography.Text strong>Bo loc tim phong</Typography.Text>
                <Button onClick={resetFilters}>Dat lai bo loc</Button>
              </Space>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                <Input
                  allowClear
                  placeholder="Tim ma phong, ten phong"
                  value={filters.keyword}
                  onChange={(event) => updateFilter("keyword", event.target.value)}
                />
                <InputNumber
                  className="full-width-input"
                  min={0}
                  placeholder="Gia tu"
                  value={filters.priceMin}
                  addonAfter="VND"
                  onChange={(value) => updateFilter("priceMin", value)}
                />
                <InputNumber
                  className="full-width-input"
                  min={0}
                  placeholder="Gia den"
                  value={filters.priceMax}
                  addonAfter="VND"
                  onChange={(value) => updateFilter("priceMax", value)}
                />
                <InputNumber
                  className="full-width-input"
                  min={0}
                  placeholder="Dien tich tu"
                  value={filters.areaMin}
                  addonAfter="m2"
                  onChange={(value) => updateFilter("areaMin", value)}
                />
                <InputNumber
                  className="full-width-input"
                  min={0}
                  placeholder="Dien tich den"
                  value={filters.areaMax}
                  addonAfter="m2"
                  onChange={(value) => updateFilter("areaMax", value)}
                />
                <InputNumber
                  className="full-width-input"
                  min={1}
                  placeholder="So nguoi toi thieu"
                  value={filters.capacityMin}
                  onChange={(value) => updateFilter("capacityMin", value)}
                />
                <Select
                  allowClear
                  placeholder="Chon tang"
                  value={filters.floor}
                  options={floorOptions}
                  onChange={(value) => updateFilter("floor", value)}
                />
                <Select
                  value={filters.sortBy}
                  options={[
                    { label: "Moi nhat", value: "newest" },
                    { label: "Gia thap den cao", value: "price_asc" },
                    { label: "Gia cao den thap", value: "price_desc" },
                    { label: "Dien tich lon den nho", value: "area_desc" },
                  ]}
                  onChange={(value) => updateFilter("sortBy", value)}
                />
              </div>
            </Space>
          </Card>

          {filteredRooms.length === 0 ? (
            <Card loading={loading}>
              <Empty description="Khong co phong phu hop voi bo loc" />
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              }}
            >
              {filteredRooms.map((room) => (
                <Card
                  key={room.id}
                  loading={loading}
                  cover={
                    room.images?.[0] ? (
                      <img
                        alt={`${room.roomNumber} - ${room.name}`}
                        src={toImageUrl(room.images[0])}
                        style={{ height: 170, objectFit: "cover", width: "100%" }}
                      />
                    ) : null
                  }
                  actions={[
                    <Button type="link" icon={<HomeOutlined />} onClick={() => navigate(`/rooms/${room.id}`)}>
                      Chi tiet
                    </Button>,
                    <Button type="link" icon={<HeartOutlined />} onClick={() => requireLogin(`/rooms/${room.id}`)}>
                      Quan tam
                    </Button>,
                    <Button type="link" icon={<CreditCardOutlined />} onClick={() => requireLogin(`/rooms/${room.id}`)}>
                      Dat coc
                    </Button>,
                    <Button type="link" icon={<KeyOutlined />} onClick={() => requireLogin(`/user/rooms/${room.id}`)}>
                      Thue phong
                    </Button>,
                  ]}
                >
                  <Space direction="vertical" size={8} className="page-stack">
                    <Space style={{ justifyContent: "space-between", width: "100%" }}>
                      <Typography.Text strong>
                        {room.roomNumber} - {room.name}
                      </Typography.Text>
                      <Tag color="success">Con trong</Tag>
                    </Space>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {formatCurrency(room.price)}
                    </Typography.Title>
                    <Space wrap>
                      <Tag>{room.area || 0} m2</Tag>
                      <Tag>{room.capacity || 0} nguoi</Tag>
                      <Tag>Tang {room.floor ?? "-"}</Tag>
                    </Space>
                    <Typography.Text type="secondary">
                      Coc {formatCurrency(room.deposit)} - Phi dich vu {formatCurrency(room.serviceFee)}
                    </Typography.Text>
                  </Space>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <Space direction="vertical" size={8} className="page-stack">
              <Typography.Title level={4}>Gioi thieu ve Tro Plus</Typography.Title>
              <Typography.Text type="secondary">
                Tro Plus giup nguoi thue tim phong, theo doi hop dong, hoa don va gui bao cao su co sau khi da tro thanh khach thue.
              </Typography.Text>
              <Space wrap>
                <Tag color="blue">Thong tin phong ro rang</Tag>
                <Tag color="green">Dat coc va thue phong truc tuyen</Tag>
                <Tag color="gold">Quan ly hoa don va hop dong</Tag>
              </Space>
            </Space>
          </Card>
        </Space>

        <Modal
          title="Can dang nhap"
          open={Boolean(loginPromptTarget)}
          onCancel={() => setLoginPromptTarget("")}
          onOk={() => navigate(`/login?redirect=${encodeURIComponent(loginPromptTarget)}`)}
          okText="Tiep tuc dang nhap"
          cancelText="O lai"
        >
          <Typography.Text>
            Ban can dang nhap de thuc hien tac vu nay. Ban co muon tiep tuc dang nhap khong?
          </Typography.Text>
        </Modal>
      </Content>
    </Layout>
  );
};

export default PublicHomePage;
