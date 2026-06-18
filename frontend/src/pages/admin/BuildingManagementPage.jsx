import {
  BankOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  status: "active",
  totalFloors: 1,
};

const statusOptions = [
  { label: "Hoat dong", value: "active" },
  { label: "Tam ngung", value: "inactive" },
];

const panelStyle = {
  border: "1px solid #eef1f7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const heroStyle = {
  ...panelStyle,
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #0f766e 0%, #0891b2 48%, #2563eb 100%)",
  backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto",
};

const statIconStyle = {
  alignItems: "center",
  borderRadius: 8,
  display: "flex",
  height: 42,
  justifyContent: "center",
  width: 42,
};

const toolbarInputStyle = {
  borderRadius: 8,
  height: 40,
};

const mutedTextStyle = {
  color: "#64748b",
};

const sectionTitleStyle = {
  color: "#0f172a",
  fontSize: 16,
};

const BuildingManagementPage = () => {
  const [form] = Form.useForm();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const buildingStats = useMemo(() => {
    const active = buildings.filter((item) => item.status === "active").length;
    const inactive = buildings.filter((item) => item.status === "inactive").length;
    const totalFloors = buildings.reduce((sum, item) => sum + Number(item.totalFloors || 0), 0);

    return {
      active,
      inactive,
      total: buildings.length,
      totalFloors,
    };
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return buildings.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        [item.name, item.code, item.address, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [buildings, searchText, statusFilter]);

  const fetchBuildings = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/buildings");
      setBuildings(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach toa nha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openCreateModal = () => {
    setEditingBuilding(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingBuilding(record);
    form.resetFields();
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBuilding(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (editingBuilding) {
        await http.put(`/buildings/${editingBuilding.id}`, values);
        message.success("Da cap nhat toa nha");
      } else {
        await http.post("/buildings", values);
        message.success("Da tao toa nha");
      }

      closeModal();
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu toa nha that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "active" ? "inactive" : "active";

    try {
      await http.patch(`/buildings/${record.id}/status`, { status: nextStatus });
      message.success(nextStatus === "active" ? "Da mo hoat dong toa nha" : "Da tam ngung toa nha");
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Cap nhat trang thai that bai");
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/buildings/${record.id}`);
      message.success("Da xoa toa nha");
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa toa nha that bai");
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const columns = useMemo(
    () => [
      {
        title: "TOA NHA",
        dataIndex: "name",
        key: "name",
        width: 280,
        render: (value, record) => (
          <Space size={12}>
            <Avatar
              size={42}
              style={{
                background:
                  record.status === "active"
                    ? "linear-gradient(135deg, #0f766e, #16a34a)"
                    : "linear-gradient(135deg, #64748b, #94a3b8)",
                color: "#ffffff",
                fontWeight: 700,
              }}
              icon={<BankOutlined />}
            />
            <div>
              <Typography.Text strong style={{ color: "#334155" }}>
                {value || "Chua cap nhat"}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.code || "Chua co ma toa nha"}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: "MA TOA NHA",
        dataIndex: "code",
        key: "code",
        width: 150,
        render: (value) => (
          <Tag
            bordered={false}
            style={{
              background: "#e0f2fe",
              borderRadius: 5,
              color: "#0369a1",
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {value || "--"}
          </Tag>
        ),
      },
      {
        title: "DIA CHI",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
        render: (value) => (
          <Space size={8}>
            <EnvironmentOutlined style={{ color: "#64748b" }} />
            <Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "SO TANG",
        dataIndex: "totalFloors",
        key: "totalFloors",
        align: "center",
        width: 120,
        render: (value) => (
          <Typography.Text strong style={{ color: "#334155" }}>
            {value || 0}
          </Typography.Text>
        ),
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (status) => (
          <Tag
            bordered={false}
            icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />}
            style={{
              background: status === "active" ? "#dcfce7" : "#f1f5f9",
              borderRadius: 5,
              color: status === "active" ? "#15803d" : "#64748b",
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {status === "active" ? "Hoat dong" : "Tam ngung"}
          </Tag>
        ),
      },
      {
        title: "NGAY TAO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 150,
        render: (value) => (
          <Typography.Text style={{ color: "#475569" }}>
            {value ? new Date(value).toLocaleDateString("vi-VN") : "-"}
          </Typography.Text>
        ),
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 150,
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space size={8}>
              <Tooltip title="Sua toa nha">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                  style={{ borderRadius: 8, height: 32, width: 32 }}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Tam ngung toa nha" : "Mo lai toa nha"}>
                <Button
                  size="small"
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                  onClick={() => handleToggleStatus(record)}
                  style={{ borderRadius: 8, height: 32, width: 32 }}
                />
              </Tooltip>
              <Popconfirm
                title="Xoa toa nha nay?"
                description="Chi xoa duoc toa nha chua co phong."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
              >
                <Tooltip title="Xoa toa nha">
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ borderRadius: 8, height: 32, width: 32 }}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>
              TRO PLUS ADMIN
            </Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>
              Quan ly toa nha
            </Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>
              Tao, cap nhat, tam ngung hoac xoa toa nha trong he thong.
            </Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {buildingStats.total} toa nha
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {buildingStats.active} dang hoat dong
              </Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>
                {buildingStats.totalFloors} tang
              </Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={fetchBuildings} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>
                Tai lai
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{
                  background: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  boxShadow: "none",
                  fontWeight: 800,
                  height: 40,
                }}
              >
                Them toa nha
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={7}>
            <Space>
              <div style={{ ...statIconStyle, background: "#e6fffb", color: "#0f766e", height: 36, width: 36 }}>
                <FilterOutlined />
              </div>
              <div>
                <Typography.Text strong style={sectionTitleStyle}>
                  Bo loc toa nha
                </Typography.Text>
                <br />
                <Typography.Text style={mutedTextStyle}>
                  Loc nhanh theo ten, ma, dia chi va trang thai
                </Typography.Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={17}>
            <Row gutter={[10, 10]} justify="end">
              <Col xs={24} md={12}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tim ten, ma toa nha hoac dia chi"
                  style={toolbarInputStyle}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </Col>
              <Col xs={12} md={6}>
                <Select
                  value={statusFilter}
                  style={{ ...toolbarInputStyle, width: "100%" }}
                  onChange={setStatusFilter}
                  options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]}
                />
              </Col>
              <Col xs={12} md={6}>
                <Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>
                  Dat lai
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <div style={{ ...statIconStyle, background: "#e6fffb", color: "#0f766e", height: 34, width: 34 }}>
              <BankOutlined />
            </div>
            <div>
              <Typography.Text strong style={sectionTitleStyle}>
                Danh sach toa nha
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Quan ly thong tin va trang thai tung toa nha
              </Typography.Text>
            </div>
          </Space>
        }
        extra={
          <Tag bordered={false} style={{ background: "#e6fffb", borderRadius: 999, color: "#0f766e", fontWeight: 800, padding: "5px 12px" }}>
            Hien thi {filteredBuildings.length}/{buildings.length}
          </Tag>
        }
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" },
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredBuildings}
          loading={loading}
          size="middle"
          rowClassName={() => "user-management-row"}
          locale={{
            emptyText: <Empty description="Khong co toa nha phu hop" />,
          }}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} toa nha`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar
              size={36}
              style={{ background: editingBuilding?.status === "inactive" ? "#64748b" : "#0f766e" }}
              icon={<BankOutlined />}
            />
            <div>
              <Typography.Text strong>{editingBuilding ? "Sua toa nha" : "Them toa nha"}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {editingBuilding ? editingBuilding.code : "Tao toa nha moi cho he thong"}
              </Typography.Text>
            </div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingBuilding ? "Luu" : "Tao toa nha"}
        cancelText="Huy"
        width={720}
      >
        <Alert
          showIcon
          type="info"
          message={editingBuilding ? "Cap nhat thong tin toa nha" : "Nhap thong tin de tao toa nha moi"}
          style={{ marginBottom: 18, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space>
            <BankOutlined style={{ color: "#0f766e" }} />
            <Typography.Text strong>Thong tin toa nha</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Ten toa nha" rules={[{ required: true }]}>
                <Input placeholder="Nhap ten toa nha" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="code" label="Ma toa nha" rules={[{ required: true }]}>
                <Input placeholder="VD: TN-A" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Dia chi" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhap dia chi toa nha" />
          </Form.Item>

          <Space>
            <EnvironmentOutlined style={{ color: "#1677ff" }} />
            <Typography.Text strong>Van hanh</Typography.Text>
          </Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item
              name="totalFloors"
              label="Tong so tang"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} placeholder="Ghi chu them ve toa nha" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default BuildingManagementPage;
