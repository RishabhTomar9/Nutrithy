const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema({
  // User who initiated or received the call
  userId: {
    type: String,
    required: true,
    index: true
  },
  userPhone: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  
  // Other participant details
  otherParticipantPhone: {
    type: String,
    required: true
  },
  otherParticipantName: {
    type: String,
    default: 'Unknown'
  },
  otherParticipantId: {
    type: String // Socket ID or user ID if available
  },
  
  // Call details
  callType: {
    type: String,
    enum: ['outgoing', 'incoming', 'missed'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'rejected', 'failed'],
    required: true
  },
  
  // Timing information
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in milliseconds
    default: 0
  },
  
  // Call quality and technical details
  connectionQuality: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'failed'],
    default: 'good'
  },
  
  // Room and session info
  roomId: {
    type: String
  },
  sessionId: {
    type: String
  },
  
  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    failureReason: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
callHistorySchema.index({ userId: 1, startTime: -1 });
callHistorySchema.index({ userPhone: 1, startTime: -1 });
callHistorySchema.index({ otherParticipantPhone: 1, startTime: -1 });
callHistorySchema.index({ callType: 1, status: 1 });

// Virtual for formatted duration
callHistorySchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  
  const totalSeconds = Math.floor(this.duration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Instance method to mark call as completed
callHistorySchema.methods.markCompleted = function(endTime = new Date()) {
  this.endTime = endTime;
  this.status = 'completed';
  this.duration = endTime.getTime() - this.startTime.getTime();
  return this.save();
};

// Static method to create call history entry
callHistorySchema.statics.createCallRecord = function(data) {
  return this.create({
    userId: data.userId,
    userPhone: data.userPhone,
    userName: data.userName,
    otherParticipantPhone: data.otherParticipantPhone,
    otherParticipantName: data.otherParticipantName || 'Unknown',
    otherParticipantId: data.otherParticipantId,
    callType: data.callType,
    status: data.status || 'completed',
    startTime: data.startTime || new Date(),
    endTime: data.endTime,
    duration: data.duration || 0,
    connectionQuality: data.connectionQuality || 'good',
    roomId: data.roomId,
    sessionId: data.sessionId,
    metadata: data.metadata || {}
  });
};

// Static method to get user's call history
callHistorySchema.statics.getUserCallHistory = function(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    callType = null,
    status = null,
    startDate = null,
    endDate = null
  } = options;
  
  let query = { userId };
  
  if (callType) query.callType = callType;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ startTime: -1 })
    .limit(limit)
    .skip(offset)
    .exec();
};

// Static method to get call statistics
callHistorySchema.statics.getCallStats = function(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        startTime: { $gte: since }
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        outgoingCalls: {
          $sum: { $cond: [{ $eq: ['$callType', 'outgoing'] }, 1, 0] }
        },
        incomingCalls: {
          $sum: { $cond: [{ $eq: ['$callType', 'incoming'] }, 1, 0] }
        },
        missedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('CallHistory', callHistorySchema);