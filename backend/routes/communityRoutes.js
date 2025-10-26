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

module.exports = router;