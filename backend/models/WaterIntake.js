const mongoose = require("mongoose");

const waterIntakeSchema = new mongoose.Schema(
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
    
    // Water intake details
    amount: { type: Number, required: true }, // ml
    timestamp: { type: Date, default: Date.now },
    
    // Optional metadata
    source: { 
      type: String, 
      enum: ['water', 'juice', 'tea', 'coffee', 'sports_drink', 'other'],
      default: 'water' 
    },
    notes: { type: String }
  },
  { timestamps: true }
);

// Compound index for efficient date-based queries
waterIntakeSchema.index({ userId: 1, date: 1 });

const WaterIntake = mongoose.model("WaterIntake", waterIntakeSchema);

module.exports = WaterIntake;
