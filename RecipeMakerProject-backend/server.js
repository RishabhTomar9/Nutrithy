// server.js
require("dotenv").config(); // ✅ Load environment variables

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ===== Mongoose Schemas =====
const userSchema = new mongoose.Schema({
  socketId: String,
  uid: String,
  displayName: String,
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  roomID: String,
  hostSocketId: String,
  createdAt: { type: Date, default: Date.now },
  users: [userSchema],
});

const Room = mongoose.model("Room", roomSchema);

// Example Recipe Schema
const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  ingredients: [String],
  cookTime: String,
  steps: [String],
  createdAt: { type: Date, default: Date.now },
});
const Recipe = mongoose.model("Recipe", recipeSchema);

// ===== REST API: Search Rooms =====
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const rooms = await Room.find({ roomID: { $regex: query, $options: "i" } });
    res.json(rooms);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Failed to search rooms" });
  }
});

// GET all recipes
app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// POST a new recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ error: "Failed to create recipe" });
  }
});

// ===== WebSocket Setup =====
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};        // In-memory room map
const socketToUser = {}; // Map of socketId => user

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("check-room", (roomID, cb) => cb(!!rooms[roomID]));

  socket.on("create-room", async ({ roomID, user }) => {
    if (!rooms[roomID]) {
      rooms[roomID] = { host: socket.id, users: { [socket.id]: user } };
      socketToUser[socket.id] = user;
      socket.join(roomID);
      await Room.create({
        roomID,
        hostSocketId: socket.id,
        users: [{ socketId: socket.id, ...user }],
      });
      console.log(`🏠 Room created: ${roomID}`);
    }
  });

  socket.on("request-to-join", ({ roomID, user }) => {
    const room = rooms[roomID];
    if (room) {
      socketToUser[socket.id] = user;
      io.to(room.host).emit("new-join-request", { from: socket.id, user });
    }
  });

  socket.on("respond-to-request", ({ to, roomID, accepted }) => {
    if (accepted) {
      io.to(to).emit("request-accepted");
    } else {
      io.to(to).emit("request-declined");
      delete socketToUser[to];
    }
  });

  socket.on("join-room", async ({ roomID, user }) => {
    const room = rooms[roomID];
    if (!room) return;

    room.users[socket.id] = user;
    socketToUser[socket.id] = user;
    socket.join(roomID);

    const otherUsers = { ...room.users };
    delete otherUsers[socket.id];

    socket.emit("all-users", otherUsers);

    await Room.findOneAndUpdate(
      { roomID },
      { $push: { users: { socketId: socket.id, ...user } } }
    );
  });

  socket.on("sending-signal", ({ userToSignal, callerID, signal }) => {
    io.to(userToSignal).emit("user-joined", {
      signal,
      callerID,
      user: socketToUser[callerID],
    });
  });

  socket.on("returning-signal", ({ callerID, signal }) => {
    io.to(callerID).emit("receiving-returned-signal", {
      signal,
      id: socket.id,
    });
  });

  socket.on("toggle-mic", ({ roomID, micOn }) => {
    socket.to(roomID).emit("user-toggled-mic", {
      userID: socket.id,
      micOn,
    });
  });

  socket.on("toggle-video", ({ roomID, videoOn }) => {
    socket.to(roomID).emit("user-toggled-video", {
      userID: socket.id,
      videoOn,
    });
  });

  const handleDisconnect = async () => {
    const user = socketToUser[socket.id];
    if (!user) return;

    let roomID;
    for (const id in rooms) {
      if (rooms[id].users[socket.id]) {
        roomID = id;
        break;
      }
    }

    if (roomID) {
      const room = rooms[roomID];
      delete room.users[socket.id];

      if (socket.id === room.host) {
        Object.keys(room.users).forEach((uid) =>
          io.to(uid).emit("host-left")
        );
        delete rooms[roomID];
        await Room.deleteOne({ roomID });
      } else {
        io.to(roomID).emit("user-disconnected", socket.id);
        await Room.findOneAndUpdate(
          { roomID },
          { $pull: { users: { socketId: socket.id } } }
        );
      }
    }

    delete socketToUser[socket.id];
    console.log(`❌ Disconnected: ${socket.id}`);
  };

  socket.on("leave-room", handleDisconnect);
  socket.on("disconnect", handleDisconnect);
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
