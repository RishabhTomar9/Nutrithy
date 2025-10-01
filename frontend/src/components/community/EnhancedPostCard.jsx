import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaHeart, FaComment, FaShare, FaBookmark, FaEllipsisH, 
  FaUserCircle, FaUtensils, FaEye, FaStar, FaMapMarkerAlt,
  FaClock, FaFire, FaThumbsUp, FaLaugh, FaSurprise, FaSadTear,
  FaAngry, FaCalendarAlt, FaExternalLinkAlt
} from 'react-icons/fa';
import CommentSection from './CommentSection';
import EmojiReactions from './EmojiReactions';

// Enhanced post card with modern design and advanced features
export default function EnhancedPostCard({ post, userInteractions, onInteraction, variants }) {
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Handle comment count update
  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
  };

  // Format date with more detail
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get engagement color based on interactions
  const getEngagementColor = (likes) => {
    if (likes > 100) return 'from-pink-500 to-red-500';
    if (likes > 50) return 'from-orange-500 to-pink-500';
    if (likes > 20) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  // Truncate text if too long
  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return showFullText ? text : text.substring(0, maxLength) + '...';
  };

  return (
    <motion.article 
      className="group relative bg-gradient-to-br from-gray-800/70 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/30 shadow-xl transition-all duration-500"
      variants={variants}
      whileHover={{ 
        y: -8,
        scale: 1.01,
        boxShadow: "0 20px 40px rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.4)",
      }}
      layout
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Post Header */}
      <div className="relative p-6 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Link to={`/user/${post.uid}`} className="relative group/avatar">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/10 transition-all duration-300 group-hover/avatar:ring-indigo-400/50">
                {post.authorImage ? (
                  <img 
                    src={post.authorImage} 
                    alt={post.author} 
                    className="w-full h-full rounded-full object-cover"
                    onLoad={() => setImageLoaded(true)}
                  />
                ) : (
                  <span className="text-lg">{post.author.charAt(0)}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  to={`/user/${post.uid}`} 
                  className="font-semibold text-white hover:text-indigo-300 transition-colors text-lg"
                >
                  {post.author}
                </Link>
                {post.isVerified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaStar className="text-white text-xs" />
                  </div>
                )}
                <span className="text-gray-400 text-sm">•</span>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <FaClock size={12} />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
              
              {/* Location if available */}
              {post.location && (
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <FaMapMarkerAlt size={12} />
                  <span>{post.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Engagement indicator */}
            {post.likes > 10 && (
              <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getEngagementColor(post.likes)} text-white text-xs font-medium flex items-center gap-1`}>
                <FaFire size={10} />
                <span>Hot</span>
              </div>
            )}
            
            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-all duration-200">
              <FaEllipsisH size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-200 leading-relaxed">
              {truncateText(post.content)}
            </p>
            {post.content.length > 200 && (
              <button 
                onClick={() => setShowFullText(!showFullText)}
                className="text-indigo-400 hover:text-indigo-300 text-sm mt-1 transition-colors"
              >
                {showFullText ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
        
        {/* Post Image with Enhanced Display */}
        {post.image && (
          <div className="mb-4 rounded-xl overflow-hidden group/image relative">
            <motion.img 
              src={post.image} 
              alt="Post content" 
              className={`w-full h-auto object-cover transition-all duration-700 group-hover/image:scale-105 ${
                imageLoaded ? 'blur-0' : 'blur-sm'
              }`}
              onLoad={() => setImageLoaded(true)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-700/50 animate-pulse rounded-xl" />
            )}
            
            {/* Image overlay with view count */}
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs flex items-center gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
              <FaEye size={12} />
              <span>{post.views || '0'} views</span>
            </div>
          </div>
        )}
        
        {/* Enhanced Recipe Card */}
        {post.recipe && (
          <motion.div 
            className="mb-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-600/30 hover:border-indigo-500/40 transition-all duration-300"
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex">
              {post.recipe.image && (
                <div className="w-1/3 relative">
                  <img 
                    src={post.recipe.image} 
                    alt={post.recipe.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg">
                    <FaUtensils className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg">{post.recipe.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {post.recipe.cookTime && (
                        <div className="flex items-center gap-1">
                          <FaClock size={10} />
                          <span>{post.recipe.cookTime}</span>
                        </div>
                      )}
                      {post.recipe.difficulty && (
                        <div className="flex items-center gap-1">
                          <FaFire size={10} />
                          <span>{post.recipe.difficulty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {post.recipe.description && (
                  <p className="text-sm text-gray-300 line-clamp-2 mb-3">{post.recipe.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => post.recipe.url && window.open(post.recipe.url, '_blank')}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FaExternalLinkAlt size={12} />
                    View Recipe
                  </button>
                  
                  {post.recipe.rating && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaStar size={12} />
                      <span className="text-sm font-medium">{post.recipe.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Enhanced Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <motion.span 
                key={index} 
                className="text-xs bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        )}
      </div>
      
      {/* Enhanced Post Actions */}
      <div className="px-6 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Enhanced Like Button */}
            <motion.button 
              onClick={() => onInteraction(post._id, 'like')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                post.isLiked 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
              }`}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ scale: post.isLiked ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <FaHeart size={14} />
              </motion.div>
              <span className="font-semibold">{post.likes}</span>
            </motion.button>

            {/* Enhanced Comment Button */}
            <motion.button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                showComments 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20'
              }`}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaComment size={14} />
              <span className="font-semibold">{commentCount}</span>
            </motion.button>

            {/* Enhanced Share Button */}
            <motion.button 
              onClick={() => onInteraction(post._id, 'share')} 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300 border border-transparent hover:border-green-500/20"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaShare size={14} />
              <span className="font-semibold">{post.shares || 0}</span>
            </motion.button>

            {/* Reactions Button */}
            <motion.button 
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-300 border border-transparent hover:border-yellow-500/20"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaLaugh size={14} />
              <span className="font-semibold">React</span>
            </motion.button>
          </div>

          {/* Bookmark Button */}
          <motion.button 
            onClick={() => onInteraction(post._id, 'bookmark')} 
            className={`p-2 rounded-full text-sm transition-all duration-300 ${
              userInteractions.bookmark 
                ? 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/30' 
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20'
            }`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaBookmark size={14} />
          </motion.button>
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/20">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{post.views || 0} views</span>
            <span>•</span>
            <span>{post.shares || 0} shares</span>
            {post.recipe && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FaUtensils size={10} />
                  Recipe included
                </span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            <FaCalendarAlt size={10} className="inline mr-1" />
            {formatDate(post.createdAt)}
          </div>
        </div>
      </div>
      
      {/* Reactions Panel */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700/30 overflow-hidden"
          >
            <div className="p-4">
              <EmojiReactions />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="border-t border-gray-700/30 overflow-hidden"
          >
            <CommentSection 
              postId={post._id} 
              initialComments={post.comments || []} 
              onCommentAdded={handleCommentAdded}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating engagement indicator */}
      {post.likes > 50 && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse" />
      )}
    </motion.article>
  );
}
