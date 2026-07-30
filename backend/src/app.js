const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const path = require("path");

const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const contractRoutes = require("./routes/contractRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const meterReadingRoutes = require("./routes/meterReadingRoutes");
const meRoutes = require("./routes/meRoutes");
const operatingExpenseRoutes = require("./routes/operatingExpenseRoutes");
const repairRequestRoutes = require("./routes/repairRequestRoutes");
const roomRequestRoutes = require("./routes/roomRequestRoutes");
const roomRoutes = require("./routes/roomRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running", status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ message: "API is healthy", status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/meter-readings", meterReadingRoutes);
app.use("/api/me", meRoutes);
app.use("/api/operating-expenses", operatingExpenseRoutes);
app.use("/api/repair-requests", repairRequestRoutes);
app.use("/api/room-requests", roomRequestRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
