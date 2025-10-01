import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaImage, FaSmile, FaHashtag, FaTimes, FaUtensils, 
  FaPaperPlane, FaSpinner, FaLink, FaMapMarkerAlt
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

// Simple emoji array
const emojis = ['😀', '😃', '😄', '😁', '😊', '😍', '🤤', '😋', '🍴', '🥘', '🍜', '🍕', '🍔', '🍟', '🌮', '🥗'];

export default function SimplePostCreator({ onSubmit, initialContent = '' }) {
  const [content, setContent] = useState(initialContent);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;
  const { user } = useAuth();

  // Handle content change and calculate character count
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharacterCount(newContent.length);
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emoji) => {
    setContent(prev => prev + emoji);
    setCharacterCount(prev => prev + emoji.length);
    setShowEmojiPicker(false);
  };

  // Add new tag
  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = inputTag.trim().toLowerCase().replace(/\s+/g, '');
    
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
      setInputTag('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return; // Don't submit empty posts
    }
    
    setSubmitting(true);
    
    try {
      // Prepare the post data
      const postData = {
        content: content.trim(),
        tags,
        location: location.trim() || null,
        author: user?.displayName || 'Anonymous',
        authorImage: user?.photoURL || null,
        uid: user?.uid,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
      };
      
      // Pass the data to the parent component
      await onSubmit(postData);
      
      // Reset the form
      setContent('');
      setTags([]);
      setInputTag('');
      setLocation('');
      setCharacterCount(0);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-white font-medium">Create Post</h3>
        </div>
        
        {/* Content Area */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg ring-2 ring-white/10">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{user?.displayName?.charAt(0) || 'A'}</span>
              )}
            </div>
            
            {/* Text Input */}
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0] || 'there'}?`}
                  className="w-full min-h-[100px] bg-gray-700/40 backdrop-blur-sm text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-600/30 hover:border-gray-600/50 transition-all duration-300 resize-none"
                  disabled={submitting || !user}
                  rows={4}
                />
              </div>
              
              {/* Character Counter */}
              <div className="flex justify-end mb-2 mt-2">
                <span className={`text-xs ${characterCount > MAX_CHARS * 0.8 ? (characterCount > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                  {characterCount}/{MAX_CHARS}
                </span>
              </div>
              
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 text-xs bg-indigo-500/30 text-indigo-200 px-2 py-1 rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-indigo-300 hover:text-white"
                      >
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Location */}
              {location && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                  <FaMapMarkerAlt className="text-red-400" />
                  <span>{location}</span>
                  <button
                    type="button"
                    onClick={() => setLocation('')}
                    className="text-gray-400 hover:text-white"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Tag Input */}
          <AnimatePresence>
            {inputTag && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                      <FaHashtag />
                    </div>
                    <input
                      type="text"
                      value={inputTag}
                      onChange={(e) => setInputTag(e.target.value)}
                      placeholder="Enter tag name"
                      className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputTag.trim() || tags.length >= 5}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    Add Tag
                  </button>
                </form>
                {tags.length >= 5 && (
                  <p className="text-yellow-400 text-xs mt-1">Maximum 5 tags allowed</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Emoji Picker */}
          <div className="relative">
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-16 right-0 z-10"
                >
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-xl">
                    <div className="grid grid-cols-8 gap-2 text-xl max-w-xs">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-2 hover:bg-gray-700 rounded transition-colors hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h4 className="text-gray-400 text-sm mr-2">Add to your post:</h4>
            
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full text-yellow-400 hover:bg-gray-700/50 transition-colors"
            >
              <FaSmile />
            </button>
            
            {/* Tag Button */}
            <button
              type="button"
              onClick={() => setInputTag(inputTag ? '' : ' ')}
              className={`p-2 rounded-full ${inputTag ? 'text-white bg-blue-500' : 'text-blue-400 hover:bg-gray-700/50'} transition-colors`}
            >
              <FaHashtag />
            </button>
            
            {/* Location Button */}
            <button
              type="button"
              onClick={() => setLocation(location ? '' : ' ')}
              className={`p-2 rounded-full ${location ? 'text-white bg-red-500' : 'text-red-400 hover:bg-gray-700/50'} transition-colors`}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className={`
                px-4 py-2 rounded-lg font-medium flex items-center gap-2
                ${!content.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-blue-500/20'}
                transition-all duration-300
              `}
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
