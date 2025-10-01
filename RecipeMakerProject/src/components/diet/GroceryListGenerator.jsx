import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, X, Download, Share2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

const GroceryListGenerator = ({ dietPlan, isVisible, onClose }) => {
  const [groceryList, setGroceryList] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [servings, setServings] = useState(1);

  // Generate grocery list from diet plan
  useEffect(() => {
    if (dietPlan && isVisible) {
      generateGroceryList();
    }
  }, [dietPlan, isVisible, servings]);

  const generateGroceryList = () => {
    const ingredients = {};
    
    // Extract ingredients from all meals
    Object.values(dietPlan.meals).flat().forEach(meal => {
      const extractedIngredients = extractIngredientsFromMeal(meal);
      extractedIngredients.forEach(ingredient => {
        const category = categorizeIngredient(ingredient);
        if (!ingredients[category]) {
          ingredients[category] = [];
        }
        
        // Check if ingredient already exists and combine quantities
        const existingIndex = ingredients[category].findIndex(item => 
          item.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          ingredients[category][existingIndex].quantity = combineQuantities(
            ingredients[category][existingIndex].quantity,
            ingredient.quantity * servings
          );
        } else {
          ingredients[category].push({
            ...ingredient,
            quantity: ingredient.quantity * servings,
            id: `${category}-${ingredients[category].length}`
          });
        }
      });
    });

    setGroceryList(ingredients);
    
    // Initialize expanded categories
    const initialExpanded = {};
    Object.keys(ingredients).forEach(category => {
      initialExpanded[category] = true;
    });
    setExpandedCategories(initialExpanded);
  };

  const extractIngredientsFromMeal = (meal) => {
    const ingredients = [];
    const patterns = [
      /(\d*\.?\d+)\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lbs?|pieces?|medium|large|small)\s+(.+)/i,
      /(\d+)\s+(.+)/i,
      /(.+)\s+\((\d*\.?\d+)\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lbs?|pieces?|medium|large|small)\)/i
    ];

    patterns.forEach(pattern => {
      const match = meal.match(pattern);
      if (match) {
        const quantity = parseFloat(match[1]) || 1;
        const unit = match[2] || 'piece';
        const name = match[3] || match[2] || meal;
        
        ingredients.push({
          name: name.trim(),
          quantity: quantity,
          unit: unit,
          originalMeal: meal
        });
        return;
      }
    });

    // If no pattern matches, add as generic item
    if (ingredients.length === 0) {
      ingredients.push({
        name: meal.trim(),
        quantity: 1,
        unit: 'item',
        originalMeal: meal
      });
    }

    return ingredients;
  };

  const categorizeIngredient = (ingredient) => {
    const name = ingredient.name.toLowerCase();
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('fish') || name.includes('salmon') || name.includes('turkey')) {
      return 'Meat & Seafood';
    }
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
        name.includes('butter') || name.includes('cream')) {
      return 'Dairy';
    }
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('berries') || name.includes('fruit')) {
      return 'Fruits';
    }
    if (name.includes('broccoli') || name.includes('carrots') || name.includes('spinach') || 
        name.includes('lettuce') || name.includes('tomato') || name.includes('vegetable')) {
      return 'Vegetables';
    }
    if (name.includes('bread') || name.includes('rice') || name.includes('pasta') || 
        name.includes('oats') || name.includes('quinoa') || name.includes('cereal')) {
      return 'Grains & Bakery';
    }
    if (name.includes('oil') || name.includes('vinegar') || name.includes('spice') || 
        name.includes('salt') || name.includes('pepper') || name.includes('herb')) {
      return 'Pantry & Condiments';
    }
    if (name.includes('nuts') || name.includes('seeds') || name.includes('protein powder')) {
      return 'Nuts & Supplements';
    }
    
    return 'Other';
  };

  const combineQuantities = (qty1, qty2) => {
    // Simple quantity combination - in a real app, you'd handle unit conversions
    return qty1 + qty2;
  };

  const toggleItemCheck = (category, itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${category}-${itemId}`]: !prev[`${category}-${itemId}`]
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const exportGroceryList = () => {
    const listText = Object.entries(groceryList)
      .map(([category, items]) => {
        const categoryText = `${category}:\n`;
        const itemsText = items.map(item => 
          `  - ${item.quantity} ${item.unit} ${item.name}`
        ).join('\n');
        return categoryText + itemsText;
      })
      .join('\n\n');

    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareGroceryList = () => {
    const listText = Object.entries(groceryList)
      .map(([category, items]) => {
        const itemsText = items.map(item => 
          `• ${item.quantity} ${item.unit} ${item.name}`
        ).join('\n');
        return `${category}:\n${itemsText}`;
      })
      .join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: 'My Grocery List',
        text: listText,
      });
    } else {
      navigator.clipboard.writeText(listText);
      // Show toast notification
      alert('Grocery list copied to clipboard!');
    }
  };

  const getTotalItems = () => {
    return Object.values(groceryList).flat().length;
  };

  const getCheckedItems = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart size={28} className="text-green-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Grocery List</h2>
              <p className="text-gray-400 text-sm">
                {getCheckedItems()}/{getTotalItems()} items completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <span className="text-white text-sm">Servings:</span>
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                <Minus size={16} />
              </button>
              <span className="text-white font-bold px-2">{servings}</span>
              <button
                onClick={() => setServings(servings + 1)}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={exportGroceryList}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={shareGroceryList}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        {/* Grocery List */}
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {Object.entries(groceryList).map(([category, items]) => (
            <motion.div
              key={category}
              className="bg-gray-800/50 rounded-lg border border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-400">{category}</span>
                  <span className="text-sm text-gray-400">({items.length} items)</span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedCategories[category] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-2">
                      {items.map((item) => {
                        const itemKey = `${category}-${item.id}`;
                        const isChecked = checkedItems[itemKey] || false;
                        
                        return (
                          <motion.div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors group"
                            whileHover={{ x: 2 }}
                          >
                            <button
                              onClick={() => toggleItemCheck(category, item.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-500 hover:border-green-400'
                              }`}
                            >
                              {isChecked && (
                                <Check size={12} />
                              )}
                            </button>
                            <span className={`flex-1 transition-all ${
                              isChecked 
                                ? 'text-gray-500 line-through' 
                                : 'text-white group-hover:text-green-300'
                            }`}>
                              {item.quantity} {item.unit} {item.name}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Shopping Progress</span>
            <span className="text-green-400">
              {Math.round((getCheckedItems() / getTotalItems()) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(getCheckedItems() / getTotalItems()) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroceryListGenerator;
