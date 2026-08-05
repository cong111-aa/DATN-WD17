import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, Upload, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const { Title, Paragraph } = Typography;

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toImageUrl = (url) => (url?.startsWith("http") ? url : `${apiOrigin}${url}`);

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
  const navigate = useNavigate();
  const { refreshProfile, user } = useAuth();
  const [identityBackFileList, setIdentityBackFileList] = useState([]);
  const [identityFrontFileList, setIdentityFrontFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue(user);
    setIdentityBackFileList(toIdentityFileList(user?.identityBackImage));
    setIdentityFrontFileList(toIdentityFileList(user?.identityFrontImage));
  }, [user, form]);

  const handleIdentityImageUpload = async ({ file, onError, onSuccess }) => {
    const formData = new FormData();
    formData.append("identity", file);

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

  const handleIdentityFileChange = (fieldName, setter) => ({ fileList }) => {
    setter(fileList);
    const uploadedUrl =
      fileList[0]?.response?.urls?.[0] || fileList[0]?.rawUrl || fileList[0]?.url || "";
    form.setFieldValue(fieldName, uploadedUrl);
  };

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      await http.put("/me/profile", values);
      message.success("Cập nhật thông tin thành công");
      await refreshProfile();
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-portal-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="portal-section-card">
        <div className="portal-section-header">
          <div className="portal-section-title">
            <div className="portal-section-icon"><UserOutlined /></div>
            <span>Hồ sơ cá nhân & CCCD</span>
          </div>
          <Button onClick={() => navigate("/user")} style={{ borderRadius: 6 }}>← Về trang chủ</Button>
        </div>

        <div>
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ marginBottom: 4 }}>Cập nhật thông tin cá nhân & CCCD</Title>
            <Paragraph type="secondary">
              Cập nhật đầy đủ thông tin định danh để làm hợp đồng thuê nhà chính thức.
            </Paragraph>
          </div>

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
              loading={loading}
              style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 700, paddingLeft: 32, paddingRight: 32 }}
            >
              Lưu thông tin tài khoản
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
