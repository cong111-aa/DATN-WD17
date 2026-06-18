import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  HomeOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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

const filterStatusOptions = [{ label: "Tat ca trang thai", value: "all" }, ...statusOptions];

const normalize = (value) => String(value || "").trim().toLowerCase();

const BuildingManagementPage = () => {
  const [form] = Form.useForm();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const stats = useMemo(() => {
    const activeCount = buildings.filter((building) => building.status === "active").length;
    const floorCount = buildings.reduce(
      (total, building) => total + Number(building.totalFloors || 0),
      0
    );

    return {
      total: buildings.length,
      active: activeCount,
      inactive: buildings.length - activeCount,
      floors: floorCount,
    };
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    const searchValue = normalize(keyword);

    return buildings.filter((building) => {
      const matchesStatus = statusFilter === "all" || building.status === statusFilter;
      const matchesKeyword =
        !searchValue ||
        [building.name, building.code, building.address, building.description]
          .map(normalize)
          .some((value) => value.includes(searchValue));

      return matchesStatus && matchesKeyword;
    });
  }, [buildings, keyword, statusFilter]);

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

  const handleResetFilters = () => {
    setKeyword("");
    setStatusFilter("all");
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
      console.log("FULL ERROR:", error.response);
      console.log("DATA:", error.response?.data);

      message.error(
        error.response?.data?.message || "Luu toa nha that bai"
      );
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

  const columns = useMemo(
    () => [
      {
        title: "TOA NHA",
        dataIndex: "name",
        key: "name",
        width: 250,
        render: (name, record) => (
          <div className="entity-cell">
            <div className="entity-avatar building-avatar">
              {String(record.code || name || "T").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="entity-name">{name}</div>
              <div className="entity-sub">{record.code}</div>
            </div>
          </div>
        ),
      },
      {
        title: "DIA CHI",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
        render: (value) => <span className="muted-text">{value}</span>,
      },
      {
        title: "SO TANG",
        dataIndex: "totalFloors",
        key: "totalFloors",
        width: 110,
        render: (value) => (
          <Tag className="soft-tag neutral-tag">
            <ApartmentOutlined /> {value || 0} tang
          </Tag>
        ),
      },
      {
        title: "TRANG THAI",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (status) => (
          <Tag className={`status-pill ${status === "active" ? "status-active" : "status-locked"}`}>
            {status === "active" ? "Hoat dong" : "Tam ngung"}
          </Tag>
        ),
      },
      {
        title: "NGAY TAO",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 130,
        render: (value) => (
          <span className="muted-text">{value ? new Date(value).toLocaleDateString("vi-VN") : "-"}</span>
        ),
      },
      {
        title: "THAO TAC",
        key: "actions",
        fixed: "right",
        align: "right",
        width: 146,
        render: (_, record) => {
          const isActive = record.status === "active";

          return (
            <Space size={8} className="action-buttons">
              <Tooltip title="Sua thong tin">
                <Button
                  aria-label="Sua thong tin toa nha"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title={isActive ? "Tam ngung hoat dong" : "Mo lai hoat dong"}>
                <Button
                  aria-label={isActive ? "Tam ngung toa nha" : "Mo lai toa nha"}
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                  onClick={() => handleToggleStatus(record)}
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
                  <Button danger aria-label="Xoa toa nha" icon={<DeleteOutlined />} />
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
    <Space direction="vertical" size={18} className="page-stack admin-management-page">
      <section className="admin-hero">
        <div>
          <div className="admin-eyebrow">TRO PLUS ADMIN</div>
          <Typography.Title level={2}>Quan ly toa nha</Typography.Title>
          <Typography.Text>
            Tao, cap nhat, tam ngung hoac xoa toa nha trong he thong.
          </Typography.Text>
          <div className="hero-pills">
            <span>{stats.total} toa nha</span>
            <span>{stats.active} dang hoat dong</span>
            <span>{stats.inactive} tam ngung</span>
            <span>{stats.floors} tang</span>
          </div>
        </div>
        <div className="hero-actions">
          <Button icon={<ReloadOutlined />} onClick={fetchBuildings} loading={loading}>
            Tai lai
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Them toa nha
          </Button>
        </div>
      </section>

      <Card className="filter-card">
        <div className="filter-title">
          <FilterOutlined />
          <div>
            <strong>Bo loc toa nha</strong>
            <span>Loc nhanh theo ten, ma toa nha, dia chi va trang thai</span>
          </div>
        </div>
        <div className="filter-controls">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tim ten, ma toa nha hoac dia chi"
          />
          <Select value={statusFilter} options={filterStatusOptions} onChange={setStatusFilter} />
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Dat lai
          </Button>
        </div>
      </Card>

      <Card className="table-card">
        <div className="table-heading">
          <div className="table-title">
            <HomeOutlined />
            <div>
              <strong>Danh sach toa nha</strong>
              <span>Quan ly thong tin van hanh va trang thai toa nha</span>
            </div>
          </div>
          <Tag className="result-tag">Hien thi {filteredBuildings.length}/{buildings.length}</Tag>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredBuildings}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          className="management-table"
        />
      </Card>

      <Modal
        title={editingBuilding ? "Sua toa nha" : "Them toa nha"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingBuilding ? "Luu" : "Tao toa nha"}
        cancelText="Huy"
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Ten toa nha" rules={[{ required: true }]}>
            <Input placeholder="VD: Toa nha A" />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="code" label="Ma toa nha" rules={[{ required: true }]}>
              <Input placeholder="VD: TN-A" />
            </Form.Item>
            <Form.Item
              name="totalFloors"
              label="Tong so tang"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Dia chi" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhap dia chi toa nha" />
          </Form.Item>
          <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} placeholder="Ghi chu tien ich, khu vuc, quy dinh..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default BuildingManagementPage;
