import React from "react";
import { motion } from "framer-motion";

export default function ShareButton({ icon, label, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-1"
      onClick={onClick}
    >
      <div className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
        {icon}
      </div>
      <span className="text-white/70 text-xs">{label}</span>
    </motion.button>
  );
}
