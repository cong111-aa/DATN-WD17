import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const statusOptions = [
  { label: "Dang hieu luc", value: "active" },
  { label: "Het han", value: "expired" },
  { label: "Da cham dut", value: "terminated" },
];

const statusMeta = {
  active: { color: "success", label: "Dang hieu luc" },
  expired: { color: "default", label: "Het han" },
  terminated: { color: "error", label: "Da cham dut" },
};

const defaultFormValues = {
  durationMonths: 12,
  status: "active",
};

const panelStyle = {
  border: "1px solid #eef1f7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const heroStyle = {
  ...panelStyle,
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 32% 64%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.10) 0 1px, transparent 1px), linear-gradient(115deg, #5b21b6 0%, #7c2dff 46%, #2563eb 100%)",
  backgroundSize: "88px 88px, 120px 120px, 96px 96px, auto",
};

const statIconStyle = { alignItems: "center", borderRadius: 8, display: "flex", height: 42, justifyContent: "center", width: 42 };
const toolbarInputStyle = { borderRadius: 8, height: 40 };
const mutedTextStyle = { color: "#64748b" };
const sectionTitleStyle = { color: "#0f172a", fontSize: 16 };

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const toPayload = (values) => ({
  ...values,
  moveInDate: values.moveInDate ? values.moveInDate.toISOString() : undefined,
  endDate: values.endDate ? values.endDate.toISOString() : undefined,
});

const toFormValues = (record) => ({
  ...record,
  moveInDate: record.moveInDate ? dayjs(record.moveInDate) : undefined,
  endDate: record.endDate ? dayjs(record.endDate) : undefined,
});

const ContractManagementPage = () => {
  const [form] = Form.useForm();
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const contractStats = useMemo(() => {
    const active = contracts.filter((item) => item.status === "active").length;
    const expired = contracts.filter((item) => item.status === "expired").length;
    return { active, expired, total: contracts.length };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return contracts.filter((item) => {
      const matchesSearch = !keyword || [item.contractCode, item.roomNumber, item.roomName, item.tenantName]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
      return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
    });
  }, [contracts, searchText, statusFilter]);

  const representativeOptions = useMemo(
    () =>
      tenants
        .filter((tenant) => tenant.status === "active" && tenant.roomRole === "representative")
        .map((tenant) => ({
          label: `${tenant.userName} - Phong ${tenant.roomNumber}`,
          tenant,
          value: tenant.id,
        })),
    [tenants]
  );

  const fetchOptions = async () => {
    try {
      const [{ data: tenantData }, { data: roomData }] = await Promise.all([
        http.get("/tenants"),
        http.get("/rooms"),
      ]);
      setTenants(tenantData);
      setRooms(roomData);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc du lieu lua chon");
    }
  };

  const fetchContracts = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/contracts");
      setContracts(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach hop dong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchContracts();
  }, []);

  const refreshAll = () => {
    fetchOptions();
    fetchContracts();
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const updateEndDate = () => {
    const moveInDate = form.getFieldValue("moveInDate");
    const durationMonths = form.getFieldValue("durationMonths");

    if (moveInDate && durationMonths) {
      form.setFieldsValue({ endDate: moveInDate.add(Number(durationMonths), "month") });
    }
  };

  const handleRepresentativeChange = (value) => {
    const selected = representativeOptions.find((option) => option.value === value)?.tenant;
    const room = rooms.find((item) => item.id === selected?.room);
    const memberCount = tenants.filter(
      (tenant) => tenant.room === selected?.room && tenant.status === "active"
    ).length;

    form.setFieldsValue({
      deposit: room?.deposit ?? 0,
      memberCount: memberCount || 1,
      monthlyRent: room?.price ?? 0,
      moveInDate: selected?.moveInDate ? dayjs(selected.moveInDate) : dayjs(),
      room: selected?.room,
      tenant: selected?.user,
    });
    setTimeout(updateEndDate, 0);
  };

  const openCreateModal = () => {
    setEditingContract(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingContract(record);
    form.resetFields();
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingContract(null);
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = toPayload(values);

      if (editingContract) {
        await http.put(`/contracts/${editingContract.id}`, payload);
        message.success("Da cap nhat hop dong");
      } else {
        await http.post("/contracts", payload);
        message.success("Da tao hop dong");
      }

      closeModal();
      refreshAll();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu hop dong that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/contracts/${record.id}`);
      message.success("Da xoa hop dong");
      fetchContracts();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa hop dong that bai");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const { data } = await http.get(`/contracts/${record.id}`);
      setDetailContract(data);
      setDetailOpen(true);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc chi tiet hop dong");
    }
  };

  const handleViewFile = async (record) => {
    try {
      const { data } = await http.get(`/contracts/${record.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(error.response?.data?.message || "Khong mo duoc file hop dong");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "MA HOP DONG",
        dataIndex: "contractCode",
        key: "contractCode",
        width: 175,
        render: (value) => <Typography.Text strong style={{ color: "#334155" }}>{value}</Typography.Text>,
      },
      {
        title: "PHONG",
        dataIndex: "roomNumber",
        key: "roomNumber",
        width: 190,
        render: (value, record) => <Typography.Text style={{ color: "#475569" }}>{value || "-"} - {record.roomName || "-"}</Typography.Text>,
      },
      {
        title: "NGUOI DAI DIEN",
        dataIndex: "tenantName",
        key: "tenantName",
        width: 205,
        render: (value) => <Typography.Text style={{ color: "#475569" }}>{value || "-"}</Typography.Text>,
      },
      {
        title: "THANH VIEN",
        dataIndex: "memberCount",
        key: "memberCount",
        width: 110,
      },
      {
        title: "GIA THUE",
        dataIndex: "monthlyRent",
        key: "monthlyRent",
        render: formatCurrency,
      },
      {
        title: "TIEN COC",
        dataIndex: "deposit",
        key: "deposit",
        render: formatCurrency,
      },
      {
        title: "NGAY TAO",
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: "NGAY VAO",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "THOI HAN",
        dataIndex: "durationMonths",
        key: "durationMonths",
        render: (value) => `${value} thang`,
      },
      {
        title: "HET HAN",
        dataIndex: "endDate",
        key: "endDate",
        render: formatDate,
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return <Tag bordered={false} icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />} style={{ background: status === "active" ? "#dcfce7" : status === "terminated" ? "#fee2e2" : "#f1f5f9", borderRadius: 5, color: status === "active" ? "#15803d" : status === "terminated" ? "#dc2626" : "#64748b", fontWeight: 700, padding: "3px 10px" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "center",
        width: 175,
        render: (_, record) => (
          <Space size={7}>
            <Tooltip title="Xem chi tiet"><Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Tooltip title="Xem file hop dong"><Button size="small" icon={<FileTextOutlined />} onClick={() => handleViewFile(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Tooltip title="Sua hop dong"><Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            <Popconfirm
              title="Xoa hop dong nay?"
              description="Khong the xoa hop dong dang hieu luc."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
              disabled={record.status === "active"}
            >
              <Tooltip title="Xoa hop dong"><Button danger size="small" icon={<DeleteOutlined />} disabled={record.status === "active"} style={{ borderRadius: 8, height: 32, width: 32 }} /></Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={18} className="page-stack" style={{ maxWidth: "100%", margin: "0 auto" }}>
      <Card styles={{ body: { minHeight: 230, padding: 28 } }} style={heroStyle}>
        <Row gutter={[18, 18]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 800 }}>TRO PLUS ADMIN</Typography.Text>
            <Typography.Title level={2} style={{ color: "#ffffff", margin: "6px 0 8px", fontSize: 30 }}>Quan ly hop dong</Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", marginBottom: 16, maxWidth: 620 }}>Tao, cap nhat, theo doi thoi han va xem chi tiet hop dong thue phong.</Typography.Paragraph>
            <Space wrap>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.total} hop dong</Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.active} dang hieu luc</Tag>
              <Tag bordered={false} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, color: "#ffffff", fontWeight: 800, padding: "4px 14px" }}>{contractStats.expired} het han</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>Tai lai</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 8, boxShadow: "none", fontWeight: 800, height: 40 }}>Them hop dong</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ ...panelStyle, background: "#ffffff" }} styles={{ body: { padding: "18px 20px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={8}><Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 36, width: 36 }}><FilterOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Bo loc hop dong</Typography.Text><br /><Typography.Text style={mutedTextStyle}>Tim nhanh theo ma, phong, nguoi dai dien</Typography.Text></div></Space></Col>
          <Col xs={24} lg={16}><Row gutter={[10, 10]} justify="end"><Col xs={24} md={12}><Input allowClear prefix={<SearchOutlined />} placeholder="Tim ma hop dong, phong, nguoi dai dien" style={toolbarInputStyle} value={searchText} onChange={(event) => setSearchText(event.target.value)} /></Col><Col xs={12} md={6}><Select value={statusFilter} style={{ ...toolbarInputStyle, width: "100%" }} onChange={setStatusFilter} options={[{ label: "Tat ca trang thai", value: "all" }, ...statusOptions]} /></Col><Col xs={12} md={6}><Button block icon={<ReloadOutlined />} onClick={resetFilters} style={{ ...toolbarInputStyle, background: "#f3f6fb", borderColor: "#f3f6fb", fontWeight: 700 }}>Dat lai</Button></Col></Row></Col>
        </Row>
      </Card>

      <Card
        title={<Space><div style={{ ...statIconStyle, background: "#f5edff", color: "#7c3aed", height: 34, width: 34 }}><FileProtectOutlined /></div><div><Typography.Text strong style={sectionTitleStyle}>Danh sach hop dong</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>Theo doi cac hop dong thue phong trong he thong</Typography.Text></div></Space>}
        extra={<Tag bordered={false} style={{ background: "#f5edff", borderRadius: 999, color: "#7c3aed", fontWeight: 800, padding: "5px 12px" }}>Hien thi {filteredContracts.length}/{contracts.length}</Tag>}
        style={{ ...panelStyle, overflow: "hidden" }}
        styles={{ body: { padding: 0 }, header: { borderBottom: "1px solid #f1f5f9", minHeight: 74, padding: "12px 20px" } }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredContracts}
          loading={loading}
          size="middle"
          rowClassName={() => "contract-management-row"}
          locale={{ emptyText: <Empty description="Khong co hop dong phu hop" /> }}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} hop dong` }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} />
            <div><Typography.Text strong>{editingContract ? "Sua hop dong" : "Them hop dong"}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{editingContract ? editingContract.contractCode : "Tao hop dong moi cho phong"}</Typography.Text></div>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingContract ? "Luu" : "Tao hop dong"}
        cancelText="Huy"
        width={820}
      >
        <Alert showIcon type="info" message={editingContract ? "Cap nhat thong tin hop dong" : "Chon nguoi dai dien de tu dong dien thong tin phong"} style={{ marginBottom: 18, borderRadius: 8 }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin nguoi thue</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Form.Item name="representativePicker" label="Phong - nguoi dai dien">
            <Select
              options={representativeOptions}
              placeholder="Chon nguoi dai dien phong"
              showSearch
              optionFilterProp="label"
              onChange={handleRepresentativeChange}
            />
          </Form.Item>
          <Form.Item name="tenant" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="room" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Space><CalendarOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Thong tin hop dong</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <div className="form-grid">
            <Form.Item name="contractCode" label="Ma hop dong" rules={[{ required: true }]}>
              <Input placeholder="VD: HDT-2026-001" />
            </Form.Item>
            <Form.Item name="memberCount" label="Tong thanh vien">
              <InputNumber min={1} className="full-width-input" disabled />
            </Form.Item>
            <Form.Item name="monthlyRent" label="Gia thue" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="deposit" label="Tien coc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="moveInDate" label="Ngay vao o" rules={[{ required: true }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" onChange={updateEndDate} />
            </Form.Item>
            <Form.Item name="durationMonths" label="Thoi han hop dong" rules={[{ required: true }]}>
              <InputNumber min={1} className="full-width-input" addonAfter="thang" onChange={updateEndDate} />
            </Form.Item>
            <Form.Item name="endDate" label="Het han hop dong" rules={[{ required: true }]}>
              <DatePicker className="full-width-input" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>
          <Form.Item name="terms" label="Dieu khoan / ghi chu">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><Avatar size={36} style={{ background: "#7c3aed" }} icon={<FileProtectOutlined />} /><div><Typography.Text strong>Chi tiet hop dong</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailContract?.contractCode || "Thong tin hop dong thue phong"}</Typography.Text></div></Space>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Dong
          </Button>,
        ]}
        width={820}
      >
        {detailContract && (
          <>
          <Alert showIcon type={detailContract.status === "active" ? "success" : "info"} message={`Trang thai: ${statusMeta[detailContract.status]?.label || "-"}`} style={{ marginBottom: 18, borderRadius: 8 }} />
          <Space><TeamOutlined style={{ color: "#7c3aed" }} /><Typography.Text strong>Thong tin nguoi thue va phong</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Ma hop dong">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trang thai">
              <Tag bordered={false} color={statusMeta[detailContract.status]?.color}>
                {statusMeta[detailContract.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phong">
              {detailContract.roomNumber} - {detailContract.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Tang">{detailContract.roomFloor}</Descriptions.Item>
            <Descriptions.Item label="Nguoi dai dien">{detailContract.tenantName}</Descriptions.Item>
            <Descriptions.Item label="Lien he">
              {detailContract.tenantPhone || detailContract.tenantEmail || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tong thanh vien">{detailContract.memberCount}</Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 20 }}><CalendarOutlined style={{ color: "#2563eb" }} /><Typography.Text strong>Gia tri va thoi han</Typography.Text></Space>
          <Divider style={{ margin: "12px 0 16px" }} />
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Gia thue">{formatCurrency(detailContract.monthlyRent)}</Descriptions.Item>
            <Descriptions.Item label="Tien coc">{formatCurrency(detailContract.deposit)}</Descriptions.Item>
            <Descriptions.Item label="Ngay tao">{formatDate(detailContract.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Ngay vao o">{formatDate(detailContract.moveInDate)}</Descriptions.Item>
            <Descriptions.Item label="Thoi han">{detailContract.durationMonths} thang</Descriptions.Item>
            <Descriptions.Item label="Het han">{formatDate(detailContract.endDate)}</Descriptions.Item>
            <Descriptions.Item label="Dieu khoan" span={2}>
              {detailContract.terms || "-"}
            </Descriptions.Item>
          </Descriptions>
          </>
        )}
      </Modal>
    </Space>
  );
};

export default ContractManagementPage;
