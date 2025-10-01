import React from "react";
import { motion } from "framer-motion";
import { PieChart, ChefHat, Heart, TrendingUp, Clock } from "lucide-react";
import WeeklyActivity from "./WeeklyActivity";

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-lg"
    >
      <div className={`bg-gradient-to-br ${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
        {icon}
      </div>
      <h4 className="text-white/60 text-sm mb-1">{label}</h4>
      <p className="text-white text-2xl font-bold">{value}</p>
    </motion.div>
  );
}

export default function RecipeStats({ userStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden"
    >
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-green-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gradient-to-tr from-purple-400/10 to-pink-500/10 rounded-full blur-3xl"></div>
      <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <PieChart className="text-green-400" size={24} /> Recipe Activity
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<ChefHat size={20} />} label="Total Recipes" value={userStats.totalRecipes} color="from-blue-400 to-blue-500" />
        <StatCard icon={<Heart size={20} />} label="Favorites" value={userStats.favoriteCount} color="from-red-400 to-red-500" />
        <StatCard icon={<TrendingUp size={20} />} label="Streak" value={`${userStats.streakDays} days`} color="from-green-400 to-green-500" />
        <StatCard icon={<Clock size={20} />} label="Last Active" value={userStats.lastActive} color="from-purple-400 to-purple-500" />
      </div>
      {userStats.topCategories.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold text-white mb-3">Top Categories</h4>
          <div className="flex flex-wrap gap-2">
            {userStats.topCategories.map((category, index) => (
              <span key={index} className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-400/80 to-green-500/80 text-white">
                {category.name} ({category.count})
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <h4 className="text-lg font-semibold text-white mb-3">Weekly Activity</h4>
        <WeeklyActivity />
      </div>
    </motion.div>
  );
}
