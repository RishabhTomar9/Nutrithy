const express = require("express");
const Room = require("../models/Room");
const router = express.Router();

// Search Rooms by ID
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const rooms = await Room.find({ roomID: { $regex: query, $options: "i" } });
    res.json(rooms);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Failed to search rooms" });
  }
});

module.exports = router;
