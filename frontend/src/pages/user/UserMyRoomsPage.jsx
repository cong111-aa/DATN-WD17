import { HomeOutlined } from "@ant-design/icons";
import { Button, Descriptions, Empty, Image, Modal, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

const { Title, Text } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const roomRoleMeta = {
  member: { color: "green", label: "Thành viên" },
  representative: { color: "gold", label: "Đại diện phòng" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Đang thuê" },
  inactive: { color: "default", label: "Đã kết thúc" },
};

const UserMyRoomsPage = () => {
  const navigate = useNavigate();
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailTenancy, setDetailTenancy] = useState(null);

  const fetchTenancies = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/me/tenancies");
      setTenancies(data || []);
    } catch (err) {
      // Handled by interceptor
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
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 15 }}>Phòng {value || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.roomName || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roomRole",
      key: "roomRole",
      render: (role) => {
        const meta = roomRoleMeta[role] || roomRoleMeta.member;
        return <Tag color={meta.color} style={{ borderRadius: 4, fontWeight: 600 }}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngày vào ở",
      dataIndex: "moveInDate",
      key: "moveInDate",
      render: formatDate,
    },
    {
      title: "Giá thuê",
      dataIndex: "roomPrice",
      key: "roomPrice",
      render: (val) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = tenantStatusMeta[status] || tenantStatusMeta.inactive;
        return <Tag color={meta.color} style={{ borderRadius: 4 }}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button size="small" onClick={() => setDetailTenancy(record)} style={{ borderRadius: 6 }}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon"><HomeOutlined /></div>
            <span>Phòng trọ của tôi</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>← Về trang chủ</Button>
        </div>

        {tenancies.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 15 }}>Bạn chưa có phòng trọ đang thuê</Text>}>
              <Button type="primary" onClick={() => navigate("/")} style={{ background: "#0f766e", borderRadius: 8 }}>Tìm phòng ngay</Button>
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
      </div>

      <Modal
        title="Chi Tiết Phòng Đang Thuê"
        open={Boolean(detailTenancy)}
        onCancel={() => setDetailTenancy(null)}
        footer={[<Button key="close" onClick={() => setDetailTenancy(null)} style={{ borderRadius: 6 }}>Đóng</Button>]}
        width={800}
      >
        {detailTenancy && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {(detailTenancy.roomImages || []).length > 0 && (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailTenancy.roomImages.map((image) => (
                    <Image key={image} src={toImageUrl(image)} width={120} height={86} style={{ objectFit: "cover", borderRadius: 8 }} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            )}
            <Descriptions bordered size="small" column={2} style={{ background: "#f8fafc" }}>
              <Descriptions.Item label="Phòng">Phòng {detailTenancy.roomNumber} - {detailTenancy.roomName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={tenantStatusMeta[detailTenancy.status]?.color}>{tenantStatusMeta[detailTenancy.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={roomRoleMeta[detailTenancy.roomRole]?.color}>{roomRoleMeta[detailTenancy.roomRole]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày vào">{formatDate(detailTenancy.moveInDate)}</Descriptions.Item>
              <Descriptions.Item label="Tầng">{detailTenancy.roomFloor ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Diện tích">{detailTenancy.roomArea || 0} m²</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{detailTenancy.roomCapacity || 0} người</Descriptions.Item>
              <Descriptions.Item label="Giá thuê">{formatCurrency(detailTenancy.roomPrice)}</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatCurrency(detailTenancy.roomDeposit)}</Descriptions.Item>
              <Descriptions.Item label="Phí dịch vụ">{formatCurrency(detailTenancy.roomServiceFee)}</Descriptions.Item>
              <Descriptions.Item label="Giá điện">{formatCurrency(detailTenancy.roomElectricityPrice)}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">{formatCurrency(detailTenancy.roomWaterPrice)}</Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>{detailTenancy.roomDescription || "-"}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserMyRoomsPage;
