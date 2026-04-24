require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const rateLimit = require("express-rate-limit");
// const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
app.set("io", io);

connectDB();

const { connectRedis } = require("./config/redis");
connectRedis();

// Middleware
// app.use(helmet({
//   crossOriginResourcePolicy: false,
// }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());



app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Test route
app.get("/", (req, res) => {
  res.send("GhostApp Backend Running 👻");
});

// Attach socket
require("./socket/socket")(io);
const auth = require("./middleware/authMiddleware");

app.get("/api/protected", auth, (req, res) => {
  res.json({ message: "Protected route working", user: req.user });
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;