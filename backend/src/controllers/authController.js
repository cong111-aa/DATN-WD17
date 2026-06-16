const generateToken = require("../utils/generateToken");

const toAuthResponse = (user) => ({
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
  token: generateToken(user._id),
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const User = require("../models/User");
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      res.status(403);
      throw new Error("Account is inactive");
    }

    res.json(toAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;
    user.address = req.body.address ?? user.address;
    user.identityNumber = req.body.identityNumber ?? user.identityNumber;
    user.identityFrontImage = req.body.identityFrontImage ?? user.identityFrontImage;
    user.identityBackImage = req.body.identityBackImage ?? user.identityBackImage;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json(toAuthResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, login, updateProfile };
