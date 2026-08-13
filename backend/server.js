const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");
const { initSocket } = require("./src/socket");
const { startInvoiceOverdueChecker } = require("./src/services/invoiceOverdueService");
const { startExpiredPaymentLockReleaser } = require("./src/utils/roomPaymentLock");

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);

  initSocket(server);
  startExpiredPaymentLockReleaser();
  startInvoiceOverdueChecker();

  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
