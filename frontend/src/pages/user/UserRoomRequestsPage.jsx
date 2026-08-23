import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  HomeOutlined,
  KeyOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

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
    return { color: "success", label: "Đã cọc thành công", badgeBg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };
  }

  if (
    ["failed", "cancelled"].includes(record.paymentStatus) ||
    ["rejected", "cancelled", "expired"].includes(record.status)
  ) {
    return { color: "error", label: "Thanh toán thất bại", badgeBg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
  }

  return { color: "processing", label: "Chờ xác nhận cọc", badgeBg: "#fffbeb", text: "#b45309", border: "#fde68a" };
};

const getHoldTimeMeta = (record) => {
  const hasEffectiveHold =
    record.type === "hold_deposit" &&
    record.paymentStatus === "paid" &&
    record.status === "pending";

  if (!hasEffectiveHold) {
    return { expired: true, label: "Hết hiệu lực giữ chỗ" };
  }
  if (!record.holdExpiresAt) {
    return { expired: true, label: "Hết hạn" };
  }

  const diffMs = new Date(record.holdExpiresAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return { expired: true, label: "Quá hạn giữ chỗ" };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) parts.push(`${days} ngày`);
  if (hours) parts.push(`${hours} giờ`);
  if (!days && minutes) parts.push(`${minutes} phút`);

  return { expired: false, label: `Còn lại ${parts.join(" ") || "Dưới 1 phút"}` };
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

  const [roomRequests, setRoomRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [detailRequest, setDetailRequest] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState("manual_qr");
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [rentHoldRequest, setRentHoldRequest] = useState(null);
  const [rentSubmitting, setRentSubmitting] = useState(false);
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
      message.success("Đã tải ảnh CCCD thành công!");
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
      message.success("Đã tải ảnh biên lai thành công!");
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
    if (!request?.id) return;

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
      // Ant Design validation handled
    }
  };

  const handleRentSubmit = async (values) => {
    if (!rentHoldRequest) return;

    setRentSubmitting(true);
    try {
      const { data } = await http.post(`/me/room-requests/${rentHoldRequest.id}/rent`, {
        durationMonths: values.durationMonths,
        message: values.message,
        occupantCount: values.occupantCount,
        occupants: values.occupants || [],
        paymentProvider: values.paymentProvider || paymentProvider,
      });

      message.success("Đã tạo yêu cầu thuê phòng từ khoản tiền cọc thành công!");
      closeRentModal();
      setPaymentRequest(null);
      fetchRoomRequests();

    } catch (error) {
      message.error(error.response?.data?.message || "Không thể tạo yêu cầu thuê phòng");
    } finally {
      setRentSubmitting(false);
    }
  };

  // Filtered Deposited Rooms
  const filteredDeposits = useMemo(() => {
    return depositedRooms.filter((item) => {
      const holdMeta = getHoldTimeMeta(item);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? !holdMeta.expired && item.paymentStatus === "paid"
          : holdMeta.expired || item.paymentStatus !== "paid";

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
        (item.roomName && item.roomName.toLowerCase().includes(q)) ||
        (item.requestCode && item.requestCode.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [depositedRooms, statusFilter, searchQuery]);

  // Stats Summary
  const stats = useMemo(() => {
    const activeHold = depositedRooms.filter(
      (r) => !getHoldTimeMeta(r).expired && r.paymentStatus === "paid"
    );
    const totalDepositAmount = depositedRooms.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const readyToRentCount = depositedRooms.filter((r) => canRentFromHold(r)).length;
    const total = depositedRooms.length;
    return { activeHoldCount: activeHold.length, totalDepositAmount, readyToRentCount, total };
  }, [depositedRooms]);

  // Table Columns
  const columns = [
    {
      title: "Phòng Trọ Đã Cọc",
      key: "room",
      render: (_, record) => {
        const coverImg = record.roomImages?.[0] ? toImageUrl(record.roomImages[0]) : null;
        return (
          <Space size={12}>
            {coverImg ? (
              <img
                src={coverImg}
                alt={`Phòng ${record.roomNumber}`}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                }}
              />
            ) : (
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  background: "#f0f9ff",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <CreditCardOutlined />
              </div>
            )}
            <div>
              <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                Phòng {record.roomNumber || "-"}
              </Text>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {record.roomName || "Phòng trọ cao cấp"}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Số tiền giữ cọc",
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Text strong style={{ color: "#0284c7", fontSize: 15 }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Trạng thái cọc",
      key: "paymentStatus",
      render: (_, record) => {
        const meta = getPaymentStatusMeta(record);
        return (
          <Tag
            style={{
              background: meta.badgeBg,
              color: meta.text,
              borderColor: meta.border,
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Cổng thanh toán",
      dataIndex: "paymentProvider",
      key: "paymentProvider",
      render: (provider) => {
        const meta = getPaymentProviderMeta(provider);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Hiệu lực giữ chỗ",
      key: "remainingHoldTime",
      render: (_, record) => {
        const meta = getHoldTimeMeta(record);
        return (
          <Tag color={meta.expired ? "error" : "success"} style={{ borderRadius: 6, fontWeight: 700 }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Ngày cọc",
      dataIndex: "paidAt",
      key: "paidAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => {
        const canRent = canRentFromHold(record);
        return (
          <Space size={8} wrap>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetail(record)}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              Chi tiết
            </Button>
            <Button
              size="small"
              type="primary"
              disabled={!canRent}
              icon={<KeyOutlined />}
              onClick={() => openRentModal(record)}
              style={{
                background: canRent ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : undefined,
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              Thuê ngay
            </Button>
          </Space>
        );
      },
    },
  ];

  const remainingRentAmount = rentHoldRequest
    ? Math.max(Number(rentHoldRequest.roomPrice || 0) - Number(rentHoldRequest.amount || 0), 0)
    : 0;

  return (
    <div className="my-room-requests-container">
      {/* Hero Header Section */}
      <div className="my-room-requests-hero">
        <div className="my-room-requests-hero-badge">
          <CreditCardOutlined />
          <span>QUẢN LÝ GIỮ PHÒNG & ĐẶT CỌC CHÍNH THỨC • TRO PLUS</span>
        </div>
        <Title level={2} className="my-room-requests-hero-title">
          Phòng Đã Đặt Cọc & Giữ Chỗ
        </Title>
        <p className="my-room-requests-hero-desc">
          Theo dõi danh sách phòng trọ bạn đã cọc giữ chỗ thành công, kiểm tra thời gian hiệu lực ưu tiên & ký hợp đồng thuê chính thức để dọn vào ở ngay.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-room-requests-stats-grid">
          <div className="my-room-requests-stat-card">
            <div className="my-room-requests-stat-icon sky">
              <CreditCardOutlined />
            </div>
            <div>
              <div className="my-room-requests-stat-val">{stats.total}</div>
              <div className="my-room-requests-stat-lbl">Tổng số phòng đã cọc</div>
            </div>
          </div>

          <div className="my-room-requests-stat-card emerald">
            <div className="my-room-requests-stat-icon emerald">
              <ClockCircleOutlined />
            </div>
            <div>
              <div className="my-room-requests-stat-val">{stats.activeHoldCount}</div>
              <div className="my-room-requests-stat-lbl">Đang có hiệu lực giữ chỗ</div>
            </div>
          </div>

          <div className="my-room-requests-stat-card amber">
            <div className="my-room-requests-stat-icon amber">
              <DollarOutlined />
            </div>
            <div>
              <div className="my-room-requests-stat-val">
                {stats.totalDepositAmount > 0
                  ? `${(stats.totalDepositAmount / 1000000).toFixed(1)} tr`
                  : "0 đ"}
              </div>
              <div className="my-room-requests-stat-lbl">Tổng tiền cọc đã trả</div>
            </div>
          </div>

          <div className="my-room-requests-stat-card indigo">
            <div className="my-room-requests-stat-icon indigo">
              <KeyOutlined />
            </div>
            <div>
              <div className="my-room-requests-stat-val">{stats.readyToRentCount}</div>
              <div className="my-room-requests-stat-lbl">Sẵn sàng ký hợp đồng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-room-requests-control-bar">
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
              { label: `Tất cả (${depositedRooms.length})`, value: "all" },
              {
                label: `Còn giữ chỗ (${stats.activeHoldCount})`,
                value: "active",
              },
              {
                label: `Khác (${depositedRooms.length - stats.activeHoldCount})`,
                value: "other",
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
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
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
            Đang tải dữ liệu danh sách phòng đã cọc...
          </div>
        </div>
      ) : filteredDeposits.length === 0 ? (
        /* Empty Sales State */
        <div className="my-rooms-empty-sales-card">
          <div
            className="my-rooms-empty-icon-wrapper"
            style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", color: "#0284c7" }}
          >
            <CreditCardOutlined />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy phòng đã cọc phù hợp"
              : "Bạn chưa có khoản cọc giữ phòng nào"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng điều chỉnh lại từ khóa hoặc bộ lọc tìm kiếm."
              : "Đặt cọc giữ phòng online giúp bạn giữ quyền ưu tiên thuê trước các khách hàng khác. Khám phá ngay các phòng trọ đẹp đang trống tại TRO PLUS!"}
          </Paragraph>

          <Space size={14} wrap style={{ justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => navigate("/")}
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                borderRadius: 12,
                height: 48,
                padding: "0 28px",
                fontWeight: 700,
              }}
            >
              Khám phá phòng trọ ngay
            </Button>
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/user/my-rooms")}
              style={{ borderRadius: 12, height: 48, padding: "0 24px", fontWeight: 600 }}
            >
              Phòng của tôi
            </Button>
          </Space>
        </div>
      ) : viewMode === "grid" ? (
        /* Card Grid View */
        <div className="my-room-requests-grid">
          {filteredDeposits.map((request) => {
            const holdMeta = getHoldTimeMeta(request);
            const statusMeta = getPaymentStatusMeta(request);
            const canRent = canRentFromHold(request);
            const coverImage = request.roomImages?.[0]
              ? toImageUrl(request.roomImages[0])
              : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80";

            return (
              <div
                key={request.id}
                className={`my-room-request-card ${canRent ? "ready" : ""}`}
              >
                {/* Cover Image */}
                <div className="my-room-request-card-cover">
                  <img src={coverImage} alt={`Phòng ${request.roomNumber}`} className="my-room-request-card-img" />

                  {/* Hold Status Badge */}
                  <div
                    className="my-room-request-hold-badge"
                    style={{
                      background: holdMeta.expired ? "#fef2f2" : "#f0fdf4",
                      color: holdMeta.expired ? "#dc2626" : "#15803d",
                      border: `1px solid ${holdMeta.expired ? "#fecaca" : "#bbf7d0"}`,
                    }}
                  >
                    {!holdMeta.expired && <span className="pulse-dot" />}
                    <span>{holdMeta.label}</span>
                  </div>

                  {/* Deposit Amount Overlay */}
                  <div className="my-room-request-deposit-overlay">
                    {formatCurrency(request.amount)} <span style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1" }}>(Tiền cọc)</span>
                  </div>
                </div>

                {/* Body */}
                <div className="my-room-request-card-body">
                  <div>
                    <h3 className="my-rooms-room-name">
                      Phòng {request.roomNumber || "-"}
                    </h3>
                    <div className="my-rooms-sub-title">
                      {request.roomName || "Phòng trọ tiện nghi"} • Giá thuê: {formatCurrency(request.roomPrice)}/tháng
                    </div>
                  </div>

                  <div className="my-room-request-info-box">
                    <div className="my-room-request-info-row">
                      <span style={{ color: "#64748b" }}>Trạng thái thanh toán cọc:</span>
                      <Tag
                        style={{
                          background: statusMeta.badgeBg,
                          color: statusMeta.text,
                          borderColor: statusMeta.border,
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        {statusMeta.label}
                      </Tag>
                    </div>

                    <div className="my-room-request-info-row">
                      <span style={{ color: "#64748b" }}>Cần thanh toán thêm khi thuê:</span>
                      <strong style={{ color: "#0284c7", fontSize: 15 }}>
                        {formatCurrency(Math.max(Number(request.roomPrice || 0) - Number(request.amount || 0), 0))}
                      </strong>
                    </div>

                    <div className="my-room-request-info-row">
                      <span style={{ color: "#64748b" }}>Cổng thanh toán cọc:</span>
                      <Tag color={getPaymentProviderMeta(request.paymentProvider).color}>
                        {getPaymentProviderMeta(request.paymentProvider).label}
                      </Tag>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="my-room-request-card-actions">
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => handleOpenDetail(request)}
                      style={{ borderRadius: 10, fontWeight: 600, borderColor: "#cbd5e1" }}
                    >
                      Biên lai cọc
                    </Button>

                    <Button
                      type={canRent ? "primary" : "default"}
                      disabled={!canRent}
                      icon={<KeyOutlined />}
                      onClick={() => openRentModal(request)}
                      style={{
                        borderRadius: 10,
                        fontWeight: 700,
                        background: canRent ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : undefined,
                      }}
                    >
                      Thuê ngay
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
            columns={columns}
            dataSource={filteredDeposits}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* Deposit Detail Modal */}
      <Modal
        title={
          <Space size={10}>
            <CreditCardOutlined style={{ color: "#0284c7", fontSize: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              Chi Tiết Khoản Cọc Phòng #{detailRequest?.roomNumber}
            </span>
          </Space>
        }
        open={Boolean(detailRequest)}
        onCancel={() => setDetailRequest(null)}
        footer={[
          <Button key="close" onClick={() => setDetailRequest(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={760}
        centered
      >
        {detailRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng trọ">
                Phòng {detailRequest.roomNumber || "-"} - {detailRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá thuê chính thức">
                {formatCurrency(detailRequest.roomPrice)} / tháng
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền đã cọc giữ chỗ">
                <Text strong style={{ color: "#0284c7", fontSize: 16 }}>
                  {formatCurrency(detailRequest.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cần thanh toán thêm khi thuê">
                {formatCurrency(Math.max(Number(detailRequest.roomPrice || 0) - Number(detailRequest.amount || 0), 0))}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái cọc">
                <Tag color={getPaymentStatusMeta(detailRequest).color}>
                  {getPaymentStatusMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời hạn giữ chỗ còn lại">
                <Tag color={getHoldTimeMeta(detailRequest).expired ? "error" : "success"}>
                  {getHoldTimeMeta(detailRequest).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color={getPaymentProviderMeta(detailRequest.paymentProvider).color}>
                  {getPaymentProviderMeta(detailRequest.paymentProvider).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hoàn thành cọc">
                {formatDate(detailRequest.paidAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch / Nội dung" span={2}>
                <Text copyable strong style={{ color: "#e11d48" }}>
                  {detailRequest.paymentContent || detailRequest.paymentOrderCode || detailRequest.requestCode}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {detailRequest.paymentProvider !== "vnpay" && (
              <Card size="small" title="🖼️ Biên Lai Chuyển Khoản Đã Đính Kèm" style={{ borderRadius: 12 }}>
                {(detailRequest.paymentProofImages || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {detailRequest.paymentProofImages.map((image, idx) => (
                        <Image
                          key={idx}
                          src={toImageUrl(image)}
                          width={132}
                          height={92}
                          style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Text type="secondary">Chưa đính kèm hình ảnh biên lai.</Text>
                )}
              </Card>
            )}
          </Space>
        )}
      </Modal>

      {/* Upgrade Hold to Official Renting Modal */}
      <Modal
        title={
          <Space size={10}>
            <KeyOutlined style={{ color: "#0284c7", fontSize: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              Ký Thuê Phòng Đã Đặt Cọc
            </span>
          </Space>
        }
        open={Boolean(rentHoldRequest)}
        onCancel={closeRentModal}
        cancelText="Hủy"
        footer={[
          <Button key="cancel" onClick={closeRentModal} style={{ borderRadius: 8 }}>
            Hủy
          </Button>,
          <Button
            key="manual"
            type="primary"
            loading={rentSubmitting && paymentProvider === "manual_qr"}
            onClick={() => submitRentFromHold("manual_qr")}
            style={{ background: "#0f766e", borderRadius: 8, fontWeight: 700 }}
          >
            Thanh toán VietQR thủ công
          </Button>,
          <Button
            key="vnpay"
            type="primary"
            loading={rentSubmitting && paymentProvider === "vnpay"}
            onClick={() => submitRentFromHold("vnpay")}
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              borderRadius: 8,
              display: "none",
              fontWeight: 700,
            }}
          >
            Thanh toán online VNPay
          </Button>,
        ]}
        width={860}
        centered
      >
        {rentHoldRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng chọn thuê">
                Phòng {rentHoldRequest.roomNumber || "-"} - {rentHoldRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá thuê phòng chính thức">
                {formatCurrency(rentHoldRequest.roomPrice)} / tháng
              </Descriptions.Item>
              <Descriptions.Item label="Đã khấu trừ tiền cọc">
                <Text type="success" strong>- {formatCurrency(rentHoldRequest.amount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cần thanh toán thêm">
                <Text strong style={{ color: "#0284c7", fontSize: 16 }}>
                  {formatCurrency(remainingRentAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Form form={rentForm} layout="vertical" onFinish={handleRentSubmit}>
              <Form.Item name="paymentProvider" hidden initialValue="manual_qr">
                <Input />
              </Form.Item>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item
                  name="durationMonths"
                  label="Thời hạn thuê mong muốn (tháng)"
                  rules={[{ required: true, message: "Vui lòng nhập thời hạn thuê" }]}
                >
                  <InputNumber min={1} style={{ width: "100%", borderRadius: 8 }} />
                </Form.Item>
                <Form.Item
                  name="occupantCount"
                  label="Tổng số người dọn vào ở"
                  rules={[{ required: true, message: "Vui lòng nhập số người ở" }]}
                >
                  <InputNumber min={1} style={{ width: "100%", borderRadius: 8 }} />
                </Form.Item>
              </div>

              <Text strong style={{ display: "block", marginBottom: 10, color: "#334155" }}>
                👥 Thông Tin CCCD / Căn Cước Người Ở Cùng:
              </Text>

              <Form.List name="occupants">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Thành viên cư trú ${index + 1}`}
                        extra={
                          fields.length > 1 ? (
                            <Button type="link" danger onClick={() => remove(field.name)}>
                              Xóa
                            </Button>
                          ) : null
                        }
                        style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                            label="Số CCCD / CMND"
                            rules={[{ required: true, message: "Vui lòng nhập CCCD" }]}
                          >
                            <Input style={{ borderRadius: 6 }} />
                          </Form.Item>

                          <Form.Item label="CCCD Mặt trước" required>
                            <Upload
                              accept="image/jpeg,image/png,image/webp"
                              customRequest={(options) =>
                                handleIdentityUpload(options, ["occupants", field.name, "identityFrontImage"])
                              }
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>
                                Upload mặt trước
                              </Button>
                            </Upload>
                          </Form.Item>
                          <Form.Item label="CCCD mat sau" required>
                            <Upload
                              accept="image/jpeg,image/png,image/webp"
                              customRequest={(options) =>
                                handleIdentityUpload(options, ["occupants", field.name, "identityBackImage"])
                              }
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>
                                Upload mat sau
                              </Button>
                            </Upload>
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "identityFrontImage"]}
                            hidden
                            rules={[{ required: true, message: "Vui long upload CCCD mat truoc" }]}
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "identityBackImage"]}
                            hidden
                            rules={[{ required: true, message: "Vui long upload CCCD mat sau" }]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                      </Card>
                    ))}
                    <Button onClick={() => add()} icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
                      Thêm người ở cùng
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Form.Item name="message" label="Ghi chú / Lời nhắn cho chủ nhà" style={{ marginTop: 16 }}>
                <Input.TextArea rows={3} placeholder="VD: Ngày dự kiến dọn vào, thời gian nhận chìa khóa..." style={{ borderRadius: 8 }} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      {/* Payment Processing Result Modal */}
      <Modal
        title="Thanh Toán Tiền Phòng Còn Lại"
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
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              Thanh toán VNPay
            </Button>
          ) : null,
        ]}
        width={720}
        centered
      >
        {paymentRequest && (
          <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
            <Descriptions bordered size="small" column={2} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">
                Phòng {paymentRequest.roomNumber || "-"} - {paymentRequest.roomName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền cần thanh toán">
                <Text strong style={{ color: "#0284c7", fontSize: 16 }}>
                  {formatCurrency(paymentRequest.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Đã trừ cọc">{formatCurrency(paymentRequest.depositCreditAmount)}</Descriptions.Item>
              <Descriptions.Item label="Cổng thanh toán">
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

            {paymentRequest.paymentProvider !== "vnpay" && (
              <>
                {paymentRequest.paymentQrCode && (
                  <div style={{ textAlign: "center", padding: 16, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <Image src={paymentRequest.paymentQrCode} width={240} style={{ borderRadius: 8 }} />
                    <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                      Quét mã QR để thanh toán khoản tiền còn lại, sau đó upload ảnh biên lai.
                    </Paragraph>
                  </div>
                )}
                <Card size="small" title="🖼️ Biên lai chuyển khoản QR thủ công" style={{ borderRadius: 12 }}>
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Upload
                      accept="image/jpeg,image/png,image/webp"
                      customRequest={handlePaymentProofUpload}
                      maxCount={5}
                      multiple
                    >
                      <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                        Tải ảnh biên lai lên
                      </Button>
                    </Upload>
                    {(paymentRequest.paymentProofImages || []).length > 0 ? (
                      <Image.PreviewGroup>
                        <Space wrap>
                          {paymentRequest.paymentProofImages.map((image, idx) => (
                            <Image
                              key={idx}
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
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserRoomRequestsPage;
