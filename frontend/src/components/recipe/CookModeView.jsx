import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, List, Book, Coffee, CheckCircle, Circle } from 'lucide-react';
import CookStep from './CookStep';
import IngredientItem from './IngredientItem';

export default function CookModeView({ steps = [], description = '', ingredients = [], cookTime = 'Unknown' }) {
  // Generate a unique ID for this recipe based on its content
  const recipeId = React.useMemo(() => {
    const recipeContent = JSON.stringify({ description, ingredients, steps: steps.map(s => s.text) });
    return btoa(recipeContent).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  }, [description, ingredients, steps]);
  
  // Utility function to get localStorage key for this recipe
  const getStorageKey = useCallback((type, index) => {
    return `recipe-${recipeId}-${type}-${index}`;
  }, [recipeId]);
  
  const [checkedStates, setCheckedStates] = useState(() =>
    steps.map((_, i) => JSON.parse(localStorage.getItem(getStorageKey('step', i))) || false)
  );
  const [ingredientChecked, setIngredientChecked] = useState(() =>
    ingredients.map((_, i) => JSON.parse(localStorage.getItem(getStorageKey('ingredient', i))) || false)
  );

  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = timerActive ? setInterval(() => setSeconds(s => s + 1), 1000) : null;
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleStep = (index) => {
    setCheckedStates(prev => {
      const copy = [...prev];
      copy[index] = !copy[index];
      localStorage.setItem(getStorageKey('step', index), JSON.stringify(copy[index]));
      return copy;
    });
  };

  const toggleIngredient = (index) => {
    setIngredientChecked(prev => {
      const copy = [...prev];
      copy[index] = !copy[index];
      localStorage.setItem(getStorageKey('ingredient', index), JSON.stringify(copy[index]));
      return copy;
    });
  };
  
  // Toggle ingredient by name (for CookStep integration)
  const toggleIngredientByName = (ingredientName) => {
    const index = ingredients.findIndex(ing => 
      ing.toLowerCase() === ingredientName.toLowerCase());
    
    if (index !== -1) {
      toggleIngredient(index);
    }
  };
  
  // Reset all checked states when recipe changes
  useEffect(() => {
    // Clear any existing checked states for this recipe
    for (let i = 0; i < steps.length; i++) {
      localStorage.removeItem(getStorageKey('step', i));
    }
    for (let i = 0; i < ingredients.length; i++) {
      localStorage.removeItem(getStorageKey('ingredient', i));
    }
    
    // Reset states to all unchecked for new recipe
    setCheckedStates(steps.map(() => false));
    setIngredientChecked(ingredients.map(() => false));
    
    // Cleanup function to prevent localStorage from getting too cluttered
    return () => {
      // Only clean up this recipe's entries when unmounting or changing recipes
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`recipe-${recipeId}`)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove old keys when component unmounts or recipe changes
      // We don't remove them immediately to allow for recipe revisiting during the session
      if (keysToRemove.length > 100) { // Only clean if there are too many entries
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    };
  }, [recipeId, steps, ingredients, getStorageKey]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white flex flex-col gap-6">

      {/* TIMER */}
      <motion.div className="self-center mb-4">
        <div className={`px-6 py-3 rounded-2xl font-bold text-xl md:text-2xl text-center transition-all ${timerActive ? 'bg-red-600 shadow-red-500/40' : 'bg-blue-600 shadow-blue-500/40'}`}
          style={{ boxShadow: timerActive ? '0 0 20px rgba(244,63,94,0.4)' : '0 0 20px rgba(59,130,246,0.4)' }}
          onClick={() => setTimerActive(!timerActive)}
        >
          {timerActive ? `Stop Timer (${formatTime(seconds)})` : 'Start Timer'} <Timer className="inline ml-2" size={24}/>
        </div>
      </motion.div>

      {/* DESCRIPTION */}
      <div className="bg-gray-800 rounded-2xl p-6 text-center text-white/80 text-base md:text-lg shadow-inner">
        <p className="italic leading-relaxed">{description}</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* INGREDIENTS */}
        <div className="flex-1 flex flex-col bg-gray-800 p-4 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Coffee size={24}/> Ingredients</h2>
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {ingredients.map((ing, i) => (
              <IngredientItem
                key={i}
                index={i}
                ingredient={ing}
                checked={ingredientChecked[i]}
                onToggle={() => toggleIngredient(i)}
              />
            ))}
          </div>
        </div>

        {/* COOKING STEPS */}
        <div className="flex-1 flex flex-col bg-gray-800 p-4 rounded-2xl shadow-md relative">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Book size={24}/> Cooking Steps</h2>

          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-4 relative z-10">
            {steps.map((step, i) => (
              <CookStep
                key={i}
                index={i}
                step={step}
                checked={checkedStates[i]}
                onToggle={() => toggleStep(i)}
                ingredients={ingredients}
                onIngredientToggle={toggleIngredientByName}
                recipeId={recipeId}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
