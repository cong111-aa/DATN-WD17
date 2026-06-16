const connectDB = require("../src/config/db");
const User = require("../src/models/User");

const seedAdmin = async () => {
  await connectDB();

  const name = process.env.ADMIN_NAME || "Admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "123456";

  const admin = await User.findOne({ email });

  if (admin) {
    admin.name = name;
    admin.password = password;
    admin.role = "admin";
    admin.status = "active";
    await admin.save();
    console.log(`Admin updated: ${email}`);
  } else {
    await User.create({ name, email, password, role: "admin", status: "active" });
    console.log(`Admin created: ${email}`);
  }

  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
