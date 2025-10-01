import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Sparkles } from "lucide-react";

export default function IngredientItem({ index, ingredient, checked, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: checked ? 0.97 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 250,
        damping: 18,
        delay: index * 0.05,
      }}
      onClick={onToggle}
      className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-all duration-300 backdrop-blur-md border overflow-hidden group
        ${checked
          ? "bg-gradient-to-r from-blue-900 to-blue-700 text-blue-200 border-blue-500/40"
          : "bg-gray-800/70 border-gray-600/20 hover:border-gray-400/40"}
      `}
    >
      {/* Checkbox */}
      <motion.div
        className={`flex-shrink-0 rounded-full p-1 transition-colors duration-300
          ${checked ? "text-green-400 drop-shadow-lg" : "text-white/70"}`}
      >
        {checked ? <CheckCircle size={22} /> : <Circle size={22} />}
      </motion.div>

      {/* Ingredient text */}
      <motion.span
        className={`text-base md:text-lg transition-all duration-300 font-medium tracking-wide
          ${checked
            ? "line-through decoration-2 text-blue-200/80 italic"
            : "text-white"}
        `}
        animate={{ x: checked ? 8 : 0 }}
      >
        {ingredient}
      </motion.span>

      {/* Strike-through animation */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-[10%] right-[10%] top-1/2 h-[2px] bg-blue-400/60 z-10 rounded-full origin-left"
          />
        )}
      </AnimatePresence>

      {/* Sparkle effect when checked */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute right-3 top-2 text-green-400/80"
          >
            <Sparkles size={18} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover glow border */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-white/10 transition-colors duration-300" />
    </motion.div>
  );
}