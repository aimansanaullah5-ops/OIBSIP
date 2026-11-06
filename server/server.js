const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Create the HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Make Socket.IO accessible in controllers using req.app.get("io")
app.set("io", io);

// Handle Socket.IO connections

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support common customer JWT ID field names
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId || decoded.role === "admin") {
      return next(new Error("Customer authentication required"));
    }

    socket.data.userId = String(userId);
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  console.log("Customer tracking connected:", userId);

  socket.on("disconnect", () => {
    console.log("Customer tracking disconnected:", userId);
  });
});


// Start the database connection before listening
async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
