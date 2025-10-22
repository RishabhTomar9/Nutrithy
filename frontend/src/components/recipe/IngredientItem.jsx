import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

export default function IngredientItem({ index, ingredient, checked, onToggle }) {
  const springTransition = {
    type: "spring",
    stiffness: 350,
    damping: 28,
    mass: 0.7,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95, filter: "blur(6px)" }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      transition={{ 
        ...springTransition, 
        delay: index * 0.05,
        opacity: { duration: 0.4 },
        filter: { duration: 0.5 }
      }}
      className="group relative"
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onToggle}
        className="relative cursor-pointer select-none"
      >
        {/* Main container */}
        <motion.div
          animate={{
            backgroundColor: checked 
              ? "rgba(16, 185, 129, 0.08)" 
              : "rgba(255, 255, 255, 0.04)",
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex items-center gap-5 p-5 rounded-3xl overflow-hidden border transition-all duration-600
            ${
              checked
                ? "border-emerald-500/25 shadow-lg shadow-emerald-500/10"
                : "border-white/8 shadow-sm shadow-black/5"
            }
          `}
        >
          {/* Ambient gradient background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: checked ? 1 : 0,
            }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/8 to-cyan-500/5" />
            <div className="absolute inset-0 bg-gradient-to-tl from-emerald-400/3 to-transparent" />
          </motion.div>

          {/* Top shine layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none" />

          {/* Checkbox with enhanced design */}
          <motion.div
            animate={{
              scale: checked ? [1, 1.15, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="relative flex-shrink-0"
          >
            <motion.div
              className={`relative flex items-center justify-center w-7 h-7 rounded-xl border-2 transition-all duration-500
                ${
                  checked
                    ? "bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600 border-emerald-400/50 shadow-xl shadow-emerald-500/40"
                    : "border-white/20 bg-white/[0.03]"
                }
              `}
            >
              <AnimatePresence mode="wait">
                {checked && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 90, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                  >
                    <Check size={16} strokeWidth={3.5} className="text-white drop-shadow-lg" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checkbox inner glow */}
              <AnimatePresence>
                {checked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 rounded-xl bg-white/30"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Ripple burst effect */}
            <AnimatePresence>
              {checked && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-400/40 blur-sm"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.4 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md"
                  />
                </>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Text content */}
          <motion.div className="flex-1 min-w-0 relative">
            <motion.p
              animate={{
                x: checked ? 4 : 0,
                opacity: checked ? 0.65 : 1,
              }}
              transition={{ 
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`text-base font-medium tracking-wide leading-relaxed transition-all duration-500
                ${
                  checked
                    ? "text-white/70"
                    : "text-white/95"
                }
              `}
            >
              {ingredient}
            </motion.p>
            
            {/* Enhanced strike-through */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="absolute left-0 right-0 top-1/2 h-[2px] origin-left"
                  style={{ transform: "translateY(-50%)" }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {/* Sparkle indicator */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0, 
                    opacity: 1,
                  }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="text-emerald-400"
                >
                  <Sparkles size={18} fill="currentColor" className="drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completion badge */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: 0.15,
                  }}
                  className="relative"
                >
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest drop-shadow-sm">
                      Complete
                    </span>
                  </div>
                  {/* Badge glow */}
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md -z-10" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating particles effect when checked */}
          <AnimatePresence>
            {checked && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: 0,
                      y: 0,
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0.5],
                      x: [0, (i - 1) * 30 + Math.random() * 20],
                      y: [0, -40 - Math.random() * 30],
                    }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400 pointer-events-none"
                    style={{
                      left: "30%",
                      top: "50%",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}