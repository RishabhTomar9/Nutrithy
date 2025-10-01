import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Users, 
  Heart, 
  Star, 
  Trophy, 
  TrendingUp,
  Eye,
  Calendar,
  ArrowRight,
  BarChart3
} from 'lucide-react';

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="group relative"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-700/50" />
      
      {/* Hover effect background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative p-3 sm:p-4 lg:p-6 text-center">
        {/* Icon */}
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 mx-auto mb-2 sm:mb-3 lg:mb-4 rounded-xl sm:rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 ${stat.color}`} />
        </div>
        
        {/* Value */}
        <div className="space-y-0.5 sm:space-y-1">
          <motion.div 
            className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            {stat.value}
          </motion.div>
          
          <div className="text-xs sm:text-sm text-gray-400 font-medium leading-tight">
            {stat.label}
          </div>
          
          {stat.trend && (
            <motion.div 
              className={`flex items-center justify-center gap-1 text-xs ${stat.trend > 0 ? 'text-emerald-400' : 'text-red-400'} mt-1 sm:mt-2`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <TrendingUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${stat.trend < 0 ? 'rotate-180' : ''}`} />
              <span className="text-xs">
                <span className="hidden sm:inline">{Math.abs(stat.trend)}% this month</span>
                <span className="sm:hidden">+{Math.abs(stat.trend)}%</span>
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProfileStats = ({ profile }) => {
  const navigate = useNavigate();
  
  const stats = [
    {
      label: 'Recipes Created',
      value: profile?.recipeCount || 0,
      icon: ChefHat,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      gradient: 'from-emerald-400/20 to-teal-500/20',
      trend: 12
    },
    {
      label: 'Followers',
      value: profile?.followersCount || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      gradient: 'from-blue-400/20 to-indigo-500/20',
      trend: 8
    },
    {
      label: 'Likes Received',
      value: profile?.totalLikes || 0,
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
      gradient: 'from-pink-400/20 to-rose-500/20',
      trend: 25
    },
    {
      label: 'Average Rating',
      value: profile?.averageRating ? `${profile.averageRating.toFixed(1)}★` : '0★',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      gradient: 'from-yellow-400/20 to-orange-500/20',
      trend: 5
    },
    {
      label: 'Achievement Points',
      value: profile?.achievementPoints || 0,
      icon: Trophy,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      gradient: 'from-purple-400/20 to-violet-500/20',
      trend: 15
    },
    {
      label: 'Profile Views',
      value: profile?.profileViews || 0,
      icon: Eye,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      gradient: 'from-cyan-400/20 to-teal-500/20',
      trend: -3
    },
    {
      label: 'Days Active',
      value: profile?.daysActive || Math.floor((Date.now() - new Date(profile?.createdAt || Date.now())) / (1000 * 60 * 60 * 24)) || 0,
      icon: Calendar,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      gradient: 'from-indigo-400/20 to-blue-500/20',
      trend: null
    },
    {
      label: 'Following',
      value: profile?.followingCount || 0,
      icon: Heart,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      gradient: 'from-rose-400/20 to-pink-500/20',
      trend: 3
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-8"
    >
      {/* Section Header */}
      <div className="mb-6 sm:mb-8 text-center px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2"
        >
          Profile Statistics
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base"
        >
          Track your nutrition journey progress and community engagement
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={stat.label} 
            stat={stat} 
            index={index}
          />
        ))}
      </div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        {/* Achievement Progress */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-700/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-400/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Achievement Level</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress to next level</span>
              <span className="text-purple-400 font-medium">75%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-purple-400 to-violet-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              Complete 5 more recipes to reach <span className="text-purple-400 font-medium">Nutrition Expert</span> level
            </p>
          </div>
        </div>

        {/* Recent Activity Summary with Navigation */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-700/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-400/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">This Month</h3>
            </div>
            
            <motion.button
              onClick={() => navigate('/activity')}
              className="flex items-center gap-1 sm:gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 className="w-3 h-3" />
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Recipes shared</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">New followers</span>
              <span className="text-emerald-400 font-medium">+12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Likes received</span>
              <span className="text-pink-400 font-medium">+48</span>
            </div>
          </div>
          
          {/* Full Activity Button */}
          <motion.button
            onClick={() => navigate('/activity')}
            className="w-full mt-3 sm:mt-4 py-2 px-3 sm:px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 rounded-lg sm:rounded-xl text-emerald-400 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">View Full Activity</span>
            <span className="sm:hidden">Full Activity</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileStats;
