import { EyeOutlined, HomeOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Empty, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text } = Typography;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const roomRoleMeta = {
  member: { color: "green", label: "Thành viên" },
  representative: { color: "gold", label: "Đại diện phòng" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Đang thuê" },
  inactive: { color: "default", label: "Đã kết thúc" },
};

const UserTenanciesPage = () => {
  const navigate = useNavigate();
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailTenancy, setDetailTenancy] = useState(null);

  const fetchTenancies = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/tenancies");
      setTenancies(data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Không tải được danh sách phòng đang thuê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenancies();
  }, []);

  const tenancyColumns = [
    {
      title: "Phòng",
      key: "room",
      render: (_, record) => (
        <div>
          <Text strong style={{ color: "#0f766e", fontSize: 15 }}>
            Phòng {record.roomNumber}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {record.roomName}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={roomRoleMeta[role]?.color || "default"} style={{ borderRadius: 6, fontWeight: 600 }}>
          {roomRoleMeta[role]?.label || role}
        </Tag>
      ),
    },
    {
      title: "Ngày vào ở",
      dataIndex: "startDate",
      key: "startDate",
      render: formatDate,
    },
    {
      title: "Giá thuê",
      dataIndex: "rentPrice",
      key: "rentPrice",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={tenantStatusMeta[status]?.color || "default"} style={{ borderRadius: 6 }}>
          {tenantStatusMeta[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailTenancy(record)} style={{ borderRadius: 6 }}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <HomeOutlined style={{ color: "#0d9488", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Danh sách phòng của tôi
            </Title>
          </Space>
        }
      >
        {tenancies.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">Bạn chưa có phòng trọ đang thuê</Text>}>
              <Button type="primary" onClick={() => navigate("/")} style={{ background: "#0f766e", borderRadius: 8 }}>
                Tìm phòng ngay
              </Button>
            </Empty>
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={tenancyColumns}
            dataSource={tenancies}
            loading={loading}
            pagination={false}
            scroll={{ x: 900 }}
            style={{ borderRadius: 12, overflow: "hidden" }}
          />
        )}
      </Card

>

      {/* Tenancy Detail Modal */}
      <Modal
        title="Chi Tiết Phòng Đang Thuê"
        open={Boolean(detailTenancy)}
        onCancel={() => setDetailTenancy(null)}
        footer={[<Button key="close" onClick={() => setDetailTenancy(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={750}
      >
        {detailTenancy && (
          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 12 }}>
            <Descriptions.Item label="Tên phòng">{detailTenancy.roomName}</Descriptions.Item>
            <Descriptions.Item label="Số phòng">Phòng {detailTenancy.roomNumber}</Descriptions.Item>
            <Descriptions.Item label="Giá thuê">{formatCurrency(detailTenancy.rentPrice)}/tháng</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{formatCurrency(detailTenancy.depositAmount)}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Tag color={roomRoleMeta[detailTenancy.role]?.color}>{roomRoleMeta[detailTenancy.role]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">{formatDate(detailTenancy.startDate)}</Descriptions.Item>
            <Descriptions.Item label="Ký hợp đồng chính">
              {detailTenancy.isPrimaryContractor ? <Tag color="blue">Có</Tag> : <Tag color="default">Không</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{detailTenancy.notes || "Không có"}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserTenanciesPage;
