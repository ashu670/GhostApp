const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) return next(new Error("Not authorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // Join personal room
    socket.join(socket.userId);

    // Listen for sending message
    socket.on("sendMessage", ({ receiverId, message }) => {
      io.to(receiverId).emit("receiveMessage", {
        senderId: socket.userId,
        message,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
    });
  });
};