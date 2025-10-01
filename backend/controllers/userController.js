const User = require('../models/User');
const Profile = require('../models/Profile');
const UserSearch = require('../models/UserSearch');

// Login user (upsert from Firebase claims)
exports.loginUser = async (req, res) => {
  try {
    const { uid, name, email, picture } = req.user;
    
    // Find or create user
    let user = await User.findOne({ uid });
    
    if (!user) {
      user = await User.create({
        uid,
        name,
        email,
        photo: picture,
        profileCompleted: false
      });
    }
    
    // Check if profile exists
    const profile = await Profile.findOne({ uid });
    const profileCompleted = !!profile;
    
    res.json({ user, profileCompleted });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user with profile
exports.getCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;

    const user = await User.findOne({ uid }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await Profile.findOne({ uid }).lean();

    // Combine user and profile data into a single object
    const fullProfile = { ...user, ...profile };

    // If there's a profile, calculate age from DOB
    if (profile && profile.dob) {
      const dob = new Date(profile.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      fullProfile.age = age;
    }
    
    // Ensure displayName and photoURL are consistent
    fullProfile.displayName = fullProfile.displayName || user.name;
    fullProfile.photoURL = fullProfile.photoURL || user.photo;


    res.status(200).json(fullProfile);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Record user search
exports.recordSearch = async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      query,
      recipeId,
      recipeTitle,
      image,
      description,
      ingredients,
      cookTime,
      steps,
    } = req.body || {};
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const created = await UserSearch.create({
      uid,
      query,
      recipeId,
      recipeTitle,
      image,
      description,
      ingredients,
      cookTime,
      steps,
      isFavorite: false,
    });
    
    return res.status(201).json({ search: created });
  } catch (error) {
    console.error('Record search error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get recent searches
exports.getRecentSearches = async (req, res) => {
  try {
    const { uid } = req.user;
    const items = await UserSearch.find({ uid })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    return res.json({ searches: items });
  } catch (error) {
    console.error('Recent searches error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Mark search as favorite
exports.markSearchAsFavorite = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const updated = await UserSearch.findOneAndUpdate(
      { _id: id, uid },
      { $set: { isFavorite: true } },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    return res.json({ search: updated });
  } catch (error) {
    console.error('Mark favorite error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Remove search from favorites
exports.removeSearchFromFavorites = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const updated = await UserSearch.findOneAndUpdate(
      { _id: id, uid },
      { $set: { isFavorite: false } },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    return res.json({ search: updated });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get favorite searches
exports.getFavoriteSearches = async (req, res) => {
  try {
    const { uid } = req.user;
    const items = await UserSearch.find({ uid, isFavorite: true })
      .sort({ createdAt: -1 })
      .lean();
    
    return res.json({ favorites: items });
  } catch (error) {
    console.error('Favorite searches error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};