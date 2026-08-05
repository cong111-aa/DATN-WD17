import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Descriptions, Dropdown, Form, Image, Input, InputNumber, Layout, Modal, Space, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const UserRoomDetailPage = () => {
  const [roomRequestForm] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [roomRequestModalOpen, setRoomRequestModalOpen] = useState(false);
  const [roomRequestSubmitting, setRoomRequestSubmitting] = useState(false);
  const [roomRequestType, setRoomRequestType] = useState("hold_deposit");
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const fetchRoom = async () => {
    setLoading(true);

    try {
      const { data } = await http.get(user ? `/me/available-rooms/${id}` : `/public/rooms/${id}`);
      setRoom(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được chi tiết phòng");
      navigate(user ? "/user" : "/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [id, user]);

  const requireLogin = () => {
    if (user) {
      return true;
    }

    setLoginPromptOpen(true);
    return false;
  };

  const handleInterestedRoom = async () => {
    if (!requireLogin()) {
      return;
    }

    try {
      await http.post("/me/interested-rooms", { room: id });
      message.success("Đã thêm phòng vào danh sách quan tâm");
    } catch (error) {
      message.error(error.response?.data?.message || "Không thêm được phòng quan tâm");
    }
  };

  const openRoomRequestModal = (type) => {
    if (!requireLogin()) {
      return;
    }

    setRoomRequestType(type);
    roomRequestForm.resetFields();
    roomRequestForm.setFieldsValue(
      type === "rent"
        ? {
            durationMonths: 12,
            occupantCount: 1,
            occupants: [
              {
                name: user?.name || "",
                phone: user?.phone || "",
                identityNumber: user?.identityNumber || "",
                identityFrontImage: user?.identityFrontImage || "",
                identityBackImage: user?.identityBackImage || "",
              },
            ],
          }
        : {}
    );
    setRoomRequestModalOpen(true);
  };

  const closeRoomRequestModal = () => {
    setRoomRequestModalOpen(false);
    roomRequestForm.resetFields();
  };

  const handleRoomRequestSubmit = async (values) => {
    setRoomRequestSubmitting(true);

    try {
      const payload = {
        message: values.message,
        room: id,
      };

      if (roomRequestType === "rent") {
        payload.durationMonths = values.durationMonths;
        payload.occupantCount = values.occupantCount;
        payload.occupants = values.occupants || [];
      }

      const { data } = await http.post(
        roomRequestType === "hold_deposit"
          ? "/me/room-requests/hold-deposit"
          : "/me/room-requests/rent",
        payload
      );
      message.success("Đã gửi yêu cầu phòng thành công");
      closeRoomRequestModal();
      setPaymentRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi yêu cầu phòng thất bại");
    } finally {
      setRoomRequestSubmitting(false);
    }
  };

  const userMenuItems = useMemo(
    () => [
      {
        key: "user-header",
        disabled: true,
        label: (
          <div className="user-menu-header">
            <div className="user-menu-info-name">{user?.name || "Người dùng"}</div>
            <div className="user-menu-info-email">{user?.email || "Tenant Portal"}</div>
          </div>
        ),
      },
      {
        key: "rooms",
        icon: <HomeOutlined style={{ color: "#0f766e" }} />,
        label: "Phòng của tôi",
      },
      {
        key: "contracts",
        icon: <FileProtectOutlined style={{ color: "#2563eb" }} />,
        label: "Hợp đồng",
      },
      {
        key: "invoices",
        icon: <FileTextOutlined style={{ color: "#d97706" }} />,
        label: "Hóa đơn",
      },
      {
        key: "repair-requests",
        icon: <ToolOutlined style={{ color: "#e11d48" }} />,
        label: "Báo sự cố",
      },
      {
        key: "room-requests",
        icon: <CreditCardOutlined style={{ color: "#0284c7" }} />,
        label: "Yêu cầu & Cọc",
      },
      {
        key: "interested-rooms",
        icon: <HeartOutlined style={{ color: "#e11d48" }} />,
        label: "Phòng yêu thích",
      },
      {
        key: "profile",
        icon: <UserOutlined style={{ color: "#4f46e5" }} />,
        label: "Hồ sơ cá nhân",
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
      },
    ],
    [user]
  );

  const handleUserMenuClick = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else if (key && key !== "user-header") {
      navigate(`/user?tab=${key}`);
    }
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand" onClick={() => navigate("/")}>
          <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
          <span>TRO PLUS</span>
          <span className="brand-badge">Premium</span>
        </div>
        <Space>
          {user ? (
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              overlayClassName="user-dropdown-popover"
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="header-user-btn">
                <Avatar className="header-user-avatar" size={32} icon={<UserOutlined />}>
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <span className="header-user-name">{user?.name || "Tài khoản"}</span>
                <DownOutlined style={{ fontSize: 11, opacity: 0.8 }} />
              </div>
            </Dropdown>
          ) : (
            <>
              <Button onClick={() => navigate("/login")} style={{ borderRadius: 8 }}>
                Đăng nhập
              </Button>
              <Button
                type="primary"
                onClick={() => navigate("/register")}
                style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8 }}
              >
                Đăng ký
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content className="app-content">
        <div className="user-portal-container">
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(user ? "/user" : "/")}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Quay lại danh sách phòng
            </Button>
          </div>

          <Card loading={loading} style={{ borderRadius: 16, overflow: "hidden" }}>
            {room && (
              <div className="detail-layout" style={{ padding: 0 }}>
                {/* Left Column: Room Details & Images */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                    <div>
                      <Title level={2} style={{ margin: 0, color: "#0f172a" }}>
                        Phòng {room.roomNumber} - {room.name}
                      </Title>
                      <Space size="middle" style={{ marginTop: 8 }}>
                        <Tag color="success" style={{ padding: "4px 12px", borderRadius: 6, fontWeight: 700 }}>
                          ● Còn trống khả dụng
                        </Tag>
                        <Text type="secondary"><EnvironmentOutlined /> Tầng {room.floor ?? "-"} • Diện tích {room.area || 0} m²</Text>
                      </Space>
                    </div>
                  </div>

                  {/* Image Preview Gallery */}
                  {(room.images || []).length > 0 ? (
                    <Image.PreviewGroup>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          marginBottom: 24,
                        }}
                      >
                        {room.images.map((image, index) => (
                          <Image
                            key={image}
                            src={toImageUrl(image)}
                            height={180}
                            style={{ borderRadius: 12, objectFit: "cover", width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <div style={{ background: "#f1f5f9", borderRadius: 12, height: 220, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                      <Text type="secondary">Chưa có hình ảnh phòng</Text>
                    </div>
                  )}

                  {/* Specs Icon Grid */}
                  <Title level={4} style={{ marginBottom: 16 }}>Bảng phí & Tiện ích phòng</Title>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Tối đa người ở</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>👥 {room.capacity || 1} người</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Đơn giá điện</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "#d97706" }}>⚡ {formatCurrency(room.electricityPrice)}/kWh</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Đơn giá nước</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "#2563eb" }}>💧 {formatCurrency(room.waterPrice)}/m³</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Phí dịch vụ chung</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>🧹 {formatCurrency(room.serviceFee)}/tháng</div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <Title level={4} style={{ marginBottom: 12 }}>Mô tả chi tiết</Title>
                  <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: "#334155", background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    {room.description || "Phòng trọ khép kín rộng rãi, ánh sáng tự nhiên tốt, thiết bị vệ sinh cao cấp, an ninh đảm bảo 24/7, giờ giấc tự do không chung chủ."}
                  </Paragraph>
                </div>

                {/* Right Column: Sticky Sales Sidebar */}
                <div className="detail-sticky-sidebar">
                  <div className="price-box">
                    <Text style={{ color: "#ccfbf1", fontSize: 13, fontWeight: 600 }}>GIÁ THUÊ NIÊM YẾT</Text>
                    <h3 className="price-main">{formatCurrency(room.price)} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>/ tháng</span></h3>
                    <Text style={{ color: "#ffffff", opacity: 0.9, fontSize: 13 }}>Tiền cọc giữ chỗ: {formatCurrency(room.deposit || Math.ceil(Number(room.price || 0) / 3))}</Text>
                  </div>

                  <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<CreditCardOutlined />}
                        block
                        onClick={() => openRoomRequestModal("hold_deposit")}
                        style={{ background: "#0f766e", borderColor: "#0f766e", height: 48, borderRadius: 8, fontWeight: 700, fontSize: 16 }}
                      >
                        Đặt cọc giữ phòng ngay
                      </Button>
                      <Button
                        type="default"
                        size="large"
                        block
                        onClick={() => openRoomRequestModal("rent")}
                        style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
                      >
                        Đăng ký thuê phòng
                      </Button>
                      <Button
                        type="dashed"
                        icon={<HeartOutlined />}
                        block
                        onClick={handleInterestedRoom}
                        style={{ borderRadius: 8, color: "#e11d48" }}
                      >
                        Thêm vào danh sách yêu thích
                      </Button>

                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                        <Text strong style={{ fontSize: 14 }}>Hỗ trợ tư vấn chủ trọ</Text>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <PhoneOutlined style={{ color: "#0f766e", fontSize: 18 }} />
                          <Text style={{ fontWeight: 600, fontSize: 15 }}>0988 123 456</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                          Liên hệ để hẹn lịch xem phòng thực tế trực tiếp.
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Content>

      {/* Room Request Form Modal */}
      <Modal
        title={roomRequestType === "hold_deposit" ? "Đặt Cọc Giữ Phòng Trọ" : "Yêu Cầu Đăng Ký Thuê Phòng"}
        open={roomRequestModalOpen}
        onCancel={closeRoomRequestModal}
        onOk={() => roomRequestForm.submit()}
        confirmLoading={roomRequestSubmitting}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        width={780}
        okButtonProps={{ style: { background: "#0f766e", borderColor: "#0f766e" } }}
      >
        {room && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">Phòng {room.roomNumber} - {room.name}</Descriptions.Item>
              <Descriptions.Item label="Giá thuê">{formatCurrency(room.price)}/tháng</Descriptions.Item>
              <Descriptions.Item label="Số tiền cần cọc">
                <Text strong style={{ color: "#0f766e" }}>
                  {formatCurrency(
                    roomRequestType === "hold_deposit"
                      ? Math.ceil(Number(room.price || 0) / 3)
                      : room.price
                  )}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Quyền lợi">
                {roomRequestType === "hold_deposit"
                  ? "Giữ chỗ phòng trong 7 ngày sau khi thanh toán cọc."
                  : "Tiền cọc bằng 1 tháng tiền thuê phòng."}
              </Descriptions.Item>
            </Descriptions>

            <Form form={roomRequestForm} layout="vertical" onFinish={handleRoomRequestSubmit}>
              {roomRequestType === "rent" ? (
                <>
                  <div className="form-grid">
                    <Form.Item name="durationMonths" label="Thời hạn thuê (tháng)" rules={[{ required: true, message: "Vui lòng nhập thời hạn thuê" }]}>
                      <InputNumber className="full-width-input" min={1} style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="occupantCount" label="Số người ở" rules={[{ required: true, message: "Vui lòng nhập số người ở" }]}>
                      <InputNumber className="full-width-input" min={1} style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </div>

                  <Form.List name="occupants">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        {fields.map((field, index) => (
                          <Card
                            key={field.key}
                            size="small"
                            title={`Thông tin Người ở ${index + 1}`}
                            extra={
                              fields.length > 1 ? (
                                <Button type="link" danger onClick={() => remove(field.name)}>
                                  Xóa
                                </Button>
                              ) : null
                            }
                            style={{ borderRadius: 8 }}
                          >
                            <div className="form-grid">
                              <Form.Item {...field} name={[field.name, "name"]} label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "phone"]} label="Số điện thoại" rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "identityNumber"]} label="Số CCCD" rules={[{ required: true, message: "Vui lòng nhập CCCD" }]}>
                                <Input style={{ borderRadius: 6 }} />
                              </Form.Item>
                            </div>
                          </Card>
                        ))}
                        <Button onClick={() => add()} style={{ borderRadius: 6 }}>Thêm người ở cùng</Button>
                      </Space>
                    )}
                  </Form.List>
                </>
              ) : null}
              <Form.Item name="message" label="Lời nhắn cho chủ trọ (Thời gian hẹn xem phòng/yêu cầu thêm)">
                <Input.TextArea rows={3} placeholder="VD: Em muốn hẹn xem phòng vào thứ 7 tuần này lúc 10h sáng." style={{ borderRadius: 8 }} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      {/* Payment QR Code Modal */}
      <Modal
        title="Thông Tin Chuyển Khoản Thanh Toán"
        open={Boolean(paymentRequest)}
        onCancel={() => setPaymentRequest(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPaymentRequest(null)} style={{ background: "#0f766e", borderRadius: 8 }}>
            Đã chuyển khoản / Đóng
          </Button>,
        ]}
        width={720}
      >
        {paymentRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã yêu cầu">{paymentRequest.requestCode}</Descriptions.Item>
              <Descriptions.Item label="Phòng">{paymentRequest.roomNumber} - {paymentRequest.roomName}</Descriptions.Item>
              <Descriptions.Item label="Số tiền cọc">
                <Text strong style={{ color: "#0f766e", fontSize: 16 }}>{formatCurrency(paymentRequest.amount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{paymentRequest.paymentBankName || "MB Bank"}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                <Text copyable strong>{paymentRequest.paymentBankAccountNumber || "-"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{paymentRequest.paymentBankAccountName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung CK" span={2}>
                <Text copyable strong style={{ color: "#e11d48", fontSize: 15 }}>
                  {paymentRequest.paymentContent || paymentRequest.paymentOrderCode || paymentRequest.requestCode}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {paymentRequest.paymentQrCode ? (
              <div style={{ textAlign: "center", padding: 16, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <Image src={paymentRequest.paymentQrCode} width={260} style={{ borderRadius: 8 }} />
                <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                  Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản chính xác nội dung & số tiền.
                </Paragraph>
              </div>
            ) : null}
          </Space>
        )}
      </Modal>

      {/* Login Prompt Modal */}
      <Modal
        title="Yêu cầu Đăng nhập"
        open={loginPromptOpen}
        onCancel={() => setLoginPromptOpen(false)}
        onOk={() => navigate(`/login?redirect=${encodeURIComponent(`/rooms/${id}`)}`)}
        okText="Đăng nhập ngay"
        cancelText="Ở lại"
        okButtonProps={{ style: { background: "#0f766e" } }}
      >
        <Text style={{ fontSize: 15 }}>
          Bạn cần đăng nhập tài khoản để thực hiện đặt cọc giữ chỗ hoặc lưu phòng quan tâm. Bạn có muốn chuyển đến trang đăng nhập ngay không?
        </Text>
      </Modal>
    </Layout>
  );
};

export default UserRoomDetailPage;
