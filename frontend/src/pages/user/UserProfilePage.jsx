import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, Typography, Upload, message } from "antd";
import { useEffect, useState } from "react";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Title, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

const toUploadedImageUrl = (fileList = []) =>
  fileList[0]?.response?.urls?.[0] || fileList[0]?.rawUrl || fileList[0]?.url || "";

const toIdentityFileList = (url) =>
  url
    ? [
        {
          uid: url,
          name: url.split("/").pop() || "identity-image",
          rawUrl: url,
          status: "done",
          url: toImageUrl(url),
        },
      ]
    : [];

const UserProfilePage = () => {
  const [form] = Form.useForm();
  const { refreshProfile, user } = useAuth();
  const [identityBackFileList, setIdentityBackFileList] = useState([]);
  const [identityFrontFileList, setIdentityFrontFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
      setIdentityBackFileList(toIdentityFileList(user.identityBackImage));
      setIdentityFrontFileList(toIdentityFileList(user.identityFrontImage));
    }
  }, [form, user]);

  const handleUpdate = async (values) => {
    setSubmitting(true);
    try {
      await http.put("/auth/profile", values);
      await refreshProfile();
      message.success("Đã cập nhật thông tin tài khoản thành công");
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIdentityImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const { data } = await http.post("/uploads/identity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(data);
    } catch (error) {
      message.error(error.response?.data?.message || "Upload ảnh CCCD thất bại");
      onError(error);
    }
  };

  const handleIdentityFileChange = (fieldName, setFileList) => ({ fileList }) => {
    const nextFileList = fileList.slice(-1);
    setFileList(nextFileList);
    form.setFieldValue(fieldName, toUploadedImageUrl(nextFileList));
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>
      <Card
        style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
        title={
          <Space>
            <UserOutlined style={{ color: "#4f46e5", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              Cập nhật Hồ sơ cá nhân & CCCD
            </Title>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Cập nhật đầy đủ thông tin định danh để chủ trọ làm hợp đồng thuê nhà chính thức.
        </Paragraph>

        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <div className="form-grid">
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
              <Input size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="email" label="Email đăng nhập">
              <Input size="large" disabled style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại liên hệ">
              <Input size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="identityNumber" label="Số CCCD / CMND">
              <Input size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="identityFrontImage" label="Ảnh CCCD mặt trước">
              <Upload
                accept="image/png,image/jpeg,image/webp"
                customRequest={handleIdentityImageUpload}
                fileList={identityFrontFileList}
                listType="picture-card"
                maxCount={1}
                onChange={handleIdentityFileChange("identityFrontImage", setIdentityFrontFileList)}
              >
                {identityFrontFileList.length ? null : (
                  <button type="button" className="upload-card-button">
                    <UploadOutlined />
                    <span>Tải ảnh</span>
                  </button>
                )}
              </Upload>
            </Form.Item>
            <Form.Item name="identityBackImage" label="Ảnh CCCD mặt sau">
              <Upload
                accept="image/png,image/jpeg,image/webp"
                customRequest={handleIdentityImageUpload}
                fileList={identityBackFileList}
                listType="picture-card"
                maxCount={1}
                onChange={handleIdentityFileChange("identityBackImage", setIdentityBackFileList)}
              >
                {identityBackFileList.length ? null : (
                  <button type="button" className="upload-card-button">
                    <UploadOutlined />
                    <span>Tải ảnh</span>
                  </button>
                )}
              </Upload>
            </Form.Item>
          </div>
          <Form.Item name="address" label="Địa chỉ thường trú">
            <Input.TextArea rows={3} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu mới (Nếu cần đổi)">
            <Input.Password size="large" placeholder="Để trống nếu giữ nguyên mật khẩu cũ" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 700, paddingLeft: 32, paddingRight: 32, marginTop: 12 }}
          >
            Lưu thông tin tài khoản
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default UserProfilePage;
