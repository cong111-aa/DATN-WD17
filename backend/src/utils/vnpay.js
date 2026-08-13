const crypto = require("crypto");
const env = require("../config/env");

const pad = (value) => String(value).padStart(2, "0");

const formatVnpDate = (date = new Date()) => {
  const utc7Date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return [
    utc7Date.getUTCFullYear(),
    pad(utc7Date.getUTCMonth() + 1),
    pad(utc7Date.getUTCDate()),
    pad(utc7Date.getUTCHours()),
    pad(utc7Date.getUTCMinutes()),
    pad(utc7Date.getUTCSeconds()),
  ].join("");
};

const sortObject = (params) =>
  Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = params[key];
      return sorted;
    }, {});

const encodeValue = (value) =>
  encodeURIComponent(String(value)).replace(/%20/g, "+");

const stringifyParams = (params) =>
  Object.keys(params)
    .map((key) => `${encodeValue(key)}=${encodeValue(params[key])}`)
    .join("&");

const signParams = (params) => {
  const sortedParams = sortObject(params);
  const hashData = stringifyParams(sortedParams);

  return crypto
    .createHmac("sha512", env.vnpayHashSecret)
    .update(Buffer.from(hashData, "utf-8"))
    .digest("hex");
};

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return (
    rawIp?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "127.0.0.1"
  ).replace("::ffff:", "");
};

const ensureVnpayConfigured = () => {
  if (!env.vnpayTmnCode || !env.vnpayHashSecret) {
    throw new Error("VNPay is not configured");
  }
};

const buildVnpayPaymentUrl = ({ amount, ipAddress, orderInfo, txnRef }) => {
  ensureVnpayConfigured();

  const createDate = new Date();
  const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);
  const params = {
    vnp_Amount: Math.round(Number(amount || 0)) * 100,
    vnp_Command: "pay",
    vnp_CreateDate: formatVnpDate(createDate),
    vnp_CurrCode: "VND",
    vnp_ExpireDate: formatVnpDate(expireDate),
    vnp_IpAddr: ipAddress || "127.0.0.1",
    vnp_Locale: env.vnpayLocale,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_ReturnUrl: env.vnpayReturnUrl,
    vnp_TmnCode: env.vnpayTmnCode,
    vnp_TxnRef: txnRef,
    vnp_Version: "2.1.0",
  };
  const sortedParams = sortObject(params);
  const secureHash = signParams(sortedParams);

  return {
    params: sortedParams,
    paymentUrl: `${env.vnpayPaymentUrl}?${stringifyParams({
      ...sortedParams,
      vnp_SecureHash: secureHash,
    })}`,
  };
};

const verifyVnpayParams = (query) => {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  if (!secureHash) {
    return { isValid: false, params: sortObject(params) };
  }

  return {
    isValid: signParams(params).toLowerCase() === String(secureHash).toLowerCase(),
    params: sortObject(params),
  };
};

module.exports = {
  buildVnpayPaymentUrl,
  getClientIp,
  verifyVnpayParams,
};
