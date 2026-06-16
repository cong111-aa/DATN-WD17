import { Card, Col, Row, Space, Typography } from "antd";

const AdminDashboardPage = () => (
  <Space direction="vertical" size={16} className="page-stack">
    <div className="page-title">
      <Typography.Title level={3}>Tong quan</Typography.Title>
      <Typography.Text type="secondary">
        Khu vuc quan tri he thong nha tro Tro Plus.
      </Typography.Text>
    </div>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <Typography.Text type="secondary">Tai khoan</Typography.Text>
          <Typography.Title level={3}>Quan ly nguoi dung</Typography.Title>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Typography.Text type="secondary">Phong tro</Typography.Text>
          <Typography.Title level={3}>Dang phat trien</Typography.Title>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Typography.Text type="secondary">Hoa don</Typography.Text>
          <Typography.Title level={3}>Dang phat trien</Typography.Title>
        </Card>
      </Col>
    </Row>
  </Space>
);

export default AdminDashboardPage;
