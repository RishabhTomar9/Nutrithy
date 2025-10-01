import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import * as communityService from '../../services/communityService';

export default function CommunitySearch({ onSearchResults }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showClearButton, setShowClearButton] = useState(false);

  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowClearButton(value.length > 0);
  };

  // Clear search input
  const handleClearSearch = () => {
    setQuery('');
    setShowClearButton(false);
    onSearchResults(null); // Clear search results
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      setSearching(true);
      setError(null);
      
      const response = await communityService.searchPosts(query.trim());
      
      // Pass search results to parent component
      onSearchResults({
        posts: response.posts,
        query: query.trim(),
        total: response.total,
        searchMethod: response.searchMethod
      });
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search posts');
      onSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search posts by content, author, or tags..."
          className="w-full bg-gray-800/60 backdrop-blur-sm text-white rounded-full py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500/50 border border-gray-700/50"
          disabled={searching}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <FaSearch />
        </div>
        
        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
          >
            <FaTimes />
          </button>
        )}
        
        {/* Search button */}
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50"
        >
          {searching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
        </button>
      </form>
      
      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm mt-2">
          {error}
        </div>
      )}
    </motion.div>
  );
}