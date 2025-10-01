const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Profile = require("../models/Profile");
const verifyFirebaseToken = require("../auth/verifyFirebaseToken");

// POST /api/users/register
router.post("/register", verifyFirebaseToken, async (req, res) => {
  try {
    const { name, email, photo, dob, age, gender, weight, height, phone, bloodGroup, medicalHistory } = req.body;
    const { uid } = req.user;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and Email are required" });
    }
    if (weight && (isNaN(weight) || weight < 0 || weight > 500)) {
      return res.status(400).json({ message: "Weight must be a valid number (0-500)" });
    }
    if (height && (isNaN(height) || height < 0 || height > 300)) {
      return res.status(400).json({ message: "Height must be a valid number (0-300)" });
    }

    // Upsert base user doc (name/photo/email)
    await User.findOneAndUpdate(
      { $or: [{ uid }, { email }] },
      { $set: { uid, name, email, photo } },
      { upsert: true }
    );

    // Upsert profile by uid and mark completed
    const filter = { uid };

    // Calculate BMI (optional)
    let bmi = "";
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    // Default daily calories & goal
    const dailyCalories = "1800 kcal";
    const goalStatus = "On Track";

    const update = {
      $set: {
        uid,
        // Only allow specific fields to be set to protect against mass assignment
        name,
        email,
        photo,
        dob,
        age,
        gender,
        weight,
        height,
        bmi,
        phone,
        bloodGroup,
        medicalHistory,
        dailyCalories,
        goalStatus,
        profileCompleted: true,
      },
    };

    const options = { new: true, upsert: true };
    const profile = await Profile.findOneAndUpdate(filter, update, options);
    await User.findOneAndUpdate({ uid }, { $set: { profileCompleted: true } });

    // Limit response to non-sensitive profile fields
    const safe = {
      uid: profile.uid,
      dob: profile.dob,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      bmi: profile.bmi,
      bloodGroup: profile.bloodGroup,
      medicalHistory: profile.medicalHistory,
      dailyCalories: profile.dailyCalories,
      goalStatus: profile.goalStatus,
      phone: profile.phone,
    };
    res.status(201).json({ message: "User registered successfully", profile: safe, profileCompleted: true });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
