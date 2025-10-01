import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  TrendingUp, 
  Users, 
  ChefHat, 
  Heart,
  MessageCircle,
  Calendar,
  Tag,
  SortAsc,
  SortDesc,
  Globe,
  User,
  Hash
} from 'lucide-react';
import * as communityService from '../../services/communityService';
import { toast } from 'react-hot-toast';

const EnhancedCommunitySearch = ({ onSearchResults, onFilterChange, initialFilters = {} }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'posts', 'recipes', 'users'
    category: '',
    dateRange: '7d', // '1d', '7d', '30d', 'all'
    sortBy: 'relevance', // 'relevance', 'date', 'popularity', 'engagement'
    sortOrder: 'desc', // 'asc', 'desc'
    tags: [],
    author: '',
    hasImages: false,
    hasRecipes: false,
    minLikes: 0,
    location: '',
    language: 'all',
    ...initialFilters
  });

  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  // Search categories with icons
  const searchCategories = [
    { value: 'all', label: 'All Content', icon: Globe, color: 'bg-gray-100 text-gray-700' },
    { value: 'posts', label: 'Posts', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
    { value: 'recipes', label: 'Recipes', icon: ChefHat, color: 'bg-green-100 text-green-700' },
    { value: 'users', label: 'Users', icon: Users, color: 'bg-purple-100 text-purple-700' },
  ];

  // Popular search tags
  const popularTags = [
    'healthy', 'vegetarian', 'vegan', 'gluten-free', 'keto', 'breakfast', 'lunch', 
    'dinner', 'dessert', 'quick-meals', 'meal-prep', 'comfort-food', 'international'
  ];

  // Date range options
  const dateRangeOptions = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: 'This Week' },
    { value: '30d', label: 'This Month' },
    { value: '90d', label: '3 Months' },
    { value: 'all', label: 'All Time' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: TrendingUp },
    { value: 'date', label: 'Newest First', icon: Calendar },
    { value: 'popularity', label: 'Most Popular', icon: Heart },
    { value: 'engagement', label: 'Most Engaged', icon: MessageCircle }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    try {
      const newRecentSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5);

      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, [recentSearches]);

  // Fetch search suggestions with debouncing
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await communityService.getSearchSuggestions(searchQuery, {
        limit: 8,
        type: filters.type
      });

      if (response.success) {
        setSuggestions(response.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [filters.type]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Show suggestions for non-empty queries
    if (value.trim()) {
      setShowSuggestions(true);
      
      // Debounce suggestion fetching
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [fetchSuggestions]);

  // Perform search
  const performSearch = useCallback(async (searchQuery = query, searchFilters = filters) => {
    if (!searchQuery.trim()) {
      // Clear search results
      onSearchResults(null);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const response = await communityService.searchCommunity(searchQuery, {
        ...searchFilters,
        page: 1,
        limit: 20
      });

      if (response.success) {
        onSearchResults({
          query: searchQuery,
          results: response.results || [],
          total: response.total || 0,
          searchMethod: response.searchMethod || 'default',
          filters: searchFilters,
          suggestions: response.relatedSuggestions || []
        });

        // Save to recent searches
        saveRecentSearch(searchQuery);

        // Analytics tracking
        if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
          window.gtag('event', 'search', {
            search_term: searchQuery,
            search_type: searchFilters.type,
            results_count: response.total || 0
          });
        }
      } else {
        toast.error('Search failed. Please try again.');
        onSearchResults(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Something went wrong. Please try again.');
      onSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, onSearchResults, saveRecentSearch]);

  // Handle search submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    performSearch();
  }, [performSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);

    // Auto-search if there's a query
    if (query.trim()) {
      performSearch(query, newFilters);
    }
  }, [filters, query, performSearch, onFilterChange]);

  // Handle tag toggle
  const toggleTag = useCallback((tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    handleFilterChange('tags', newTags);
  }, [filters.tags, handleFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      type: 'all',
      category: '',
      dateRange: '7d',
      sortBy: 'relevance',
      sortOrder: 'desc',
      tags: [],
      author: '',
      hasImages: false,
      hasRecipes: false,
      minLikes: 0,
      location: '',
      language: 'all'
    };
    
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);

    if (query.trim()) {
      performSearch(query, defaultFilters);
    }
  }, [query, performSearch, onFilterChange]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch(suggestion.text);
  }, [performSearch]);

  // Handle recent search selection
  const selectRecentSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchResults(null);
    searchInputRef.current?.focus();
  }, [onSearchResults]);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Main Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 z-10">
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Search className="w-5 h-5 text-emerald-400" />
                </motion.div>
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search recipes, posts, users, or ingredients..."
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(query.trim().length > 0)}
              className="w-full bg-gray-800/60 backdrop-blur-sm text-white placeholder-gray-400 rounded-2xl pl-12 pr-24 py-4 border border-gray-700/50 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
            />

            <div className="absolute right-2 flex items-center gap-2">
              {query && (
                <motion.button
                  type="button"
                  onClick={clearSearch}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl transition-all ${
                  showFilters 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Filter className="w-4 h-4" />
              </motion.button>

              <motion.button
                type="submit"
                disabled={isSearching || !query.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200"
              >
                Search
              </motion.button>
            </div>
          </div>
        </form>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && !query.trim() && (
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <motion.button
                        key={index}
                        onClick={() => selectRecentSearch(search)}
                        whileHover={{ x: 4 }}
                        className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                      >
                        {search}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Suggestions
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                      >
                        {suggestion.type === 'user' && <User className="w-4 h-4 text-purple-400" />}
                        {suggestion.type === 'recipe' && <ChefHat className="w-4 h-4 text-green-400" />}
                        {suggestion.type === 'tag' && <Hash className="w-4 h-4 text-blue-400" />}
                        {suggestion.type === 'general' && <Search className="w-4 h-4 text-gray-400" />}
                        
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.text}</div>
                          {suggestion.description && (
                            <div className="text-sm text-gray-500">{suggestion.description}</div>
                          )}
                        </div>
                        
                        {suggestion.count && (
                          <span className="text-xs text-gray-500">{suggestion.count} results</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Category Filters */}
      <div className="flex flex-wrap gap-3 mt-4 mb-4">
        {searchCategories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.button
              key={category.value}
              onClick={() => handleFilterChange('type', category.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                filters.type === category.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </motion.button>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6 mt-4 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Time Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded-xl px-3 py-2 border border-gray-600/50 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20"
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded-xl px-3 py-2 border border-gray-600/50 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Sort Order
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-600/50">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('sortOrder', 'desc')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 transition-all ${
                      filters.sortOrder === 'desc'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    <SortDesc className="w-4 h-4" />
                    Desc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('sortOrder', 'asc')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 transition-all ${
                      filters.sortOrder === 'asc'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    <SortAsc className="w-4 h-4" />
                    Asc
                  </button>
                </div>
              </div>

              {/* Minimum Likes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Heart className="w-4 h-4 inline mr-2" />
                  Minimum Likes
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minLikes}
                  onChange={(e) => handleFilterChange('minLikes', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700/50 text-white rounded-xl px-3 py-2 border border-gray-600/50 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              {/* Content Type Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Content Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={filters.hasImages}
                      onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                      className="rounded border-gray-600 text-emerald-600 focus:ring-emerald-600/20"
                    />
                    Has Images
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={filters.hasRecipes}
                      onChange={(e) => handleFilterChange('hasRecipes', e.target.checked)}
                      className="rounded border-gray-600 text-emerald-600 focus:ring-emerald-600/20"
                    />
                    Has Recipes
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <motion.button
                  type="button"
                  onClick={clearFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-2 px-4 bg-gray-600/50 hover:bg-gray-500/50 text-white rounded-xl font-medium transition-all"
                >
                  Clear Filters
                </motion.button>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="mt-6 pt-6 border-t border-gray-700/30">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Tag className="w-4 h-4 inline mr-2" />
                Popular Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <motion.button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      filters.tags.includes(tag)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedCommunitySearch;
