require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
// const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
app.set("io", io);

connectDB();

// Middleware
// app.use(helmet({
//   crossOriginResourcePolicy: false,
// }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});