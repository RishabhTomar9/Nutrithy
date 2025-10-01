const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, index: true },

    // Core user info
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: String,

    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // Content
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],

    // Linked Profile
    profileCompleted: { type: Boolean, default: false },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
