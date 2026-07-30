const env = require("../config/env");

const buildPaymentContent = (requestCode) => String(requestCode || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 50);

const buildVietQrUrl = ({ amount, content }) => {
  if (!env.bankBin || !env.bankAccountNumber) {
    return "";
  }

  const query = new URLSearchParams({
    accountName: env.bankAccountName,
    addInfo: content,
    amount: String(Math.max(Number(amount || 0), 0)),
  });

  return `https://img.vietqr.io/image/${env.bankBin}-${env.bankAccountNumber}-${env.paymentQrTemplate}.png?${query.toString()}`;
};

const buildBankTransferPayment = (roomRequest) => {
  const content = buildPaymentContent(roomRequest.requestCode);

  return {
    paymentBankAccountName: env.bankAccountName,
    paymentBankAccountNumber: env.bankAccountNumber,
    paymentBankBin: env.bankBin,
    paymentBankName: env.bankName,
    paymentContent: content,
    paymentQrCode: roomRequest.paymentQrCode || buildVietQrUrl({ amount: roomRequest.amount, content }),
  };
};

module.exports = {
  buildBankTransferPayment,
  buildPaymentContent,
  buildVietQrUrl,
};
