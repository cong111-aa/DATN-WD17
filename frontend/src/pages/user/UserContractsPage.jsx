import { FileProtectOutlined } from "@ant-design/icons";
import { Button, Descriptions, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const contractStatusMeta = {
  active: { color: "blue", label: "Đang hiệu lực" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const UserContractsPage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailContract, setDetailContract] = useState(null);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/contracts");
      setContracts(data || []);
    } catch (err) {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleOpenContractFile = (contract) => {
    if (!contract?.contractFile) {
      message.info("Hợp đồng này chưa tải file đính kèm.");
      return;
    }
    window.open(toImageUrl(contract.contractFile), "_blank");
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
          <Button size="small" onClick={() => setDetailContract(record)} style={{ borderRadius: 6 }}>
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={!record.contractFile}
            onClick={() => handleOpenContractFile(record)}
            style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}
          >
            File HĐ
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
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>← Về trang chủ</Button>
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
        title="Chi Tiết Hợp Đồng"
        open={Boolean(detailContract)}
        onCancel={() => setDetailContract(null)}
        footer={[
          <Button key="file" type="primary" onClick={() => handleOpenContractFile(detailContract)} style={{ background: "#0f766e", borderRadius: 6 }}>Mở File Hợp Đồng</Button>,
          <Button key="close" onClick={() => setDetailContract(null)} style={{ borderRadius: 6 }}>Đóng</Button>,
        ]}
        width={780}
      >
        {detailContract && (
          <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
            <Descriptions.Item label="Mã HĐ">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={contractStatusMeta[detailContract.status]?.color}>{contractStatusMeta[detailContract.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng">Phòng {detailContract.roomNumber} - {detailContract.roomName}</Descriptions.Item>
            <Descriptions.Item label="Đại diện thuê">{detailContract.tenantName}</Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailContract.startDate)}</Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">{formatDate(detailContract.endDate)}</Descriptions.Item>
            <Descriptions.Item label="Thời hạn">{detailContract.durationMonths} tháng</Descriptions.Item>
            <Descriptions.Item label="Số thành viên">{detailContract.memberCount} người</Descriptions.Item>
            <Descriptions.Item label="Tiền thuê">{formatCurrency(detailContract.monthlyRent)}/tháng</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{formatCurrency(detailContract.deposit)}</Descriptions.Item>
            <Descriptions.Item label="Điều khoản" span={2}>{detailContract.terms || "Theo quy định nhà trọ."}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserContractsPage;
