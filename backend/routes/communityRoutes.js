const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const verifyFirebaseToken = require('../auth/verifyFirebaseToken');
const multer = require('multer');
const upload = multer(); // memory storage, we stream buffer to Cloudinary

// Public routes (no authentication required)
router.get('/', communityController.getAllPosts);
router.get('/search', communityController.searchPosts);
router.get('/user/:uid', communityController.getUserPosts);
router.get('/:id', communityController.getPostById);

// Protected routes (require authentication)
// Accept up to 5 files in the "media" field
router.post('/', verifyFirebaseToken, upload.array('media', 5), communityController.createPost);
router.put('/:id', verifyFirebaseToken, communityController.updatePost);
router.delete('/:id', verifyFirebaseToken, communityController.deletePost);

// Interaction routes
router.post('/:id/like', verifyFirebaseToken, communityController.likePost);

// Comment routes
router.post('/:id/comment', verifyFirebaseToken, communityController.addComment);
router.get('/:id/comments', communityController.getPostComments);
router.delete('/comments/:commentId', verifyFirebaseToken, communityController.deleteComment);
router.post('/comments/:commentId/like', verifyFirebaseToken, communityController.likeComment);
router.get('/comments/:commentId/replies', communityController.getCommentReplies);

module.exports = router;
