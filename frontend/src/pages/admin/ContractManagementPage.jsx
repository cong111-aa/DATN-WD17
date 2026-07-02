import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
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
        title: "Ma hop dong",
        dataIndex: "contractCode",
        key: "contractCode",
        render: (value) => <Typography.Text strong>{value}</Typography.Text>,
      },
      {
        title: "Phong",
        dataIndex: "roomNumber",
        key: "roomNumber",
        render: (value, record) => `${value || "-"} - ${record.roomName || "-"}`,
      },
      {
        title: "Nguoi dai dien",
        dataIndex: "tenantName",
        key: "tenantName",
      },
      {
        title: "Thanh vien",
        dataIndex: "memberCount",
        key: "memberCount",
        width: 110,
      },
      {
        title: "Gia thue",
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
        title: "Ngay tao",
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: "Ngay vao",
        dataIndex: "moveInDate",
        key: "moveInDate",
        render: formatDate,
      },
      {
        title: "Thoi han",
        dataIndex: "durationMonths",
        key: "durationMonths",
        render: (value) => `${value} thang`,
      },
      {
        title: "Het han",
        dataIndex: "endDate",
        key: "endDate",
        render: formatDate,
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.active;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => (
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              Chi tiet
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => handleViewFile(record)}>
              Xem file
            </Button>
            <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Sua
            </Button>
            <Popconfirm
              title="Xoa hop dong nay?"
              description="Khong the xoa hop dong dang hieu luc."
              okText="Xoa"
              cancelText="Huy"
              onConfirm={() => handleDelete(record)}
              disabled={record.status === "active"}
            >
              <Button danger icon={<DeleteOutlined />} disabled={record.status === "active"}>
                Xoa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly hop dong</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat, xem chi tiet va in file hop dong tu dong.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them hop dong
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={contracts}
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <FileProtectOutlined />
            <span>{editingContract ? "Sua hop dong" : "Them hop dong"}</span>
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
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
        title="Chi tiet hop dong"
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
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Ma hop dong">{detailContract.contractCode}</Descriptions.Item>
            <Descriptions.Item label="Trang thai">
              <Tag color={statusMeta[detailContract.status]?.color}>
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
        )}
      </Modal>
    </Space>
  );
};

export default ContractManagementPage;
