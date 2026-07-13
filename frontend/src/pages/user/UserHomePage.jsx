import {
  FileProtectOutlined,
  HomeOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const roomRoleMeta = {
  member: { color: "green", label: "Thanh vien" },
  representative: { color: "gold", label: "Dai dien phong" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Dang thue" },
  inactive: { color: "default", label: "Da ket thuc" },
};

const contractStatusMeta = {
  active: { color: "blue", label: "Dang hieu luc" },
  expired: { color: "default", label: "Het han" },
  terminated: { color: "error", label: "Da cham dut" },
};

const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const UserHomePage = () => {
  const [form] = Form.useForm();
  const { logout, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [tenancies, setTenancies] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailTenancy, setDetailTenancy] = useState(null);
  const [detailContract, setDetailContract] = useState(null);

  const activeTenancies = useMemo(
    () => tenancies.filter((tenancy) => tenancy.status === "active"),
    [tenancies]
  );

  useEffect(() => {
    form.setFieldsValue(user);
  }, [form, user]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      const [{ data: tenancyData }, { data: contractData }] = await Promise.all([
        http.get("/me/tenancies"),
        http.get("/me/contracts"),
      ]);

      setTenancies(tenancyData);
      setContracts(contractData);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc du lieu nguoi dung");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleUpdate = async (values) => {
    try {
      await http.put("/auth/profile", values);
      await refreshProfile();
      message.success("Da cap nhat thong tin");
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat that bai");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
      message.error(error.response?.data?.message || "Khong mo duoc hop dong");
    }
  };

  const tenancyColumns = [
    {
      title: "Phong",
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value || "-"}</Typography.Text>
          <Typography.Text type="secondary">{record.roomName || "-"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Vai tro",
      dataIndex: "roomRole",
      key: "roomRole",
      render: (role) => {
        const meta = roomRoleMeta[role] || roomRoleMeta.member;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngay vao",
      dataIndex: "moveInDate",
      key: "moveInDate",
      render: formatDate,
    },
    {
      title: "Gia phong",
      dataIndex: "roomPrice",
      key: "roomPrice",
      render: formatCurrency,
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = tenantStatusMeta[status] || tenantStatusMeta.inactive;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tac",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => setDetailTenancy(record)}>
          Chi tiet
        </Button>
      ),
    },
  ];

  const contractColumns = [
    {
      title: "Ma hop dong",
      dataIndex: "contractCode",
      key: "contractCode",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.roomNumber || "-"} - {record.roomName || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Thoi han",
      key: "period",
      render: (_, record) => `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`,
    },
    {
      title: "Tien thue",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      render: formatCurrency,
    },
    {
      title: "Tien coc",
      dataIndex: "deposit",
      key: "deposit",
      render: formatCurrency,
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = contractStatusMeta[status] || contractStatusMeta.expired;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tac",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button onClick={() => setDetailContract(record)}>Chi tiet</Button>
          <Button type="primary" onClick={() => handleOpenContractFile(record)}>
            Xem file
          </Button>
        </Space>
      ),
    },
  ];

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
            <div className="page-title">
              <Typography.Title level={3}>Trang cua toi</Typography.Title>
              <Typography.Text type="secondary">
                Theo doi phong dang thue, hop dong va thong tin tai khoan.
              </Typography.Text>
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchUserData} loading={loading}>
              Tai lai
            </Button>
          </div>

          <Tabs
            defaultActiveKey="rooms"
            items={[
              {
                key: "rooms",
                icon: <HomeOutlined />,
                label: "Phong cua toi",
                children: (
                  <Space direction="vertical" size={16} className="page-stack">
                    {activeTenancies.length === 0 ? (
                      <Card>
                        <Empty description="Ban chua co phong dang thue" />
                      </Card>
                    ) : (
                      <Card>
                        <Table
                          rowKey="id"
                          columns={tenancyColumns}
                          dataSource={tenancies}
                          loading={loading}
                          pagination={false}
                          scroll={{ x: 900 }}
                        />
                      </Card>
                    )}
                  </Space>
                ),
              },
              {
                key: "contracts",
                icon: <FileProtectOutlined />,
                label: "Hop dong",
                children: (
                  <Card>
                    <Table
                      rowKey="id"
                      columns={contractColumns}
                      dataSource={contracts}
                      loading={loading}
                      pagination={{ pageSize: 6 }}
                      scroll={{ x: 1000 }}
                      locale={{ emptyText: "Chua co hop dong" }}
                    />
                  </Card>
                ),
              },
              {
                key: "profile",
                icon: <UserOutlined />,
                label: "Tai khoan",
                children: (
                  <Card>
                    <Typography.Title level={4}>Thong tin ca nhan</Typography.Title>
                    <Typography.Paragraph type="secondary">
                      Cap nhat thong tin lien he va CCCD/CMND cua ban.
                    </Typography.Paragraph>
                    <Form form={form} layout="vertical" onFinish={handleUpdate}>
                      <div className="form-grid">
                        <Form.Item name="name" label="Ho ten" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item name="email" label="Email">
                          <Input disabled />
                        </Form.Item>
                        <Form.Item name="phone" label="So dien thoai">
                          <Input />
                        </Form.Item>
                        <Form.Item name="identityNumber" label="So CCCD/CMND">
                          <Input />
                        </Form.Item>
                        <Form.Item name="identityFrontImage" label="Anh mat truoc CCCD">
                          <Input placeholder="URL hoac duong dan anh" />
                        </Form.Item>
                        <Form.Item name="identityBackImage" label="Anh mat sau CCCD">
                          <Input placeholder="URL hoac duong dan anh" />
                        </Form.Item>
                      </div>
                      <Form.Item name="address" label="Dia chi">
                        <Input.TextArea rows={3} />
                      </Form.Item>
                      <Form.Item name="password" label="Mat khau moi">
                        <Input.Password placeholder="De trong neu khong doi" />
                      </Form.Item>
                      <Button type="primary" htmlType="submit">
                        Luu thong tin
                      </Button>
                    </Form>
                  </Card>
                ),
              },
            ]}
          />
        </Space>

        <Modal
          title="Chi tiet phong cua toi"
          open={Boolean(detailTenancy)}
          onCancel={() => setDetailTenancy(null)}
          footer={[
            <Button key="close" onClick={() => setDetailTenancy(null)}>
              Dong
            </Button>,
          ]}
          width={840}
        >
          {detailTenancy && (
            <Space direction="vertical" size={16} className="page-stack">
              {(detailTenancy.roomImages || []).length > 0 && (
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailTenancy.roomImages.map((image) => (
                      <Image
                        key={image}
                        src={toImageUrl(image)}
                        width={120}
                        height={86}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              )}
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Phong">
                  {detailTenancy.roomNumber} - {detailTenancy.roomName}
                </Descriptions.Item>
                <Descriptions.Item label="Trang thai">
                  <Tag color={tenantStatusMeta[detailTenancy.status]?.color}>
                    {tenantStatusMeta[detailTenancy.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Vai tro">
                  <Tag color={roomRoleMeta[detailTenancy.roomRole]?.color}>
                    {roomRoleMeta[detailTenancy.roomRole]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngay vao">{formatDate(detailTenancy.moveInDate)}</Descriptions.Item>
                <Descriptions.Item label="Tang">{detailTenancy.roomFloor ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Dien tich">{detailTenancy.roomArea || 0} m2</Descriptions.Item>
                <Descriptions.Item label="Suc chua">{detailTenancy.roomCapacity || 0}</Descriptions.Item>
                <Descriptions.Item label="Gia thue">{formatCurrency(detailTenancy.roomPrice)}</Descriptions.Item>
                <Descriptions.Item label="Tien coc">{formatCurrency(detailTenancy.roomDeposit)}</Descriptions.Item>
                <Descriptions.Item label="Phi dich vu">{formatCurrency(detailTenancy.roomServiceFee)}</Descriptions.Item>
                <Descriptions.Item label="Gia dien">{formatCurrency(detailTenancy.roomElectricityPrice)}</Descriptions.Item>
                <Descriptions.Item label="Gia nuoc">{formatCurrency(detailTenancy.roomWaterPrice)}</Descriptions.Item>
                <Descriptions.Item label="Mo ta" span={2}>
                  {detailTenancy.roomDescription || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          )}
        </Modal>

        <Modal
          title="Chi tiet hop dong"
          open={Boolean(detailContract)}
          onCancel={() => setDetailContract(null)}
          footer={[
            <Button key="file" type="primary" onClick={() => handleOpenContractFile(detailContract)}>
              Xem file
            </Button>,
            <Button key="close" onClick={() => setDetailContract(null)}>
              Dong
            </Button>,
          ]}
          width={820}
        >
          {detailContract && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ma hop dong">{detailContract.contractCode}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={contractStatusMeta[detailContract.status]?.color}>
                  {contractStatusMeta[detailContract.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phong">
                {detailContract.roomNumber} - {detailContract.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Nguoi dai dien">{detailContract.tenantName}</Descriptions.Item>
              <Descriptions.Item label="Ngay bat dau">{formatDate(detailContract.startDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngay ket thuc">{formatDate(detailContract.endDate)}</Descriptions.Item>
              <Descriptions.Item label="Thoi han">{detailContract.durationMonths} thang</Descriptions.Item>
              <Descriptions.Item label="So thanh vien">{detailContract.memberCount}</Descriptions.Item>
              <Descriptions.Item label="Tien thue">{formatCurrency(detailContract.monthlyRent)}</Descriptions.Item>
              <Descriptions.Item label="Tien coc">{formatCurrency(detailContract.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Dieu khoan" span={2}>
                {detailContract.terms || "-"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserHomePage;
