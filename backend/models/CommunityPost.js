const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  author: { type: String, required: true },
  authorImage: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const communityPostSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  author: { type: String, required: true },
  authorImage: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
  commentCount: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  tags: [{ type: String }],
  recipe: {
    recipeId: { type: String },
    title: { type: String },
    image: { type: String },
    description: { type: String },
  },
  likedBy: [{ type: String }], // Array of user UIDs who liked the post
  sharedBy: [{ type: String }], // Array of user UIDs who shared the post
}, { timestamps: true });

// Create text index for search functionality
communityPostSchema.index({ content: 'text', author: 'text', tags: 'text' });

module.exports = mongoose.model("CommunityPost", communityPostSchema);