import { ArrowLeftOutlined, CreditCardOutlined, HeartOutlined, LogoutOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Form, Image, Input, InputNumber, Layout, Modal, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
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

  const openRoomRequestModal = (type) => {
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
      message.success("Da gui yeu cau phong");
      closeRoomRequestModal();
      setPaymentRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Gui yeu cau phong that bai");
    } finally {
      setRoomRequestSubmitting(false);
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
            <Space wrap>
              <Button type="primary" icon={<HeartOutlined />} onClick={handleInterestedRoom} disabled={!room}>
                Quan tam phong nay
              </Button>
              <Button icon={<CreditCardOutlined />} onClick={() => openRoomRequestModal("hold_deposit")} disabled={!room}>
                Dat coc giu phong
              </Button>
              <Button onClick={() => openRoomRequestModal("rent")} disabled={!room}>
                Thue phong
              </Button>
            </Space>
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

        <Modal
          title={roomRequestType === "hold_deposit" ? "Dat coc giu phong" : "Yeu cau thue phong"}
          open={roomRequestModalOpen}
          onCancel={closeRoomRequestModal}
          onOk={() => roomRequestForm.submit()}
          confirmLoading={roomRequestSubmitting}
          okText="Gui yeu cau"
          cancelText="Huy"
          width={860}
        >
          {room && (
            <Space direction="vertical" size={16} className="page-stack">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Phong">
                  {room.roomNumber} - {room.name}
                </Descriptions.Item>
                <Descriptions.Item label="Gia thue">{formatCurrency(room.price)}</Descriptions.Item>
                <Descriptions.Item label="So tien can thanh toan">
                  <Typography.Text strong>
                    {formatCurrency(
                      roomRequestType === "hold_deposit"
                        ? Math.ceil(Number(room.price || 0) / 3)
                        : room.price
                    )}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chu">
                  {roomRequestType === "hold_deposit"
                    ? "Giu phong trong 7 ngay sau khi thanh toan coc."
                    : "Tien coc bang 1 thang tien phong."}
                </Descriptions.Item>
              </Descriptions>

              <Form form={roomRequestForm} layout="vertical" onFinish={handleRoomRequestSubmit}>
                {roomRequestType === "rent" ? (
                  <>
                    <div className="form-grid">
                      <Form.Item name="durationMonths" label="Thoi han thue (thang)" rules={[{ required: true }]}>
                        <InputNumber className="full-width-input" min={1} />
                      </Form.Item>
                      <Form.Item name="occupantCount" label="So nguoi o" rules={[{ required: true }]}>
                        <InputNumber className="full-width-input" min={1} />
                      </Form.Item>
                    </div>

                    <Form.List name="occupants">
                      {(fields, { add, remove }) => (
                        <Space direction="vertical" size={12} className="page-stack">
                          {fields.map((field, index) => (
                            <Card
                              key={field.key}
                              size="small"
                              title={`Nguoi o ${index + 1}`}
                              extra={
                                fields.length > 1 ? (
                                  <Button type="link" danger onClick={() => remove(field.name)}>
                                    Xoa
                                  </Button>
                                ) : null
                              }
                            >
                              <div className="form-grid">
                                <Form.Item {...field} name={[field.name, "name"]} label="Ho ten" rules={[{ required: true }]}>
                                  <Input />
                                </Form.Item>
                                <Form.Item {...field} name={[field.name, "phone"]} label="So dien thoai" rules={[{ required: true }]}>
                                  <Input />
                                </Form.Item>
                                <Form.Item {...field} name={[field.name, "identityNumber"]} label="So CCCD" rules={[{ required: true }]}>
                                  <Input />
                                </Form.Item>
                                <Form.Item {...field} name={[field.name, "identityFrontImage"]} label="Anh CCCD mat truoc" rules={[{ required: true }]}>
                                  <Input placeholder="/uploads/identity/..." />
                                </Form.Item>
                                <Form.Item {...field} name={[field.name, "identityBackImage"]} label="Anh CCCD mat sau" rules={[{ required: true }]}>
                                  <Input placeholder="/uploads/identity/..." />
                                </Form.Item>
                              </div>
                            </Card>
                          ))}
                          <Button onClick={() => add()}>Them nguoi o</Button>
                        </Space>
                      )}
                    </Form.List>
                  </>
                ) : null}
                <Form.Item name="message" label="Loi nhan cho admin">
                  <Input.TextArea rows={3} placeholder="VD: Toi muon xem phong vao cuoi tuan nay" />
                </Form.Item>
              </Form>
            </Space>
          )}
        </Modal>

        <Modal
          title="Thong tin thanh toan"
          open={Boolean(paymentRequest)}
          onCancel={() => setPaymentRequest(null)}
          footer={[
            <Button key="close" onClick={() => setPaymentRequest(null)}>
              Dong
            </Button>,
          ]}
          width={760}
        >
          {paymentRequest && (
            <Space direction="vertical" size={16} className="page-stack">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Ma yeu cau">{paymentRequest.requestCode}</Descriptions.Item>
                <Descriptions.Item label="Phong">
                  {paymentRequest.roomNumber} - {paymentRequest.roomName}
                </Descriptions.Item>
                <Descriptions.Item label="So tien">
                  <Typography.Text strong>{formatCurrency(paymentRequest.amount)}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngan hang">{paymentRequest.paymentBankName || "-"}</Descriptions.Item>
                <Descriptions.Item label="So tai khoan">
                  <Typography.Text copyable>{paymentRequest.paymentBankAccountNumber || "-"}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Chu tai khoan">{paymentRequest.paymentBankAccountName || "-"}</Descriptions.Item>
                <Descriptions.Item label="Noi dung CK">
                  <Typography.Text copyable strong>
                    {paymentRequest.paymentContent || paymentRequest.paymentOrderCode || paymentRequest.requestCode}
                  </Typography.Text>
                </Descriptions.Item>
              </Descriptions>
              {paymentRequest.paymentQrCode ? (
                <Space direction="vertical" align="center" className="page-stack">
                  <Image src={paymentRequest.paymentQrCode} width={280} />
                  <Typography.Text type="secondary">
                    Vui long chuyen dung so tien va dung noi dung de admin doi soat.
                  </Typography.Text>
                </Space>
              ) : (
                <Typography.Text type="danger">
                  Chua cau hinh thong tin ngan hang de tao QR thanh toan.
                </Typography.Text>
              )}
            </Space>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserRoomDetailPage;
