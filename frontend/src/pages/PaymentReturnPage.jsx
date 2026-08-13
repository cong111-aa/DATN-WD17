import { Button, Card, Result, Spin, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../api/http";

const { Paragraph, Text } = Typography;

const PaymentReturnPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const verifyPayment = async () => {
      setLoading(true);
      try {
        const { data } = await http.get(`/payments/vnpay/return?${queryString}`);
        setResult(data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Không xác minh được giao dịch VNPay";
        setResult({ message: errorMessage, success: false });
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [queryString]);

  const backPath = result?.targetType === "invoice" ? "/user/invoices" : "/user/room-requests";

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f1f5f9", padding: 24 }}>
      <Card style={{ width: "100%", maxWidth: 640, borderRadius: 12 }}>
        {loading ? (
          <div style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
            <Spin tip="Đang kiểm tra kết quả thanh toán..." />
          </div>
        ) : (
          <Result
            status={result?.success ? "success" : "error"}
            title={result?.success ? "Thanh toán thành công" : "Thanh toán chưa thành công"}
            subTitle={
              <Paragraph style={{ marginBottom: 0 }}>
                <Text>{result?.message || "VNPay đã trả kết quả giao dịch."}</Text>
              </Paragraph>
            }
            extra={[
              <Button key="home" onClick={() => navigate("/")}>Trang chủ</Button>,
              <Button key="back" type="primary" onClick={() => navigate(backPath)} style={{ background: "#0f766e" }}>
                Xem lại thông tin
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentReturnPage;
