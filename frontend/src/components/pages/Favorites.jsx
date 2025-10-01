import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  ChefHat,
  Star,
  BookmarkPlus,
  Grid3X3,
  List,
  SortDesc,
  Tag
} from 'lucide-react';

export default function Favorites() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Mock data for favorite items
  const mockFavorites = [
    {
      id: 1,
      title: 'Mediterranean Quinoa Bowl',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      category: 'Healthy',
      cookTime: '25 mins',
      rating: 4.8,
      saves: 1250,
      author: 'Chef Maria',
      dateAdded: '2 days ago',
      tags: ['gluten-free', 'vegetarian', 'protein-rich']
    },
    {
      id: 2,
      title: 'Avocado Toast Variations',
      image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400',
      category: 'Breakfast',
      cookTime: '10 mins',
      rating: 4.6,
      saves: 890,
      author: 'NutriChef',
      dateAdded: '1 week ago',
      tags: ['quick', 'healthy', 'vegetarian']
    },
    {
      id: 3,
      title: 'Protein Power Smoothie',
      image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
      category: 'Drinks',
      cookTime: '5 mins',
      rating: 4.9,
      saves: 2100,
      author: 'FitnessFoodie',
      dateAdded: '3 days ago',
      tags: ['protein', 'post-workout', 'quick']
    },
    {
      id: 4,
      title: 'Asian Fusion Stir Fry',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      category: 'Dinner',
      cookTime: '30 mins',
      rating: 4.7,
      saves: 756,
      author: 'AsianCuisine',
      dateAdded: '5 days ago',
      tags: ['spicy', 'vegetables', 'balanced']
    },
    {
      id: 5,
      title: 'Keto Chocolate Mousse',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
      category: 'Dessert',
      cookTime: '15 mins',
      rating: 4.5,
      saves: 634,
      author: 'KetoKitchen',
      dateAdded: '1 week ago',
      tags: ['keto', 'low-carb', 'dessert']
    },
    {
      id: 6,
      title: 'Green Goddess Salad',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      category: 'Salad',
      cookTime: '15 mins',
      rating: 4.8,
      saves: 1100,
      author: 'GreenEats',
      dateAdded: '4 days ago',
      tags: ['fresh', 'detox', 'vitamins']
    }
  ];

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'dessert', 'drinks', 'salad', 'healthy'];
  const sortOptions = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'cookTime', label: 'Quick to Make' }
  ];

  const filteredFavorites = mockFavorites.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const FavoriteCard = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    >
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors duration-200"
          >
            <Heart className="w-4 h-4 fill-current" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-emerald-500/80 transition-colors duration-200"
          >
            <BookmarkPlus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-medium rounded-full">
            {item.category}
          </span>
        </div>

        {/* Cook Time */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{item.cookTime}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors duration-200">
            {item.title}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-300">{item.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <ChefHat className="w-4 h-4" />
          <span>by {item.author}</span>
          <span>•</span>
          <span>{item.dateAdded}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{item.saves} saves</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-200"
          >
            View Recipe
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const FavoriteListItem = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors duration-200 truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-300">{item.rating}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{item.cookTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-3 h-3" />
              <span>{item.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{item.saves} saves</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {item.tags.slice(0, 2).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/30 transition-colors duration-200"
            >
              View
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
                My Favorites
              </h1>
              <p className="text-gray-400 text-lg">
                Your saved recipes and loved content • {filteredFavorites.length} items
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              <motion.button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Grid3X3 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <List className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 cursor-pointer min-w-[140px]"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="bg-gray-800 text-white">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 cursor-pointer min-w-[160px]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <SortDesc className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Favorites Grid/List */}
        <AnimatePresence mode="wait">
          {filteredFavorites.length > 0 ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFavorites.map((item, index) => (
                    <FavoriteCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFavorites.map((item, index) => (
                    <FavoriteListItem key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-red-400/10 to-pink-400/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-400/20">
                <Heart className="w-12 h-12 text-red-400/40" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery || filterCategory !== 'all' ? 'No matches found' : 'No favorites yet'}
              </h3>
              <p className="text-white/60 max-w-md mx-auto leading-relaxed">
                {searchQuery || filterCategory !== 'all' 
                  ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                  : 'Start exploring recipes and save your favorites to see them here.'
                }
              </p>
              {(searchQuery || filterCategory !== 'all') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                  }}
                  className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg"
                >
                  Clear Filters
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
