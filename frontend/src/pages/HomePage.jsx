import { useEffect, useState } from "react";
import { Alert, Button, Card, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import http from "../api/http";
import PageHeader from "../components/PageHeader";

const HomePage = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkApi = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await http.get("/health");
      setApiStatus(data);
    } catch (err) {
      setApiStatus(null);
      setError(err.response?.data?.message || "Cannot connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <PageHeader
        title="React + Express + MongoDB"
        subtitle="A clean base project ready for new features."
      />
      <Card>
        <Space direction="vertical" size={12}>
          <Typography.Text>
            Frontend is running. Use this page as the starting point for your
            new project.
          </Typography.Text>
          {apiStatus && (
            <Alert
              type="success"
              showIcon
              message={apiStatus.message}
              description={`Status: ${apiStatus.status}`}
            />
          )}
          {error && <Alert type="error" showIcon message={error} />}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={checkApi}>
            Check API
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default HomePage;
