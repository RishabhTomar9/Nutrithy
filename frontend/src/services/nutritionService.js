import axiosInstance from '../utils/axiosInstance';

/**
 * Nutrition Service for tracking and managing nutrition data
 */
class NutritionService {
  // Nutrition endpoints
  static ENDPOINTS = {
    NUTRITION_LOG: '/api/nutrition/log',
    DAILY_NUTRITION: '/api/nutrition/daily',
    NUTRITION_GOALS: '/api/nutrition/goals',
    NUTRITION_SUMMARY: '/api/nutrition/summary',
    FOOD_DATABASE: '/api/nutrition/foods',
    MEAL_PLANS: '/api/nutrition/meal-plans',
    NUTRITION_ANALYSIS: '/api/nutrition/analysis',
    CALORIE_TRACKING: '/api/nutrition/calories',
    MACRO_TRACKING: '/api/nutrition/macros',
    WATER_INTAKE: '/api/nutrition/water',
    WEIGHT_TRACKING: '/api/nutrition/weight'
  };

  /**
   * Log a food item or meal
   * @param {Object} nutritionData - Nutrition log data
   * @param {string} nutritionData.foodId - Food item ID
   * @param {string} nutritionData.name - Food name
   * @param {number} nutritionData.quantity - Quantity consumed
   * @param {string} nutritionData.unit - Unit of measurement
   * @param {string} nutritionData.mealType - Meal type (breakfast, lunch, dinner, snack)
   * @param {Date} nutritionData.consumedAt - When it was consumed
   * @returns {Promise<Object>} Logged nutrition entry
   */
  static async logFood(nutritionData) {
    try {
      const response = await axiosInstance.post(this.ENDPOINTS.NUTRITION_LOG, {
        ...nutritionData,
        loggedAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error logging food:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get daily nutrition data
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Daily nutrition data
   */
  static async getDailyNutrition(date = null, userId = null) {
    try {
      const params = {};
      if (date) params.date = date;
      if (userId) params.userId = userId;

      const response = await axiosInstance.get(this.ENDPOINTS.DAILY_NUTRITION, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily nutrition:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get nutrition summary for a period
   * @param {string} period - Period ('week', 'month', 'year')
   * @param {string} startDate - Start date (optional)
   * @param {string} endDate - End date (optional)
   * @returns {Promise<Object>} Nutrition summary
   */
  static async getNutritionSummary(period = 'week', startDate = null, endDate = null) {
    try {
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axiosInstance.get(this.ENDPOINTS.NUTRITION_SUMMARY, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrition summary:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Set or update nutrition goals
   * @param {Object} goals - Nutrition goals
   * @param {number} goals.calories - Daily calorie goal
   * @param {number} goals.protein - Daily protein goal (grams)
   * @param {number} goals.carbohydrates - Daily carbs goal (grams)
   * @param {number} goals.fat - Daily fat goal (grams)
   * @param {number} goals.fiber - Daily fiber goal (grams)
   * @param {number} goals.water - Daily water goal (ml)
   * @returns {Promise<Object>} Updated nutrition goals
   */
  static async setNutritionGoals(goals) {
    try {
      const response = await axiosInstance.put(this.ENDPOINTS.NUTRITION_GOALS, goals);
      return response.data;
    } catch (error) {
      console.error('Error setting nutrition goals:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user's nutrition goals
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Nutrition goals
   */
  static async getNutritionGoals(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await axiosInstance.get(this.ENDPOINTS.NUTRITION_GOALS, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrition goals:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search food database
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Food search results
   */
  static async searchFood(query, limit = 20) {
    try {
      const response = await axiosInstance.get(this.ENDPOINTS.FOOD_DATABASE, {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching food database:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get food item details by ID
   * @param {string} foodId - Food item ID
   * @returns {Promise<Object>} Food item details
   */
  static async getFoodDetails(foodId) {
    try {
      const response = await axiosInstance.get(`${this.ENDPOINTS.FOOD_DATABASE}/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food details:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Log water intake
   * @param {number} amount - Amount in ml
   * @param {Date} timestamp - When water was consumed
   * @returns {Promise<Object>} Water log entry
   */
  static async logWaterIntake(amount, timestamp = new Date()) {
    try {
      const response = await axiosInstance.post(this.ENDPOINTS.WATER_INTAKE, {
        amount,
        timestamp: timestamp.toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error logging water intake:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get water intake data
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Water intake data
   */
  static async getWaterIntake(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await axiosInstance.get(this.ENDPOINTS.WATER_INTAKE, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching water intake:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Log weight measurement
   * @param {number} weight - Weight in kg
   * @param {Date} timestamp - When weight was measured
   * @param {Object} metadata - Additional metadata (body fat %, muscle mass, etc.)
   * @returns {Promise<Object>} Weight log entry
   */
  static async logWeight(weight, timestamp = new Date(), metadata = {}) {
    try {
      const response = await axiosInstance.post(this.ENDPOINTS.WEIGHT_TRACKING, {
        weight,
        timestamp: timestamp.toISOString(),
        metadata
      });
      return response.data;
    } catch (error) {
      console.error('Error logging weight:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get weight tracking history
   * @param {string} period - Period ('week', 'month', 'year', 'all')
   * @returns {Promise<Array>} Weight history
   */
  static async getWeightHistory(period = 'month') {
    try {
      const response = await axiosInstance.get(this.ENDPOINTS.WEIGHT_TRACKING, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weight history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get calorie tracking data
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Calorie tracking data
   */
  static async getCalorieTracking(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await axiosInstance.get(this.ENDPOINTS.CALORIE_TRACKING, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching calorie tracking:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get macro nutrient breakdown
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Macro nutrient data
   */
  static async getMacroTracking(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await axiosInstance.get(this.ENDPOINTS.MACRO_TRACKING, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching macro tracking:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyze nutrition data and get insights
   * @param {string} period - Analysis period ('week', 'month')
   * @returns {Promise<Object>} Nutrition analysis and recommendations
   */
  static async getNutritionAnalysis(period = 'week') {
    try {
      const response = await axiosInstance.get(this.ENDPOINTS.NUTRITION_ANALYSIS, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrition analysis:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get or create meal plans
   * @param {Object} preferences - User preferences for meal planning
   * @param {string} duration - Duration ('week', 'month')
   * @returns {Promise<Object>} Meal plan data
   */
  static async getMealPlan(preferences = {}, duration = 'week') {
    try {
      const response = await axiosInstance.post(this.ENDPOINTS.MEAL_PLANS, {
        preferences,
        duration
      });
      return response.data;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update nutrition log entry
   * @param {string} entryId - Log entry ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated log entry
   */
  static async updateNutritionLog(entryId, updates) {
    try {
      const response = await axiosInstance.put(`${this.ENDPOINTS.NUTRITION_LOG}/${entryId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating nutrition log:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete nutrition log entry
   * @param {string} entryId - Log entry ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteNutritionLog(entryId) {
    try {
      const response = await axiosInstance.delete(`${this.ENDPOINTS.NUTRITION_LOG}/${entryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting nutrition log:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @returns {Object} Formatted error
   */
  static handleError(error) {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const status = error.response?.status || 500;
    
    return {
      message,
      status,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate nutrition percentages based on goals
   * @param {Object} current - Current nutrition values
   * @param {Object} goals - Nutrition goals
   * @returns {Object} Calculated percentages
   */
  static calculateNutritionPercentages(current, goals) {
    if (!current || !goals) return {};

    return {
      calories: goals.calories ? Math.round((current.calories / goals.calories) * 100) : 0,
      protein: goals.protein ? Math.round((current.protein / goals.protein) * 100) : 0,
      carbohydrates: goals.carbohydrates ? Math.round((current.carbohydrates / goals.carbohydrates) * 100) : 0,
      fat: goals.fat ? Math.round((current.fat / goals.fat) * 100) : 0,
      fiber: goals.fiber ? Math.round((current.fiber / goals.fiber) * 100) : 0,
      water: goals.water ? Math.round((current.water / goals.water) * 100) : 0
    };
  }

  /**
   * Format nutrition data for display
   * @param {Object} nutrition - Raw nutrition data
   * @returns {Object} Formatted nutrition data
   */
  static formatNutritionData(nutrition) {
    if (!nutrition) return null;

    return {
      calories: Math.round(nutrition.calories || 0),
      protein: Math.round(nutrition.protein || 0),
      carbohydrates: Math.round(nutrition.carbohydrates || 0),
      fat: Math.round(nutrition.fat || 0),
      fiber: Math.round(nutrition.fiber || 0),
      sugar: Math.round(nutrition.sugar || 0),
      sodium: Math.round(nutrition.sodium || 0),
      water: Math.round(nutrition.water || 0),
      lastUpdated: nutrition.lastUpdated || new Date().toISOString()
    };
  }
}

export default NutritionService;
