const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  resource_type: { type: String },
  format: { type: String },
  width: { type: Number },
  height: { type: Number },
  bytes: { type: Number },
  public_id: { type: String }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  uid: { type: String, required: true, index: true },
  author: { type: String, required: true },
  authorImage: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

// Top-level CommunityPost schema (update/add fields as needed)
const CommunityPostSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  author: { type: String, required: true },
  authorImage: { type: String },
  content: { type: String, required: true },
  media: { type: [mediaSchema], default: [] }, // array of media objects (max 5 enforced by controller)
  tags: [{ type: String }],
  recipe: { type: mongoose.Schema.Types.Mixed },
  commentsCount: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);