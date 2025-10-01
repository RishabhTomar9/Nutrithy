import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axiosInstance';
import { Calendar, Activity, Target, Clock, Droplet, RefreshCw, Coffee, Utensils, ChevronDown, ChevronUp, Heart, Flame, Zap, Sun, Moon, ShoppingCart, TrendingUp, ChefHat, Bookmark, Share2, Download, Check } from "lucide-react";
import GroceryListGenerator from '../components/diet/GroceryListGenerator';
import NutritionAnalytics from '../components/diet/NutritionAnalytics';
import SmartRecipeSuggestions from '../components/diet/SmartRecipeSuggestions';

const SharedDietPlan = () => {
  const { id } = useParams();
  const location = useLocation();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('meals');
  const [expandedMeals, setExpandedMeals] = useState({});
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default to dark theme
  
  // Enhanced features state
  const [mealProgress, setMealProgress] = useState({});
  const [dailyProgress, setDailyProgress] = useState(0);
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [formData, setFormData] = useState({}); // For recipe suggestions
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  useEffect(() => {
    const fetchSharedPlan = async () => {
      try {
        setLoading(true);
        
        // Check if we have an ID from URL params
        if (id) {
          // Fetch from backend API
          const response = await axiosInstance.get(`/api/diet-plans/shared/${id}`);
          if (response.data.success) {
            setDietPlan(response.data.dietPlan);
          } else {
            setError('Failed to load the shared diet plan');
          }
        } else {
          // Check for query param ID (for localStorage sharing)
          const queryParams = new URLSearchParams(location.search);
          const shareId = queryParams.get('id');
          
          if (shareId) {
            // Get from localStorage
            const sharedPlans = JSON.parse(localStorage.getItem('sharedDietPlans') || '{}');
            const planData = sharedPlans[shareId];
            
            if (planData) {
              setDietPlan({
                name: planData.name,
                plan: planData.plan,
                createdAt: new Date().toISOString()
              });
            } else {
              setError('This shared diet plan has expired or is no longer available');
            }
          } else {
            setError('Invalid diet plan link');
          }
        }
      } catch (error) {
        console.error('Error fetching shared diet plan:', error);
        setError('Failed to load the shared diet plan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedPlan();
  }, [id, location.search]);
  
  // Load meal progress from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedProgress = localStorage.getItem(`sharedMealProgress_${today}`);
    if (savedProgress) {
      setMealProgress(JSON.parse(savedProgress));
    }
  }, []);
  
  // Calculate daily progress
  useEffect(() => {
    if (dietPlan?.plan) {
      const totalMealItems = Object.values(dietPlan.plan.meals).flat().length;
      const completedItems = Object.values(mealProgress).flat().filter(Boolean).length;
      setDailyProgress(totalMealItems > 0 ? (completedItems / totalMealItems) * 100 : 0);
    }
  }, [mealProgress, dietPlan]);
  
  // Save meal progress to localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(`sharedMealProgress_${today}`, JSON.stringify(mealProgress));
  }, [mealProgress]);

  const toggleMealExpansion = (mealType) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };
  
  // Enhanced meal progress functions
  const toggleMealItem = (mealName, itemIndex) => {
    setMealProgress(prev => {
      const mealItems = prev[mealName] || [];
      const newMealItems = [...mealItems];
      newMealItems[itemIndex] = !newMealItems[itemIndex];
      return {
        ...prev,
        [mealName]: newMealItems
      };
    });
  };
  
  const copyShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        // Show success message (you could add a toast here)
        alert('Share link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  const downloadPlan = () => {
    const planData = {
      name: dietPlan.name,
      createdAt: dietPlan.createdAt,
      plan: dietPlan.plan
    };
    
    const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diet-plan-${dietPlan.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply theme to document body
  useEffect(() => {
    // Apply theme to body when component mounts or theme changes
    document.body.classList.toggle('dark-theme', isDarkTheme);
    document.body.classList.toggle('light-theme', !isDarkTheme);
    
    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('light-theme');
    };
  }, [isDarkTheme]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-300`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>Loading shared diet plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-md max-w-md w-full text-center transition-colors duration-300`}>
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'} mb-2 transition-colors duration-300`}>Error</h2>
          <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} mb-6 transition-colors duration-300`}>{error}</p>
          <a 
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-md max-w-md w-full text-center transition-colors duration-300`}>
          <div className="text-yellow-500 text-5xl mb-4">🔍</div>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'} mb-2 transition-colors duration-300`}>Diet Plan Not Found</h2>
          <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} mb-6 transition-colors duration-300`}>The diet plan you're looking for doesn't exist or has been removed.</p>
          <a 
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const plan = dietPlan.plan;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} py-25 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-[80vw] mx-auto relative">
        {/* Theme Toggle Button */}
        <motion.button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDarkTheme ? 'bg-gray-700 text-yellow-300' : 'bg-blue-100 text-blue-800'} z-10 transition-colors duration-300`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${isDarkTheme ? 'bg-gray-800/80' : 'bg-white'} rounded-lg shadow-lg p-6 transition-colors duration-300`}
        >
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'} mb-2 transition-colors duration-300`}>{dietPlan.name}</h1>
            <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300 mb-4`}>
              Shared on {new Date(dietPlan.createdAt).toLocaleDateString()}
            </p>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <motion.button
                onClick={() => setShowGroceryList(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart size={16} />
                Grocery List
              </motion.button>
              
              <motion.button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp size={16} />
                Analytics
              </motion.button>
              
              <motion.button
                onClick={() => setShowRecipes(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChefHat size={16} />
                Recipes
              </motion.button>
              
              <motion.button
                onClick={copyShareLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 size={16} />
                Copy Link
              </motion.button>
              
              <motion.button
                onClick={downloadPlan}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={16} />
                Download
              </motion.button>
            </div>
            
            {/* Daily Progress Bar */}
            <motion.div 
              className={`mb-6 p-4 ${isDarkTheme ? 'bg-purple-900/30 border-purple-700/30' : 'bg-purple-100 border-purple-300'} border rounded-xl transition-colors duration-300`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className={`font-medium ${isDarkTheme ? 'text-purple-300' : 'text-purple-700'} transition-colors duration-300`}>Today's Progress</h4>
                <span className={`${isDarkTheme ? 'text-purple-200' : 'text-purple-600'} text-sm transition-colors duration-300`}>{Math.round(dailyProgress)}% Complete</span>
              </div>
              <div className={`w-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-3 overflow-hidden transition-colors duration-300`}>
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              {dailyProgress === 100 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'} text-sm flex items-center gap-1 transition-colors duration-300`}
                >
                  🎉 Great job! You've completed all your meals today!
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Calories and Macros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`${isDarkTheme ? 'bg-blue-900/30 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'} p-4 rounded-lg text-center transition-colors duration-300`}
            >
              <div className="text-blue-500 font-bold text-xl mb-1">{plan.calories}</div>
              <div className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} text-sm transition-colors duration-300`}>Daily Calories</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={`${isDarkTheme ? 'bg-red-900/30 border border-red-700/30' : 'bg-red-50 border border-red-200'} p-4 rounded-lg text-center transition-colors duration-300`}
            >
              <div className="text-red-500 font-bold text-xl mb-1">{plan.macros.protein}g</div>
              <div className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} text-sm transition-colors duration-300`}>Protein</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className={`${isDarkTheme ? 'bg-yellow-900/30 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'} p-4 rounded-lg text-center transition-colors duration-300`}
            >
              <div className="text-yellow-500 font-bold text-xl mb-1">{plan.macros.carbs}g</div>
              <div className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} text-sm transition-colors duration-300`}>Carbs</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className={`${isDarkTheme ? 'bg-green-900/30 border border-green-700/30' : 'bg-green-50 border border-green-200'} p-4 rounded-lg text-center transition-colors duration-300`}
            >
              <div className="text-green-500 font-bold text-xl mb-1">{plan.macros.fats}g</div>
              <div className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} text-sm transition-colors duration-300`}>Fats</div>
            </motion.div>
          </div>

          {/* Hydration */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`${isDarkTheme ? 'bg-blue-900/30 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'} p-4 rounded-lg mb-8 transition-colors duration-300`}
          >
            <div className="flex items-center mb-2">
              <Droplet className="text-blue-500 mr-2" size={20} />
              <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-blue-300' : 'text-gray-800'} transition-colors duration-300`}>Hydration</h3>
            </div>
            <p className={`${isDarkTheme ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>{plan.hydration}</p>
          </motion.div>

          {/* Navigation Tabs */}
          <div className={`flex ${isDarkTheme ? 'border-b border-gray-600' : 'border-b border-gray-200'} mb-6 overflow-x-auto transition-colors duration-300`}>
            <button
              onClick={() => setActiveTab('meals')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-300 ${activeTab === 'meals' 
                ? `${isDarkTheme ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-500'}` 
                : `${isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`}
            >
              <Utensils className="inline mr-1" size={16} /> Meals
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-300 ${activeTab === 'weekly' 
                ? `${isDarkTheme ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-500'}` 
                : `${isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`}
            >
              <Calendar className="inline mr-1" size={16} /> Weekly Plan
            </button>
            <button
              onClick={() => setActiveTab('exercise')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-300 ${activeTab === 'exercise' 
                ? `${isDarkTheme ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-500'}` 
                : `${isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`}
            >
              <Activity className="inline mr-1" size={16} /> Exercise
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-300 ${activeTab === 'analysis' 
                ? `${isDarkTheme ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-500'}` 
                : `${isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`}
            >
              <Target className="inline mr-1" size={16} /> Analysis
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Meals Tab */}
            {activeTab === 'meals' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-6">
                  {Object.entries(plan.meals).map(([mealType, items], mealIndex) => {
                    const mealItems = mealProgress[mealType] || [];
                    const completedItems = mealItems.filter(Boolean).length;
                    const totalItems = items.length;
                    const mealProgressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                    
                    return (
                      <motion.div 
                        key={mealType} 
                        className={`${isDarkTheme ? 'bg-gray-800/50 border-gray-700/50 hover:border-green-500/30' : 'bg-gray-50 border-gray-200 hover:border-green-400/50'} border rounded-lg p-4 transition-all duration-300`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mealIndex * 0.1 }}
                      >
                        <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleMealExpansion(mealType)}
                        >
                          <div className="flex items-center gap-3">
                            <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-green-400' : 'text-gray-800'} transition-colors duration-300`}>
                              {mealType}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-300`}>
                                {completedItems}/{totalItems}
                              </span>
                              <div className={`w-12 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-1.5 transition-colors duration-300`}>
                                <div 
                                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                                  style={{ width: `${mealProgressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {mealProgressPercentage === 100 && (
                              <span className="text-green-500 text-sm">✓</span>
                            )}
                            {expandedMeals[mealType] ? (
                              <ChevronUp size={20} className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                            ) : (
                              <ChevronDown size={20} className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                            )}
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedMeals[mealType] && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 overflow-hidden"
                            >
                              <ul className="space-y-3">
                                {items.map((item, idx) => {
                                  const isCompleted = mealItems[idx] || false;
                                  return (
                                    <li key={idx} className="flex items-center gap-3 group">
                                      <motion.button
                                        onClick={() => toggleMealItem(mealType, idx)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                          isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : `border-gray-500 hover:border-green-400 ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        {isCompleted && (
                                          <motion.svg 
                                            className="w-3 h-3" 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500 }}
                                          >
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </motion.svg>
                                        )}
                                      </motion.button>
                                      <span className={`transition-all ${
                                        isCompleted 
                                          ? `${isDarkTheme ? 'text-gray-500' : 'text-gray-400'} line-through` 
                                          : `${isDarkTheme ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`
                                      }`}>
                                        {item}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                              {mealProgressPercentage === 100 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`mt-3 p-2 ${isDarkTheme ? 'bg-green-900/20 border-green-700/30 text-green-400' : 'bg-green-100 border-green-300 text-green-600'} border rounded-md text-sm flex items-center gap-2 transition-colors duration-300`}
                                >
                                  <span>✅</span>
                                  <span>{mealType} completed!</span>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Weekly Plan Tab */}
            {activeTab === 'weekly' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {Object.entries(plan.weeklyPlan).map(([day, plan]) => (
                  <div key={day} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">{day}</h3>
                    <p className="text-gray-700">{plan}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Exercise Tab */}
            {activeTab === 'exercise' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Activity className="mr-2 text-blue-500" size={20} />
                    Exercise Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {plan.exerciseRecommendations.map((exercise, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{exercise}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Flame className="mr-2 text-green-500" size={20} />
                    Nutritional Strengths
                  </h3>
                  <ul className="space-y-2">
                    {plan.nutritionAnalysis.strengths.map((strength, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="text-green-500 mr-2">✓</div>
                        <span className="text-gray-700">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Zap className="mr-2 text-yellow-500" size={20} />
                    Considerations
                  </h3>
                  <ul className="space-y-2">
                    {plan.nutritionAnalysis.considerations.map((consideration, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="text-yellow-500 mr-2">!</div>
                        <span className="text-gray-700">{consideration}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          {/* Nutrition Tips */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-indigo-50 p-4 rounded-lg"
          >
            <div className="flex items-center mb-3">
              <Heart className="text-indigo-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Nutrition Tips</h3>
            </div>
            <ul className="space-y-2">
              {plan.tips.map((tip, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + (index * 0.1) }}
                  className="text-gray-700 flex items-start"
                >
                  <span className="text-indigo-500 mr-2">•</span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Enhanced Components */}
      <AnimatePresence>
        {/* Grocery List Generator */}
        {showGroceryList && (
          <GroceryListGenerator
            dietPlan={plan}
            isVisible={showGroceryList}
            onClose={() => setShowGroceryList(false)}
          />
        )}
        
        {/* Nutrition Analytics */}
        {showAnalytics && (
          <NutritionAnalytics
            dietPlan={plan}
            mealProgress={mealProgress}
            isVisible={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />
        )}
        
        {/* Smart Recipe Suggestions */}
        {showRecipes && (
          <SmartRecipeSuggestions
            dietPlan={plan}
            formData={formData}
            isVisible={showRecipes}
            onClose={() => setShowRecipes(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharedDietPlan;
