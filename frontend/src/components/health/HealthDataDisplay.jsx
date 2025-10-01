import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Heart, Footprints, Zap, Clock, Droplet, TrendingUp,
  Activity, Target, Calendar, RefreshCw, AlertCircle, 
  CheckCircle, Smartphone, Watch, BarChart3,
  Wifi, WifiOff, Battery, Signal
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import healthDataService from '../../services/healthDataService';

const HealthDataDisplay = memo(({ showConnectionButtons = false, onConnect }) => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    googleFit: false,
    smartwatch: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Accessibility and performance
  const shouldReduceMotion = useReducedMotion();
  const [focusedCard, setFocusedCard] = useState(null);

  // Responsive breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      loadHealthData();
      checkConnectionStatus();

      // Subscribe to real-time health data updates
      const unsubscribe = healthDataService.subscribeToHealthData(user.uid, (data) => {
        if (data) {
          setHealthData(data);
          setLastUpdate(data.lastUpdate);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const loadHealthData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      const data = await healthDataService.getHealthData(user.uid);
      setHealthData(data);
      if (data) {
        setLastUpdate(data.lastUpdate);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const checkConnectionStatus = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const status = await healthDataService.getConnectionStatus(user.uid);
      setConnectionStatus({
        googleFit: status?.googleFitConnected || false,
        smartwatch: status?.smartwatchConnected || false
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [user?.uid]);

  const syncHealthData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const data = await healthDataService.fetchHealthData(yesterday, today);
      setHealthData(data);
      setLastUpdate(data.lastUpdate);
    } catch (error) {
      console.error('Error syncing health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const healthMetrics = useMemo(() => [
    {
      id: 'steps',
      label: 'Steps',
      icon: Footprints,
      value: healthData?.steps || 0,
      unit: '',
      color: 'text-blue-400',
      bgColor: 'from-blue-900/20 to-blue-800/30',
      borderColor: 'border-blue-700/30',
      glowColor: 'shadow-blue-500/10',
      target: 10000,
      format: (value) => value.toLocaleString(),
      trend: healthData?.steps > 8000 ? 'up' : 'down',
      category: 'Activity'
    },
    {
      id: 'heartRate',
      label: isMobile ? 'Heart Rate' : 'Heart Rate',
      shortLabel: 'HR',
      icon: Heart,
      value: healthData?.heartRate?.value || 0,
      unit: 'bpm',
      color: 'text-red-400',
      bgColor: 'from-red-900/20 to-red-800/30',
      borderColor: 'border-red-700/30',
      glowColor: 'shadow-red-500/10',
      target: null,
      format: (value) => Math.round(value),
      trend: 'stable',
      category: 'Vitals'
    },
    {
      id: 'calories',
      label: isMobile ? 'Calories' : 'Calories Burned',
      shortLabel: 'Cal',
      icon: Zap,
      value: healthData?.calories || 0,
      unit: 'kcal',
      color: 'text-orange-400',
      bgColor: 'from-orange-900/20 to-orange-800/30',
      borderColor: 'border-orange-700/30',
      glowColor: 'shadow-orange-500/10',
      target: 2000,
      format: (value) => Math.round(value),
      trend: healthData?.calories > 1500 ? 'up' : 'down',
      category: 'Activity'
    },
    {
      id: 'distance',
      label: 'Distance',
      icon: TrendingUp,
      value: healthData?.distance || 0,
      unit: 'km',
      color: 'text-green-400',
      bgColor: 'from-green-900/20 to-green-800/30',
      borderColor: 'border-green-700/30',
      glowColor: 'shadow-green-500/10',
      target: 5,
      format: (value) => value.toFixed(1),
      trend: healthData?.distance > 3 ? 'up' : 'down',
      category: 'Activity'
    },
    {
      id: 'sleep',
      label: 'Sleep',
      icon: Clock,
      value: healthData?.sleep?.hours || 0,
      unit: 'hours',
      color: 'text-purple-400',
      bgColor: 'from-purple-900/20 to-purple-800/30',
      borderColor: 'border-purple-700/30',
      glowColor: 'shadow-purple-500/10',
      target: 8,
      format: (value) => `${value}h`,
      trend: healthData?.sleep?.hours >= 7 ? 'up' : 'down',
      category: 'Recovery'
    }
  ], [healthData, isMobile]);

  const getProgressPercentage = useCallback((value, target) => {
    if (!target) return 0;
    return Math.min(100, (value / target) * 100);
  }, []);

  const getConnectionStatusColor = () => {
    const connected = connectionStatus.googleFit || connectionStatus.smartwatch;
    return connected ? 'text-green-400' : 'text-red-400';
  };

  const getConnectionIcon = () => {
    const connected = connectionStatus.googleFit || connectionStatus.smartwatch;
    return connected ? Wifi : WifiOff;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-700 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 sm:h-5 bg-gray-700 rounded w-32 sm:w-40 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="w-16 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(isMobile ? 2 : isTablet ? 4 : 6)].map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-700"></div>
                  <div className="h-4 bg-gray-700 rounded w-20 sm:w-24"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
              <div className="space-y-3">
                <div className="h-8 sm:h-10 bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-700 rounded w-full"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const hasConnectedDevices = connectionStatus.googleFit || connectionStatus.smartwatch;
  const hasHealthData = healthData && Object.values(healthData).some(value => 
    value !== null && value !== 0 && value !== undefined
  );

  return (
    <div className="space-y-4 sm:space-y-6" role="region" aria-label="Health metrics dashboard">
      {/* Enhanced Header */}
      <motion.div 
        initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity size={isMobile ? 20 : 24} className="text-blue-400" />
          </motion.div>
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              Health {isMobile ? '' : 'Metrics'}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-1">
                {React.createElement(getConnectionIcon(), { size: 12 })}
                <span className={getConnectionStatusColor()}>
                  {connectionStatus.googleFit || connectionStatus.smartwatch ? 'Connected' : 'Offline'}
                </span>
              </div>
              {!isMobile && (
                <>
                  <span>•</span>
                  <span>Real-time health data from your devices</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle for larger screens */}
          {!isMobile && (
            <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <button
                onClick={() => setViewMode('grid')}
                onKeyDown={(e) => e.key === 'Enter' && setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <BarChart3 size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                onKeyDown={(e) => e.key === 'Enter' && setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  viewMode === 'list' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                aria-label="Switch to list view"
                aria-pressed={viewMode === 'list'}
              >
                <Activity size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {hasConnectedDevices && healthData && (
            <motion.button
              onClick={syncHealthData}
              disabled={isLoading}
              className={`flex items-center gap-2 ${
                isMobile ? 'px-3 py-2.5' : 'px-4 py-2'
              } bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-xl text-blue-400 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              aria-label={isLoading ? 'Syncing health data' : 'Sync health data'}
            >
              <RefreshCw size={isMobile ? 14 : 16} className={isLoading ? 'animate-spin' : ''} />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>Sync</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Connection Status */}
      {showConnectionButtons && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Signal size={12} className="text-blue-400" />
                </div>
                Device Status
              </h4>
              {(connectionStatus.googleFit || connectionStatus.smartwatch) && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
            
            <div className={`grid gap-3 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {/* Google Fit Status */}
              <motion.div 
                className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600/30"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus.googleFit ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <Smartphone size={isMobile ? 14 : 16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300 font-medium`}>
                    Google Fit
                  </span>
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} ${
                    connectionStatus.googleFit ? 'text-green-400' : 'text-gray-500'
                  } mt-0.5`}>
                    {connectionStatus.googleFit ? 'Syncing data' : 'Disconnected'}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                  connectionStatus.googleFit 
                    ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                    : 'bg-gray-600/10 text-gray-500 border-gray-600/30'
                }`}>
                  {connectionStatus.googleFit ? 'ON' : 'OFF'}
                </span>
              </motion.div>

              {/* Smartwatch Status */}
              <motion.div 
                className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600/30"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus.smartwatch ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <Watch size={isMobile ? 14 : 16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300 font-medium`}>
                    Smartwatch
                  </span>
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} ${
                    connectionStatus.smartwatch ? 'text-blue-400' : 'text-gray-500'
                  } mt-0.5`}>
                    {connectionStatus.smartwatch ? 'Real-time sync' : 'Disconnected'}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                  connectionStatus.smartwatch 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                    : 'bg-gray-600/10 text-gray-500 border-gray-600/30'
                }`}>
                  {connectionStatus.smartwatch ? 'ON' : 'OFF'}
                </span>
              </motion.div>
            </div>

            {onConnect && (
              <motion.button
                onClick={onConnect}
                className={`w-full ${isMobile ? 'py-3' : 'py-2.5'} px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={isMobile ? 'text-sm' : 'text-base'}>Connect Health Devices</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced No Data State */}
      {!hasHealthData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-800/20 to-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-700/30"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="mx-auto mb-4 sm:mb-6"
          >
            <Activity size={isMobile ? 40 : 48} className="text-gray-500 mx-auto" />
          </motion.div>
          
          <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-300 mb-2`}>
            No Health Data Available
          </h4>
          
          <p className={`text-gray-500 ${isMobile ? 'text-xs px-4' : 'text-sm'} mb-6 max-w-md mx-auto leading-relaxed`}>
            {!hasConnectedDevices 
              ? 'Connect your devices to start tracking your health metrics and get personalized insights'
              : 'Sync your devices to see your latest health data and progress'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {!isMobile && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Smartphone size={12} />
                  <span>Google Fit</span>
                </div>
                <div className="flex items-center gap-1">
                  <Watch size={12} />
                  <span>Smartwatch</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Health Metrics Grid */}
      {hasHealthData && (
        <>
          <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${
            viewMode === 'list' && !isMobile 
              ? 'grid-cols-1 max-w-4xl mx-auto' 
              : isMobile 
                ? 'grid-cols-1' 
                : isTablet 
                  ? 'grid-cols-2' 
                  : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}>
            {healthMetrics.map((metric, index) => {
              const isListView = viewMode === 'list' && !isMobile;
              const progress = getProgressPercentage(metric.value, metric.target);
              
              return (
                <motion.div
                  key={metric.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
                  animate={shouldReduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
                  transition={shouldReduceMotion ? {} : { 
                    delay: index * 0.08, 
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={shouldReduceMotion ? {} : { 
                    y: -4, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className={`group relative overflow-hidden bg-gradient-to-br ${metric.bgColor} backdrop-blur-xl border ${metric.borderColor} hover:border-opacity-60 transition-all duration-300 hover:${metric.glowColor} focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 ${
                    isListView 
                      ? 'p-6 rounded-2xl flex items-center gap-6' 
                      : isMobile 
                        ? 'p-4 rounded-xl' 
                        : 'p-5 sm:p-6 rounded-xl sm:rounded-2xl'
                  }`}
                  role="article"
                  aria-label={`${metric.label} health metric`}
                  tabIndex={0}
                  onFocus={() => setFocusedCard(metric.id)}
                  onBlur={() => setFocusedCard(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocusedCard(focusedCard === metric.id ? null : metric.id);
                    }
                  }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-current transform translate-x-16 -translate-y-16"></div>
                  </div>
                  
                  {isListView ? (
                    /* List View Layout */
                    <>
                      <div className="flex items-center gap-4">
                          <motion.div 
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} flex items-center justify-center`}
                            whileHover={shouldReduceMotion ? {} : { rotate: 5 }}
                            aria-hidden="true"
                          >
                            <metric.icon size={24} className={metric.color} />
                          </motion.div>
                        <div>
                          <h4 className="text-lg font-bold text-white" id={`metric-${metric.id}-title`}>{metric.label}</h4>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">{metric.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-baseline gap-2">
                            <span 
                              className={`text-4xl font-bold ${metric.color}`}
                              aria-describedby={`metric-${metric.id}-title`}
                            >
                              {metric.format(metric.value)}
                            </span>
                            <span className="text-gray-400 text-base" aria-label={`Unit: ${metric.unit}`}>{metric.unit}</span>
                          </div>
                          {metric.trend && (
                            <div className={`text-xs mt-1 flex items-center gap-1 justify-center ${
                              metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              <TrendingUp size={10} className={metric.trend === 'down' ? 'rotate-180' : ''} />
                              <span>{metric.trend === 'up' ? 'Trending up' : metric.trend === 'down' ? 'Trending down' : 'Stable'}</span>
                            </div>
                          )}
                        </div>
                        
                        {metric.target && (
                          <div className="flex-1 max-w-xs">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">Goal Progress</span>
                              <span className={metric.color}>{Math.round(progress)}%</span>
                            </div>
                            <div className="relative w-full bg-gray-700/50 rounded-full h-3">
                              <motion.div
                                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${metric.color.replace('text-', 'from-').replace('-400', '-400')} ${metric.color.replace('text-', 'to-').replace('-400', '-600')}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                              />
                              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white`}>
                                {metric.format(metric.target)}{metric.unit}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Grid View Layout */
                    <>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div 
                              className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <metric.icon size={isMobile ? 16 : 20} className={metric.color} />
                            </motion.div>
                            <div>
                              <h4 className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>
                                {isMobile && metric.shortLabel ? metric.shortLabel : metric.label}
                              </h4>
                              {!isMobile && (
                                <span className="text-xs text-gray-400 uppercase tracking-wider">{metric.category}</span>
                              )}
                            </div>
                          </div>
                          
                          {metric.target && (
                            <div className="text-right">
                              <span className={`text-xs text-gray-400 ${isMobile ? 'hidden' : ''}`}>
                                Goal: {metric.format(metric.target)}
                              </span>
                              {metric.trend && (
                                <div className={`flex items-center gap-1 justify-end mt-1 ${
                                  metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  <TrendingUp size={8} className={metric.trend === 'down' ? 'rotate-180' : ''} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-baseline gap-2">
                            <motion.span 
                              className={`font-bold ${metric.color} ${isMobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                            >
                              {metric.format(metric.value)}
                            </motion.span>
                            <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>{metric.unit}</span>
                          </div>

                          {metric.target && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-400">Progress</span>
                                <span className={metric.color}>{Math.round(progress)}%</span>
                              </div>
                              <div className="relative w-full bg-gray-700/50 rounded-full h-2 sm:h-2.5 overflow-hidden">
                                <motion.div
                                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${metric.color.replace('text-', 'from-').replace('-400', '-400')} ${metric.color.replace('text-', 'to-').replace('-400', '-600')}`}
                                  initial={{ width: 0, opacity: 0 }}
                                  animate={{ width: `${progress}%`, opacity: 1 }}
                                  transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.1 }}
                                />
                                <motion.div
                                  className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 2, ease: "easeInOut", delay: index * 0.1 + 1 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover Effect Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgColor} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl sm:rounded-2xl`}></div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced Last Update Info */}
          {lastUpdate && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 bg-gray-800/20 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Clock size={10} className="text-green-400" />
                </div>
                <span>Last synced: {new Date(lastUpdate).toLocaleString()}</span>
              </div>
              
              {!isMobile && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span>Auto-sync enabled</span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span>{healthMetrics.filter(m => m.value > 0).length} metrics active</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Enhanced Sleep Quality Section */}
          {healthData?.sleep?.quality && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br from-indigo-900/20 to-purple-900/30 backdrop-blur-xl border border-indigo-700/30 transition-all duration-300 hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-500/10 ${
                isMobile ? 'p-4 rounded-xl' : 'p-6 rounded-2xl'
              }`}
            >
              <div className={`flex items-center gap-3 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Clock size={isMobile ? 16 : 20} className="text-indigo-400" />
                </motion.div>
                <div>
                  <h4 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>Sleep Quality</h4>
                  <span className="text-xs text-indigo-400/70 uppercase tracking-wider">Recovery Metric</span>
                </div>
                
                <div className="ml-auto text-right">
                  <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-indigo-400`}>
                    {healthData.sleep.quality}%
                  </div>
                  <div className={`text-xs ${healthData.sleep.quality >= 80 ? 'text-green-400' : healthData.sleep.quality >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {healthData.sleep.quality >= 80 ? 'Excellent' : 
                     healthData.sleep.quality >= 70 ? 'Good' : 
                     healthData.sleep.quality >= 60 ? 'Fair' : 'Poor'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quality Score</span>
                  <span className="text-indigo-400 font-medium">{healthData.sleep.quality}/100</span>
                </div>
                
                <div className="relative w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${healthData.sleep.quality}%`, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
                  />
                </div>
                
                {!isMobile && healthData.sleep.duration && (
                  <div className="flex justify-between items-center pt-2 border-t border-indigo-700/30">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-indigo-400">{healthData.sleep.duration}h</div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                    <div className="w-px h-8 bg-indigo-700/30"></div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-purple-400">{healthData.sleep.efficiency || '92'}%</div>
                      <div className="text-xs text-gray-400">Efficiency</div>
                    </div>
                    <div className="w-px h-8 bg-indigo-700/30"></div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-pink-400">{healthData.sleep.deepSleep || '25'}%</div>
                      <div className="text-xs text-gray-400">Deep Sleep</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
});

HealthDataDisplay.displayName = 'HealthDataDisplay';

export default HealthDataDisplay;
