const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  socketId: String,
  uid: String,
  displayName: String,
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        // Basic phone number validation (allows various formats)
        return /^[+]?[1-9]\d{1,14}$/.test(v.replace(/[\s()-]/g, ''));
      },
      message: 'Invalid phone number format'
    }
  },
  roomID: String,
  hostSocketId: String,
  ownerName: String,
  isAvailable: { type: Boolean, default: true },
  inCall: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  users: [userSchema],
});

module.exports = mongoose.model("Room", roomSchema);
