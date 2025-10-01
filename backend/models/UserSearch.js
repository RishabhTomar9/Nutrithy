const mongoose = require("mongoose");

const userSearchSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    query: { type: String, required: true, trim: true },
    recipeId: { type: String },
    recipeTitle: { type: String },
    description: { type: String },
    ingredients: { type: [String], default: [] },
    cookTime: { type: String },
    steps: { type: [String], default: [] },
    image: { type: String },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSearch", userSearchSchema);


