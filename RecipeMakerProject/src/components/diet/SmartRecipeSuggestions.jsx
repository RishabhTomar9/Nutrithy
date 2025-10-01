import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Clock, Users, Flame, Heart, Star, X, 
  RefreshCw, Filter, Search, BookOpen, Plus, Minus 
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const SmartRecipeSuggestions = ({ dietPlan, formData, isVisible, onClose }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [filters, setFilters] = useState({
    mealType: 'all',
    difficulty: 'all',
    cookTime: 'all',
    cuisine: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    if (isVisible && dietPlan) {
      generateRecipes();
    }
  }, [isVisible, dietPlan, filters]);

  const generateRecipes = async () => {
    setLoading(true);
    
    try {
      if (!API_KEY) {
        // Use mock recipes if no API key
        setTimeout(() => {
          setRecipes(getMockRecipes());
          setLoading(false);
        }, 1500);
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const prompt = `
Generate 8 smart recipe suggestions based on this diet plan:
- Calories: ${dietPlan.calories}
- Protein: ${dietPlan.macros.protein}g
- Carbs: ${dietPlan.macros.carbs}g  
- Fats: ${dietPlan.macros.fats}g
- Dietary Preference: ${formData.dietaryPreference}
- Goal: ${formData.goal}
- Allergies: ${formData.allergies || 'None'}
- Medical Conditions: ${formData.medicalConditions || 'None'}
${filters.mealType !== 'all' ? `- Focus on: ${filters.mealType} recipes` : ''}
${filters.difficulty !== 'all' ? `- Difficulty: ${filters.difficulty}` : ''}
${filters.cookTime !== 'all' ? `- Cooking time: ${filters.cookTime}` : ''}

Return JSON array with recipes containing:
{
  "name": string,
  "description": string,
  "ingredients": [string],
  "instructions": [string],
  "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
  "cookTime": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "mealType": "breakfast|lunch|dinner|snack",
  "cuisine": string,
  "tags": [string],
  "tips": [string]
}

Focus on recipes that align with the dietary goals and restrictions.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      
      try {
        const parsed = JSON.parse(text);
        setRecipes(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        console.error('Failed to parse recipes:', e);
        setRecipes(getMockRecipes());
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      setRecipes(getMockRecipes());
    } finally {
      setLoading(false);
    }
  };

  const getMockRecipes = () => [
    {
      name: "Protein Power Bowl",
      description: "High-protein quinoa bowl with grilled chicken, avocado, and mixed vegetables",
      ingredients: [
        "1 cup cooked quinoa",
        "150g grilled chicken breast",
        "1/2 avocado, sliced",
        "1 cup mixed vegetables",
        "2 tbsp olive oil",
        "Salt and pepper to taste"
      ],
      instructions: [
        "Cook quinoa according to package instructions",
        "Grill chicken breast until fully cooked",
        "Steam mixed vegetables until tender",
        "Assemble bowl with quinoa as base",
        "Top with chicken, avocado, and vegetables",
        "Drizzle with olive oil and season"
      ],
      nutrition: { calories: 520, protein: 35, carbs: 45, fats: 18 },
      cookTime: 25,
      servings: 1,
      difficulty: "easy",
      mealType: "lunch",
      cuisine: "healthy",
      tags: ["high-protein", "gluten-free", "dairy-free"],
      tips: ["Prep quinoa in advance", "Marinate chicken for extra flavor"]
    },
    {
      name: "Overnight Oats Delight",
      description: "Creamy overnight oats with berries, nuts, and Greek yogurt",
      ingredients: [
        "1/2 cup rolled oats",
        "1/2 cup Greek yogurt",
        "1/2 cup almond milk",
        "1 tbsp chia seeds",
        "1/2 cup mixed berries",
        "2 tbsp chopped nuts",
        "1 tsp honey"
      ],
      instructions: [
        "Mix oats, yogurt, and almond milk in a jar",
        "Add chia seeds and stir well",
        "Refrigerate overnight",
        "Top with berries, nuts, and honey before serving",
        "Enjoy cold or at room temperature"
      ],
      nutrition: { calories: 380, protein: 20, carbs: 48, fats: 12 },
      cookTime: 5,
      servings: 1,
      difficulty: "easy",
      mealType: "breakfast",
      cuisine: "healthy",
      tags: ["high-fiber", "probiotics", "make-ahead"],
      tips: ["Prepare multiple jars for the week", "Add protein powder for extra protein"]
    },
    {
      name: "Mediterranean Salmon",
      description: "Baked salmon with Mediterranean herbs and roasted vegetables",
      ingredients: [
        "200g salmon fillet",
        "2 tbsp olive oil",
        "1 tsp dried oregano",
        "1 tsp garlic powder",
        "1 cup cherry tomatoes",
        "1 bell pepper, sliced",
        "1/2 red onion, sliced",
        "Lemon wedges"
      ],
      instructions: [
        "Preheat oven to 400°F (200°C)",
        "Season salmon with herbs and half the olive oil",
        "Toss vegetables with remaining oil",
        "Place salmon and vegetables on baking sheet",
        "Bake for 15-18 minutes until salmon flakes easily",
        "Serve with lemon wedges"
      ],
      nutrition: { calories: 420, protein: 38, carbs: 12, fats: 26 },
      cookTime: 20,
      servings: 1,
      difficulty: "medium",
      mealType: "dinner",
      cuisine: "mediterranean",
      tags: ["omega-3", "heart-healthy", "one-pan"],
      tips: ["Don't overcook the salmon", "Use parchment paper for easy cleanup"]
    }
  ];

  const filteredRecipes = recipes.filter(recipe => {
    if (filters.mealType !== 'all' && recipe.mealType !== filters.mealType) return false;
    if (filters.difficulty !== 'all' && recipe.difficulty !== filters.difficulty) return false;
    if (filters.cookTime !== 'all') {
      const maxTime = filters.cookTime === 'quick' ? 15 : filters.cookTime === 'medium' ? 30 : 60;
      if (recipe.cookTime > maxTime) return false;
    }
    if (searchQuery && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleFavorite = (recipeId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(recipeId)) {
        newFavorites.delete(recipeId);
      } else {
        newFavorites.add(recipeId);
      }
      return newFavorites;
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMealTypeIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🥜';
      default: return '🍽️';
    }
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
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ChefHat size={28} className="text-orange-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Smart Recipe Suggestions</h2>
              <p className="text-gray-400 text-sm">
                AI-powered recipes tailored to your diet plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateRecipes}
              disabled={loading}
              className="p-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-white transition-colors"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(90vh-120px)]">
          {/* Filters Sidebar */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Filter size={20} />
              Filters
            </h3>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Controls */}
            {[
              { key: 'mealType', label: 'Meal Type', options: [
                { value: 'all', label: 'All Meals' },
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinner', label: 'Dinner' },
                { value: 'snack', label: 'Snacks' }
              ]},
              { key: 'difficulty', label: 'Difficulty', options: [
                { value: 'all', label: 'Any Level' },
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]},
              { key: 'cookTime', label: 'Cook Time', options: [
                { value: 'all', label: 'Any Time' },
                { value: 'quick', label: '< 15 min' },
                { value: 'medium', label: '< 30 min' },
                { value: 'long', label: '< 60 min' }
              ]}
            ].map(filter => (
              <div key={filter.key} className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {filter.label}
                </label>
                <select
                  value={filters[filter.key]}
                  onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg border border-gray-600 p-2 focus:border-orange-500 focus:outline-none"
                >
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-gray-300 text-sm">
                Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Recipes Grid */}
          <div className="lg:col-span-3 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Generating personalized recipes...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    {/* Recipe Header */}
                    <div className="p-4 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMealTypeIcon(recipe.mealType)}</span>
                          <h3 className="text-white font-bold text-lg">{recipe.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(index);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            favorites.has(index) 
                              ? 'text-red-500 bg-red-500/20' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart size={16} fill={favorites.has(index) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {recipe.description}
                      </p>

                      {/* Recipe Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{recipe.cookTime} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={getDifficultyColor(recipe.difficulty)}>
                            {recipe.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Nutrition Info */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                          <div className="text-orange-400 text-xs">Cal</div>
                          <div className="text-white text-sm font-bold">{recipe.nutrition.calories}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                          <div className="text-blue-400 text-xs">Pro</div>
                          <div className="text-white text-sm font-bold">{recipe.nutrition.protein}g</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                          <div className="text-yellow-400 text-xs">Carb</div>
                          <div className="text-white text-sm font-bold">{recipe.nutrition.carbs}g</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                          <div className="text-green-400 text-xs">Fat</div>
                          <div className="text-white text-sm font-bold">{recipe.nutrition.fats}g</div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags?.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recipe Detail Modal */}
        <AnimatePresence>
          {selectedRecipe && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getMealTypeIcon(selectedRecipe.mealType)}</span>
                    <h3 className="text-2xl font-bold text-white">{selectedRecipe.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Ingredients & Instructions */}
                  <div>
                    <div className="mb-6">
                      <h4 className="text-white font-bold text-lg mb-3">Ingredients</h4>
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-300">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-white font-bold text-lg mb-3">Instructions</h4>
                      <ol className="space-y-3">
                        {selectedRecipe.instructions.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-gray-300">
                            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Right Column - Nutrition & Tips */}
                  <div>
                    <div className="mb-6">
                      <h4 className="text-white font-bold text-lg mb-3">Nutrition Facts</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-orange-400 text-sm mb-1">Calories</div>
                          <div className="text-white text-2xl font-bold">{selectedRecipe.nutrition.calories}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-blue-400 text-sm mb-1">Protein</div>
                          <div className="text-white text-2xl font-bold">{selectedRecipe.nutrition.protein}g</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-yellow-400 text-sm mb-1">Carbs</div>
                          <div className="text-white text-2xl font-bold">{selectedRecipe.nutrition.carbs}g</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-green-400 text-sm mb-1">Fats</div>
                          <div className="text-white text-2xl font-bold">{selectedRecipe.nutrition.fats}g</div>
                        </div>
                      </div>
                    </div>

                    {selectedRecipe.tips && (
                      <div>
                        <h4 className="text-white font-bold text-lg mb-3">Chef's Tips</h4>
                        <ul className="space-y-2">
                          {selectedRecipe.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-yellow-400 mt-1">💡</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SmartRecipeSuggestions;
