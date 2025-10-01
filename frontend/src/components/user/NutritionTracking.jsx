import React from "react";
import { motion } from "framer-motion";
import { Flame, Target, Plus } from "lucide-react";
import { FaUtensils } from "react-icons/fa";

export default function NutritionTracking({ profile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden"
    >
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full blur-3xl"></div>
      <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <FaUtensils className="text-purple-400" size={24} /> Nutrition Tracking
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Calorie Intake */}
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Flame size={18} className="text-orange-400" /> Daily Calories
          </h4>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-white">
                  {Math.floor(Math.random() * 500) + 1500} / 2000 kcal
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-white">
                  {Math.floor(Math.random() * 30) + 70}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                transition={{ duration: 1 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-orange-400 to-red-500"
              ></motion.div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/70">Protein</div>
              <div className="text-sm font-bold text-white">{Math.floor(Math.random() * 30) + 70}g</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/70">Carbs</div>
              <div className="text-sm font-bold text-white">{Math.floor(Math.random() * 50) + 150}g</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/70">Fat</div>
              <div className="text-sm font-bold text-white">{Math.floor(Math.random() * 20) + 40}g</div>
            </div>
          </div>
        </div>
        {/* Nutrient Goals */}
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Target size={18} className="text-blue-400" /> Nutrient Goals
          </h4>
          <div className="space-y-4">
            {['Protein', 'Fiber', 'Vitamin C', 'Iron'].map((nutrient, index) => {
              const progress = Math.floor(Math.random() * 60) + 40;
              return (
                <div key={nutrient} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white">{nutrient}</span>
                    <span className="text-xs text-white/70">{progress}%</span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.1 * index, duration: 0.8 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-400 to-indigo-500"
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2">
            <Plus size={16} /> Track New Meal
          </button>
        </div>
      </div>
    </motion.div>
  );
}
