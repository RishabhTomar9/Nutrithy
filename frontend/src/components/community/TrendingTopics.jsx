import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHashtag, FaFire, FaCrown, FaUsers, FaUtensils, FaEye, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { MdOutlineTrendingUp } from "react-icons/md";
// Mock data - replace with real API data
const mockTrendingData = {
  hashtags: [
    { tag: 'pasta', count: 2847, growth: '+24%' },
    { tag: 'vegan', count: 1923, growth: '+18%' },
    { tag: 'breakfast', count: 1756, growth: '+15%' },
    { tag: 'dessert', count: 1453, growth: '+12%' },
    { tag: 'healthy', count: 1298, growth: '+9%' },
    { tag: 'quickmeal', count: 987, growth: '+34%' },
  ],
  recipes: [
    {
      id: 1,
      title: 'Creamy Garlic Pasta',
      author: 'ChefMaria',
      views: 15400,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Avocado Toast Supreme',
      author: 'HealthyEats',
      views: 12300,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Chocolate Lava Cake',
      author: 'SweetTooth',
      views: 11200,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    },
  ],
  contributors: [
    { name: 'ChefMaria', recipes: 156, followers: 28500, verified: true },
    { name: 'HealthyEats', recipes: 89, followers: 15200, verified: true },
    { name: 'SweetTooth', recipes: 124, followers: 22100, verified: false },
    { name: 'QuickBites', recipes: 67, followers: 8900, verified: false },
  ],
  stats: {
    totalUsers: 45620,
    totalRecipes: 12840,
    totalPosts: 28340,
    activeUsers: 3240,
  },
};

const containerVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function TrendingTopics() {
  const [activeTab, setActiveTab] = useState('hashtags');
  const [data, setData] = useState(mockTrendingData);

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          activeUsers: prev.stats.activeUsers + Math.floor(Math.random() * 10) - 5,
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'hashtags', label: 'Trending', icon: MdOutlineTrendingUp },
    { id: 'recipes', label: 'Popular', icon: FaUtensils },
    { id: 'contributors', label: 'Top Chefs', icon: FaCrown },
    { id: 'stats', label: 'Community', icon: FaUsers },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hashtags':
        return (
          <div className="space-y-3">
            {data.hashtags.map((hashtag, index) => (
              <motion.div
                key={hashtag.tag}
                variants={itemVariants}
                className="flex items-center justify-between p-3 bg-gray-800/40 backdrop-blur-sm rounded-lg hover:bg-gray-700/40 transition-all duration-300 cursor-pointer group"
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <FaHashtag className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-blue-300 transition-colors">
                      #{hashtag.tag}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {formatNumber(hashtag.count)} posts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <MdOutlineTrendingUp className="text-xs" />
                    {hashtag.growth}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'recipes':
        return (
          <div className="space-y-3">
            {data.recipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                variants={itemVariants}
                className="p-3 bg-gray-800/40 backdrop-blur-sm rounded-lg hover:bg-gray-700/40 transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={recipe.image} 
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">
                      {recipe.title}
                    </h4>
                    <p className="text-gray-400 text-xs">by {recipe.author}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <FaEye className="text-xs" />
                        {formatNumber(recipe.views)}
                      </span>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-400 text-xs" />
                        <span className="text-white text-xs">{recipe.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'contributors':
        return (
          <div className="space-y-3">
            {data.contributors.map((contributor, index) => (
              <motion.div
                key={contributor.name}
                variants={itemVariants}
                className="flex items-center justify-between p-3 bg-gray-800/40 backdrop-blur-sm rounded-lg hover:bg-gray-700/40 transition-all duration-300 cursor-pointer group"
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {contributor.name.charAt(0)}
                    </div>
                    {contributor.verified && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <FaCrown className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-orange-300 transition-colors">
                      {contributor.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {contributor.recipes} recipes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">
                    {formatNumber(contributor.followers)}
                  </p>
                  <p className="text-gray-500 text-xs">followers</p>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4">
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 gap-3"
            >
              <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg border border-blue-500/20">
                <FaUsers className="text-blue-400 mb-2" />
                <p className="text-white font-bold text-lg">{formatNumber(data.stats.totalUsers)}</p>
                <p className="text-gray-300 text-sm">Total Users</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-sm rounded-lg border border-green-500/20">
                <FaUtensils className="text-green-400 mb-2" />
                <p className="text-white font-bold text-lg">{formatNumber(data.stats.totalRecipes)}</p>
                <p className="text-gray-300 text-sm">Recipes</p>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 gap-3"
            >
              <div className="p-4 bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-lg border border-orange-500/20">
                <FaFire className="text-orange-400 mb-2" />
                <p className="text-white font-bold text-lg">{formatNumber(data.stats.totalPosts)}</p>
                <p className="text-gray-300 text-sm">Total Posts</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <FaUsers className="text-purple-400" />
                </div>
                <p className="text-white font-bold text-lg">{formatNumber(data.stats.activeUsers)}</p>
                <p className="text-gray-300 text-sm">Online Now</p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-lg border border-gray-600/50"
            >
              <h4 className="text-white font-medium mb-2">Community Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Posts Today</span>
                  <span className="text-green-400">+127</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">New Recipes</span>
                  <span className="text-blue-400">+43</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">New Members</span>
                  <span className="text-purple-400">+89</span>
                </div>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-sm"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="mb-4 p-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-md rounded-xl border border-gray-600/50"
      >
        <h2 className="text-xl font-bold text-white mb-1">Community Hub</h2>
        <p className="text-gray-300 text-sm">Discover what's trending</p>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        variants={itemVariants}
        className="mb-4 p-1 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50"
      >
        <div className="grid grid-cols-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className="text-xs" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        variants={itemVariants}
        className="bg-gray-800/60 backdrop-blur-md rounded-xl border border-gray-700/50 p-4 min-h-[400px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        variants={itemVariants}
        className="mt-4 space-y-2"
      >
        <button className="w-full p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-lg border border-green-500/30 text-white hover:from-green-600/30 hover:to-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2">
          <FaUtensils />
          <span className="font-medium">Share a Recipe</span>
        </button>
        <button className="w-full p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg border border-purple-500/30 text-white hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 flex items-center justify-center gap-2">
          <FaUsers />
          <span className="font-medium">Join Groups</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
