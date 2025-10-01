const mongoose = require("mongoose");

const dietPlanSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  name: { type: String, required: true },
  formData: {
    age: String,
    weight: String,
    height: String,
    activityLevel: String,
    goal: String,
    dietaryPreference: String,
    mealPreference: String,
    allergies: String,
    medicalConditions: String,
    fitnessLevel: String
  },
  plan: {
    calories: Number,
    macros: {
      protein: Number,
      carbs: Number,
      fats: Number
    },
    hydration: String,
    meals: {
      Breakfast: [String],
      Lunch: [String],
      Snack: [String],
      Dinner: [String]
    },
    tips: [String],
    weeklyPlan: {
      Monday: String,
      Tuesday: String,
      Wednesday: String,
      Thursday: String,
      Friday: String,
      Saturday: String,
      Sunday: String
    },
    exerciseRecommendations: [String],
    nutritionAnalysis: {
      strengths: [String],
      considerations: [String]
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("DietPlan", dietPlanSchema);