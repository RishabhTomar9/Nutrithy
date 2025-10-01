const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const verifyFirebaseToken = require('../auth/verifyFirebaseToken');
const uploadProfileImage = require('../middleware/uploadProfileImage');

// Public routes
router.get('/:userId', userProfileController.getUserProfile);

// Protected routes (require authentication)
router.get('/me', verifyFirebaseToken, userProfileController.getCurrentUserProfile);


// Follow/unfollow routes
router.post('/:userId/follow', verifyFirebaseToken, userProfileController.followUser);
router.post('/:userId/unfollow', verifyFirebaseToken, userProfileController.unfollowUser);

// Followers/following routes
router.get('/:userId/followers', userProfileController.getUserFollowers);
router.get('/:userId/following', userProfileController.getUserFollowing);

module.exports = router;