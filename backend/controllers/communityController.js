const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// configure Cloudinary using env vars (set in backend .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all community posts with pagination
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Apply filters if needed
    if (filter === 'trending') {
      // Sort by most likes and comments in the last week
      query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (filter === 'following') {
      // In a real app, we would fetch posts from users that the current user follows
      // For now, just return all posts as we don't have a following system yet
    }
    
    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 }) // Latest posts first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await CommunityPost.countDocuments(query);
    
    // Check if the current user has liked any of these posts
    if (req.user && req.user.uid) {
      const uid = req.user.uid;
      posts.forEach(post => {
        post.isLiked = post.likedBy.includes(uid);
        // Remove the likedBy array from the response to reduce payload size
        delete post.likedBy;
        delete post.sharedBy;
      });
    }
    
    return res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return res.status(500).json({ error: 'Failed to fetch community posts' });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).lean();
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if the current user has liked this post
    if (req.user && req.user.uid) {
      post.isLiked = post.likedBy.includes(req.user.uid);
      // Remove the likedBy array from the response
      delete post.likedBy;
      delete post.sharedBy;
    }
    
    return res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// Add a post (with optional images/videos uploaded to Cloudinary)
exports.createPost = async (req, res) => {
  try {
    // use authenticated uid when verifyFirebaseToken sets req.user
    const uid = (req.user && req.user.uid) || req.body.uid;
    const { author, content, authorImage, tags, recipe } = req.body;
    if (!uid || !author || !content) {
      return res.status(400).json({ message: 'uid, author and content are required' });
    }

    const files = req.files || [];
    if (files.length > 5) {
      return res.status(400).json({ message: 'You can upload up to 5 media files.' });
    }

    const media = [];
    for (const file of files) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'community' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      media.push({
        url: uploadResult.secure_url,
        resource_type: uploadResult.resource_type,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        public_id: uploadResult.public_id,
      });
    }

    // Parse tags if sent as JSON string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const newPost = new CommunityPost({
      uid,
      author,
      authorImage: authorImage || null,
      content,
      media,
      tags: parsedTags,
      recipe: recipe ? (typeof recipe === 'string' ? JSON.parse(recipe) : recipe) : undefined,
    });

    await newPost.save();

    return res.status(201).json(newPost);
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image, tags } = req.body;
    const { uid } = req.user;
    
    // Find the post and check ownership
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only allow the post owner to update it
    if (post.uid !== uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    // Update only allowed fields
    post.content = content || post.content;
    post.image = image || post.image;
    post.tags = tags || post.tags;
    
    await post.save();
    
    return res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    // Find the post and check ownership
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only allow the post owner to delete it
    if (post.uid !== uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await CommunityPost.findByIdAndDelete(id);
    
    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.likedBy.includes(uid);
    
    if (alreadyLiked) {
      // Unlike the post
      post.likedBy = post.likedBy.filter(id => id !== uid);
      post.likes = Math.max(0, post.likes - 1); // Ensure likes don't go below 0
    } else {
      // Like the post
      post.likedBy.push(uid);
      post.likes += 1;
    }
    
    await post.save();
    
    return res.json({
      likes: post.likes,
      isLiked: !alreadyLiked
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return res.status(500).json({ error: 'Failed to like post' });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;
    const { uid } = req.user;
    
    // Basic validation
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Find the post first
    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Get user info - simplified approach
    let author = uid.substring(0, 8);
    let authorImage = null;
    
    try {
      const user = await User.findOne({ uid }).lean();
      if (user) {
        author = user.displayName || user.name || author;
        authorImage = user.photoURL || user.photo || null;
      }
    } catch (userError) {
      console.error('Error fetching user, using fallback:', userError);
      // Continue with fallback values
    }
    
    // Create a simple comment object
    const comment = {
      _id: new mongoose.Types.ObjectId(),
      uid,
      author,
      authorImage,
      content: content.trim(),
      createdAt: new Date(),
      likes: 0,
      likedBy: []
    };
    
    // Add comment to post
    post.comments.push(comment);
    post.commentCount = post.comments.length;
    
    // Save with error handling
    try {
      await post.save();
    } catch (saveError) {
      console.error('Error saving post with new comment:', saveError);
      return res.status(500).json({ error: 'Failed to save comment to database' });
    }
    
    // Return a plain object with string ID
    return res.status(201).json({
      _id: comment._id.toString(),
      uid: comment.uid,
      author: comment.author,
      authorImage: comment.authorImage,
      content: comment.content,
      createdAt: comment.createdAt,
      likes: 0,
      likedBy: []
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get comments for a post with pagination
exports.getPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Sort comments by creation date (newest first) and apply pagination
    const comments = post.comments
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + parseInt(limit));
    
    return res.status(200).json({
      comments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(post.comments.length / limit),
      totalComments: post.comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Get replies for a comment
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // In the current model, we don't have a separate collection for replies
    // This is a placeholder for future implementation
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { uid } = req.user;
    
    // Find the post containing the comment
    const post = await CommunityPost.findOne({ 'comments._id': commentId });
    
    if (!post) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Find the comment in the post
    const comment = post.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the author of the comment
    if (comment.uid !== uid) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Remove the comment
    comment.remove();
    post.commentCount = post.comments.length;
    
    await post.save();
    
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // In the current model, we don't track likes on comments
    // This is a placeholder for future implementation
    return res.status(200).json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
};

// Share a post
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user already shared the post
    const alreadyShared = post.sharedBy.includes(uid);
    
    if (!alreadyShared) {
      post.sharedBy.push(uid);
      post.shares += 1;
      await post.save();
    }
    
    return res.json({
      shares: post.shares
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    return res.status(500).json({ error: 'Failed to share post' });
  }
};

// Get posts by user
exports.getUserPosts = async (req, res) => {
  try {
    const { uid } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const posts = await CommunityPost.find({ uid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await CommunityPost.countDocuments({ uid });
    
    // Check if the current user has liked any of these posts
    if (req.user && req.user.uid) {
      const currentUid = req.user.uid;
      posts.forEach(post => {
        post.isLiked = post.likedBy.includes(currentUid);
        // Remove the likedBy array from the response
        delete post.likedBy;
        delete post.sharedBy;
      });
    }
    
    return res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
};

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Use text index for more efficient searching
    const posts = await CommunityPost.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await CommunityPost.countDocuments({ $text: { $search: q } });
    
    // If text search returns no results, fall back to regex search
    if (posts.length === 0) {
      const regexQuery = {
        $or: [
          { content: { $regex: q, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };
      
      const regexPosts = await CommunityPost.find(regexQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const regexTotal = await CommunityPost.countDocuments(regexQuery);
      
      // Check if the current user has liked any of these posts
      if (req.user && req.user.uid) {
        const uid = req.user.uid;
        regexPosts.forEach(post => {
          post.isLiked = post.likedBy.includes(uid);
          // Remove the likedBy array from the response
          delete post.likedBy;
          delete post.sharedBy;
        });
      }
      
      return res.json({
        posts: regexPosts,
        totalPages: Math.ceil(regexTotal / limit),
        currentPage: parseInt(page),
        totalPosts: regexTotal,
        query: q,
        searchMethod: 'regex'
      });
    }
    
    // Check if the current user has liked any of these posts
    if (req.user && req.user.uid) {
      const uid = req.user.uid;
      posts.forEach(post => {
        post.isLiked = post.likedBy.includes(uid);
        // Remove the likedBy array from the response
        delete post.likedBy;
        delete post.sharedBy;
      });
    }
    
    return res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalPosts: total,
      query: q,
      searchMethod: 'text'
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    return res.status(500).json({ error: 'Failed to search posts' });
  }
};