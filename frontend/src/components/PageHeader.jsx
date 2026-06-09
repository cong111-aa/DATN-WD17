import { Typography } from "antd";

const PageHeader = ({ title, subtitle }) => (
  <div className="page-header">
    <Typography.Title level={3}>{title}</Typography.Title>
    {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
  </div>
);

export default PageHeader;
