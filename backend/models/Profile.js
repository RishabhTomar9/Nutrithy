const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  
  // Personal Info
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  interests: { type: [String], default: [] },
  
  // Culinary Info
  dietaryPreferences: { type: [String], default: [] },
  allergies: { type: [String], default: [] },
  cookingExperience: { 
    type: String, 
    enum: ["", "beginner", "intermediate", "advanced", "professional"], 
    default: "" 
  },
  favoriteIngredients: { type: [String], default: [] },

  // Health & Fitness (optional)
  phone: String,
  dob: String,
  gender: String,
  weight: Number,
  height: Number,
  
  // App settings
  notificationsEnabled: { type: Boolean, default: true },
  privacy: { type: String, enum: ["public", "private"], default: "public" },
  
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);


