const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnail_url: String,
  resource_type: String,
  format: String,
  width: Number,
  height: Number,
  bytes: Number,
  public_id: String
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: String,
  cookTime: String,
  servings: Number,
  calories: Number,
  ingredients: [String],
  instructions: [String],
  nutritionInfo: mongoose.Schema.Types.Mixed
}, { _id: false });

const postSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  author: { type: String, required: true },
  authorImage: String,
  content: { type: String, required: true },
  media: [mediaSchema],
  tags: [String],
  recipe: recipeSchema,
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  isLiked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', postSchema);