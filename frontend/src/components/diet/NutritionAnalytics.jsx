import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Temporarily removed recharts import to fix loading issue
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
//   RadialBarChart, RadialBar
// } from 'recharts';
import { 
  TrendingUp, Calendar, Target, Activity, Flame, Droplet, 
  X, Download, RotateCcw, ChevronDown, ChevronUp, Smartphone,
  Watch, Wifi, WifiOff, RefreshCw, Heart, Footprints, Zap, 
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import healthDataService from '../../services/healthDataService';

const NutritionAnalytics = ({ dietPlan, mealProgress, isVisible, onClose }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({});
  const [activeChart, setActiveChart] = useState('macros');
  const [timeRange, setTimeRange] = useState('week');
  const [expandedSection, setExpandedSection] = useState('overview');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  
  // Google Fit & Smartwatch Integration State
  const [googleFitConnected, setGoogleFitConnected] = useState(false);
  const [smartwatchConnected, setSmartwatchConnected] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(true);

  // Colors for charts
  const COLORS = {
    protein: '#3B82F6',
    carbs: '#F59E0B',
    fats: '#10B981',
    calories: '#EF4444',
    water: '#06B6D4',
    fiber: '#8B5CF6'
  };

  const pieColors = ['#3B82F6', '#F59E0B', '#10B981'];

  // Initialize Google Fit API
  useEffect(() => {
    if (isVisible) {
      checkSavedConnections();
    }
  }, [isVisible]);

  // Auto-sync real-time data
  useEffect(() => {
    let syncInterval;
    if (googleFitConnected && autoSync && isVisible) {
      syncInterval = setInterval(() => {
        syncRealTimeData();
      }, 60000); // Sync every minute
    }
    return () => clearInterval(syncInterval);
  }, [googleFitConnected, autoSync, isVisible]);

  useEffect(() => {
    if (dietPlan && isVisible) {
      generateAnalyticsData();
    }
  }, [dietPlan, mealProgress, isVisible, timeRange, realTimeData]);

  const generateAnalyticsData = () => {
    // Generate mock data for different time ranges
    const data = {
      macroBreakdown: [
        { name: 'Protein', value: dietPlan.macros.protein, color: COLORS.protein, percentage: Math.round((dietPlan.macros.protein * 4 / dietPlan.calories) * 100) },
        { name: 'Carbs', value: dietPlan.macros.carbs, color: COLORS.carbs, percentage: Math.round((dietPlan.macros.carbs * 4 / dietPlan.calories) * 100) },
        { name: 'Fats', value: dietPlan.macros.fats, color: COLORS.fats, percentage: Math.round((dietPlan.macros.fats * 9 / dietPlan.calories) * 100) }
      ],
      weeklyProgress: generateWeeklyData(),
      dailyIntake: generateDailyIntakeData(),
      nutritionScore: calculateNutritionScore(),
      goals: {
        calories: { target: dietPlan.calories, current: Math.round(dietPlan.calories * getCurrentProgress()) },
        protein: { target: dietPlan.macros.protein, current: Math.round(dietPlan.macros.protein * getCurrentProgress()) },
        carbs: { target: dietPlan.macros.carbs, current: Math.round(dietPlan.macros.carbs * getCurrentProgress()) },
        fats: { target: dietPlan.macros.fats, current: Math.round(dietPlan.macros.fats * getCurrentProgress()) }
      }
    };

    setAnalyticsData(data);
  };

  // Google Fit Integration Functions
  const initializeGoogleFit = () => {
    return new Promise((resolve, reject) => {
      // Check if Google Fit API is available
      if (typeof gapi !== 'undefined') {
        gapi.load('auth2', () => {
          gapi.auth2.init({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id'
          }).then(() => {
            console.log('Google Auth2 initialized successfully');
            resolve();
          }).catch(reject);
        });
      } else {
        // Load Google API dynamically
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          gapi.load('auth2', () => {
            gapi.auth2.init({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id'
            }).then(() => {
              console.log('Google Auth2 initialized successfully');
              resolve();
            }).catch(reject);
          });
        };
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.head.appendChild(script);
      }
    });
  };

  const connectGoogleFit = async () => {
    setIsConnecting(true);
    setConnectionError('');
    try {
      await healthDataService.connectGoogleFit();
      setGoogleFitConnected(true);
      await syncRealTimeData();
      setLastSync(new Date());
    } catch (error) {
      console.error('Google Fit connection error:', error);
      const message = error?.message?.includes('cancelled') || error?.message?.includes('popup_closed_by_user')
        ? 'Google sign-in was cancelled.'
        : (error?.message || 'Failed to connect to Google Fit. Please try again.');
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleFit = () => {
    if (typeof gapi !== 'undefined') {
      const authInstance = gapi.auth2.getAuthInstance();
      authInstance.signOut();
    }
    setGoogleFitConnected(false);
    setRealTimeData({});
    localStorage.removeItem('googleFitConnected');
  };

  const connectSmartwatch = async () => {
    setIsConnecting(true);
    setConnectionError('');
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser');
      }
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['fitness_machine'] },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Samsung' },
          { namePrefix: 'Apple' }
        ],
        optionalServices: ['battery_service', 'device_information']
      });
      const server = await device.gatt.connect();
      setSmartwatchConnected(true);
      localStorage.setItem('smartwatchConnected', 'true');
      try {
        const heartRateService = await server.getPrimaryService('heart_rate');
        const heartRateCharacteristic = await heartRateService.getCharacteristic('heart_rate_measurement');
        await heartRateCharacteristic.startNotifications();
        heartRateCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange);
      } catch (hrError) {
        console.log('Heart rate monitoring not available:', hrError);
      }
    } catch (error) {
      console.error('Smartwatch connection error:', error);
      const message = error?.name === 'NotFoundError' ? 'Device selection was cancelled.' : (error?.message || 'Failed to connect to smartwatch.');
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleHeartRateChange = (event) => {
    const value = event.target.value;
    const heartRate = value.getUint16(1, true);
    
    setRealTimeData(prev => ({
      ...prev,
      heartRate,
      lastHeartRateUpdate: new Date()
    }));
  };

  const syncRealTimeData = async () => {
    if (!googleFitConnected) return;
    
    try {
      // Fetch real-time data from Google Fit
      const mockRealTimeData = {
        steps: Math.floor(Math.random() * 5000) + 5000,
        caloriesBurned: Math.floor(Math.random() * 300) + 200,
        activeMinutes: Math.floor(Math.random() * 60) + 30,
        heartRate: Math.floor(Math.random() * 40) + 60,
        distance: (Math.random() * 3 + 2).toFixed(2),
        sleep: {
          hours: (Math.random() * 2 + 7).toFixed(1),
          quality: Math.floor(Math.random() * 30) + 70
        },
        hydration: Math.floor(Math.random() * 1000) + 1500,
        lastUpdate: new Date()
      };
      
      setRealTimeData(mockRealTimeData);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to sync real-time data:', error);
    }
  };

  const checkSavedConnections = async () => {
    if (!user) return;
    
    try {
      const status = await healthDataService.getConnectionStatus(user.uid);
      if (status?.googleFitConnected) {
        setGoogleFitConnected(true);
        syncRealTimeData();
      }
      if (status?.smartwatchConnected) {
        setSmartwatchConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const getCurrentProgress = () => {
    if (!mealProgress || Object.keys(mealProgress).length === 0) return 0;
    const totalItems = Object.values(dietPlan.meals).flat().length;
    const completedItems = Object.values(mealProgress).flat().filter(Boolean).length;
    return totalItems > 0 ? completedItems / totalItems : 0;
  };

  const generateWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      calories: Math.round(dietPlan.calories * (0.8 + Math.random() * 0.4)),
      protein: Math.round(dietPlan.macros.protein * (0.8 + Math.random() * 0.4)),
      carbs: Math.round(dietPlan.macros.carbs * (0.8 + Math.random() * 0.4)),
      fats: Math.round(dietPlan.macros.fats * (0.8 + Math.random() * 0.4)),
      water: Math.round(2000 + Math.random() * 1000)
    }));
  };

  const generateDailyIntakeData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    let cumulativeCalories = 0;
    return hours.map(hour => {
      if (hour >= 7 && hour <= 22) {
        cumulativeCalories += Math.round(dietPlan.calories / 16 * (0.5 + Math.random()));
      }
      return {
        hour: `${hour}:00`,
        calories: Math.min(cumulativeCalories, dietPlan.calories)
      };
    });
  };

  const calculateNutritionScore = () => {
    const currentProgress = getCurrentProgress();
    const baseScore = Math.round(75 + currentProgress * 20);
    return Math.min(100, Math.max(0, baseScore));
  };

  const exportAnalytics = () => {
    const data = {
      date: new Date().toISOString(),
      nutritionScore: analyticsData.nutritionScore,
      macros: analyticsData.macroBreakdown,
      goals: analyticsData.goals,
      weeklyData: analyticsData.weeklyProgress
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutrition-analytics.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}${entry.dataKey === 'water' ? 'ml' : entry.dataKey === 'calories' ? ' kcal' : 'g'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={28} className="text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Nutrition Analytics</h2>
              <p className="text-gray-400 text-sm">
                Track your nutritional progress and insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={exportAnalytics}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Device Connection Section */}
        <div className="mb-6 bg-gradient-to-r from-green-800/30 to-blue-800/30 p-4 rounded-lg border border-green-700/40">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-green-400">
            <Activity className="w-5 h-5 mr-2" />
            Connected Devices
          </h3>
          
          <div className="flex flex-wrap gap-4">
            {/* Google Fit Connection */}
            <div className="flex items-center space-x-3 bg-gray-800/60 p-3 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${googleFitConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-medium text-white">Google Fit</span>
              {googleFitConnected ? (
                <button
                  onClick={disconnectGoogleFit}
                  className="px-3 py-1 text-xs bg-red-600/20 text-red-400 border border-red-600/40 rounded hover:bg-red-600/30 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectGoogleFit}
                  disabled={isConnecting}
                  className="px-3 py-1 text-xs bg-green-600/20 text-green-400 border border-green-600/40 rounded hover:bg-green-600/30 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Smartwatch Connection */}
            <div className="flex items-center space-x-3 bg-gray-800/60 p-3 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${smartwatchConnected ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-medium text-white">Smartwatch</span>
              {smartwatchConnected ? (
                <button
                  onClick={() => {
                    setSmartwatchConnected(false);
                    localStorage.removeItem('smartwatchConnected');
                  }}
                  className="px-3 py-1 text-xs bg-red-600/20 text-red-400 border border-red-600/40 rounded hover:bg-red-600/30 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectSmartwatch}
                  disabled={isConnecting}
                  className="px-3 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/40 rounded hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Auto-sync Toggle */}
            {(googleFitConnected || smartwatchConnected) && (
              <div className="flex items-center space-x-3 bg-gray-800/60 p-3 rounded-lg border border-gray-700">
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    autoSync ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-gray-600/20 text-gray-400 border border-gray-600/40'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${autoSync ? 'animate-spin' : ''}`} />
                  <span>Auto-sync {autoSync ? 'ON' : 'OFF'}</span>
                </button>
                {lastSync && (
                  <span className="text-xs text-gray-400">
                    Last: {lastSync.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-700/40 rounded text-sm text-red-400">
              {connectionError}
            </div>
          )}

          {/* Real-time Data Preview */}
          {Object.keys(realTimeData).length > 0 && (
            <div className="mt-4 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
              <h4 className="font-medium text-sm mb-2 text-white">Live Health Data</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {realTimeData.steps && (
                  <div>
                    <span className="text-gray-400">Steps:</span>
                    <div className="font-semibold text-white">{realTimeData.steps.toLocaleString()}</div>
                  </div>
                )}
                {realTimeData.heartRate && (
                  <div>
                    <span className="text-gray-400">Heart Rate:</span>
                    <div className="font-semibold text-white">{realTimeData.heartRate} bpm</div>
                  </div>
                )}
                {realTimeData.caloriesBurned && (
                  <div>
                    <span className="text-gray-400">Calories Burned:</span>
                    <div className="font-semibold text-white">{realTimeData.caloriesBurned}</div>
                  </div>
                )}
                {realTimeData.distance && (
                  <div>
                    <span className="text-gray-400">Distance:</span>
                    <div className="font-semibold text-white">{realTimeData.distance} km</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(90vh-120px)] overflow-y-auto">
          {/* Left Panel - Overview Cards */}
          <div className="space-y-4">
            {/* Nutrition Score */}
            <motion.div
              className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-4 rounded-xl border border-blue-700/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">Nutrition Score</h3>
                <Target size={20} className="text-blue-400" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {analyticsData.nutritionScore}
                </div>
                <div className="text-gray-400 text-sm">out of 100</div>
                <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${analyticsData.nutritionScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Daily Goals */}
            <motion.div
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Activity size={20} className="text-green-400" />
                Daily Goals
              </h3>
              {analyticsData.goals && Object.entries(analyticsData.goals).map(([key, goal]) => (
                <div key={key} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{key}</span>
                    <span className="text-white">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Chart Type Selector */}
            <motion.div
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white font-bold mb-3">View Charts</h3>
              <div className="space-y-2">
                {[
                  { id: 'macros', label: 'Macro Breakdown', icon: '🥪' },
                  { id: 'weekly', label: 'Weekly Progress', icon: '📊' },
                  { id: 'daily', label: 'Daily Intake', icon: '⏰' }
                ].map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => setActiveChart(chart.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      activeChart === chart.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span>{chart.icon}</span>
                    <span className="text-sm">{chart.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Charts */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Macro Breakdown */}
              {activeChart === 'macros' && analyticsData.macroBreakdown && (
                <motion.div
                  key="macros"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 h-full"
                >
                  <h3 className="text-white font-bold text-xl mb-6">Macronutrient Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="flex flex-col justify-center">
                      {/* CSS-based Donut Chart */}
                      <div className="w-full h-[300px] flex items-center justify-center">
                        <div className="relative w-48 h-48">
                          {/* Donut Chart */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 animate-pulse">
                            <div className="absolute inset-4 rounded-full bg-gray-800 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">
                                  {analyticsData.macroBreakdown && analyticsData.macroBreakdown.reduce((sum, macro) => sum + macro.value, 0)}g
                                </div>
                                <div className="text-gray-400 text-sm">Total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      {analyticsData.macroBreakdown.map((macro, index) => (
                        <motion.div
                          key={macro.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: pieColors[index % pieColors.length] }}
                            />
                            <span className="text-white font-medium">{macro.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{macro.value}g</div>
                            <div className="text-gray-400 text-sm">{macro.percentage}%</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Weekly Progress */}
              {activeChart === 'weekly' && analyticsData.weeklyProgress && (
                <motion.div
                  key="weekly"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 h-full"
                >
                  <h3 className="text-white font-bold text-xl mb-6">Weekly Progress</h3>
                  {/* CSS-based Bar Chart */}
                  <div className="w-full h-[400px] p-4 bg-gray-700/30 rounded-lg">
                    <div className="space-y-6">
                      {analyticsData.weeklyProgress && analyticsData.weeklyProgress.map((day, index) => (
                        <div key={day.day} className="">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-medium text-sm">{day.day}</span>
                            <span className="text-gray-400 text-xs">{day.calories} kcal</span>
                          </div>
                          <div className="flex gap-2">
                            {/* Calories Bar */}
                            <div className="flex-1">
                              <div className="h-4 bg-gray-600 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-red-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.calories / 2500) * 100}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                />
                              </div>
                            </div>
                            {/* Protein Bar */}
                            <div className="flex-1">
                              <div className="h-4 bg-gray-600 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-blue-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.protein / 200) * 100}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                                />
                              </div>
                            </div>
                            {/* Carbs Bar */}
                            <div className="flex-1">
                              <div className="h-4 bg-gray-600 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-yellow-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.carbs / 300) * 100}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 + 0.4 }}
                                />
                              </div>
                            </div>
                            {/* Fats Bar */}
                            <div className="flex-1">
                              <div className="h-4 bg-gray-600 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-green-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.fats / 100) * 100}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 + 0.6 }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Legend */}
                      <div className="flex justify-center gap-4 mt-6 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-300">Calories</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-300">Protein</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-300">Carbs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-300">Fats</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Daily Intake */}
              {activeChart === 'daily' && analyticsData.dailyIntake && (
                <motion.div
                  key="daily"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 h-full"
                >
                  <h3 className="text-white font-bold text-xl mb-6">Daily Calorie Intake</h3>
                  {/* CSS-based Area Chart */}
                  <div className="w-full h-[400px] p-4 bg-gray-700/30 rounded-lg">
                    <div className="relative h-full">
                      {/* Chart Grid */}
                      <div className="absolute inset-0 opacity-20">
                        {/* Horizontal lines */}
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="absolute w-full border-t border-gray-500" style={{top: `${i * 20}%`}} />
                        ))}
                        {/* Vertical lines */}
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="absolute h-full border-l border-gray-500" style={{left: `${i * 20}%`}} />
                        ))}
                      </div>
                      
                      {/* Area Chart Simulation */}
                      <div className="relative h-full flex items-end justify-between px-2">
                        {analyticsData.dailyIntake && analyticsData.dailyIntake.filter((_, i) => i % 4 === 0).map((point, index) => {
                          const height = (point.calories / 2500) * 100;
                          return (
                            <motion.div
                              key={index}
                              className="flex-1 mx-0.5"
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            >
                              <div className="w-full bg-gradient-to-t from-red-500/80 to-red-300/40 rounded-t" style={{height: '100%'}} />
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-8">
                        <span>2500</span>
                        <span>2000</span>
                        <span>1500</span>
                        <span>1000</span>
                        <span>500</span>
                        <span>0</span>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-400 mt-2">
                        <span>6AM</span>
                        <span>12PM</span>
                        <span>6PM</span>
                        <span>12AM</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NutritionAnalytics;
