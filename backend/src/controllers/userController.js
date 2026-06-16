const User = require("../models/User");

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  identityNumber: user.identityNumber,
  identityFrontImage: user.identityFrontImage,
  identityBackImage: user.identityBackImage,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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

    res.status(201).json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users.map(toUserResponse));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const {
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
    } = req.body;

    if (role && !["admin", "user"].includes(role)) {
      res.status(400);
      throw new Error("Invalid role");
    }

    if (status && !["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(400);
        throw new Error("Email already exists");
      }

      user.email = email;
    }

    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;
    user.address = address ?? user.address;
    user.identityNumber = identityNumber ?? user.identityNumber;
    user.identityFrontImage = identityFrontImage ?? user.identityFrontImage;
    user.identityBackImage = identityBackImage ?? user.identityBackImage;
    user.role = role ?? user.role;

    if (String(user._id) === String(req.user._id) && status === "inactive") {
      res.status(400);
      throw new Error("You cannot deactivate your own account");
    }

    user.status = status ?? user.status;

    if (password) {
      user.password = password;
    }

    const updatedUser = await user.save();
    res.json(toUserResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (String(user._id) === String(req.user._id) && status === "inactive") {
      res.status(400);
      throw new Error("You cannot deactivate your own account");
    }

    user.status = status;
    const updatedUser = await user.save();
    res.json(toUserResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (String(user._id) === String(req.user._id)) {
      res.status(400);
      throw new Error("You cannot delete your own account");
    }

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserStatus,
};
