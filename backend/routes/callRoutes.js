const express = require('express');
const verifyFirebaseToken = require('../auth/verifyFirebaseToken');
const CallHistory = require('../models/CallHistory');
const User = require('../models/User');
const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /api/calls/history - Get user's call history
router.get('/history', async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      limit = 50,
      offset = 0,
      callType,
      status,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (callType) options.callType = callType;
    if (status) options.status = status;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const callHistory = await CallHistory.getUserCallHistory(uid, options);
    
    // Get total count for pagination
    const totalCount = await CallHistory.countDocuments({
      userId: uid,
      ...(callType && { callType }),
      ...(status && { status }),
      ...(startDate || endDate) && {
        startTime: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      }
    });

    res.json({
      success: true,
      data: callHistory,
      pagination: {
        total: totalCount,
        limit: options.limit,
        offset: options.offset,
        hasMore: totalCount > options.offset + options.limit
      }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
});

// GET /api/calls/stats - Get call statistics
router.get('/stats', async (req, res) => {
  try {
    const { uid } = req.user;
    const { days = 30 } = req.query;

    const stats = await CallHistory.getCallStats(uid, parseInt(days));
    
    const result = stats.length > 0 ? stats[0] : {
      totalCalls: 0,
      outgoingCalls: 0,
      incomingCalls: 0,
      missedCalls: 0,
      totalDuration: 0,
      avgDuration: 0
    };

    // Format durations for frontend
    result.formattedTotalDuration = formatDuration(result.totalDuration);
    result.formattedAvgDuration = formatDuration(result.avgDuration);

    res.json({
      success: true,
      data: result,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call statistics',
      error: error.message
    });
  }
});

// POST /api/calls/history - Create call history entry (for manual logging)
router.post('/history', async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      otherParticipantPhone,
      otherParticipantName,
      callType,
      status,
      startTime,
      endTime,
      duration,
      connectionQuality,
      roomId,
      metadata
    } = req.body;

    // Validation
    if (!otherParticipantPhone || !callType || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: otherParticipantPhone, callType, status'
      });
    }

    // Get user details
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const callRecord = await CallHistory.createCallRecord({
      userId: uid,
      userPhone: user.phone || 'Unknown',
      userName: user.name || user.displayName || 'Unknown',
      otherParticipantPhone,
      otherParticipantName: otherParticipantName || 'Unknown',
      callType,
      status,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      duration: duration || 0,
      connectionQuality: connectionQuality || 'good',
      roomId,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Call history entry created',
      data: callRecord
    });
  } catch (error) {
    console.error('Create call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call history entry',
      error: error.message
    });
  }
});

// PUT /api/calls/history/:id - Update call history entry
router.put('/history/:id', async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.userId;
    delete updates.userPhone;
    delete updates.userName;

    const callRecord = await CallHistory.findOneAndUpdate(
      { _id: id, userId: uid },
      { $set: updates },
      { new: true }
    );

    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: 'Call history entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Call history updated',
      data: callRecord
    });
  } catch (error) {
    console.error('Update call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call history entry',
      error: error.message
    });
  }
});

// DELETE /api/calls/history/:id - Delete call history entry
router.delete('/history/:id', async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const result = await CallHistory.findOneAndDelete({
      _id: id,
      userId: uid
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Call history entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Call history entry deleted'
    });
  } catch (error) {
    console.error('Delete call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call history entry',
      error: error.message
    });
  }
});

// GET /api/calls/frequent-contacts - Get frequently called contacts
router.get('/frequent-contacts', async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 10 } = req.query;

    const frequentContacts = await CallHistory.aggregate([
      {
        $match: {
          userId: uid,
          startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        }
      },
      {
        $group: {
          _id: '$otherParticipantPhone',
          name: { $last: '$otherParticipantName' },
          totalCalls: { $sum: 1 },
          lastCall: { $max: '$startTime' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { totalCalls: -1, lastCall: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          phone: '$_id',
          name: 1,
          totalCalls: 1,
          lastCall: 1,
          formattedAvgDuration: {
            $concat: [
              { $toString: { $floor: { $divide: ['$avgDuration', 60000] } } },
              ':',
              { $let: {
                vars: { seconds: { $floor: { $divide: [{ $mod: ['$avgDuration', 60000] }, 1000] } } },
                in: { $cond: [{ $lt: ['$$seconds', 10] }, { $concat: ['0', { $toString: '$$seconds' }] }, { $toString: '$$seconds' }] }
              }}
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: frequentContacts
    });
  } catch (error) {
    console.error('Get frequent contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch frequent contacts',
      error: error.message
    });
  }
});

// GET /api/calls/missed - Get missed calls count
router.get('/missed', async (req, res) => {
  try {
    const { uid } = req.user;
    
    const missedCount = await CallHistory.countDocuments({
      userId: uid,
      status: 'missed',
      startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      success: true,
      data: { count: missedCount }
    });
  } catch (error) {
    console.error('Get missed calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch missed calls count',
      error: error.message
    });
  }
});

// Utility function to format duration
function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds === 0) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = router;