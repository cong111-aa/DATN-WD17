import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import http from "../../api/http";

const defaultFormValues = {
  area: 0,
  capacity: 1,
  deposit: 0,
  electricityPrice: 3500,
  floor: 1,
  serviceFee: 0,
  images: [],
  status: "available",
  waterPrice: 15000,
};

const statusOptions = [
  { label: "Con trong", value: "available" },
  { label: "Dang thue", value: "occupied" },
  { label: "Bao tri", value: "maintenance" },
];

const statusMeta = {
  available: { color: "success", label: "Con trong" },
  occupied: { color: "blue", label: "Dang thue" },
  maintenance: { color: "warning", label: "Bao tri" },
};

const tenantStatusMeta = {
  active: { color: "blue", label: "Dang thue" },
  inactive: { color: "default", label: "Da ket thuc" },
};

const roomRoleMeta = {
  representative: { color: "gold", label: "Dai dien phong" },
  member: { color: "green", label: "Nguoi thue phong" },
};

const currencyFormatter = (value) =>
  typeof value === "number" ? value.toLocaleString("vi-VN") : value || "-";
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-");

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toAbsoluteImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toUploadFileList = (images = []) =>
  images.map((url, index) => ({
    uid: `${url}-${index}`,
    name: url.split("/").pop() || `image-${index + 1}`,
    status: "done",
    url: url.startsWith("http") ? url : `${apiOrigin}${url}`,
    response: { urls: [url] },
  }));

const toImageUrls = (fileList = []) =>
  fileList.flatMap((file) => {
    if (file.response?.urls) {
      return file.response.urls;
    }

    if (file.url?.startsWith(apiOrigin)) {
      return file.url.replace(apiOrigin, "");
    }

    return file.url ? [file.url] : [];
  });

const RoomManagementPage = () => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailTenants, setDetailTenants] = useState([]);
  const [detailTenantsLoading, setDetailTenantsLoading] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);

  const roomStatusOptions = useMemo(
    () =>
      statusOptions.map((option) => ({
        ...option,
        disabled: editingRoom?.status === "occupied" && option.value === "available",
      })),
    [editingRoom]
  );

  const fetchRooms = async () => {
    setLoading(true);

    try {
      const { data } = await http.get("/rooms");
      setRooms(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach phong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    form.resetFields();
    form.setFieldsValue(defaultFormValues);
    setImageFileList([]);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRoom(record);
    form.resetFields();
    form.setFieldsValue(record);
    setImageFileList(toUploadFileList(record.images));
    setModalOpen(true);
  };

  const openDetailModal = async (record) => {
    setDetailRoom(record);
    setDetailTenants([]);
    setDetailOpen(true);
    setDetailTenantsLoading(true);

    try {
      const { data } = await http.get("/tenants", { params: { room: record.id } });
      setDetailTenants(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Khong tai duoc danh sach nguoi thue");
    } finally {
      setDetailTenantsLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setImageFileList([]);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        images: toImageUrls(imageFileList),
      };

      if (editingRoom) {
        await http.put(`/rooms/${editingRoom.id}`, payload);
        message.success("Da cap nhat phong");
      } else {
        await http.post("/rooms", payload);
        message.success("Da tao phong");
      }

      closeModal();
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Luu phong that bai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await http.delete(`/rooms/${record.id}`);
      message.success("Da xoa phong");
      fetchRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xoa phong that bai");
    }
  };

  const handleViewContract = async (record) => {
    try {
      const { data: contracts } = await http.get("/contracts", {
        params: {
          room: record.id,
          status: "active",
        },
      });
      const contract = contracts?.[0];

      if (!contract) {
        message.info("Phong nay chua co hop dong dang hieu luc");
        return;
      }

      const { data } = await http.get(`/contracts/${contract.id}/file`, {
        responseType: "text",
      });
      const blob = new Blob([data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(error.response?.data?.message || "Khong mo duoc hop dong cua phong");
    }
  };

  const handleImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/rooms", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload anh that bai");
      onError(error);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Phong",
        dataIndex: "roomNumber",
        key: "roomNumber",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{record.name}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Tang",
        dataIndex: "floor",
        key: "floor",
        width: 90,
      },
      {
        title: "Dien tich",
        dataIndex: "area",
        key: "area",
        width: 110,
        render: (value) => `${value || 0} m2`,
      },
      {
        title: "Suc chua",
        dataIndex: "capacity",
        key: "capacity",
        width: 110,
      },
      {
        title: "Gia thue",
        dataIndex: "price",
        key: "price",
        render: (value) => currencyFormatter(value),
      },
      {
        title: "Trang thai",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || statusMeta.available;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Ngay tao",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
      },
      {
        title: "Thao tac",
        key: "actions",
        fixed: "right",
        render: (_, record) => {
          const isOccupied = record.status === "occupied";

          return (
            <Space wrap>
              <Button icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
                Chi tiet
              </Button>
              <Button icon={<FileTextOutlined />} onClick={() => handleViewContract(record)}>
                Xem hop dong
              </Button>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Sua
              </Button>
              <Popconfirm
                title="Xoa phong nay?"
                description="Khong the xoa phong dang co nguoi thue."
                okText="Xoa"
                cancelText="Huy"
                onConfirm={() => handleDelete(record)}
                disabled={isOccupied}
              >
                <Button danger icon={<DeleteOutlined />} disabled={isOccupied}>
                  Xoa
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <div className="page-toolbar">
        <div className="page-title">
          <Typography.Title level={3}>Quan ly phong</Typography.Title>
          <Typography.Text type="secondary">
            Tao, cap nhat hoac xoa phong trong he thong.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Them phong
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rooms}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editingRoom ? "Sua phong" : "Them phong"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Luu" : "Tao phong"}
        cancelText="Huy"
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="form-grid">
            <Form.Item name="roomNumber" label="So phong" rules={[{ required: true }]}>
              <Input placeholder="VD: 101" />
            </Form.Item>
            <Form.Item name="name" label="Ten phong" rules={[{ required: true }]}>
              <Input placeholder="VD: Phong 101" />
            </Form.Item>
            <Form.Item name="floor" label="Tang" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" />
            </Form.Item>
            <Form.Item name="area" label="Dien tich">
              <InputNumber min={0} className="full-width-input" addonAfter="m2" />
            </Form.Item>
            <Form.Item name="capacity" label="Suc chua" rules={[{ required: true }]}>
              <InputNumber min={1} className="full-width-input" />
            </Form.Item>
            <Form.Item name="price" label="Gia thue" rules={[{ required: true }]}>
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="deposit" label="Tien coc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="serviceFee" label="Phi dich vu">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="electricityPrice" label="Gia dien">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="waterPrice" label="Gia nuoc">
              <InputNumber min={0} className="full-width-input" addonAfter="VND" />
            </Form.Item>
            <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
              <Select options={roomStatusOptions} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Anh phong">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              customRequest={handleImageUpload}
              fileList={imageFileList}
              listType="picture-card"
              multiple
              onChange={({ fileList }) => setImageFileList(fileList)}
              onRemove={(file) => {
                setImageFileList((current) => current.filter((item) => item.uid !== file.uid));
              }}
            >
              {imageFileList.length >= 10 ? null : (
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
        title="Chi tiet phong"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Dong
          </Button>,
        ]}
        width={820}
      >
        {detailRoom && (
          <Space direction="vertical" size={16} className="page-stack">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="So phong">{detailRoom.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Ten phong">{detailRoom.name}</Descriptions.Item>
              <Descriptions.Item label="Tang">{detailRoom.floor}</Descriptions.Item>
              <Descriptions.Item label="Dien tich">{detailRoom.area || 0} m2</Descriptions.Item>
              <Descriptions.Item label="Suc chua">{detailRoom.capacity}</Descriptions.Item>
              <Descriptions.Item label="Trang thai">
                <Tag color={statusMeta[detailRoom.status]?.color}>
                  {statusMeta[detailRoom.status]?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Gia va dich vu</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Gia thue">{formatCurrency(detailRoom.price)}</Descriptions.Item>
              <Descriptions.Item label="Tien coc">{formatCurrency(detailRoom.deposit)}</Descriptions.Item>
              <Descriptions.Item label="Gia dien">{formatCurrency(detailRoom.electricityPrice)}</Descriptions.Item>
              <Descriptions.Item label="Gia nuoc">{formatCurrency(detailRoom.waterPrice)}</Descriptions.Item>
              <Descriptions.Item label="Phi dich vu">{formatCurrency(detailRoom.serviceFee)}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Mo ta">{detailRoom.description || "-"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Nguoi thue phong</Divider>
            <List
              bordered
              dataSource={detailTenants}
              loading={detailTenantsLoading}
              locale={{ emptyText: "Chua co nguoi thue trong phong" }}
              renderItem={(tenant) => {
                const roleMeta = roomRoleMeta[tenant.roomRole] || roomRoleMeta.member;
                const tenantMeta = tenantStatusMeta[tenant.status] || tenantStatusMeta.active;

                return (
                  <List.Item>
                    <Space direction="vertical" size={4} className="page-stack">
                      <Space wrap>
                        <Typography.Text strong>{tenant.userName || "-"}</Typography.Text>
                        <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
                        <Tag color={tenantMeta.color}>{tenantMeta.label}</Tag>
                      </Space>
                      <Typography.Text type="secondary">
                        {tenant.userPhone || tenant.userEmail || "-"} | Vao: {formatDate(tenant.moveInDate)} | Roi:{" "}
                        {formatDate(tenant.moveOutDate)}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                );
              }}
            />

            <Divider orientation="left">Anh phong</Divider>
            {detailRoom.images?.length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {detailRoom.images.map((url, index) => (
                    <Image
                      key={`${url}-${index}`}
                      src={toAbsoluteImageUrl(url)}
                      width={120}
                      height={90}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">Chua co anh phong</Typography.Text>
            )}

            <Divider orientation="left">Thoi gian</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Ngay tao">{formatDate(detailRoom.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngay cap nhat">{formatDate(detailRoom.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default RoomManagementPage;
