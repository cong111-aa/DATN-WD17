import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FormOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  Input,
  Modal,
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const contractStatusMeta = {
  pending_user_signature: {
    color: "warning",
    badgeBg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    label: "Chờ khách ký",
    icon: <ClockCircleOutlined />,
    urgent: true,
  },
  revision_requested: {
    color: "orange",
    badgeBg: "#fff7ed",
    text: "#c2410c",
    border: "#ffedd5",
    label: "Đang yêu cầu sửa",
    icon: <EditOutlined />,
  },
  active: {
    color: "success",
    badgeBg: "#f0fdf4",
    text: "#15803d",
    border: "#bbf7d0",
    label: "Đang hiệu lực",
    icon: <CheckCircleOutlined />,
  },
  expired: {
    color: "default",
    badgeBg: "#f8fafc",
    text: "#64748b",
    border: "#e2e8f0",
    label: "Hết hạn",
    icon: <ExclamationCircleOutlined />,
  },
  terminated: {
    color: "error",
    badgeBg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
    label: "Đã chấm dứt",
    icon: <ExclamationCircleOutlined />,
  },
};

const UserContractsPage = () => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [detailContract, setDetailContract] = useState(null);
  const [contractHtml, setContractHtml] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState("drawn");
  const [signing, setSigning] = useState(false);

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionText, setRevisionText] = useState("");

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/contracts");
      setContracts(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#0f172a";
  };

  useEffect(() => {
    if (detailContract && detailContract.status === "pending_user_signature") {
      setTimeout(prepareCanvas, 120);
    }
  }, [detailContract]);

  const openContract = async (contract) => {
    try {
      const { data } = await http.get(`/me/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      setDetailContract(contract);
      setContractHtml(data);
      setAcceptedTerms(false);
      setSignatureMethod("drawn");
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được hợp đồng");
    }
  };

  const openContractInNewTab = async (contract) => {
    try {
      const { data } = await http.get(`/me/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được hợp đồng");
    }
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  };

  const startDraw = (event) => {
    if (signatureMethod !== "drawn") return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || signatureMethod !== "drawn") return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const point = getCanvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    setSignatureMethod("drawn");
    prepareCanvas();
  };

  const createAutoSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    prepareCanvas();
    setSignatureMethod("auto_generated");
    ctx.fillStyle = "#1e293b";
    ctx.font = "40px cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(detailContract?.tenantName || "Nguoi thue", canvas.clientWidth / 2, canvas.clientHeight / 2);
  };

  const handleSignContract = async () => {
    if (!detailContract) return;

    if (!acceptedTerms) {
      message.warning("Bạn cần xác nhận đã đọc và đồng ý điều khoản hợp đồng");
      return;
    }

    const signatureDataUrl = canvasRef.current?.toDataURL("image/png");

    setSigning(true);
    try {
      const { data } = await http.patch(`/me/contracts/${detailContract.id}/sign`, {
        acceptedTerms,
        signatureDataUrl,
        signatureMethod,
      });
      message.success("Đã ký hợp đồng điện tử thành công!");
      setDetailContract(data);
      fetchContracts();

      const { data: html } = await http.get(`/me/contracts/${detailContract.id}/file`, {
        responseType: "text",
      });
      setContractHtml(html);
    } catch (error) {
      message.error(error.response?.data?.message || "Ký hợp đồng thất bại");
    } finally {
      setSigning(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!detailContract) return;

    if (!revisionText.trim()) {
      message.warning("Vui lòng nhập nội dung cần chỉnh sửa");
      return;
    }

    setRevisionSubmitting(true);
    try {
      const { data } = await http.patch(`/me/contracts/${detailContract.id}/revision-request`, {
        message: revisionText,
      });
      message.success("Đã gửi yêu cầu chỉnh sửa hợp đồng thành công!");
      setDetailContract(data);
      setRevisionModalOpen(false);
      setRevisionText("");
      fetchContracts();
    } catch (error) {
      message.error(error.response?.data?.message || "Gửi yêu cầu chỉnh sửa thất bại");
    } finally {
      setRevisionSubmitting(false);
    }
  };

  // Filter logic
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.contractCode && c.contractCode.toLowerCase().includes(q)) ||
        (c.roomNumber && String(c.roomNumber).toLowerCase().includes(q)) ||
        (c.roomName && c.roomName.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [contracts, statusFilter, searchQuery]);

  // Stats summary
  const stats = useMemo(() => {
    const pending = contracts.filter((c) => c.status === "pending_user_signature").length;
    const active = contracts.filter((c) => c.status === "active").length;
    const total = contracts.length;
    return { pending, active, total };
  }, [contracts]);

  // Table Columns
  const contractColumns = [
    {
      title: "Mã Hợp Đồng",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (code, record) => (
        <Space size={10}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: record.status === "pending_user_signature" ? "#fef3c7" : "#eff6ff",
              color: record.status === "pending_user_signature" ? "#d97706" : "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <FileProtectOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
              {code}
            </Text>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Phòng {record.roomNumber || "-"} {record.roomName ? `• ${record.roomName}` : ""}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Thời hạn hợp đồng",
      key: "period",
      render: (_, record) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "#64748b" }} />
          <span>
            {formatDate(record.startDate)} - {formatDate(record.endDate)}
          </span>
        </Space>
      ),
    },
    {
      title: "Tiền thuê hàng tháng",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      render: (val) => (
        <Text strong style={{ color: "#2563eb", fontSize: 15 }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
    {
      title: "Tiền đặt cọc",
      dataIndex: "deposit",
      key: "deposit",
      render: (val) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = contractStatusMeta[status] || contractStatusMeta.expired;
        return (
          <Tag
            icon={meta.icon}
            style={{
              background: meta.badgeBg,
              color: meta.text,
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
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Button
            type={record.status === "pending_user_signature" ? "primary" : "default"}
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openContract(record)}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              background: record.status === "pending_user_signature" ? "#2563eb" : undefined,
            }}
          >
            {record.status === "pending_user_signature" ? "Ký ngay" : "Chi tiết"}
          </Button>
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={() => openContractInNewTab(record)}
            style={{ borderRadius: 6 }}
          >
            Mở file
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="my-contracts-container">
      {/* Hero Header Section */}
      <div className="my-contracts-hero">
        <div className="my-contracts-hero-badge">
          <FileProtectOutlined />
          <span>HỢP ĐỒNG ĐIỆN TỬ • TRO PLUS</span>
        </div>
        <Title level={2} className="my-contracts-hero-title">
          Hợp Đồng Thuê Phòng
        </Title>
        <p className="my-contracts-hero-desc">
          Quản lý danh sách hợp đồng thuê phòng trực tuyến. Xác thực mã hóa SHA-256 chống chỉnh sửa trái phép, đảm bảo quyền lợi pháp lý 100% cho người thuê & chủ nhà.
        </p>

        {/* Quick Stats Grid */}
        <div className="my-contracts-stats-grid">
          <div className="my-contracts-stat-card">
            <div className="my-contracts-stat-icon blue">
              <FileProtectOutlined />
            </div>
            <div>
              <div className="my-contracts-stat-val">{stats.total}</div>
              <div className="my-contracts-stat-lbl">Tổng số hợp đồng</div>
            </div>
          </div>

          <div className="my-contracts-stat-card amber">
            <div className="my-contracts-stat-icon amber">
              <ClockCircleOutlined />
            </div>
            <div>
              <div className="my-contracts-stat-val">{stats.pending}</div>
              <div className="my-contracts-stat-lbl">Hợp đồng chờ bạn ký</div>
            </div>
          </div>

          <div className="my-contracts-stat-card emerald">
            <div className="my-contracts-stat-icon emerald">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="my-contracts-stat-val">{stats.active}</div>
              <div className="my-contracts-stat-lbl">Đang có hiệu lực</div>
            </div>
          </div>

          <div className="my-contracts-stat-card purple">
            <div className="my-contracts-stat-icon purple">
              <LockOutlined />
            </div>
            <div>
              <div className="my-contracts-stat-val">SHA-256</div>
              <div className="my-contracts-stat-lbl">Mã hóa an toàn 100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="my-contracts-control-bar">
        <Space wrap size={12}>
          <Input
            placeholder="Tìm mã HĐ hoặc số phòng..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 300, width: "100%", borderRadius: 10 }}
          />

          <Segmented
            options={[
              { label: `Tất cả (${contracts.length})`, value: "all" },
              {
                label: `Chờ ký (${contracts.filter((c) => c.status === "pending_user_signature").length})`,
                value: "pending_user_signature",
              },
              {
                label: `Đang hiệu lực (${contracts.filter((c) => c.status === "active").length})`,
                value: "active",
              },
              {
                label: `Khác (${contracts.filter((c) => c.status !== "pending_user_signature" && c.status !== "active").length})`,
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
            icon={<HomeOutlined />}
            onClick={() => navigate("/user/my-rooms")}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Phòng của tôi
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
            Đang nạp danh sách hợp đồng điện tử...
          </div>
        </div>
      ) : filteredContracts.length === 0 ? (
        /* Empty Sales State */
        <div className="my-rooms-empty-sales-card">
          <div className="my-rooms-empty-icon-wrapper" style={{ background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", color: "#2563eb" }}>
            <FileProtectOutlined />
          </div>
          <Title level={3} style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            {searchQuery || statusFilter !== "all"
              ? "Không tìm thấy hợp đồng phù hợp"
              : "Bạn chưa có hợp đồng thuê phòng nào"}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 540, margin: "0 auto 24px auto", fontSize: 15 }}>
            {searchQuery || statusFilter !== "all"
              ? "Vui lòng điều chỉnh lại từ khóa hoặc bộ lọc tìm kiếm."
              : "Hợp đồng thuê phòng điện tử sẽ tự động xuất hiện tại đây khi bạn đăng ký thuê phòng hoặc giữ cọc trực tuyến tại TRO PLUS."}
          </Paragraph>

          <Space size={14} wrap style={{ justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => navigate("/")}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                borderRadius: 12,
                height: 48,
                padding: "0 28px",
                fontWeight: 700,
              }}
            >
              Tìm phòng ngay
            </Button>
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/user/my-rooms")}
              style={{ borderRadius: 12, height: 48, padding: "0 24px", fontWeight: 600 }}
            >
              Xem phòng của tôi
            </Button>
          </Space>
        </div>
      ) : viewMode === "grid" ? (
        /* Sales Card Grid */
        <div className="my-contracts-grid">
          {filteredContracts.map((contract) => {
            const statusMeta = contractStatusMeta[contract.status] || contractStatusMeta.expired;
            const isUrgent = contract.status === "pending_user_signature";

            return (
              <div
                key={contract.id}
                className={`my-contract-card ${isUrgent ? "urgent" : ""}`}
              >
                {/* Header */}
                <div className="my-contract-card-header">
                  <div>
                    <h3 className="my-contract-code">{contract.contractCode}</h3>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      Phòng {contract.roomNumber || "-"} {contract.roomName ? `• ${contract.roomName}` : ""}
                    </div>
                  </div>

                  <Tag
                    icon={statusMeta.icon}
                    style={{
                      background: statusMeta.badgeBg,
                      color: statusMeta.text,
                      borderColor: statusMeta.border,
                      borderRadius: 8,
                      fontWeight: 700,
                      padding: "4px 10px",
                    }}
                  >
                    {statusMeta.label}
                  </Tag>
                </div>

                {/* Body */}
                <div className="my-contract-card-body">
                  <div className="my-contract-specs-box">
                    <div className="my-contract-spec-item">
                      <span className="my-contract-spec-lbl">Giá thuê hàng tháng</span>
                      <span className="my-contract-spec-val" style={{ color: "#2563eb", fontSize: 16 }}>
                        {formatCurrency(contract.monthlyRent)}
                      </span>
                    </div>
                    <div className="my-contract-spec-item">
                      <span className="my-contract-spec-lbl">Tiền đặt cọc</span>
                      <span className="my-contract-spec-val">
                        {formatCurrency(contract.deposit)}
                      </span>
                    </div>
                    <div className="my-contract-spec-item">
                      <span className="my-contract-spec-lbl">Ngày bắt đầu</span>
                      <span className="my-contract-spec-val">
                        {formatDate(contract.startDate)}
                      </span>
                    </div>
                    <div className="my-contract-spec-item">
                      <span className="my-contract-spec-lbl">Ngày kết thúc</span>
                      <span className="my-contract-spec-val">
                        {formatDate(contract.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 Hash Info */}
                  {contract.contentHash && (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "8px 12px",
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Space size={6} style={{ overflow: "hidden" }}>
                        <LockOutlined style={{ color: "#0f766e" }} />
                        <span style={{ color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          SHA-256: {contract.contentHash.substring(0, 16)}...
                        </span>
                      </Space>
                      <Tooltip title="Mã xác thực chống làm giả hợp đồng">
                        <InfoCircleOutlined style={{ color: "#94a3b8" }} />
                      </Tooltip>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="my-contract-card-actions">
                    <Button
                      type={isUrgent ? "primary" : "default"}
                      icon={<EyeOutlined />}
                      onClick={() => openContract(contract)}
                      style={{
                        borderRadius: 10,
                        fontWeight: 700,
                        background: isUrgent ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : undefined,
                      }}
                    >
                      {isUrgent ? "Xem & Ký ngay" : "Chi tiết HĐ"}
                    </Button>
                    <Button
                      icon={<ExportOutlined />}
                      onClick={() => openContractInNewTab(contract)}
                      style={{ borderRadius: 10, fontWeight: 600, borderColor: "#cbd5e1" }}
                    >
                      Mở file PDF/HTML
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
            columns={contractColumns}
            dataSource={filteredContracts}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 850 }}
          />
        </Card>
      )}

      {/* Contract Detail & Signing Modal */}
      <Modal
        title={
          <Space size={12}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#dbeafe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <FileProtectOutlined />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                Hợp Đồng Thuê Phòng #{detailContract?.contractCode}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Xác thực điện tử & Mã hóa bảo mật
              </div>
            </div>
          </Space>
        }
        open={Boolean(detailContract)}
        onCancel={() => setDetailContract(null)}
        footer={[
          <Button
            key="open"
            icon={<ExportOutlined />}
            onClick={() => openContractInNewTab(detailContract)}
            style={{ borderRadius: 8 }}
          >
            Mở tab mới / In
          </Button>,
          detailContract?.status === "pending_user_signature" ? (
            <Button
              key="revision"
              icon={<EditOutlined />}
              onClick={() => setRevisionModalOpen(true)}
              style={{ borderRadius: 8, borderColor: "#f59e0b", color: "#d97706" }}
            >
              Yêu cầu chỉnh sửa HĐ
            </Button>
          ) : null,
          detailContract?.status === "pending_user_signature" ? (
            <Button
              key="sign"
              type="primary"
              loading={signing}
              icon={<CheckCircleOutlined />}
              onClick={handleSignContract}
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              Xác nhận ký hợp đồng
            </Button>
          ) : null,
          <Button key="close" onClick={() => setDetailContract(null)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
        ]}
        width={1040}
        centered
      >
        {detailContract && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Overview Descriptions */}
            <Descriptions bordered size="small" column={3} style={{ borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              <Descriptions.Item label="Mã Hợp đồng">
                <Text strong>{detailContract.contractCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={contractStatusMeta[detailContract.status]?.color}>
                  {contractStatusMeta[detailContract.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng trọ">
                Phòng {detailContract.roomNumber} - {detailContract.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(detailContract.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {formatDate(detailContract.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Giá thuê phòng">
                <Text strong style={{ color: "#2563eb" }}>
                  {formatCurrency(detailContract.monthlyRent)} / tháng
                </Text>
              </Descriptions.Item>
              {detailContract.contentHash && (
                <Descriptions.Item label="Mã SHA-256" span={3}>
                  <Text copyable style={{ fontSize: 12, wordBreak: "break-all", fontFamily: "monospace" }}>
                    {detailContract.contentHash}
                  </Text>
                </Descriptions.Item>
              )}
              {detailContract.revisionRequests?.length ? (
                <Descriptions.Item label="Yêu cầu sửa gần nhất" span={3}>
                  <Text type="warning">
                    {detailContract.revisionRequests[detailContract.revisionRequests.length - 1]?.message || "-"}
                  </Text>
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            {/* Contract Full Document Preview Box */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8, color: "#334155" }}>
                📜 Văn Bản Hợp Đồng Điện Tử Trực Tuyến:
              </Text>
              <iframe
                title="contract-preview"
                srcDoc={contractHtml}
                style={{
                  width: "100%",
                  height: 480,
                  border: "1px solid #cbd5e1",
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
                }}
              />
            </div>

            {/* Electronic Signature Box (If pending signature) */}
            {detailContract.status === "pending_user_signature" && (
              <div className="my-contract-signing-card">
                <Title level={5} style={{ margin: "0 0 12px 0", color: "#1e293b" }}>
                  ✍️ Ký Tên Điện Tử Xác Nhận Thuê Phòng
                </Title>

                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}
                  >
                    Tôi xác nhận đã đọc kỹ, hiểu rõ và hoàn toàn đồng ý với toàn bộ các điều khoản ghi trong hợp đồng này.
                  </Checkbox>

                  <div>
                    <Text strong style={{ color: "#334155" }}>
                      Vẽ chữ ký của bạn vào khung bên dưới:
                    </Text>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                      className="my-contract-canvas"
                    />
                  </div>

                  <Space wrap justify="space-between" style={{ width: "100%" }}>
                    <Space wrap>
                      <Button
                        icon={<FormOutlined />}
                        onClick={createAutoSignature}
                        style={{ borderRadius: 8 }}
                      >
                        Tự động tạo chữ ký
                      </Button>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={clearSignature}
                        style={{ borderRadius: 8 }}
                      >
                        Xóa chữ ký vẽ lại
                      </Button>
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ℹ️ Chữ ký có giá trị pháp lý theo Luật Giao Dịch Điện Tử 2005.
                    </Text>
                  </Space>
                </Space>
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* Revision Request Modal */}
      <Modal
        title="Yêu Cầu Chỉnh Sửa Hợp Đồng"
        open={revisionModalOpen}
        onCancel={() => setRevisionModalOpen(false)}
        onOk={handleRequestRevision}
        confirmLoading={revisionSubmitting}
        okText="Gửi yêu cầu"
        cancelText="Đóng"
        centered
        okButtonProps={{ style: { borderRadius: 8, background: "#f59e0b" } }}
      >
        <Paragraph type="secondary" style={{ fontSize: 14 }}>
          Nhập thông tin hoặc các điều khoản bạn mong muốn chủ nhà điều chỉnh trước khi ký chính thức.
        </Paragraph>
        <Input.TextArea
          rows={5}
          value={revisionText}
          onChange={(e) => setRevisionText(e.target.value)}
          placeholder="Ví dụ: Tôi muốn điều chỉnh thời hạn thông báo trước khi chuyển đi từ 30 ngày xuống 15 ngày..."
          style={{ borderRadius: 10 }}
        />
      </Modal>
    </div>
  );
};

export default UserContractsPage;
