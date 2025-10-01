import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaShare } from 'react-icons/fa';

/**
 * ShareRecipeModal Component
 * 
 * A reusable modal component for sharing recipes to the community feed
 * Can be used from both recipe search results and other parts of the app
 */
const ShareRecipeModal = ({ recipe, isOpen, onClose, onShare }) => {
  const [content, setContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  
  // Handle the share submission
  const handleShare = () => {
    setIsSharing(true);
    
    // Simulate API call to share recipe
    setTimeout(() => {
      // Create a new post object with the recipe and user content
      const newPost = {
        id: `post-${Date.now()}`,
        author: 'You', // In a real app, this would be the current user
        timestamp: new Date().toLocaleDateString(),
        content: content,
        recipe: {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          url: recipe.sourceUrl || recipe.spoonacularSourceUrl
        },
        likes: 0,
        comments: 0,
        shares: 0,
        tags: ['recipe', 'shared']
      };
      
      // Call the onShare callback with the new post
      if (onShare) {
        onShare(newPost);
      }
      
      // Reset and close
      setContent('');
      setIsSharing(false);
      onClose();
    }, 1000);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-gray-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-gray-700/50"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Share Recipe to Community</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Recipe Preview */}
            <div className="mb-6 bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
              <div className="flex gap-4">
                {recipe.image && (
                  <img 
                    src={recipe.image} 
                    alt={recipe.title} 
                    className="w-20 h-20 object-cover rounded-md"
                  />
                )}
                <div>
                  <h4 className="font-medium text-white">{recipe.title}</h4>
                  {recipe.sourceName && (
                    <p className="text-xs text-gray-400">Source: {recipe.sourceName}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Share Content */}
            <div className="mb-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add your thoughts about this recipe..."
                className="w-full bg-gray-800/60 text-white px-4 py-3 rounded-xl border border-gray-700/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all min-h-[120px]"
              />
            </div>
            
            <div className="flex justify-end">
              <motion.button 
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : (
                  <>
                    <FaShare /> Share to Community
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareRecipeModal;