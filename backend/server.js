require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

// =========================
// ✅ INIT
// =========================
const app = express();
const server = http.createServer(app);

// =========================
// ✅ ALLOWED ORIGINS
// =========================
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
];

// =========================
// ✅ SOCKET.IO SETUP
// =========================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

// =========================
// ✅ DATABASE + REDIS
// =========================
connectDB();
connectRedis();

// =========================
// ✅ MIDDLEWARE
// =========================

// JSON parser
app.use(express.json());

// CORS (robust, safe)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
  })
);

// =========================
// ✅ ROUTES
// =========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// =========================
// ✅ TEST ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("GhostApp Backend Running 👻");
});

// =========================
// ✅ SOCKET HANDLER
// =========================
require("./socket/socket")(io);

// =========================
// ✅ PROTECTED TEST ROUTE
// =========================
const auth = require("./middleware/authMiddleware");

app.get("/api/protected", auth, (req, res) => {
  res.json({ message: "Protected route working", user: req.user });
});

// =========================
// ✅ START SERVER
// =========================
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;