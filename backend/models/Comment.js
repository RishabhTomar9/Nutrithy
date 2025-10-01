const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
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
      maxlength: 500,
    },
    likes: {
      count: { type: Number, default: 0 },
      users: [{ type: String }], // Array of user UIDs who liked the comment
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  { timestamps: true }
);

// Create index for faster queries
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });

module.exports = mongoose.model('Comment', CommentSchema);