const User = require("../models/User");

const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      identityNumber,
      identityFrontImage,
      identityBackImage,
      role = "user",
      status = "active",
    } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    if (!["admin", "user"].includes(role)) {
      res.status(400);
      throw new Error("Invalid role");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400);
      throw new Error("Email already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      identityNumber,
      identityFrontImage,
      identityBackImage,
      role,
      status,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getUsers };
