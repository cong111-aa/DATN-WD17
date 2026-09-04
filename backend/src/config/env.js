require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/datn",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  bankBin: process.env.BANK_BIN || "",
  bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
  bankAccountName: process.env.BANK_ACCOUNT_NAME || "",
  bankName: process.env.BANK_NAME || "",
  paymentQrTemplate: process.env.PAYMENT_QR_TEMPLATE || "compact2",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",
  vnpayTmnCode: process.env.VNPAY_TMN_CODE || "",
  vnpayHashSecret: process.env.VNPAY_HASH_SECRET || "",
  vnpayPaymentUrl:
    process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpayReturnUrl:
    process.env.VNPAY_RETURN_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/vnpay-return`,
  vnpayIpnUrl:
    process.env.VNPAY_IPN_URL || `${process.env.API_URL || "http://localhost:5000"}/api/payments/vnpay/ipn`,
  vnpayLocale: process.env.VNPAY_LOCALE || "vn",
};

module.exports = env;
