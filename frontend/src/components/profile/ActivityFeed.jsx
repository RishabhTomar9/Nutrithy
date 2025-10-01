import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ChefHat, 
  Heart, 
  Star, 
  MessageCircle, 
  Share2,
  Clock,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Bookmark,
  ThumbsUp,
  BarChart3,
  Zap,
  Target,
  Flame,
  Gift,
  Camera,
  MapPin,
  Plus,
  CheckCircle2,
  ArrowUp,
  ExternalLink,
  Sparkles,
  Timer,
  Bell,
  Layers,
  Trophy
} from 'lucide-react';

// Enhanced Activity type configurations
const ACTIVITY_CONFIG = {
  recipe_created: {
    icon: ChefHat,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    gradient: 'from-emerald-400 to-emerald-600',
    category: 'creation',
    priority: 'high'
  },
  recipe_liked: {
    icon: Heart,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    gradient: 'from-pink-400 to-pink-600',
    category: 'engagement',
    priority: 'medium'
  },
  recipe_rated: {
    icon: Star,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    gradient: 'from-yellow-400 to-yellow-600',
    category: 'engagement',
    priority: 'medium'
  },
  comment_added: {
    icon: MessageCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    gradient: 'from-blue-400 to-blue-600',
    category: 'social',
    priority: 'medium'
  },
  recipe_shared: {
    icon: Share2,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    gradient: 'from-purple-400 to-purple-600',
    category: 'social',
    priority: 'medium'
  },
  follower_gained: {
    icon: Users,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    gradient: 'from-cyan-400 to-cyan-600',
    category: 'social',
    priority: 'high'
  },
  achievement_earned: {
    icon: Award,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    gradient: 'from-orange-400 to-orange-600',
    category: 'achievement',
    priority: 'high'
  },
  nutrition_logged: {
    icon: BarChart3,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    gradient: 'from-green-400 to-green-600',
    category: 'health',
    priority: 'medium'
  },
  goal_achieved: {
    icon: Target,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    gradient: 'from-indigo-400 to-indigo-600',
    category: 'achievement',
    priority: 'high'
  },
  streak_milestone: {
    icon: Flame,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    gradient: 'from-red-400 to-red-600',
    category: 'achievement',
    priority: 'high'
  },
  photo_uploaded: {
    icon: Camera,
    color: 'text-teal-400',
    bg: 'bg-teal-400/10',
    gradient: 'from-teal-400 to-teal-600',
    category: 'creation',
    priority: 'medium'
  },
  challenge_completed: {
    icon: CheckCircle2,
    color: 'text-lime-400',
    bg: 'bg-lime-400/10',
    gradient: 'from-lime-400 to-lime-600',
    category: 'achievement',
    priority: 'high'
  },
  level_up: {
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    gradient: 'from-violet-400 to-violet-600',
    category: 'achievement',
    priority: 'high'
  }
};

const ActivityCard = React.memo(({ activity, index, onLike, onComment, onShare, onBookmark }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [likes, setLikes] = useState(activity.stats?.likes || 0);
  
  const config = ACTIVITY_CONFIG[activity.type] || {
    icon: Activity,
    color: 'text-gray-400',
    bg: 'bg-gray-400/10',
    gradient: 'from-gray-400 to-gray-600',
    category: 'general',
    priority: 'medium'
  };
  
  const Icon = config.icon;
  const isPriority = config.priority === 'high';

  const handleLike = useCallback(() => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.(activity.id, newLikedState);
  }, [isLiked, activity.id, onLike]);

  const handleBookmark = useCallback(() => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    onBookmark?.(activity.id, newBookmarkedState);
  }, [isBookmarked, activity.id, onBookmark]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Priority Badge */}
      {isPriority && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 z-20"
        >
          <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      )}

      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 ${isPriority ? 'border-yellow-200 dark:border-yellow-600/50' : 'border-gray-100 dark:border-gray-700'} hover:border-emerald-200 dark:hover:border-emerald-700 rounded-3xl p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative overflow-hidden`}>
        
        {/* Animated Background Gradient */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
              >
                <Icon className="w-7 h-7 text-white drop-shadow-sm relative z-10" />
                <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-lg mb-1">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                      {activity.description}
                    </p>
                    {/* Category Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                        {config.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{activity.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions Menu */}
                  <AnimatePresence>
                    {showActions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className="flex items-center gap-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleBookmark}
                          className={`p-2 rounded-xl transition-colors duration-200 ${isBookmarked ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {activity.content && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-600/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl p-5 mb-4 backdrop-blur-sm"
            >
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {activity.content}
              </p>
            </motion.div>
          )}

          {/* Enhanced Media */}
          {activity.image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4 overflow-hidden rounded-2xl relative group/image"
            >
              <img 
                src={activity.image} 
                alt={activity.title}
                className="w-full h-48 object-cover transition-all duration-500 group-hover/image:scale-110 brightness-90 group-hover/image:brightness-100"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md rounded-lg p-2"
              >
                <Eye className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>
          )}

          {/* Interactive Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-6">
              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className="flex items-center gap-2 group/like"
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${isLiked ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-gray-100 dark:bg-gray-700/30 group-hover/like:bg-pink-50 dark:group-hover/like:bg-pink-900/20'}`}>
                  <Heart className={`w-4 h-4 transition-all duration-200 ${isLiked ? 'text-pink-500 fill-current' : 'text-gray-500 dark:text-gray-400 group-hover/like:text-pink-500'}`} />
                </div>
                <span className={`text-sm font-medium transition-colors duration-200 ${isLiked ? 'text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {likes}
                </span>
              </motion.button>

              {/* Comment Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComment?.(activity.id)}
                className="flex items-center gap-2 group/comment"
              >
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700/30 group-hover/comment:bg-blue-50 dark:group-hover/comment:bg-blue-900/20 transition-all duration-200">
                  <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/comment:text-blue-500 transition-colors duration-200" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {activity.stats?.comments || 0}
                </span>
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShare?.(activity.id)}
                className="flex items-center gap-2 group/share"
              >
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700/30 group-hover/share:bg-purple-50 dark:group-hover/share:bg-purple-900/20 transition-all duration-200">
                  <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/share:text-purple-500 transition-colors duration-200" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {activity.stats?.shares || 0}
                </span>
              </motion.button>
            </div>

            {/* View Count */}
            {activity.stats?.views && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Eye className="w-3 h-3" />
                <span>{activity.stats.views} views</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ActivityCard.displayName = 'ActivityCard';

const ActivityFeed = ({ profile = {} }) => {
  const [filter, setFilter] = useState('all');
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'timeline'
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Enhanced mock activity data - replace with real data from API or profile.activities
  const activities = useMemo(() => profile.activities || [
    {
      id: 1,
      type: 'recipe_created',
      title: 'Created a new recipe',
      description: 'Quinoa Buddha Bowl with Tahini Dressing',
      content: 'A nutritious and colorful bowl packed with protein, healthy fats, and fresh vegetables. Perfect for meal prep! 🥗',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      timeAgo: '2 hours ago',
      stats: { likes: 24, comments: 8, shares: 3, views: 156 }
    },
    {
      id: 2,
      type: 'achievement_earned',
      title: 'Achievement Unlocked!',
      description: 'Healthy Habits Champion',
      content: 'Completed 30 days of consistent healthy eating. Keep up the great work! 🏆',
      timeAgo: '1 day ago',
      stats: { likes: 42, views: 89 }
    },
    {
      id: 3,
      type: 'nutrition_logged',
      title: 'Daily nutrition goal achieved',
      description: 'Hit all macro targets for today',
      content: 'Protein: 150g ✅ | Carbs: 250g ✅ | Fat: 67g ✅ | Water: 2.5L ✅',
      timeAgo: '1 day ago',
      stats: { likes: 18, comments: 3, views: 67 }
    },
    {
      id: 4,
      type: 'streak_milestone',
      title: 'Streak Milestone!',
      description: '28-day nutrition tracking streak',
      content: 'Consistency is key! Amazing progress on your health journey 🔥',
      timeAgo: '2 days ago',
      stats: { likes: 35, comments: 12, shares: 5, views: 124 }
    },
    {
      id: 5,
      type: 'recipe_liked',
      title: 'Liked a recipe',
      description: 'Mediterranean Chickpea Salad by @chef_maria',
      timeAgo: '2 days ago',
      stats: { likes: 156, views: 234 }
    },
    {
      id: 6,
      type: 'photo_uploaded',
      title: 'Shared a meal photo',
      description: 'Rainbow Veggie Stir-fry',
      content: 'Eating the rainbow tonight! 🌈 So many colors and flavors in one dish.',
      image: 'https://images.unsplash.com/photo-1543353071-10c8a5e2c3f9?w=400',
      timeAgo: '3 days ago',
      stats: { likes: 28, comments: 6, shares: 2, views: 98 }
    },
    {
      id: 7,
      type: 'follower_gained',
      title: 'New followers',
      description: '8 people started following you',
      timeAgo: '3 days ago',
      stats: { views: 45 }
    },
    {
      id: 8,
      type: 'goal_achieved',
      title: 'Weekly goal completed!',
      description: 'Hit your water intake target 7 days straight',
      content: 'Hydration level: Expert! 💧 Your consistency is paying off.',
      timeAgo: '4 days ago',
      stats: { likes: 22, comments: 4, views: 78 }
    },
    {
      id: 9,
      type: 'challenge_completed',
      title: 'Challenge completed',
      description: 'Plant-Based Week Challenge',
      content: 'Successfully ate plant-based for 7 days! Feeling energized and healthy 🌱',
      timeAgo: '5 days ago',
      stats: { likes: 45, comments: 15, shares: 8, views: 167 }
    },
    {
      id: 10,
      type: 'recipe_shared',
      title: 'Shared a recipe',
      description: 'Overnight Oats with Mixed Berries',
      content: 'Perfect make-ahead breakfast! Prep 5 jars on Sunday for the whole work week.',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      timeAgo: '5 days ago',
      stats: { likes: 31, comments: 9, shares: 12, views: 145 }
    },
    {
      id: 11,
      type: 'level_up',
      title: 'Level Up!',
      description: 'Reached Nutrition Expert Level',
      content: 'Your dedication to healthy living has earned you expert status! ✨',
      timeAgo: '1 week ago',
      stats: { likes: 67, comments: 23, views: 201 }
    },
    {
      id: 12,
      type: 'comment_added',
      title: 'Left a comment',
      description: 'On Avocado Toast Variations',
      content: 'This recipe changed my breakfast game! The everything bagel seasoning tip is genius 🥑',
      timeAgo: '1 week ago',
      stats: { likes: 8, views: 34 }
    }
  ], [profile.activities]);

  const filterOptions = useMemo(() => [
    { value: 'all', label: 'All Activity', icon: Activity, count: activities.length },
    { value: 'creation', label: 'Creation', icon: ChefHat, count: activities.filter(a => ACTIVITY_CONFIG[a.type]?.category === 'creation').length },
    { value: 'achievement', label: 'Achievements', icon: Award, count: activities.filter(a => ACTIVITY_CONFIG[a.type]?.category === 'achievement').length },
    { value: 'social', label: 'Social', icon: Users, count: activities.filter(a => ACTIVITY_CONFIG[a.type]?.category === 'social').length },
    { value: 'health', label: 'Health', icon: Heart, count: activities.filter(a => ACTIVITY_CONFIG[a.type]?.category === 'health').length },
    { value: 'engagement', label: 'Engagement', icon: ThumbsUp, count: activities.filter(a => ACTIVITY_CONFIG[a.type]?.category === 'engagement').length }
  ], [activities]);

  // Enhanced filtering logic
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(activity => {
        const config = ACTIVITY_CONFIG[activity.type];
        return config?.category === filter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.content?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now());
        case 'popular':
          return (b.stats?.likes || 0) - (a.stats?.likes || 0);
        case 'engaging':
          const aEngagement = (a.stats?.likes || 0) + (a.stats?.comments || 0) + (a.stats?.shares || 0);
          const bEngagement = (b.stats?.likes || 0) + (b.stats?.comments || 0) + (b.stats?.shares || 0);
          return bEngagement - aEngagement;
        case 'priority':
          const aPriority = ACTIVITY_CONFIG[a.type]?.priority === 'high' ? 2 : 1;
          const bPriority = ACTIVITY_CONFIG[b.type]?.priority === 'high' ? 2 : 1;
          return bPriority - aPriority;
        default:
          return 0;
      }
    });

    return filtered;
  }, [activities, filter, searchQuery, sortBy]);

  const displayedActivities = useMemo(() => {
    return showMore 
      ? filteredActivities 
      : filteredActivities.slice(0, 4);
  }, [filteredActivities, showMore]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setShowMore(false); // Reset show more when filter changes
  }, []);

  const handleToggleShowMore = useCallback(() => {
    setShowMore(prev => !prev);
  }, []);

  // Activity interaction handlers
  const handleLike = useCallback((activityId, isLiked) => {
    console.log('Activity liked:', activityId, isLiked);
    // TODO: Implement actual API call
  }, []);

  const handleComment = useCallback((activityId) => {
    console.log('Comment on activity:', activityId);
    // TODO: Open comment modal or navigate to activity detail
  }, []);

  const handleShare = useCallback((activityId) => {
    console.log('Share activity:', activityId);
    // TODO: Implement sharing functionality
  }, []);

  const handleBookmark = useCallback((activityId, isBookmarked) => {
    console.log('Bookmark activity:', activityId, isBookmarked);
    // TODO: Implement bookmark functionality
  }, []);

  // Activity insights calculation
  const activityInsights = useMemo(() => {
    const totalEngagement = activities.reduce((sum, activity) => {
      return sum + (activity.stats?.likes || 0) + (activity.stats?.comments || 0) + (activity.stats?.shares || 0);
    }, 0);

    const totalViews = activities.reduce((sum, activity) => sum + (activity.stats?.views || 0), 0);
    const averageEngagement = activities.length > 0 ? Math.round(totalEngagement / activities.length) : 0;
    const topActivity = activities.reduce((top, current) => {
      const currentEngagement = (current.stats?.likes || 0) + (current.stats?.comments || 0) + (current.stats?.shares || 0);
      const topEngagement = (top.stats?.likes || 0) + (top.stats?.comments || 0) + (top.stats?.shares || 0);
      return currentEngagement > topEngagement ? current : top;
    }, activities[0]);

    const categoryBreakdown = Object.entries(
      activities.reduce((acc, activity) => {
        const category = ACTIVITY_CONFIG[activity.type]?.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({ category, count }));

    return {
      totalEngagement,
      totalViews,
      averageEngagement,
      topActivity,
      categoryBreakdown,
      engagementRate: totalViews > 0 ? Math.round((totalEngagement / totalViews) * 100) : 0
    };
  }, [activities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="mt-12"
    >
      {/* Enhanced Header with Controls */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  Activity Feed
                </h2>
                <p className="text-gray-400 text-lg">
                  Your nutrition journey timeline • {activities.length} activities
                </p>
              </div>
            </motion.div>

            {/* Activity Insights Toggle */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium transition-all duration-200 group"
            >
              <BarChart3 className={`w-4 h-4 transition-transform duration-200 ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
              <span>Analytics</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                {activityInsights.engagementRate}% engagement
              </span>
            </motion.button>
          </div>

          {/* View Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20"
          >
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'cards'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'timeline'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline
            </button>
          </motion.div>
        </div>

        {/* Analytics Panel */}
        <AnimatePresence>
          {isAnalyticsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{activityInsights.totalEngagement}</div>
                  <div className="text-sm text-gray-400">Total Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{activityInsights.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{activityInsights.averageEngagement}</div>
                  <div className="text-sm text-gray-400">Avg. Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{activityInsights.engagementRate}%</div>
                  <div className="text-sm text-gray-400">Engagement Rate</div>
                </div>
              </div>
              
              {activityInsights.topActivity && (
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Top Performing Activity
                  </h4>
                  <p className="text-gray-300 text-sm">{activityInsights.topActivity.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{activityInsights.topActivity.stats?.likes || 0} likes</span>
                    <span>{activityInsights.topActivity.stats?.comments || 0} comments</span>
                    <span>{activityInsights.topActivity.stats?.views || 0} views</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
        >
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
            >
              <option value="recent" className="bg-gray-800 text-white">Most Recent</option>
              <option value="popular" className="bg-gray-800 text-white">Most Popular</option>
              <option value="engaging" className="bg-gray-800 text-white">Most Engaging</option>
              <option value="priority" className="bg-gray-800 text-white">Priority</option>
            </select>
            <ArrowUp className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-180 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Enhanced Filter Tabs with counts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap items-center gap-2 bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10"
        >
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.value;
            return (
              <motion.button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={isActive}
                aria-label={`Filter by ${option.label}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span>
                {option.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {option.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Activity Cards with Results Info */}
      <div className="space-y-6">
        {/* Results Header */}
        {(searchQuery || filter !== 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-1"
          >
            <div className="text-white/70 text-sm">
              {searchQuery ? (
                <span>
                  Found <span className="font-semibold text-white">{filteredActivities.length}</span> results for "{searchQuery}"
                </span>
              ) : (
                <span>
                  Showing <span className="font-semibold text-white">{filteredActivities.length}</span> {filter} activities
                </span>
              )}
            </div>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="text-xs text-white/50 hover:text-white/80 transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}

        {/* Activity Cards */}
        <AnimatePresence mode="wait">
          {displayedActivities.length > 0 ? (
            <div className={`space-y-6 ${
              viewMode === 'timeline' 
                ? 'relative before:absolute before:left-8 before:top-8 before:bottom-8 before:w-px before:bg-gradient-to-b before:from-emerald-500 before:via-emerald-300 before:to-transparent' 
                : ''
            }`}>
              {displayedActivities.map((activity, index) => (
                <motion.div
                  key={`${filter}-${activity.id}-${viewMode}`}
                  className={viewMode === 'timeline' ? 'relative pl-16' : ''}
                  layout
                >
                  {viewMode === 'timeline' && (
                    <div className="absolute left-6 top-8 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-4 border-gray-900 shadow-lg z-10"></div>
                  )}
                  <ActivityCard 
                    activity={activity} 
                    index={index} 
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100/10 to-gray-200/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                {searchQuery ? (
                  <Search className="w-12 h-12 text-white/40" />
                ) : (
                  <Activity className="w-12 h-12 text-white/40" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? 'No results found' : 'No activities yet'}
              </h3>
              <p className="text-white/60 max-w-md mx-auto leading-relaxed">
                {searchQuery ? (
                  <>Try adjusting your search terms or clearing filters to see more activities.</>
                ) : (
                  <>Start your nutrition journey by creating recipes, following others, or engaging with the community.</>
                )}
              </p>
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg"
                >
                  Clear search
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {filteredActivities.length > 4 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8"
        >
          <button
            onClick={handleToggleShowMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-2xl font-medium transition-all duration-200 border border-gray-700/30 hover:shadow-lg"
            aria-expanded={showMore}
            aria-label={showMore ? 'Show fewer activities' : 'Show more activities'}
          >
            {showMore ? 'Show Less' : 'Load More Activities'}
            <TrendingUp className={`w-4 h-4 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>
      )}

      {/* Enhanced Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-400/50 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {profile.daysActive || Math.floor((Date.now() - new Date(profile.createdAt || Date.now())) / (1000 * 60 * 60 * 24)) || 7}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider">Days Active</div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{width: '85%'}}></div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-400/50 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{activities.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider">Total Activities</div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{width: '72%'}}></div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-400/50 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profile.engagementGrowth || '156%'}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider">Engagement Growth</div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '95%'}}></div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ActivityFeed;
