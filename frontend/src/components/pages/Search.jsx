import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, TrendingUp, Clock, Users, ChefHat, Star } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recipes');
  const [filterOpen, setFilterOpen] = useState(false);

  const mockResults = {
    recipes: [
      {
        id: 1,
        title: 'Mediterranean Quinoa Bowl',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        rating: 4.8,
        cookTime: '25 mins',
        author: 'Chef Maria',
        saves: 1250
      },
      {
        id: 2,
        title: 'Avocado Toast Variations',
        image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400',
        rating: 4.6,
        cookTime: '10 mins',
        author: 'NutriChef',
        saves: 890
      }
    ],
    users: [
      {
        id: 1,
        name: 'Chef Maria',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60b7f3d?w=100',
        followers: 15200,
        recipes: 85,
        verified: true
      },
      {
        id: 2,
        name: 'NutriChef',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        followers: 8900,
        recipes: 42,
        verified: false
      }
    ]
  };

  const trendingSearches = ['keto recipes', 'meal prep', 'smoothie bowls', 'vegan desserts', 'protein meals'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Discover & Search
          </h1>
          <p className="text-gray-400 text-lg">
            Find recipes, chefs, and nutrition content
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for recipes, ingredients, chefs..."
              className="w-full pl-12 pr-16 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              <SearchIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>

        {/* Trending Searches */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Trending Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term, index) => (
                <motion.button
                  key={term}
                  onClick={() => setQuery(term)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-gray-300 hover:text-white transition-all duration-200 hover:scale-105"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Tabs */}
        {query && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                {['recipes', 'users', 'ingredients'].map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-4 h-4" />
                Filters
              </motion.button>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {activeTab === 'recipes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockResults.recipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">{recipe.cookTime}</span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                            {recipe.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-300">{recipe.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                          <ChefHat className="w-4 h-4" />
                          <span>by {recipe.author}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{recipe.saves} saves</span>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                          >
                            View Recipe
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                  {mockResults.users.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                              {user.verified && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                              <span>{user.followers.toLocaleString()} followers</span>
                              <span>{user.recipes} recipes</span>
                            </div>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                          Follow
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="text-center py-16">
                  <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Search for ingredients</h3>
                  <p className="text-gray-400">Find recipes based on ingredients you have</p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Empty State */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Start searching</h3>
            <p className="text-gray-400">Discover amazing recipes and connect with fellow food lovers</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
