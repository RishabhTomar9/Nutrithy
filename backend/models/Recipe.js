const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  ingredients: [String],
  cookTime: String,
  steps: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Recipe", recipeSchema);
