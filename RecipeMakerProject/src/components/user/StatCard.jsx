import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon, label, value, color }) {
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
