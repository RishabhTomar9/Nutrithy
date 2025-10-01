const mongoose = require("mongoose");

const nutritionGoalSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true 
    },
    
    // Daily nutrition goals
    calories: { type: Number, default: 2000 },
    protein: { type: Number, default: 150 }, // grams
    carbohydrates: { type: Number, default: 250 }, // grams
    fat: { type: Number, default: 67 }, // grams
    fiber: { type: Number, default: 25 }, // grams
    sugar: { type: Number, default: 50 }, // grams
    sodium: { type: Number, default: 2300 }, // mg
    water: { type: Number, default: 2000 }, // ml
    
    // Goal metadata
    activityLevel: { 
      type: String, 
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      default: 'moderately_active'
    },
    goalType: { 
      type: String, 
      enum: ['maintain', 'lose', 'gain'],
      default: 'maintain'
    },
    targetWeightChange: { type: Number, default: 0 }, // kg per week
    
    // Auto-update settings
    autoUpdate: { type: Boolean, default: false },
    lastCalculated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const NutritionGoal = mongoose.model("NutritionGoal", nutritionGoalSchema);

module.exports = NutritionGoal;
