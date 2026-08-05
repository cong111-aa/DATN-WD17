import { CreditCardOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import http from "../../api/http";

const { Title, Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const roomRequestTypeMeta = {
  hold_deposit: { color: "gold", label: "Giữ phòng" },
  rent: { color: "blue", label: "Thuê phòng" },
};

const roomRequestStatusMeta = {
  pending: { color: "processing", label: "Chờ xác nhận" },
  approved: { color: "success", label: "Đã xác nhận" },
  rejected: { color: "error", label: "Từ chối" },
  cancelled: { color: "default", label: "Đã hủy" },
  expired: { color: "warning", label: "Hết hạn" },
};

const UserRoomRequestsPage = () => {
  const [roomRequests, setRoomRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoomRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/room-requests");
      setRoomRequests(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách yêu cầu giữ chỗ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomRequests();
  }, []);

  const handleCancelRoomRequest = async (request) => {
    try {
      await http.patch(`/me/room-requests/${request.id}/cancel`);
      message.success("Đã hủy yêu cầu thành công");
      fetchRoomRequests();
    } catch (error) {
      message.error(error.response?.data?.message || "Hủy yêu cầu thất bại");
    }
  };

  const roomRequestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "requestCode",
      key: "requestCode",
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => `Phòng ${record.roomNumber} - ${record.roomName}`,
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "requestType",
      key: "requestType",
      render: (t) => <Tag color={roomRequestTypeMeta[t]?.color}>{roomRequestTypeMeta[t]?.label || t}</Tag>,
    },
    {
      title: "Tiền cọc",
      dataIndex: "depositAmount",
      key: "depositAmount",
      render: (val) => <Text strong style={{ color: "#0f766e" }}>{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={roomRequestStatusMeta[s]?.color}>{roomRequestStatusMeta[s]?.label || s}</Tag>,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        record.status === "pending" && (
          <Popconfirm
            title="Hủy yêu cầu này?"
            okText="Hủy"
            cancelText="Bỏ qua"
            onConfirm={() => handleCancelRoomRequest(record)}
          >
            <Button size="small" danger style={{ borderRadius: 6 }}>
              Hủy yêu cầu
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#0284c7", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Yêu cầu Giữ phòng & Thuê phòng
            </Title>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={roomRequestColumns}
          dataSource={roomRequests}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Chưa có yêu cầu giữ chỗ / thuê phòng" }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>
    </div>
  );
};

export default UserRoomRequestsPage;
