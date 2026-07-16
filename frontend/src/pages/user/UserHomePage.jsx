import {
  DeleteOutlined,
  EditOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  ReloadOutlined,
  ToolOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  Layout,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");
const formatResolvedDate = (value) => (value ? formatDate(value) : "Chua xu ly");

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

const invoiceStatusMeta = {
  unpaid: { color: "default", label: "Chua thanh toan" },
  partial: { color: "warning", label: "Thanh toan mot phan" },
  paid: { color: "success", label: "Da thanh toan" },
  overdue: { color: "error", label: "Qua han" },
};

const repairPriorityOptions = [
  { label: "Thap", value: "low" },
  { label: "Trung binh", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khan cap", value: "urgent" },
];

const repairPriorityMeta = {
  low: { color: "default", label: "Thap" },
  medium: { color: "blue", label: "Trung binh" },
  high: { color: "orange", label: "Cao" },
  urgent: { color: "error", label: "Khan cap" },
};

const repairStatusMeta = {
  pending: { color: "warning", label: "Cho xu ly" },
  processing: { color: "processing", label: "Dang xu ly" },
  resolved: { color: "success", label: "Da xu ly" },
  cancelled: { color: "default", label: "Da huy" },
};

const repairStatusOptions = [
  { label: "Cho xu ly", value: "pending" },
  { label: "Dang xu ly", value: "processing" },
  { label: "Da xu ly", value: "resolved" },
  { label: "Da huy", value: "cancelled" },
];

const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toUploadedImageUrls = (fileList = []) =>
  fileList.flatMap((file) => file.response?.urls || (file.rawUrl ? [file.rawUrl] : file.url ? [file.url] : []));

const toRepairImageFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    rawUrl: url,
    status: "done",
    url: toImageUrl(url),
  }));

const UserHomePage = () => {
  const [form] = Form.useForm();
  const [repairForm] = Form.useForm();
  const { logout, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [tenancies, setTenancies] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [repairImageFileList, setRepairImageFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [detailTenancy, setDetailTenancy] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [detailRepairRequest, setDetailRepairRequest] = useState(null);
  const [editingRepairRequest, setEditingRepairRequest] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const activeTenancies = useMemo(
    () => tenancies.filter((tenancy) => tenancy.status === "active"),
    [tenancies]
  );

  const activeRoomOptions = useMemo(
    () =>
      activeTenancies.map((tenancy) => ({
        label: `${tenancy.roomNumber} - ${tenancy.roomName}`,
        value: tenancy.room,
      })),
    [activeTenancies]
  );

  useEffect(() => {
    form.setFieldsValue(user);
  }, [form, user]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      const [
        { data: tenancyData },
        { data: contractData },
        { data: invoiceData },
        { data: repairRequestData },
      ] = await Promise.all([
        http.get("/me/tenancies"),
        http.get("/me/contracts"),
        http.get("/me/invoices"),
        http.get("/me/repair-requests"),
      ]);

      setTenancies(tenancyData);
      setContracts(contractData);
      setInvoices(invoiceData);
      setRepairRequests(repairRequestData);
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

  const handleViewInvoice = async (invoice) => {
    try {
      const { data } = await http.get(`/me/invoices/${invoice.id}`);
      setDetailInvoice(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet hoa don");
    }
  };

  const openRepairModal = () => {
    setEditingRepairRequest(null);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      priority: "medium",
      room: activeRoomOptions[0]?.value,
    });
    setRepairImageFileList([]);
    setRepairModalOpen(true);
  };

  const openEditRepairModal = (request) => {
    setEditingRepairRequest(request);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      description: request.description,
      priority: request.priority,
      requestedResolveDate: request.requestedResolveDate
        ? dayjs(request.requestedResolveDate)
        : undefined,
      room: request.room,
      status: request.status,
      title: request.title,
    });
    setRepairImageFileList(toRepairImageFileList(request.images));
    setRepairModalOpen(true);
  };

  const closeRepairModal = () => {
    setRepairModalOpen(false);
    setEditingRepairRequest(null);
    setRepairImageFileList([]);
    repairForm.resetFields();
  };

  const handleRepairImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/repair-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload anh su co that bai");
      onError(error);
    }
  };

  const handleCreateRepairRequest = async (values) => {
    setRepairSubmitting(true);

    try {
      const payload = {
        ...values,
        images: toUploadedImageUrls(repairImageFileList),
        requestedResolveDate: values.requestedResolveDate
          ? values.requestedResolveDate.toISOString()
          : null,
      };

      if (editingRepairRequest) {
        await http.put(`/me/repair-requests/${editingRepairRequest.id}`, payload);
        message.success("Da cap nhat su co");
      } else {
        await http.post("/me/repair-requests", payload);
        message.success("Da gui bao cao su co");
      }

      closeRepairModal();
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Gui bao cao su co that bai");
    } finally {
      setRepairSubmitting(false);
    }
  };

  const handleViewRepairRequest = async (request) => {
    try {
      const { data } = await http.get(`/me/repair-requests/${request.id}`);
      setDetailRepairRequest(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet su co");
    }
  };

  const handleDeleteRepairRequest = async (request) => {
    try {
      await http.delete(`/me/repair-requests/${request.id}`);
      message.success("Da xoa su co");
      fetchUserData();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa su co that bai");
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

  const invoiceColumns = [
    {
      title: "Ma hoa don",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
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
      title: "Ky hoa don",
      key: "period",
      render: (_, record) => `${record.month}/${record.year}`,
    },
    {
      title: "Dien/Nuoc",
      key: "utilities",
      render: (_, record) => `${record.electricityUsage ?? 0} so / ${record.waterUsage ?? 0} khoi`,
    },
    {
      title: "Tong tien",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
    },
    {
      title: "Da thanh toan",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: formatCurrency,
    },
    {
      title: "Con lai",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (value) => (
        <Typography.Text type={Number(value || 0) > 0 ? "danger" : "success"} strong>
          {formatCurrency(value)}
        </Typography.Text>
      ),
    },
    {
      title: "Han TT",
      dataIndex: "dueDate",
      key: "dueDate",
      render: formatDate,
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = invoiceStatusMeta[status] || invoiceStatusMeta.unpaid;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tac",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => handleViewInvoice(record)}>
          Chi tiet
        </Button>
      ),
    },
  ];

  const repairRequestColumns = [
    {
      title: "Su co",
      dataIndex: "title",
      key: "title",
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
      title: "Muc do",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const meta = repairPriorityMeta[priority] || repairPriorityMeta.medium;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trang thai",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta = repairStatusMeta[status] || repairStatusMeta.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Ngay bao",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Ngay muon xu ly",
      dataIndex: "requestedResolveDate",
      key: "requestedResolveDate",
      render: formatDate,
    },
    {
      title: "Ngay xu ly",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: formatResolvedDate,
    },
    {
      title: "Thao tac",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button onClick={() => handleViewRepairRequest(record)}>
            Chi tiet
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditRepairModal(record)}
            disabled={record.status !== "pending"}
          >
            Sua
          </Button>
          <Popconfirm
            title="Xoa su co nay?"
            okText="Xoa"
            cancelText="Huy"
            onConfirm={() => handleDeleteRepairRequest(record)}
            disabled={record.status !== "pending"}
          >
            <Button danger icon={<DeleteOutlined />} disabled={record.status !== "pending"}>
              Xoa
            </Button>
          </Popconfirm>
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
                Theo doi phong dang thue, hop dong, hoa don va thong tin tai khoan.
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
                key: "invoices",
                icon: <FileTextOutlined />,
                label: "Hoa don",
                children: (
                  <Card>
                    <Table
                      rowKey="id"
                      columns={invoiceColumns}
                      dataSource={invoices}
                      loading={loading}
                      pagination={{ pageSize: 6 }}
                      scroll={{ x: 1200 }}
                      locale={{ emptyText: "Chua co hoa don" }}
                    />
                  </Card>
                ),
              },
              {
                key: "repair-requests",
                icon: <ToolOutlined />,
                label: "Su co",
                children: (
                  <Space direction="vertical" size={16} className="page-stack">
                    <div className="page-toolbar">
                      <Typography.Text type="secondary">
                        Bao cao su co phong dang thue va theo doi trang thai xu ly.
                      </Typography.Text>
                      <Button type="primary" onClick={openRepairModal} disabled={activeRoomOptions.length === 0}>
                        Bao su co
                      </Button>
                    </div>
                    <Card>
                      <Table
                        rowKey="id"
                        columns={repairRequestColumns}
                        dataSource={repairRequests}
                        loading={loading}
                        pagination={{ pageSize: 6 }}
                        scroll={{ x: 900 }}
                        locale={{ emptyText: "Chua co su co" }}
                      />
                    </Card>
                  </Space>
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

        <Modal
          title="Chi tiet hoa don"
          open={Boolean(detailInvoice)}
          onCancel={() => setDetailInvoice(null)}
          footer={[
            <Button key="close" onClick={() => setDetailInvoice(null)}>
              Dong
            </Button>,
          ]}
          width={860}
        >
          {detailInvoice && (
            <Space direction="vertical" size={16} className="page-stack">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Ma hoa don">{detailInvoice.invoiceCode}</Descriptions.Item>
                <Descriptions.Item label="Trang thai">
                  <Tag color={invoiceStatusMeta[detailInvoice.status]?.color}>
                    {invoiceStatusMeta[detailInvoice.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phong">
                  {detailInvoice.roomNumber} - {detailInvoice.roomName}
                </Descriptions.Item>
                <Descriptions.Item label="Ky hoa don">
                  {detailInvoice.month}/{detailInvoice.year}
                </Descriptions.Item>
                <Descriptions.Item label="Nguoi thanh toan">{detailInvoice.tenantName}</Descriptions.Item>
                <Descriptions.Item label="Lien he">
                  {detailInvoice.tenantPhone || detailInvoice.tenantEmail || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Hop dong">{detailInvoice.contractCode || "-"}</Descriptions.Item>
                <Descriptions.Item label="Han thanh toan">{formatDate(detailInvoice.dueDate)}</Descriptions.Item>
                <Descriptions.Item label="Ngay tao">{formatDate(detailInvoice.createdAt)}</Descriptions.Item>
              </Descriptions>

              <Descriptions title="Chi so dien nuoc" bordered size="small" column={2}>
                <Descriptions.Item label="Dien cu">{detailInvoice.electricityOld ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Dien moi">{detailInvoice.electricityNew ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Dien tieu thu">{detailInvoice.electricityUsage ?? 0} so</Descriptions.Item>
                <Descriptions.Item label="Tien dien">{formatCurrency(detailInvoice.electricityAmount)}</Descriptions.Item>
                <Descriptions.Item label="Nuoc cu">{detailInvoice.waterOld ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Nuoc moi">{detailInvoice.waterNew ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Nuoc tieu thu">{detailInvoice.waterUsage ?? 0} khoi</Descriptions.Item>
                <Descriptions.Item label="Tien nuoc">{formatCurrency(detailInvoice.waterAmount)}</Descriptions.Item>
              </Descriptions>

              <Descriptions title="Tong ket chi phi" bordered size="small" column={2}>
                <Descriptions.Item label="Tien phong">{formatCurrency(detailInvoice.rentAmount)}</Descriptions.Item>
                <Descriptions.Item label="Phi dich vu">{formatCurrency(detailInvoice.serviceAmount)}</Descriptions.Item>
                <Descriptions.Item label="Chi phi khac">{formatCurrency(detailInvoice.otherAmount)}</Descriptions.Item>
                <Descriptions.Item label="Giam tru">{formatCurrency(detailInvoice.discountAmount)}</Descriptions.Item>
                <Descriptions.Item label="Tong tien">
                  <Typography.Text strong>{formatCurrency(detailInvoice.totalAmount)}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Da thanh toan">{formatCurrency(detailInvoice.paidAmount)}</Descriptions.Item>
                <Descriptions.Item label="Con lai">
                  <Typography.Text type={detailInvoice.remainingAmount > 0 ? "danger" : "success"} strong>
                    {formatCurrency(detailInvoice.remainingAmount)}
                  </Typography.Text>
                </Descriptions.Item>
              </Descriptions>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Ghi chu">{detailInvoice.note || "-"}</Descriptions.Item>
              </Descriptions>
            </Space>
          )}
        </Modal>

        <Modal
          title={editingRepairRequest ? "Sua su co" : "Bao cao su co"}
          open={repairModalOpen}
          onCancel={closeRepairModal}
          onOk={() => repairForm.submit()}
          confirmLoading={repairSubmitting}
          okText={editingRepairRequest ? "Luu" : "Gui bao cao"}
          cancelText="Huy"
          width={720}
        >
          <Form form={repairForm} layout="vertical" onFinish={handleCreateRepairRequest}>
            <div className="form-grid">
              <Form.Item name="room" label="Phong" rules={[{ required: true }]}>
                <Select options={activeRoomOptions} placeholder="Chon phong dang thue" />
              </Form.Item>
              <Form.Item name="priority" label="Muc do" rules={[{ required: true }]}>
                <Select options={repairPriorityOptions} />
              </Form.Item>
              <Form.Item name="requestedResolveDate" label="Ngay mong muon xu ly">
                <DatePicker className="full-width-input" format="DD/MM/YYYY" />
              </Form.Item>
              {editingRepairRequest ? (
                <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
                  <Select options={repairStatusOptions} />
                </Form.Item>
              ) : null}
            </div>
            <Form.Item name="title" label="Tieu de" rules={[{ required: true }]}>
              <Input placeholder="VD: Dieu hoa khong lanh" />
            </Form.Item>
            <Form.Item name="description" label="Mo ta su co" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="Anh su co">
              <Upload
                accept="image/png,image/jpeg,image/webp"
                customRequest={handleRepairImageUpload}
                fileList={repairImageFileList}
                listType="picture-card"
                multiple
                onChange={({ fileList }) => setRepairImageFileList(fileList)}
              >
                {repairImageFileList.length >= 10 ? null : (
                  <button type="button" className="upload-card-button">
                    <UploadOutlined />
                    <span>Tai anh</span>
                  </button>
                )}
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Chi tiet su co"
          open={Boolean(detailRepairRequest)}
          onCancel={() => setDetailRepairRequest(null)}
          footer={[
            <Button key="close" onClick={() => setDetailRepairRequest(null)}>
              Dong
            </Button>,
          ]}
          width={820}
        >
          {detailRepairRequest && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tieu de" span={2}>
                {detailRepairRequest.title}
              </Descriptions.Item>
              <Descriptions.Item label="Phong">
                {detailRepairRequest.roomNumber} - {detailRepairRequest.roomName}
              </Descriptions.Item>
              <Descriptions.Item label="Nguoi tao">{detailRepairRequest.createdByName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Muc do">
                <Tag color={repairPriorityMeta[detailRepairRequest.priority]?.color}>
                  {repairPriorityMeta[detailRepairRequest.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={repairStatusMeta[detailRepairRequest.status]?.color}>
                  {repairStatusMeta[detailRepairRequest.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngay bao">{formatDate(detailRepairRequest.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngay mong muon xu ly">
                {formatDate(detailRepairRequest.requestedResolveDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngay xu ly">{formatResolvedDate(detailRepairRequest.resolvedAt)}</Descriptions.Item>
              <Descriptions.Item label="Mo ta" span={2}>
                {detailRepairRequest.description}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chu admin" span={2}>
                {detailRepairRequest.adminNote || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Anh su co" span={2}>
                {(detailRepairRequest.images || []).length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {detailRepairRequest.images.map((image) => (
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
                ) : (
                  "-"
                )}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserHomePage;
