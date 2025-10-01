const mongoose = require("mongoose");

const weightTrackingSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Weight measurement
    weight: { type: Number, required: true }, // kg
    timestamp: { type: Date, default: Date.now },
    
    // Additional body measurements (optional)
    bodyFatPercentage: { type: Number },
    muscleMass: { type: Number }, // kg
    bmi: { type: Number },
    
    // Metadata
    notes: { type: String },
    verified: { type: Boolean, default: false },
    
    // Measurement context
    measurementTime: { 
      type: String, 
      enum: ['morning', 'afternoon', 'evening', 'before_workout', 'after_workout'],
      default: 'morning' 
    },
    
    // Equipment used
    scale: { type: String }, // Scale model or identifier
    
    // Additional measurements
    measurements: {
      waist: { type: Number }, // cm
      chest: { type: Number }, // cm
      hips: { type: Number }, // cm
      arms: { type: Number }, // cm
      thighs: { type: Number } // cm
    }
  },
  { timestamps: true }
);

// Index for efficient queries
weightTrackingSchema.index({ userId: 1, timestamp: -1 });

const WeightTracking = mongoose.model("WeightTracking", weightTrackingSchema);

module.exports = WeightTracking;
