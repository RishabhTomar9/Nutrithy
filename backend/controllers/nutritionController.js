const NutritionGoal = require('../models/NutritionGoal');
const NutritionLog = require('../models/NutritionLog');
const WaterIntake = require('../models/WaterIntake');
const WeightTracking = require('../models/WeightTracking');
const User = require('../models/User');

// Helper function to get user ID from request
const getUserId = async (uid) => {
  const user = await User.findOne({ uid });
  return user?._id;
};

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  
  return { startDate, endDate: now };
};

// Helper function to get start of day
const getStartOfDay = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

const getEndOfDay = (date) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

// NUTRITION GOALS ENDPOINTS

// Get nutrition goals
exports.getNutritionGoals = async (req, res) => {
  try {
    const { uid } = req.user;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    let goals = await NutritionGoal.findOne({ userId });
    
    // Create default goals if none exist
    if (!goals) {
      goals = await NutritionGoal.create({
        userId,
        calories: 2000,
        protein: 150,
        carbohydrates: 250,
        fat: 67,
        fiber: 25,
        water: 2000
      });
    }

    res.json(goals);
  } catch (error) {
    console.error('Get nutrition goals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set/update nutrition goals
exports.setNutritionGoals = async (req, res) => {
  try {
    const { uid } = req.user;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const goals = await NutritionGoal.findOneAndUpdate(
      { userId },
      { ...req.body, userId },
      { new: true, upsert: true }
    );

    res.json(goals);
  } catch (error) {
    console.error('Set nutrition goals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DAILY NUTRITION TRACKING

// Get daily nutrition data
exports.getDailyNutrition = async (req, res) => {
  try {
    const { uid } = req.user;
    const { date } = req.query;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

    // Get nutrition logs for the day
    const logs = await NutritionLog.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ consumedAt: 1 });

    // Calculate daily totals
    const dailyTotals = logs.reduce((totals, log) => {
      const nutrition = log.nutrition || {};
      return {
        calories: totals.calories + (nutrition.calories || 0),
        protein: totals.protein + (nutrition.protein || 0),
        carbohydrates: totals.carbohydrates + (nutrition.carbohydrates || 0),
        fat: totals.fat + (nutrition.fat || 0),
        fiber: totals.fiber + (nutrition.fiber || 0),
        sugar: totals.sugar + (nutrition.sugar || 0),
        sodium: totals.sodium + (nutrition.sodium || 0)
      };
    }, {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0,
      fiber: 0, sugar: 0, sodium: 0
    });

    // Get water intake for the day
    const waterIntakes = await WaterIntake.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const totalWater = waterIntakes.reduce((total, intake) => total + intake.amount, 0);

    // Group logs by meal type
    const mealBreakdown = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    logs.forEach(log => {
      if (mealBreakdown[log.mealType]) {
        mealBreakdown[log.mealType].push(log);
      }
    });

    res.json({
      date: targetDate.toISOString().split('T')[0],
      totals: { ...dailyTotals, water: totalWater },
      meals: mealBreakdown,
      logs,
      waterIntakes
    });
  } catch (error) {
    console.error('Get daily nutrition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Log food item
exports.logFood = async (req, res) => {
  try {
    const { uid } = req.user;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const logData = {
      ...req.body,
      userId,
      date: req.body.consumedAt ? new Date(req.body.consumedAt) : new Date()
    };

    const nutritionLog = await NutritionLog.create(logData);
    res.status(201).json(nutritionLog);
  } catch (error) {
    console.error('Log food error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// WATER INTAKE ENDPOINTS

// Log water intake
exports.logWaterIntake = async (req, res) => {
  try {
    const { uid } = req.user;
    const { amount, timestamp } = req.body;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const waterLog = await WaterIntake.create({
      userId,
      amount,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      date: timestamp ? getStartOfDay(new Date(timestamp)) : getStartOfDay(new Date())
    });

    res.status(201).json(waterLog);
  } catch (error) {
    console.error('Log water intake error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get water intake data
exports.getWaterIntake = async (req, res) => {
  try {
    const { uid } = req.user;
    const { date } = req.query;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

    const waterIntakes = await WaterIntake.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: 1 });

    const totalWater = waterIntakes.reduce((total, intake) => total + intake.amount, 0);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      total: totalWater,
      entries: waterIntakes
    });
  } catch (error) {
    console.error('Get water intake error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// WEIGHT TRACKING ENDPOINTS

// Log weight
exports.logWeight = async (req, res) => {
  try {
    const { uid } = req.user;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const weightLog = await WeightTracking.create({
      ...req.body,
      userId
    });

    res.status(201).json(weightLog);
  } catch (error) {
    console.error('Log weight error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weight history
exports.getWeightHistory = async (req, res) => {
  try {
    const { uid } = req.user;
    const { period = 'month' } = req.query;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = { userId };
    
    if (period !== 'all') {
      const { startDate } = getDateRange(period);
      query.timestamp = { $gte: startDate };
    }

    const weightHistory = await WeightTracking.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      period,
      history: weightHistory
    });
  } catch (error) {
    console.error('Get weight history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// NUTRITION SUMMARY AND ANALYSIS

// Get nutrition summary
exports.getNutritionSummary = async (req, res) => {
  try {
    const { uid } = req.user;
    const { period = 'week', startDate, endDate } = req.query;
    const userId = await getUserId(uid);

    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const { startDate: calculatedStart, endDate: calculatedEnd } = getDateRange(period);
      dateQuery = {
        $gte: calculatedStart,
        $lte: calculatedEnd
      };
    }

    // Get nutrition logs for the period
    const logs = await NutritionLog.find({
      userId,
      date: dateQuery
    });

    // Calculate averages and totals
    const totalDays = Math.ceil((dateQuery.$lte - dateQuery.$gte) / (1000 * 60 * 60 * 24));
    
    const summary = logs.reduce((acc, log) => {
      const nutrition = log.nutrition || {};
      acc.totalCalories += nutrition.calories || 0;
      acc.totalProtein += nutrition.protein || 0;
      acc.totalCarbs += nutrition.carbohydrates || 0;
      acc.totalFat += nutrition.fat || 0;
      acc.totalFiber += nutrition.fiber || 0;
      return acc;
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    });

    const averages = {
      calories: Math.round(summary.totalCalories / totalDays),
      protein: Math.round(summary.totalProtein / totalDays),
      carbohydrates: Math.round(summary.totalCarbs / totalDays),
      fat: Math.round(summary.totalFat / totalDays),
      fiber: Math.round(summary.totalFiber / totalDays)
    };

    res.json({
      period,
      totalDays,
      averages,
      totals: summary,
      logCount: logs.length
    });
  } catch (error) {
    console.error('Get nutrition summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get calorie tracking (alias for daily nutrition with focus on calories)
exports.getCalorieTracking = async (req, res) => {
  try {
    // Reuse daily nutrition logic but focus on calories
    await exports.getDailyNutrition(req, res);
  } catch (error) {
    console.error('Get calorie tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get macro tracking (alias for daily nutrition with focus on macros)
exports.getMacroTracking = async (req, res) => {
  try {
    // Reuse daily nutrition logic but focus on macros
    await exports.getDailyNutrition(req, res);
  } catch (error) {
    console.error('Get macro tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
