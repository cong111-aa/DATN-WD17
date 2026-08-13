const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const env = require("./config/env");
const User = require("./models/User");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        throw new Error("Token missing");
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select("_id role status");

      if (!user || user.status !== "active") {
        throw new Error("User inactive or not found");
      }

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);
    socket.join(`role:${socket.user.role}`);
  });

  return io;
};

const getIo = () => io;

module.exports = { getIo, initSocket };
