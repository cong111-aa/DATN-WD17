import { ClearOutlined, FileProtectOutlined, FormOutlined } from "@ant-design/icons";
import { Button, Checkbox, Descriptions, Input, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Paragraph, Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const contractStatusMeta = {
  pending_user_signature: { color: "gold", label: "Chờ khách ký" },
  revision_requested: { color: "orange", label: "Đang yêu cầu sửa" },
  active: { color: "blue", label: "Đang hiệu lực" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const UserContractsPage = () => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const navigate = useNavigate();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [contractHtml, setContractHtml] = useState("");
  const [contracts, setContracts] = useState([]);
  const [detailContract, setDetailContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [signatureMethod, setSignatureMethod] = useState("drawn");
  const [signing, setSigning] = useState(false);

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
    ctx.strokeStyle = "#111827";
  };

  useEffect(() => {
    if (detailContract) {
      setTimeout(prepareCanvas, 80);
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
    ctx.fillStyle = "#111827";
    ctx.font = "42px cursive";
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
      message.success("Đã ký hợp đồng thành công");
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
      message.success("Đã gửi yêu cầu chỉnh sửa hợp đồng");
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

  const contractColumns = [
    {
      title: "Mã HĐ",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#0f766e" }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phòng {record.roomNumber || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Thời hạn",
      key: "period",
      render: (_, record) => `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`,
    },
    {
      title: "Tiền thuê",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      render: formatCurrency,
    },
    {
      title: "Tiền cọc",
      dataIndex: "deposit",
      key: "deposit",
      render: formatCurrency,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = contractStatusMeta[status] || contractStatusMeta.expired;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openContract(record)} style={{ borderRadius: 6 }}>
            Xem chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => openContractInNewTab(record)}
            style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}
          >
            Mở file
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon"><FileProtectOutlined /></div>
            <span>Hợp đồng thuê phòng</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>Về trang chủ</Button>
        </div>

        <Table
          rowKey="id"
          columns={contractColumns}
          dataSource={contracts}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Chưa có hợp đồng thuê phòng" }}
        />
      </div>

      <Modal
        title="Xem và ký hợp đồng"
        open={Boolean(detailContract)}
        onCancel={() => setDetailContract(null)}
        footer={[
          <Button key="open" onClick={() => openContractInNewTab(detailContract)} style={{ borderRadius: 6 }}>
            Mở file
          </Button>,
          detailContract?.status === "pending_user_signature" ? (
            <Button key="revision" onClick={() => setRevisionModalOpen(true)} style={{ borderRadius: 6 }}>
              Yêu cầu chỉnh sửa
            </Button>
          ) : null,
          detailContract?.status === "pending_user_signature" ? (
            <Button
              key="sign"
              type="primary"
              loading={signing}
              onClick={handleSignContract}
              style={{ background: "#0f766e", borderRadius: 6 }}
            >
              Xác nhận ký hợp đồng
            </Button>
          ) : null,
          <Button key="close" onClick={() => setDetailContract(null)} style={{ borderRadius: 6 }}>Đóng</Button>,
        ]}
        width={1080}
      >
        {detailContract && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={3} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Mã HĐ">{detailContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={contractStatusMeta[detailContract.status]?.color}>
                  {contractStatusMeta[detailContract.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">Phòng {detailContract.roomNumber} - {detailContract.roomName}</Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailContract.startDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">{formatDate(detailContract.endDate)}</Descriptions.Item>
              <Descriptions.Item label="Tiền thuê">{formatCurrency(detailContract.monthlyRent)}/tháng</Descriptions.Item>
              {detailContract.contentHash ? (
                <Descriptions.Item label="Hash SHA-256" span={3}>
                  <Text copyable style={{ wordBreak: "break-all" }}>{detailContract.contentHash}</Text>
                </Descriptions.Item>
              ) : null}
              {detailContract.revisionRequests?.length ? (
                <Descriptions.Item label="Yêu cầu chỉnh sửa gần nhất" span={3}>
                  {detailContract.revisionRequests[detailContract.revisionRequests.length - 1]?.message || "-"}
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <iframe
              title="contract-preview"
              srcDoc={contractHtml}
              style={{ width: "100%", height: 520, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
            />

            {detailContract.status === "pending_user_signature" ? (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#ffffff" }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Checkbox checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)}>
                    Tôi đã đọc và đồng ý với toàn bộ điều khoản hợp đồng.
                  </Checkbox>
                  <div>
                    <Text strong>Chữ ký khách thuê</Text>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                      style={{
                        width: "100%",
                        height: 150,
                        border: "1px dashed #94a3b8",
                        borderRadius: 8,
                        display: "block",
                        marginTop: 8,
                        touchAction: "none",
                      }}
                    />
                  </div>
                  <Space wrap>
                    <Button icon={<FormOutlined />} onClick={createAutoSignature} style={{ borderRadius: 6 }}>
                      Tự động tạo chữ ký
                    </Button>
                    <Button icon={<ClearOutlined />} onClick={clearSignature} style={{ borderRadius: 6 }}>
                      Xóa chữ ký
                    </Button>
                  </Space>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Nếu không đồng ý điều khoản, hãy bấm yêu cầu chỉnh sửa trước khi ký. Sau khi ký, hệ thống sẽ khóa nội dung hợp đồng.
                  </Paragraph>
                </Space>
              </div>
            ) : null}
          </Space>
        )}
      </Modal>

      <Modal
        title="Yêu cầu chỉnh sửa hợp đồng"
        open={revisionModalOpen}
        onCancel={() => setRevisionModalOpen(false)}
        onOk={handleRequestRevision}
        confirmLoading={revisionSubmitting}
        okText="Gửi yêu cầu"
        cancelText="Đóng"
      >
        <Typography.Paragraph type="secondary">
          Ghi rõ điều khoản hoặc nội dung bạn muốn chủ trọ chỉnh sửa trước khi ký hợp đồng.
        </Typography.Paragraph>
        <Input.TextArea
          rows={5}
          value={revisionText}
          onChange={(event) => setRevisionText(event.target.value)}
          placeholder="VD: Tôi muốn điều chỉnh điều khoản báo trước khi trả phòng từ 30 ngày xuống 15 ngày..."
        />
      </Modal>
    </div>
  );
};

export default UserContractsPage;
