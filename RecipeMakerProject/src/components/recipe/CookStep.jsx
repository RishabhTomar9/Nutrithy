import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Utensils, Sparkles } from "lucide-react";
import EmojiReactions from "../community/EmojiReactions";

export default function CookStep({ index, step, ingredients, onIngredientToggle, recipeId, checked, onToggle }) {
  // Generate a unique ID for this step based on its content and recipe ID
  const stepId = React.useMemo(() => {
    if (!step || !step.text) return `step-${index}`;
    // If recipeId is provided by parent, use it for consistency
    if (recipeId) return recipeId;
    
    // Fallback to generating our own ID if recipeId not provided
    const hash = btoa(step.text).substring(0, 15).replace(/[^a-zA-Z0-9]/g, '');
    return `step-${hash}-${index}`;
  }, [step, index, recipeId]);
  
  // State for showing related ingredients
  const [showIngredients, setShowIngredients] = useState(false);

  // Extract potential ingredients from step text
  const relatedIngredients = ingredients
    ? ingredients.filter((ingredient) =>
        step.text.toLowerCase().includes(ingredient.toLowerCase())
      )
    : [];

  const handleToggle = () => {
    // Call the parent's onToggle function
    onToggle();

    // If step is marked as done, suggest marking related ingredients
    if (!checked && relatedIngredients.length > 0) {
      setShowIngredients(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: checked ? 0.98 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: index * 0.08,
      }}
      whileHover={{
        borderColor: "rgba(34,197,94,0.5)", // green glow
      }}
      className={`relative mb-6 rounded-2xl border p-5 shadow-lg transition-all duration-300 ${
        checked
          ? "border-green-500/50 bg-green-900/20"
          : "border-white/10 bg-gray-800/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h3
          className={`text-lg font-bold transition-colors duration-300 ${
            checked ? "text-green-400" : "text-white"
          }`}
        >
          Step {index + 1}
          {relatedIngredients.length > 0 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowIngredients((prev) => !prev);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full bg-green-600/20 hover:bg-green-500/30 text-green-300 text-xs"
              title="Show related ingredients"
            >
              <Utensils size={14} />
              <span className="ml-1">{relatedIngredients.length}</span>
            </motion.button>
          )}
        </h3>
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.92 }}
          className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold transition-all duration-300 ${
            checked
              ? "bg-green-600 text-white border border-green-500 shadow-md"
              : "bg-transparent text-white border border-white/30 hover:bg-white/10"
          }`}
        >
          {checked ? <CheckCircle size={18} /> : <Circle size={18} />}
          {checked ? "Completed" : "Mark as Done"}
        </motion.button>
      </div>

      {/* Step Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 + index * 0.1, duration: 0.5 }}
        className={`mt-2 text-base leading-relaxed transition-all duration-300 ${
          checked
            ? "line-through decoration-2 text-white/50 italic"
            : "text-white/80"
        }`}
      >
        {step.text}
      </motion.p>

      {/* Tags */}
      {step.tags && (
        <div className="mt-4 flex flex-wrap gap-2">
          {step.tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.25 + index * 0.1 + i * 0.08,
                duration: 0.3,
                type: "spring",
              }}
              whileHover={{ scale: 1.15, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full px-3 py-1 text-xs font-medium text-white shadow-md ${
                checked ? "bg-green-500" : "bg-blue-600"
              }`}
            >
              #{tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* Related Ingredients */}
      <AnimatePresence>
        {showIngredients && relatedIngredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            <div className="p-3 bg-gray-700/40 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-2 text-green-300">
                <Utensils size={16} />
                <span className="text-sm font-medium">
                  Related Ingredients:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedIngredients.map((ingredient, i) => (
                  <motion.button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onIngredientToggle) onIngredientToggle(ingredient);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-green-600/30 hover:bg-green-500/40 rounded-full text-xs font-medium text-white flex items-center gap-1"
                  >
                    <Circle size={12} />
                    {ingredient}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Reactions */}
      <div className="mt-4">
        <EmojiReactions stepId={index} />
      </div>

      {/* Completion effects */}
      <AnimatePresence>
        {checked && (
          <>
            {/* Strike line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute left-[10%] right-[10%] top-1/2 h-[2px] bg-green-400/60 rounded-full origin-left"
            />

            {/* Checkmark burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-4 right-4 text-green-400"
            >
              <Sparkles size={24} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
