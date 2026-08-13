import { CreditCardOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Paragraph, Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const paymentProviderMeta = {
  manual_qr: { color: "cyan", label: "Thanh toán QR thủ công" },
  vnpay: { color: "blue", label: "Thanh toán VNPay" },
};

const getPaymentProviderMeta = (provider) =>
  provider === "vnpay" ? paymentProviderMeta.vnpay : paymentProviderMeta.manual_qr;

const getPaymentStatusMeta = (record) => {
  if (record.paymentStatus === "paid") {
    return { color: "success", label: "Thanh toán thành công" };
  }

  if (
    ["failed", "cancelled"].includes(record.paymentStatus) ||
    ["rejected", "cancelled", "expired"].includes(record.status)
  ) {
    return { color: "error", label: "Thanh toán thất bại" };
  }

  return { color: "processing", label: "Đang chờ thanh toán" };
};

const getHoldTimeMeta = (record) => {
  if (!record.holdExpiresAt) {
    return { expired: true, label: "Quá hạn" };
  }

  const diffMs = new Date(record.holdExpiresAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return { expired: true, label: "Quá hạn" };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) parts.push(`${days} ngày`);
  if (hours) parts.push(`${hours} giờ`);
  if (!days && minutes) parts.push(`${minutes} phút`);

  return { expired: false, label: parts.join(" ") || "Dưới 1 phút" };
};

const canRentFromHold = (record) => {
  const timeMeta = getHoldTimeMeta(record);
  return (
    record.type === "hold_deposit" &&
    record.paymentStatus === "paid" &&
    record.status === "pending" &&
    record.roomStatus === "reserved" &&
    !timeMeta.expired
  );
};

const UserRoomRequestsPage = () => {
  const [rentForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detailRequest, setDetailRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState("manual_qr");
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [rentHoldRequest, setRentHoldRequest] = useState(null);
  const [rentSubmitting, setRentSubmitting] = useState(false);
  const [roomRequests, setRoomRequests] = useState([]);
  const [vnpaySubmitting, setVnpaySubmitting] = useState(false);

  const depositedRooms = useMemo(
    () => roomRequests.filter((request) => request.type === "hold_deposit"),
    [roomRequests]
  );

  const fetchRoomRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/room-requests");
      setRoomRequests(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách phòng đã cọc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomRequests();
  }, []);

  const handleOpenDetail = async (record) => {
    try {
      const { data } = await http.get(`/me/room-requests/${record.id}`);
      setDetailRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không lấy được chi tiết phòng đã cọc");
    }
  };

  const handleIdentityUpload = async ({ file, onError, onSuccess }, fieldPath) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/identity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = data.urls?.[0] || "";

      rentForm.setFieldValue(fieldPath, uploadedUrl);
      onSuccess?.(data);
      message.success("Đã tải ảnh CCCD");
    } catch (error) {
      onError?.(error);
      message.error(error.response?.data?.message || "Tải ảnh CCCD thất bại");
    }
  };

  const handlePaymentProofUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/payment-proofs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const currentImages = paymentRequest?.paymentProofImages || [];
      const nextImages = [...currentImages, ...(data.urls || [])];

      if (paymentRequest?.id) {
        const { data: updatedRequest } = await http.patch(
          `/me/room-requests/${paymentRequest.id}/payment-proof`,
          { paymentProofImages: nextImages }
        );
        setPaymentRequest(updatedRequest);
        fetchRoomRequests();
      }

      onSuccess?.(data);
      message.success("Đã tải ảnh biên lai");
    } catch (error) {
      onError?.(error);
      message.error(error.response?.data?.message || "Tải ảnh biên lai thất bại");
    }
  };

  const openRentModal = (record) => {
    setRentHoldRequest(record);
    setPaymentProvider("manual_qr");
    rentForm.resetFields();
    rentForm.setFieldsValue({
      durationMonths: 12,
      occupantCount: 1,
      paymentProvider: "manual_qr",
      occupants: [
        {
          name: user?.name || "",
          phone: user?.phone || "",
          identityNumber: user?.identityNumber || "",
          identityFrontImage: user?.identityFrontImage || "",
          identityBackImage: user?.identityBackImage || "",
        },
      ],
    });
  };

  const closeRentModal = () => {
    setRentHoldRequest(null);
    rentForm.resetFields();
  };

  const handleCreateVnpayPayment = async (request = paymentRequest) => {
    if (!request?.id) {
      return;
    }

    setVnpaySubmitting(true);
    try {
      const { data } = await http.post("/payments/vnpay/create", {
        targetId: request.id,
        targetType: "room_request",
      });

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không tạo được giao dịch VNPay");
    } finally {
      setVnpaySubmitting(false);
    }
  };

  const submitRentFromHold = async (provider) => {
    setPaymentProvider(provider);
    rentForm.setFieldValue("paymentProvider", provider);

    try {
      await rentForm.validateFields();
      rentForm.submit();
    } catch (error) {
      // Ant Design displays field validation messages.
    }
  };

  const handleRentSubmit = async (values) => {
    if (!rentHoldRequest) {
      return;
    }

    setRentSubmitting(true);
    try {
      const { data } = await http.post(`/me/room-requests/${rentHoldRequest.id}/rent`, {
        durationMonths: values.durationMonths,
        message: values.message,
        occupantCount: values.occupantCount,
        occupants: values.occupants || [],
        paymentProvider: values.paymentProvider || paymentProvider,
      });

      message.success("Đã tạo yêu cầu thuê phòng từ phòng đã cọc");
      closeRentModal();
      setPaymentRequest(data);
      fetchRoomRequests();

      if ((values.paymentProvider || paymentProvider) === "vnpay") {
        await handleCreateVnpayPayment(data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể tạo yêu cầu thuê phòng");
    } finally {
      setRentSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>Phòng {record.roomNumber || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.roomName || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Số tiền đã cọc",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Trạng thái",
      key: "paymentStatus",
      render: (_, record) => {
        const meta = getPaymentStatusMeta(record);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentProvider",
      key: "paymentProvider",
      render: (provider) => {
        const meta = getPaymentProviderMeta(provider);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thời gian hiệu lực còn lại",
      key: "remainingHoldTime",
      render: (_, record) => {
        const meta = getHoldTimeMeta(record);
        return <Tag color={meta.expired ? "error" : "success"}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "paidAt",
      key: "paidAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => handleOpenDetail(record)} style={{ borderRadius: 6 }}>
            Xem chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={!canRentFromHold(record)}
            onClick={() => openRentModal(record)}
            style={{ background: "#0f766e", borderRadius: 6 }}
          >
            Thuê phòng
          </Button>
        </Space>
      ),
    },
  ];

  const remainingRentAmount = rentHoldRequest
    ? Math.max(Number(rentHoldRequest.roomPrice || 0) - Number(rentHoldRequest.amount || 0), 0)
    : 0;

  return (
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon">
              <CreditCardOutlined />
            </div>
            <span>Phòng đã cọc</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>
            Về trang chủ
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={depositedRooms}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "Chưa có phòng đã cọc" }}
        />
      </div>

      <Modal
        title="Chi tiết phòng đã cọc"
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)} style={{ borderRadius: 6 }}>
            Đóng
          </Button>,
        ]}
        width={760}
      >
        {detailRequest ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">
                Phòng {detailRequest.roomNumber || "-"} - {detailRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng">{formatCurrency(detailRequest.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Số tiền đã cọc">{formatCurrency(detailRequest.amount)}</Descriptions.Item>
              <Descriptions.Item label="Còn phải thanh toán khi thuê">
                {formatCurrency(Math.max(Number(detailRequest.roomPrice || 0) - Number(detailRequest.amount || 0), 0))}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getPaymentStatusMeta(detailRequest).color}>
                  {getPaymentStatusMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={getPaymentProviderMeta(detailRequest.paymentProvider).color}>
                  {getPaymentProviderMeta(detailRequest.paymentProvider).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hiệu lực còn lại">
                <Tag color={getHoldTimeMeta(detailRequest).expired ? "error" : "success"}>
                  {getHoldTimeMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày thanh toán">{formatDate(detailRequest.paidAt)}</Descriptions.Item>
              <Descriptions.Item label="Nội dung chuyển khoản" span={2}>
                <Text copyable strong style={{ color: "#e11d48" }}>
                  {detailRequest.paymentContent || detailRequest.paymentOrderCode || detailRequest.requestCode}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lời nhắn" span={2}>
                {detailRequest.message || "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailRequest.paymentProvider !== "vnpay" ? (
              <Card size="small" title="Ảnh biên lai QR thủ công">
                {(detailRequest.paymentProofImages || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {detailRequest.paymentProofImages.map((image) => (
                        <Image
                          key={image}
                          src={toImageUrl(image)}
                          width={132}
                          height={92}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Text type="secondary">Chưa có ảnh biên lai.</Text>
                )}
              </Card>
            ) : null}
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="Thuê phòng đã cọc"
        open={Boolean(rentHoldRequest)}
        onCancel={closeRentModal}
        cancelText="Hủy"
        footer={[
          <Button key="cancel" onClick={closeRentModal} style={{ borderRadius: 8 }}>
            Hủy
          </Button>,
          <Button
            key="manual"
            loading={rentSubmitting && paymentProvider === "manual_qr"}
            onClick={() => submitRentFromHold("manual_qr")}
            style={{ borderRadius: 8 }}
          >
            Thanh toán QR thủ công
          </Button>,
          <Button
            key="vnpay"
            type="primary"
            loading={rentSubmitting && paymentProvider === "vnpay"}
            onClick={() => submitRentFromHold("vnpay")}
            style={{ background: "#0f766e", borderRadius: 8 }}
          >
            Thanh toán VNPay
          </Button>,
        ]}
        width={860}
      >
        {rentHoldRequest ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">
                Phòng {rentHoldRequest.roomNumber || "-"} - {rentHoldRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng">{formatCurrency(rentHoldRequest.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Đã cọc">{formatCurrency(rentHoldRequest.amount)}</Descriptions.Item>
              <Descriptions.Item label="Cần thanh toán thêm">
                <Text strong style={{ color: "#0f766e" }}>
                  {formatCurrency(remainingRentAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Form form={rentForm} layout="vertical" onFinish={handleRentSubmit}>
              <Form.Item name="paymentProvider" hidden initialValue="manual_qr">
                <Input />
              </Form.Item>
              <div className="form-grid">
                <Form.Item
                  name="durationMonths"
                  label="Thời hạn thuê (tháng)"
                  rules={[{ required: true, message: "Vui lòng nhập thời hạn thuê" }]}
                >
                  <InputNumber className="full-width-input" min={1} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item
                  name="occupantCount"
                  label="Số người ở"
                  rules={[{ required: true, message: "Vui lòng nhập số người ở" }]}
                >
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
                        title={`Thông tin người ở ${index + 1}`}
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
                          <Form.Item
                            {...field}
                            name={[field.name, "name"]}
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                          >
                            <Input style={{ borderRadius: 6 }} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "phone"]}
                            label="Số điện thoại"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                          >
                            <Input style={{ borderRadius: 6 }} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "identityNumber"]}
                            label="Số CCCD"
                            rules={[{ required: true, message: "Vui lòng nhập CCCD" }]}
                          >
                            <Input style={{ borderRadius: 6 }} />
                          </Form.Item>
                          <Form.Item label="CCCD mặt trước" required>
                            <Upload
                              accept="image/jpeg,image/png,image/webp"
                              customRequest={(options) =>
                                handleIdentityUpload(options, ["occupants", field.name, "identityFrontImage"])
                              }
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>
                                Tải ảnh mặt trước
                              </Button>
                            </Upload>
                          </Form.Item>
                          <Form.Item label="CCCD mặt sau" required>
                            <Upload
                              accept="image/jpeg,image/png,image/webp"
                              customRequest={(options) =>
                                handleIdentityUpload(options, ["occupants", field.name, "identityBackImage"])
                              }
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>
                                Tải ảnh mặt sau
                              </Button>
                            </Upload>
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "identityFrontImage"]}
                            hidden
                            rules={[{ required: true, message: "Vui lòng tải ảnh CCCD mặt trước" }]}
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "identityBackImage"]}
                            hidden
                            rules={[{ required: true, message: "Vui lòng tải ảnh CCCD mặt sau" }]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                      </Card>
                    ))}
                    <Button onClick={() => add()} style={{ borderRadius: 6 }}>
                      Thêm người ở cùng
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Form.Item name="message" label="Lời nhắn cho chủ trọ">
                <Input.TextArea rows={3} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Form>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="Thanh toán phần còn lại"
        open={Boolean(paymentRequest)}
        onCancel={() => setPaymentRequest(null)}
        footer={[
          <Button key="close" onClick={() => setPaymentRequest(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
          paymentRequest?.paymentProvider === "vnpay" ? (
            <Button
              key="vnpay"
              type="primary"
              loading={vnpaySubmitting}
              disabled={paymentRequest?.paymentStatus === "paid"}
              onClick={() => handleCreateVnpayPayment()}
              style={{ background: "#0f766e", borderRadius: 8 }}
            >
              Thanh toán VNPay
            </Button>
          ) : null,
        ]}
        width={720}
      >
        {paymentRequest ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">
                Phòng {paymentRequest.roomNumber || "-"} - {paymentRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền cần thanh toán">
                <Text strong style={{ color: "#0f766e", fontSize: 16 }}>
                  {formatCurrency(paymentRequest.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Đã trừ tiền cọc">{formatCurrency(paymentRequest.depositCreditAmount)}</Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={getPaymentProviderMeta(paymentRequest.paymentProvider).color}>
                  {getPaymentProviderMeta(paymentRequest.paymentProvider).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung chuyển khoản" span={2}>
                <Text copyable strong style={{ color: "#e11d48" }}>
                  {paymentRequest.paymentContent || paymentRequest.paymentOrderCode || paymentRequest.requestCode}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {paymentRequest.paymentProvider !== "vnpay" ? (
              <>
                {paymentRequest.paymentQrCode ? (
                  <div style={{ textAlign: "center", padding: 16, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <Image src={paymentRequest.paymentQrCode} width={260} style={{ borderRadius: 8 }} />
                    <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                      Quét QR để thanh toán phần tiền phòng còn lại, sau đó tải ảnh biên lai.
                    </Paragraph>
                  </div>
                ) : null}
                <Card size="small" title="Biên lai chuyển khoản QR thủ công" style={{ borderRadius: 12 }}>
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Upload
                      accept="image/jpeg,image/png,image/webp"
                      customRequest={handlePaymentProofUpload}
                      maxCount={5}
                      multiple
                    >
                      <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                        Tải ảnh biên lai
                      </Button>
                    </Upload>
                    {(paymentRequest.paymentProofImages || []).length > 0 ? (
                      <Image.PreviewGroup>
                        <Space wrap>
                          {paymentRequest.paymentProofImages.map((image) => (
                            <Image
                              key={image}
                              src={toImageUrl(image)}
                              width={112}
                              height={78}
                              style={{ objectFit: "cover", borderRadius: 8 }}
                            />
                          ))}
                        </Space>
                      </Image.PreviewGroup>
                    ) : (
                      <Text type="secondary">Chưa có ảnh biên lai.</Text>
                    )}
                  </Space>
                </Card>
              </>
            ) : null}
          </Space>
        ) : null}
      </Modal>
    </div>
  );
};

export default UserRoomRequestsPage;
