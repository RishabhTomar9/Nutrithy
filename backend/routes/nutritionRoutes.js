const express = require("express");
const verifyFirebaseToken = require("../auth/verifyFirebaseToken");
const nutritionController = require("../controllers/nutritionController");
const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// NUTRITION GOALS ROUTES
// GET /api/nutrition/goals - Get user's nutrition goals
router.get("/goals", nutritionController.getNutritionGoals);

// PUT /api/nutrition/goals - Set/update nutrition goals  
router.put("/goals", nutritionController.setNutritionGoals);

// DAILY NUTRITION TRACKING ROUTES
// GET /api/nutrition/daily - Get daily nutrition data
router.get("/daily", nutritionController.getDailyNutrition);

// POST /api/nutrition/log - Log food item
router.post("/log", nutritionController.logFood);

// WATER INTAKE ROUTES
// GET /api/nutrition/water - Get water intake data
router.get("/water", nutritionController.getWaterIntake);

// POST /api/nutrition/water - Log water intake
router.post("/water", nutritionController.logWaterIntake);

// WEIGHT TRACKING ROUTES
// GET /api/nutrition/weight - Get weight history
router.get("/weight", nutritionController.getWeightHistory);

// POST /api/nutrition/weight - Log weight
router.post("/weight", nutritionController.logWeight);

// NUTRITION SUMMARY AND ANALYSIS ROUTES
// GET /api/nutrition/summary - Get nutrition summary for a period
router.get("/summary", nutritionController.getNutritionSummary);

// GET /api/nutrition/calories - Get calorie tracking data
router.get("/calories", nutritionController.getCalorieTracking);

// GET /api/nutrition/macros - Get macro tracking data
router.get("/macros", nutritionController.getMacroTracking);

module.exports = router;
