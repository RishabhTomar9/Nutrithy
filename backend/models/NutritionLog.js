const mongoose = require("mongoose");

const nutritionLogSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    date: { 
      type: Date, 
      required: true,
      index: true 
    },
    
    // Food item details
    foodId: { type: String }, // External food database ID (optional)
    name: { type: String, required: true },
    brand: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }, // 'grams', 'cups', 'pieces', etc.
    
    // Meal information
    mealType: { 
      type: String, 
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true 
    },
    consumedAt: { type: Date, default: Date.now },
    
    // Nutrition values (per serving logged)
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 }, // grams
      carbohydrates: { type: Number, default: 0 }, // grams
      fat: { type: Number, default: 0 }, // grams
      fiber: { type: Number, default: 0 }, // grams
      sugar: { type: Number, default: 0 }, // grams
      sodium: { type: Number, default: 0 }, // mg
      
      // Vitamins and minerals (optional)
      vitaminA: { type: Number, default: 0 }, // mcg
      vitaminC: { type: Number, default: 0 }, // mg
      calcium: { type: Number, default: 0 }, // mg
      iron: { type: Number, default: 0 } // mg
    },
    
    // Additional metadata
    notes: { type: String },
    verified: { type: Boolean, default: false }, // Whether nutrition data is verified
    source: { 
      type: String, 
      enum: ['manual', 'barcode', 'recipe', 'database'],
      default: 'manual' 
    }
  },
  { timestamps: true }
);

// Compound index for efficient date-based queries
nutritionLogSchema.index({ userId: 1, date: 1 });
nutritionLogSchema.index({ userId: 1, mealType: 1 });

const NutritionLog = mongoose.model("NutritionLog", nutritionLogSchema);

module.exports = NutritionLog;
