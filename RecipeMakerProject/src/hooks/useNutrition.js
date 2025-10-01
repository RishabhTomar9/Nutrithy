import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import NutritionService from '../services/nutritionService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing nutrition data and state
 * Provides comprehensive nutrition tracking functionality
 */
export const useNutrition = (options = {}) => {
  const { user } = useAuth();
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    enableRealTime = false,
    cacheTimeout = 60000 // 1 minute
  } = options;

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyNutrition, setDailyNutrition] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [calorieTracking, setCalorieTracking] = useState(null);
  const [macroTracking, setMacroTracking] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for cleanup and caching
  const refreshIntervalRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Get today's date string
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Cache management
  const getCachedData = useCallback((key) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    return null;
  }, [cacheTimeout]);

  const setCachedData = useCallback((key, data) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  // Fetch daily nutrition data
  const fetchDailyNutrition = useCallback(async (date = null) => {
    if (!user) return null;

    const targetDate = date || getTodayDate();
    const cacheKey = `daily-nutrition-${targetDate}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) return cached;

    try {
      const data = await NutritionService.getDailyNutrition(targetDate);
      const formatted = NutritionService.formatNutritionData(data);
      setCachedData(cacheKey, formatted);
      return formatted;
    } catch (error) {
      console.error('Error fetching daily nutrition:', error);
      throw error;
    }
  }, [user, getTodayDate, getCachedData, setCachedData]);

  // Fetch nutrition goals
  const fetchNutritionGoals = useCallback(async () => {
    if (!user) return null;

    const cacheKey = 'nutrition-goals';
    const cached = getCachedData(cacheKey);
    
    if (cached) return cached;

    try {
      const data = await NutritionService.getNutritionGoals();
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching nutrition goals:', error);
      throw error;
    }
  }, [user, getCachedData, setCachedData]);

  // Fetch nutrition summary
  const fetchNutritionSummary = useCallback(async (period = 'week') => {
    if (!user) return null;

    const cacheKey = `nutrition-summary-${period}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) return cached;

    try {
      const data = await NutritionService.getNutritionSummary(period);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching nutrition summary:', error);
      throw error;
    }
  }, [user, getCachedData, setCachedData]);

  // Fetch water intake
  const fetchWaterIntake = useCallback(async (date = null) => {
    if (!user) return null;

    const targetDate = date || getTodayDate();
    const cacheKey = `water-intake-${targetDate}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) return cached;

    try {
      const data = await NutritionService.getWaterIntake(targetDate);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching water intake:', error);
      throw error;
    }
  }, [user, getTodayDate, getCachedData, setCachedData]);

  // Fetch weight history
  const fetchWeightHistory = useCallback(async (period = 'month') => {
    if (!user) return [];

    const cacheKey = `weight-history-${period}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) return cached;

    try {
      const data = await NutritionService.getWeightHistory(period);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching weight history:', error);
      throw error;
    }
  }, [user, getCachedData, setCachedData]);

  // Comprehensive data refresh
  const refreshData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Clear cache for fresh data
      cacheRef.current.clear();

      // Fetch all data concurrently
      const [
        dailyData,
        goalsData,
        summaryData,
        waterData,
        weightData,
        calorieData,
        macroData
      ] = await Promise.allSettled([
        fetchDailyNutrition(),
        fetchNutritionGoals(),
        fetchNutritionSummary(),
        fetchWaterIntake(),
        fetchWeightHistory(),
        NutritionService.getCalorieTracking(),
        NutritionService.getMacroTracking()
      ]);

      // Update state with results
      if (dailyData.status === 'fulfilled') {
        setDailyNutrition(dailyData.value);
      }
      
      if (goalsData.status === 'fulfilled') {
        setNutritionGoals(goalsData.value);
      }
      
      if (summaryData.status === 'fulfilled') {
        setNutritionSummary(summaryData.value);
      }
      
      if (waterData.status === 'fulfilled') {
        setWaterIntake(waterData.value);
      }
      
      if (weightData.status === 'fulfilled') {
        setWeightHistory(weightData.value);
      }
      
      if (calorieData.status === 'fulfilled') {
        setCalorieTracking(calorieData.value);
      }
      
      if (macroData.status === 'fulfilled') {
        setMacroTracking(macroData.value);
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error refreshing nutrition data:', error);
      setError(error.message || 'Failed to refresh nutrition data');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    fetchDailyNutrition,
    fetchNutritionGoals,
    fetchNutritionSummary,
    fetchWaterIntake,
    fetchWeightHistory
  ]);

  // Log food entry
  const logFood = useCallback(async (foodData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await NutritionService.logFood(foodData);
      
      // Refresh daily nutrition data
      const updatedDailyData = await fetchDailyNutrition();
      setDailyNutrition(updatedDailyData);

      toast.success('Food logged successfully!');
      return result;
    } catch (error) {
      console.error('Error logging food:', error);
      toast.error('Failed to log food');
      throw error;
    }
  }, [user, fetchDailyNutrition]);

  // Log water intake
  const logWater = useCallback(async (amount) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await NutritionService.logWaterIntake(amount);
      
      // Refresh water intake data
      const updatedWaterData = await fetchWaterIntake();
      setWaterIntake(updatedWaterData);

      toast.success('Water intake logged!');
      return result;
    } catch (error) {
      console.error('Error logging water:', error);
      toast.error('Failed to log water intake');
      throw error;
    }
  }, [user, fetchWaterIntake]);

  // Log weight
  const logWeight = useCallback(async (weight, metadata = {}) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await NutritionService.logWeight(weight, new Date(), metadata);
      
      // Refresh weight history
      const updatedWeightData = await fetchWeightHistory();
      setWeightHistory(updatedWeightData);

      toast.success('Weight logged successfully!');
      return result;
    } catch (error) {
      console.error('Error logging weight:', error);
      toast.error('Failed to log weight');
      throw error;
    }
  }, [user, fetchWeightHistory]);

  // Update nutrition goals
  const updateGoals = useCallback(async (goals) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await NutritionService.setNutritionGoals(goals);
      setNutritionGoals(result);
      
      // Clear related cache
      cacheRef.current.delete('nutrition-goals');

      toast.success('Nutrition goals updated!');
      return result;
    } catch (error) {
      console.error('Error updating goals:', error);
      toast.error('Failed to update nutrition goals');
      throw error;
    }
  }, [user]);

  // Calculate nutrition percentages
  const nutritionPercentages = useCallback(() => {
    if (!dailyNutrition || !nutritionGoals) return {};
    return NutritionService.calculateNutritionPercentages(dailyNutrition, nutritionGoals);
  }, [dailyNutrition, nutritionGoals]);

  // Initialize data on mount and user change
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      // Reset state when user logs out
      setDailyNutrition(null);
      setNutritionGoals(null);
      setNutritionSummary(null);
      setWaterIntake(null);
      setWeightHistory([]);
      setCalorieTracking(null);
      setMacroTracking(null);
      setLoading(false);
      setError(null);
    }
  }, [user, refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user) return;

    refreshIntervalRef.current = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, user, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      cacheRef.current.clear();
    };
  }, []);

  return {
    // Data
    dailyNutrition,
    nutritionGoals,
    nutritionSummary,
    waterIntake,
    weightHistory,
    calorieTracking,
    macroTracking,
    lastUpdated,
    
    // State
    loading,
    error,
    
    // Actions
    refreshData,
    logFood,
    logWater,
    logWeight,
    updateGoals,
    
    // Computed
    nutritionPercentages: nutritionPercentages(),
    
    // Utilities
    fetchDailyNutrition,
    fetchNutritionGoals,
    fetchNutritionSummary,
    fetchWaterIntake,
    fetchWeightHistory
  };
};

export default useNutrition;
