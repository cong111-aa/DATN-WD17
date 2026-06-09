const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
