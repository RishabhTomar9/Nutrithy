import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  Clock,
  User,
  RefreshCw,
  Droplets,
  Scale,
  Zap,
  Heart,
  Flame,
  MapPin,
  Users,
  Trophy,
  Star,
  Gift,
  Camera,
  Share2,
  Bell,
  Settings,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle,
  Timer,
  Bookmark,
  MessageCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import ActivityFeed from '../components/profile/ActivityFeed';
import LoadingFallback from '../components/common/LoadingFallback';
import NutritionService from '../services/nutritionService';
import { getCurrentUserProfile } from '../services/userService';
import toast from 'react-hot-toast';

const ActivityPage = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [nutritionLoading, setNutritionLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socialStats, setSocialStats] = useState(null);
  
  const {
    profile,
    loading: profileLoading,
    error: profileError
  } = useUserProfile(userData, loading, null);

  // Fetch user profile with joined date
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profileData = await getCurrentUserProfile();
      setUserProfile(profileData);
      
      // Mock achievements and social data for demonstration
      setAchievements([
        { id: 1, title: 'First Week Complete', icon: 'trophy', earned: true, date: '2024-01-15' },
        { id: 2, title: 'Water Warrior', icon: 'droplets', earned: true, date: '2024-01-20' },
        { id: 3, title: 'Consistency Champion', icon: 'target', earned: false, progress: 75 },
        { id: 4, title: 'Social Butterfly', icon: 'users', earned: false, progress: 40 },
      ]);
      
      setSocialStats({
        followers: profileData?.followers || 0,
        following: profileData?.following || 0,
        posts: profileData?.posts || 0,
        likes: profileData?.totalLikes || 0
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [user]);

  // Fetch nutrition data from backend
  const fetchNutritionData = useCallback(async () => {
    if (!user) return;

    try {
      setNutritionLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch all nutrition data concurrently
      const [dailyNutrition, goals, water, weight] = await Promise.allSettled([
        NutritionService.getDailyNutrition(today),
        NutritionService.getNutritionGoals(),
        NutritionService.getWaterIntake(today),
        NutritionService.getWeightHistory('week')
      ]);

      // Process results
      if (dailyNutrition.status === 'fulfilled') {
        setNutritionData(NutritionService.formatNutritionData(dailyNutrition.value));
      }

      if (goals.status === 'fulfilled') {
        setNutritionGoals(goals.value);
      }

      if (water.status === 'fulfilled') {
        setWaterIntake(water.value);
      }

      if (weight.status === 'fulfilled') {
        setWeightHistory(weight.value);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      toast.error('Failed to load nutrition data');
    } finally {
      setNutritionLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setUserData(user);
      setLoading(false);
    }, 500);

    // Fetch nutrition data and user profile
    if (user) {
      fetchNutritionData();
      fetchUserProfile();
    }

    return () => clearTimeout(timer);
  }, [user, fetchNutritionData, fetchUserProfile]);

  const handleRefreshActivity = async () => {
    setRefreshing(true);
    try {
      // Refresh both profile and nutrition data
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 1000)), // Simulate activity refresh
        fetchNutritionData(), // Refresh nutrition data
        fetchUserProfile() // Refresh user profile
      ]);
      toast.success('Activity refreshed successfully! ✨');
    } catch (error) {
      toast.error('Failed to refresh activity. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate nutrition percentages
  const nutritionPercentages = nutritionData && nutritionGoals
    ? NutritionService.calculateNutritionPercentages(nutritionData, nutritionGoals)
    : {};

  // Enhanced activity stats with more features
const activityStats = [
  {
    id: 'calories_today',
    title: "Today's Calories",
    value: nutritionData?.calories || 0,
    icon: Zap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    trend: nutritionGoals?.calories ? `${nutritionPercentages.calories || 0}% of goal` : 'No goal set',
    progress: nutritionPercentages.calories || 0
  },
  {
    id: 'water_intake',
    title: 'Water Intake',
    value: waterIntake?.total || 0,
    unit: 'ml',
    icon: Droplets,
    color: 'text-blue-600',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    trend: nutritionGoals?.water ? `${nutritionPercentages.water || 0}% of goal` : 'Stay hydrated!',
    progress: nutritionPercentages.water || 0
  },
  {
    id: 'current_weight',
    title: 'Current Weight',
    value: weightHistory[0]?.weight || 0,
    unit: 'kg',
    icon: Scale,
    color: 'text-purple-600',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    trend: weightHistory.length > 1 ? 
      `${weightHistory[0]?.weight > weightHistory[1]?.weight ? '+' : ''}${((weightHistory[0]?.weight || 0) - (weightHistory[1]?.weight || 0)).toFixed(1)}kg this week` : 
      'Track your progress',
    progress: 75
  },
  {
    id: 'active_streak',
    title: 'Active Streak',
    value: profile?.activeStreak || streakData?.current || 28,
    unit: 'days',
    icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    trend: 'Personal best!',
    progress: Math.min(100, ((profile?.activeStreak || 28) / 30) * 100)
  },
  {
    id: 'social_engagement',
    title: 'Community Points',
    value: socialStats?.likes || 156,
    icon: Heart,
    color: 'text-pink-600',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/40',
    trend: '+24 this week',
    progress: 82
  },
  {
    id: 'achievements',
    title: 'Achievements',
    value: achievements.filter(a => a.earned).length,
    unit: `/${achievements.length}`,
    icon: Trophy,
    color: 'text-yellow-600',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/40',
    trend: 'Keep going!',
    progress: (achievements.filter(a => a.earned).length / achievements.length) * 100
  },
  {
    id: 'meal_planning',
    title: 'Meal Plans Created',
    value: userProfile?.mealPlans || 5,
    icon: CalendarIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    trend: 'Coming Soon!',
    progress: 60,
    comingSoon: true
  },
  {
    id: 'recipes_shared',
    title: 'Recipes Shared',
    value: userProfile?.recipesShared || 12,
    icon: Share2,
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    trend: '+3 this month',
    progress: 85
  }
];



  if (loading || profileLoading || nutritionLoading) {
    return (
      <LoadingFallback 
        message={nutritionLoading ? "Loading nutrition data..." : "Loading your activity..."} 
      />
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-md w-full bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 text-center border border-gray-700/50 shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Activity Loading Error
          </h2>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            Unable to load your activity data. Please check your connection and try again.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="px-10 pt-8 w-full mx-auto flex flex-col gap-8 max-w-7xl"
        >
          {/* Enhanced Page Header */}
          <div className="relative mb-12 overflow-hidden">
            {/* Animated background pattern */}
            {/* <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-20 right-20 w-16 h-16 bg-white rounded-full animate-pulse delay-300"></div>
              <div className="absolute bottom-10 left-1/3 w-12 h-12 bg-white rounded-full animate-pulse delay-700"></div>
            </div> */}
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                      Your Activity Dashboard
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-white font-medium">Live tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-white/90 text-lg sm:text-xl max-w-4xl leading-relaxed">
                  🚀 Monitor your nutrition journey, track achievements, and engage with the community. 
                  <span className="text-yellow-300 font-semibold"> Stay motivated</span> with real-time insights and personalized progress tracking.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <motion.button
                  onClick={handleRefreshActivity}
                  disabled={refreshing}
                  className="flex items-center cursor-pointer gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 rounded-2xl text-white font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
             
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                  </span>
                </motion.button>
                
                {/* Quick Stats Preview */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {nutritionData?.calories || 0}
                    </div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">Calories Today</div>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {achievements.filter(a => a.earned).length}
                    </div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">Achievements</div>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {profile?.activeStreak || 28}
                    </div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">Day Streak</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Activity Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10"
          >
            {activityStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.08, duration: 0.5 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className={`rounded-3xl border border-gray-200/50 dark:border-gray-600/50 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group relative overflow-hidden backdrop-blur-sm ${stat.comingSoon ? 'opacity-75' : ''}`}
                >
                  {/* Enhanced gradient accent with glow */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-400', '-400')} ${stat.color.replace('text-', 'to-').replace('-400', '-600')} opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-lg`}></div>
                  
                  {/* Floating background glow */}
                  <div className={`absolute -inset-1 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

                  {/* Enhanced Coming Soon Badge */}
                  {/* {stat.comingSoon && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-2 rounded-full font-bold shadow-lg border-2 border-white dark:border-gray-800">
                          <Lock className="w-3 h-3 inline mr-1" />
                          SOON
                        </div>
                      </div>
                    </div>
                  )} */}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('-400', '-400')} ${stat.color.replace('text-', 'to-').replace('-400', '-600')} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl ${stat.comingSoon ? 'opacity-60 grayscale' : ''}`}>
                        <Icon className="w-7 h-7 text-white drop-shadow-sm" />
                        {/* Icon glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('-400', '-400')} ${stat.color.replace('text-', 'to-').replace('-400', '-600')} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                      </div>
                      <div className={`relative text-xs px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 ${stat.color} rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-300 ${stat.comingSoon ? 'opacity-75' : ''}`}>
                        {stat.trend}
                        <div className={`absolute inset-0 bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-400', '-100')} ${stat.color.replace('text-', 'to-').replace('-400', '-200')} rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300`}></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-gray-700 dark:text-gray-200 text-sm font-bold uppercase tracking-wider leading-tight">{stat.title}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl sm:text-5xl font-black bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('-400', '-600')} ${stat.color.replace('text-', 'to-').replace('-400', '-800')} bg-clip-text text-transparent leading-none`}>
                          {stat.value}
                        </span>
                        {stat.unit && (
                          <span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">{stat.unit}</span>
                        )}
                      </div>
                      
                      {/* Enhanced progress indicator */}
                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 shadow-inner">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-400', '-400')} ${stat.color.replace('text-', 'to-').replace('-400', '-600')} shadow-sm relative overflow-hidden`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, stat.progress || (stat.value / (stat.value + 20)) * 100)}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 1.5, ease: "easeOut" }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse"></div>
                          </motion.div>
                        </div>
                        <div className="text-right mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {Math.min(100, stat.progress || (stat.value / (stat.value + 20)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Enhanced Activity Feed Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="rounded-3xl border border-gray-200/50 dark:border-gray-600/50 shadow-2xl backdrop-blur-sm p-8 relative overflow-hidden"
          >
            {/* Background decoration */}
            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div> */}
            
            {/* Enhanced User Profile Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 mb-10 p-6 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/30 dark:via-blue-900/30 dark:to-purple-900/30 rounded-3xl border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse"></div>
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="relative w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 dark:text-white font-bold text-2xl">
                      {user?.displayName || 'Nutrition Enthusiast'}
                    </h3>
                    <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold rounded-full">
                      {profile?.level || 'Pro'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <Clock className="w-4 h-4 text-white" />
                        <span className="text-sm text-white font-medium">
                          Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024')}
                        </span>
                      </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 dark:text-green-400 font-medium">Active now</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8 sm:border-l-2 sm:border-emerald-300/30 dark:sm:border-emerald-600/30 sm:pl-8">
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                      {profile?.totalPoints?.toLocaleString() || '1,247'}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Total Points</div>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                      {achievements.filter(a => a.earned).length}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Achievements</div>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                      {profile?.activeStreak || 28}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Day Streak</div>
                </div>
              </div>
            </motion.div>

            {/* Activity Feed with enhanced styling */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-12 h-12  rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Activity Timeline
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your recent nutrition and fitness activities
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Live Updates</span>
                </div>
              </div>
              <div className="rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <ActivityFeed profile={profile} />
              </div>
            </div>
          </motion.div>

          {/* Enhanced Features Grid - Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Achievements Section */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-3xl p-6 border border-yellow-100 dark:border-yellow-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                  <Trophy className="w-3 h-3 inline mr-1" />
                  LIVE
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Achievements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unlock badges & rewards</p>
                </div>
              </div>
              <div className="space-y-2">
                {achievements.slice(0, 3).map((achievement, idx) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      achievement.earned ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {achievement.earned ? <CheckCircle className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-gray-500" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{achievement.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Social Features */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-3xl p-6 border border-pink-100 dark:border-pink-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  <Lock className="w-3 h-3 inline mr-1" />
                  SOON
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center opacity-60">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Social Hub</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect & share with friends</p>
                </div>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Group Challenges</span>
                </div>
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recipe Sharing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Community Feed</span>
                </div>
              </div>
            </motion.div>

            {/* Smart Analytics */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  <Lock className="w-3 h-3 inline mr-1" />
                  SOON
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center opacity-60">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Smart Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered insights</p>
                </div>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Goal Predictions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Personal Recommendations</span>
                </div>
              </div>
            </motion.div>

            {/* Meal Planning Pro */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-3xl p-6 border border-green-100 dark:border-green-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  <Lock className="w-3 h-3 inline mr-1" />
                  SOON
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center opacity-60">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Meal Planning Pro</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Advanced meal scheduling</p>
                </div>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto Meal Plans</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bookmark className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Shopping Lists</span>
                </div>
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Prep Time Optimizer</span>
                </div>
              </div>
            </motion.div>

            {/* Health Tracking */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  <Lock className="w-3 h-3 inline mr-1" />
                  SOON
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center opacity-60">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Health Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive health metrics</p>
                </div>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fitness Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Location-based Meals</span>
                </div>
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Photo Food Logging</span>
                </div>
              </div>
            </motion.div>

            {/* Rewards Program */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-3xl p-6 border border-purple-100 dark:border-purple-800 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  <Lock className="w-3 h-3 inline mr-1" />
                  SOON
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center opacity-60">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Rewards Program</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Earn points & unlock perks</p>
                </div>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loyalty Points</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Exclusive Recipes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium Features</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-10 bg-black rounded-3xl p-8 text-white text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">🚀 Stay Updated!</h3>
              <p className="text-lg mb-6 opacity-90">
                Be the first to know when new features launch. Get exclusive early access!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-emerald-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
              >
                <Bell className="w-5 h-5 inline mr-2" />
                Notify Me
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ActivityPage;
