const User = require('../models/User');
const Profile = require('../models/Profile');
const UserSearch = require('../models/UserSearch');

// Helper function to calculate age
function calculateAgeFromDob(dob) {
  if (!dob) return "";
  try {
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return String(age);
  } catch {
    return "";
  }
}

// Update user profile
// Unified: Forward to userProfileController.updateUserProfile
const userProfileController = require('./userProfileController');
exports.updateProfile = userProfileController.updateUserProfile;

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const { uid } = req.user;
    await Profile.deleteOne({ uid });
    await User.deleteOne({ uid });
    await UserSearch.deleteMany({ uid }); // Delete all related searches
    return res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};