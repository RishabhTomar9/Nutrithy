import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Calendar, 
  Target,
  PieChart,
  BarChart3,
  Zap,
  Heart,
  Scale,
  Flame,
  Apple,
  Utensils
} from 'lucide-react';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');
  const [activeMetric, setActiveMetric] = useState('calories');

  // Mock data for demonstration
  const mockData = {
    calories: {
      current: 2150,
      goal: 2000,
      change: '+5%',
      data: [1800, 2100, 1950, 2300, 2050, 1900, 2150]
    },
    macros: {
      carbs: { value: 45, goal: 50 },
      protein: { value: 25, goal: 25 },
      fats: { value: 30, goal: 25 }
    },
    weight: {
      current: 72.5,
      change: '-0.8kg',
      data: [73.3, 73.1, 72.8, 72.9, 72.6, 72.7, 72.5]
    },
    activities: {
      workouts: 5,
      recipes: 12,
      meals: 21
    }
  };

  const statsCards = [
    {
      title: 'Daily Calories',
      value: mockData.calories.current,
      unit: 'kcal',
      change: mockData.calories.change,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      title: 'Current Weight',
      value: mockData.weight.current,
      unit: 'kg',
      change: mockData.weight.change,
      icon: Scale,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Active Days',
      value: mockData.activities.workouts,
      unit: 'days',
      change: '+2 this week',
      icon: Activity,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Recipes Tried',
      value: mockData.activities.recipes,
      unit: 'recipes',
      change: '+3 this week',
      icon: Utensils,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  ];

  const macroData = Object.entries(mockData.macros).map(([key, data]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: data.value,
    goal: data.goal,
    color: key === 'carbs' ? 'bg-yellow-500' : key === 'protein' ? 'bg-red-500' : 'bg-blue-500'
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 text-lg">
                Track your nutrition journey and discover insights
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              {['day', 'week', 'month', 'year'].map((range) => (
                <motion.button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} ${stat.borderColor} backdrop-blur-sm rounded-2xl p-6 border hover:border-opacity-50 transition-all duration-300 hover:scale-105 cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                    <span className="text-gray-400 text-sm">{stat.unit}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Macro Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Macro Distribution</h3>
            </div>
            
            <div className="space-y-4">
              {macroData.map((macro, index) => (
                <div key={macro.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">{macro.name}</span>
                    <span className="text-white font-semibold">{macro.value}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(macro.value / macro.goal) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                      className={`h-2 rounded-full ${macro.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Weekly Progress</h3>
              </div>
              
              <select 
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="calories" className="bg-gray-800">Calories</option>
                <option value="weight" className="bg-gray-800">Weight</option>
                <option value="protein" className="bg-gray-800">Protein</option>
              </select>
            </div>
            
            {/* Simple Bar Chart Representation */}
            <div className="flex items-end justify-between h-40 gap-2">
              {mockData.calories.data.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${(value / 2500) * 100}%` }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-gradient-to-t from-emerald-500 to-blue-500 rounded-t-md flex-1 min-h-[20px]"
                  title={`Day ${index + 1}: ${value} kcal`}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Goals and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Goals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Current Goals</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300">Daily Calories</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">2000 kcal</div>
                  <div className="text-xs text-emerald-400">107% achieved</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Target Weight</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">70 kg</div>
                  <div className="text-xs text-yellow-400">2.5 kg to go</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-gray-300">Weekly Workouts</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">5 / 5</div>
                  <div className="text-xs text-emerald-400">Goal achieved!</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Recent Achievements</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { title: 'Weekly Goal Crusher', desc: 'Completed all daily nutrition goals this week', icon: '🏆', date: '2 days ago' },
                { title: 'Recipe Explorer', desc: 'Tried 5 new healthy recipes', icon: '👨‍🍳', date: '3 days ago' },
                { title: 'Consistency King', desc: '7-day streak of logging meals', icon: '🔥', date: '1 week ago' },
                { title: 'Macro Master', desc: 'Perfect macro balance for 3 days straight', icon: '⚡', date: '1 week ago' }
              ].map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-200"
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{achievement.title}</h4>
                    <p className="text-gray-400 text-sm">{achievement.desc}</p>
                  </div>
                  <span className="text-xs text-gray-500">{achievement.date}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
