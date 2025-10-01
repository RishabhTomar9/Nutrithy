import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaComment, FaShare, FaBookmark, FaEllipsisH, FaUserCircle, FaTimes, FaUtensils, FaSpinner, FaPen, FaSearch } from 'react-icons/fa';
import ThreadBackground from '../components/common/ThreadBackground';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ShareRecipeModal from '../components/modals/ShareRecipeModal';
import ShareModal from '../components/modals/ShareModal';
import PostModal from '../components/modals/PostModal';
import CommentSection from '../components/community/CommentSection';
import CommunitySearch from '../components/community/CommunitySearch';
import { useAuth } from '../hooks/useAuth';
import * as communityService from '../services/communityService';
import { toast } from 'react-toastify';

export default function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userInteractions, setUserInteractions] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [showRecipeShareModal, setShowRecipeShareModal] = useState(false);
  const [recipeToShare, setRecipeToShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const feedRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const postVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Handle post interactions
  const handleInteraction = async (postId, type) => {
    try {
      if (type === 'like') {
        const response = await communityService.likePost(postId);
        
        // Update the post with the new like count and status
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: response.likes,
              isLiked: response.isLiked
            };
          }
          return post;
        }));
      } else if (type === 'share') {
        handleShare(posts.find(post => post._id === postId));
      } else if (type === 'bookmark') {
        // Toggle bookmark state locally (we'll implement backend later)
        setUserInteractions(prev => {
          const newState = { ...prev };
          if (!newState[postId]) newState[postId] = {};
          newState[postId].bookmark = !newState[postId].bookmark;
          return newState;
        });
      }
    } catch (error) {
      console.error(`Error handling ${type} interaction:`, error);
      setError(`Failed to ${type} post. Please try again.`);
    }
  };
  
  // Handle share functionality
  const handleShare = (post) => {
    setCurrentPost(post);
    setShowShareModal(true);
  };
  
  // Handle adding a new post from shared recipe or post modal
  const handleAddPost = async (newPost) => {
    try {
      // Send the new post to the backend
      const createdPost = await communityService.createPost(newPost);
      
      // Add the new post to the beginning of the posts array
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
      toast.error('Failed to create post. Please try again.');
    }
  };
  
  // Fetch posts from the backend
  useEffect(() => {
    // Skip fetching if we're displaying search results
    if (searchResults) return;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await communityService.fetchPosts(page, 10, filter);
        
        setPosts(prev => page === 1 ? data.posts : [...prev, ...data.posts]);
        setHasMore(data.currentPage < data.totalPages);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [page, filter, searchResults]);
  
  // Handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
    if (results) {
      setPosts(results.posts);
      setHasMore(false); // Disable infinite scroll for search results
    } else {
      // Reset to normal feed view
      setPage(1);
      // The useEffect will trigger a fetch
    }
  };
  
  // Load more posts when user scrolls to bottom
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  // Check for recipe share from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shareRecipe = params.get('shareRecipe');
    
    if (shareRecipe) {
      try {
        // Decode and parse the recipe data from URL
        const recipeData = JSON.parse(decodeURIComponent(shareRecipe));
        setRecipeToShare(recipeData);
        setShowRecipeShareModal(true);
        
        // Clean up the URL after processing
        navigate(location.pathname, { replace: true });
      } catch (error) {
        console.error('Error parsing shared recipe:', error);
      }
    }
  }, [location, navigate]);

  return (
    <>
      <ThreadBackground />
      <div className="min-h-screen relative z-10 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-10 text-center bg-gradient-to-b from-gray-900/50 to-transparent p-8 rounded-2xl backdrop-blur-lg border border-white/10"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 mb-4"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Nutrithy Community
          </motion.h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Share your culinary creations, discover new recipes, and connect with fellow food enthusiasts.
          </p>
        </motion.div>
        
        {/* Search Component */}
        <CommunitySearch onSearchResults={handleSearchResults} />

        {/* Filters - Only show when not in search mode */}
        {!searchResults && (
          <div className="max-w-6xl mx-auto mb-8">
            <motion.div 
              className="flex flex-wrap gap-2 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {['all', 'trending', 'latest', 'following'].map((filterOption) => (
                <motion.button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === filterOption 
                    ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </motion.button>
              ))}
            </motion.div>
          </div>
        )}
        
        {/* Search Results Info */}
        {searchResults && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">Search Results</h3>
                  <p className="text-gray-300 text-sm">
                    Found {searchResults.total} posts for "{searchResults.query}"
                    <span className="text-xs text-gray-400 ml-2">
                      (using {searchResults.searchMethod === 'text' ? 'text index' : 'regex'} search)
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => handleSearchResults(null)}
                  className="bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-full px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                >
                  <FaTimes size={12} />
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Button */}
          <motion.div 
            className="max-w-6xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button 
              onClick={() => setShowPostModal(true)}
              className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm text-left px-6 py-4 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 group"
              whileHover={{ 
                scale: 1.01,
                boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)",
                borderColor: "rgba(34, 197, 94, 0.3)"
              }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <FaUserCircle size={24} />
                </motion.div>
                <p className="text-gray-300 group-hover:text-white transition-colors duration-300">Share your latest recipe or food adventure...</p>
              </div>
            </motion.button>
          </motion.div>        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white text-center">
            {error}
            <button 
              className="ml-4 underline"
              onClick={() => {
                setError(null);
                setPage(1);
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Posts Feed */}
        <motion.div 
          ref={feedRef}
          className="max-w-6xl mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                userInteractions={userInteractions[post._id] || {}} 
                onInteraction={handleInteraction} 
                variants={postVariants}
              />
            ))
          ) : !loading ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-xl">No posts found</p>
              <p className="mt-2">Be the first to share something!</p>
            </div>
          ) : null}
          
          {/* Load More Button */}
          {hasMore && posts.length > 0 && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={loadMorePosts}
                disabled={loading}
                className="px-6 py-2 bg-gray-800/60 hover:bg-gray-700/70 rounded-full text-gray-200 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
          
          {/* Loading Indicator */}
          {loading && posts.length === 0 && (
            <div className="flex justify-center py-20">
              <FaSpinner className="animate-spin text-4xl text-green-400" />
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && currentPost && (
          <ShareModal 
            post={currentPost} 
            onClose={() => setShowShareModal(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Recipe Share Modal */}
      <AnimatePresence>
        {showRecipeShareModal && recipeToShare && (
          <ShareRecipeModal
            recipe={recipeToShare}
            isOpen={showRecipeShareModal}
            onClose={() => setShowRecipeShareModal(false)}
            onShare={(newPost) => {
              handleAddPost(newPost);
              setShowRecipeShareModal(false);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Post Creation Modal */}
      <PostModal 
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handleAddPost}
      />
      
      {/* Floating Action Button for Mobile */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white shadow-lg flex items-center justify-center z-20 md:hidden"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPostModal(true)}
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full opacity-50 blur-lg"
        />
        <FaPen size={20} />
      </motion.button>
    </>
  );
}

function PostCard({ post, userInteractions, onInteraction, variants }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  
  // Handle comment count update
  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
  };
  
  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-lg transition-all duration-300"
      variants={variants}
      whileHover={{ 
        y: -5,
        boxShadow: "0 8px 30px rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 0.3)",
      }}
      layout
    >
      {/* Post Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to={`/user/${post.uid}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold overflow-hidden hover:ring-2 hover:ring-green-400 transition-all">
            {post.authorImage ? (
              <img src={post.authorImage} alt={post.author} className="w-full h-full rounded-full object-cover" />
            ) : (
              post.author.charAt(0)
            )}
          </Link>
          <div>
            <Link to={`/user/${post.uid}`} className="font-medium text-white hover:text-green-400 transition-colors">
              {post.author}
            </Link>
            <p className="text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors">
          <FaEllipsisH />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-200 mb-3">{post.content}</p>
        
        {/* Post Image */}
        {post.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post" 
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {/* Recipe Card (if post has recipe) */}
        {post.recipe && (
          <motion.div 
            className="mb-4 bg-gray-700/40 rounded-lg overflow-hidden border border-gray-600/50 hover:border-green-500/30 transition-all"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex">
              {post.recipe.image && (
                <div className="w-1/3">
                  <img 
                    src={post.recipe.image} 
                    alt={post.recipe.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FaUtensils className="text-green-400" />
                  <h4 className="font-medium text-white">{post.recipe.title}</h4>
                </div>
                {post.recipe.description && (
                  <p className="text-sm text-gray-300 line-clamp-2">{post.recipe.description}</p>
                )}
                <button 
                  onClick={() => post.recipe.url && window.open(post.recipe.url, '_blank')}
                  className="mt-2 text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  View Recipe →
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span 
                key={index} 
                className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-700/50 flex justify-between items-center">
        <div className="flex gap-6">
          <button 
            onClick={() => onInteraction(post._id, 'like')} 
            className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
          >
            <motion.div whileTap={{ scale: 1.4 }}>
              <FaHeart />
            </motion.div>
            <span>{post.likes}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 ${showComments ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'} transition-colors`}
          >
            <FaComment />
            <span>{commentCount}</span>
          </button>
          <button 
            onClick={() => onInteraction(post._id, 'share')} 
            className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
          >
            <FaShare />
            <span>{post.shares}</span>
          </button>
        </div>
        <button 
          onClick={() => onInteraction(post._id, 'bookmark')} 
          className={`${userInteractions.bookmark ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} transition-colors`}
        >
          <FaBookmark />
        </button>
      </div>
      
      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <CommentSection 
                postId={post._id} 
                initialComments={post.comments || []} 
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
