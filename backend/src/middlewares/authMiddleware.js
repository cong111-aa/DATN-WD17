const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorized, token missing");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.status !== "active") {
      res.status(401);
      throw new Error("Not authorized, user inactive or not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }

  res.status(403);
  next(new Error("Admin access required"));
};

module.exports = { adminOnly, protect };
