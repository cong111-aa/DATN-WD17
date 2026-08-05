import { EyeOutlined, FileProtectOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import http from "../../api/http";

const { Title, Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const contractStatusMeta = {
  active: { color: "blue", label: "Đang hiệu lực" },
  expired: { color: "default", label: "Hết hạn" },
  terminated: { color: "error", label: "Đã chấm dứt" },
};

const UserContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailContract, setDetailContract] = useState(null);

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

  const handleOpenContractFile = async (contract) => {
    try {
      const { data } = await http.get(`/me/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(error.response?.data?.message || "Không mở được file hợp đồng");
    }
  };

  const contractColumns = [
    {
      title: "Mã HĐ",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => `Phòng ${record.roomNumber} - ${record.roomName}`,
    },
    {
      title: "Thời hạn",
      key: "period",
      render: (_, record) => `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`,
    },
    {
      title: "Giá thuê",
      dataIndex: "rentPrice",
      key: "rentPrice",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Tiền cọc",
      dataIndex: "depositAmount",
      key: "depositAmount",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={contractStatusMeta[status]?.color || "default"} style={{ borderRadius: 6 }}>
          {contractStatusMeta[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailContract(record)} style={{ borderRadius: 6 }}>
            Chi tiết
          </Button>
          <Button size="small" type="primary" icon={<FileTextOutlined />} onClick={() => handleOpenContractFile(record)} style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}>
            Xem file HĐ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <FileProtectOutlined style={{ color: "#2563eb", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Quản lý hợp đồng thuê nhà
            </Title>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={contractColumns}
          dataSource={contracts}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Chưa có hợp đồng thuê phòng" }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>

      {/* Contract Detail Modal */}
      <Modal
        title="Chi Tiết Hợp Đồng Thuê Nhà"
        open={Boolean(detailContract)}
        onCancel={() => setDetailContract(null)}
        footer={[
          <Button key="file" type="primary" icon={<FileTextOutlined />} onClick={() => handleOpenContractFile(detailContract)} style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 6 }}>
            Mở File Hợp Đồng
          </Button>,
          <Button key="close" onClick={() => setDetailContract(null)} style={{ borderRadius: 6 }}>Đóng</Button>,
        ]}
        width={750}
      >
        {detailContract && (
          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 12 }}>
            <Descriptions.Item label="Mã hợp đồng">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={contractStatusMeta[detailContract.status]?.color}>{contractStatusMeta[detailContract.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng thuê">Phòng {detailContract.roomNumber} - {detailContract.roomName}</Descriptions.Item>
            <Descriptions.Item label="Giá thuê">{formatCurrency(detailContract.rentPrice)}/tháng</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{formatCurrency(detailContract.depositAmount)}</Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailContract.startDate)}</Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">{formatDate(detailContract.endDate)}</Descriptions.Item>
            <Descriptions.Item label="Ngày tính tiền điện">{detailContract.electricityStartDay ? `Ngày ${detailContract.electricityStartDay}` : "-"}</Descriptions.Item>
            <Descriptions.Item label="Ngày tính tiền nước">{detailContract.waterStartDay ? `Ngày ${detailContract.waterStartDay}` : "-"}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{detailContract.notes || "Không có"}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserContractsPage;
