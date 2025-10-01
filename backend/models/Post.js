const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      name: { type: String, required: true },
      photo: { type: String },
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      default: '',
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 30,
    }],
    likes: {
      count: { type: Number, default: 0 },
      users: [{ type: String }], // Array of user UIDs who liked the post
    },
    comments: {
      count: { type: Number, default: 0 },
    },
    shares: {
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Create text index for search functionality
PostSchema.index({ content: 'text', 'author.name': 'text', tags: 'text' });

module.exports = mongoose.model('Post', PostSchema);