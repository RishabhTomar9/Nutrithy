require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const recipeRoutes = require("./routes/recipeRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const userRegistrationRoute = require("./routes/userRegistrationRoute");
const userProfileRoutes = require("./routes/userProfileRoutes");
const dietPlanRoutes = require("./routes/dietPlanRoutes");
const communityRoutes = require("./routes/communityRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const callRoutes = require("./routes/callRoutes");
const socketHandler = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// Middleware
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173" ;
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());

// Basic rate limit for auth/profile routes
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use("/api/users", apiLimiter);
app.use("/api/recipes", apiLimiter);
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/recipes", recipeRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/calls", callRoutes);

// ✅ Users routes
app.use("/api/users", userRoutes); // existing user operations (login, profile, etc.)
app.use("/api/users", userRegistrationRoute); // registration route
app.use("/api/users", userProfileRoutes); // user profile routes

// WebSocket
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
socketHandler(io);

// Debug route for testing
app.get('/debug', (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '..', 'frontend-debug.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
