const express = require("express");
const verifyFirebaseToken = require("../auth/verifyFirebaseToken");
const userController = require("../controllers/userController");
const router = express.Router();

// ✅ POST /api/users/login
router.post("/login", verifyFirebaseToken, userController.loginUser);

// ✅ GET /api/users/me
router.get("/me", verifyFirebaseToken, userController.getCurrentUser);

// ✅ POST /api/users/searches - record a search result click
router.post("/searches", verifyFirebaseToken, userController.recordSearch);

// ✅ GET /api/users/searches/recent
router.get("/searches/recent", verifyFirebaseToken, userController.getRecentSearches);

// ✅ POST /api/users/searches/:id/favorite
router.post("/searches/:id/favorite", verifyFirebaseToken, userController.markSearchAsFavorite);

// ✅ DELETE /api/users/searches/:id/favorite
router.delete("/searches/:id/favorite", verifyFirebaseToken, userController.removeSearchFromFavorites);

// ✅ GET /api/users/searches/favorites
router.get("/searches/favorites", verifyFirebaseToken, userController.getFavoriteSearches);

// Import profile controller and multer upload middleware
const profileController = require("../controllers/profileController");
const uploadProfileImage = require("../middleware/uploadProfileImage");

// ✅ PUT /api/users/profile (with image upload support)
router.put("/profile", verifyFirebaseToken, uploadProfileImage.single('profileImage'), profileController.updateProfile);

// ✅ DELETE /api/users/account
router.delete("/account", verifyFirebaseToken, profileController.deleteAccount);

module.exports = router;
