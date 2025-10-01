import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  FaImage, FaSmile, FaHashtag, FaTimes, FaUtensils, 
  FaGlobeAmericas, FaLock, FaUserFriends, FaMapMarkerAlt,
  FaPaperPlane, FaSpinner, FaLink, FaCamera, FaEye
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
// Simple emoji picker fallback
const EmojiPicker = ({ onEmojiClick }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-xl">
    <div className="grid grid-cols-8 gap-2 text-xl max-w-xs">
      {['😀', '😃', '😄', '😁', '😊', '😍', '🤤', '😋', '🍴', '🥘', '🍜', '🍕', '🍔', '🍟', '🌮', '🥗'].map(emoji => (
        <button
          key={emoji}
          onClick={() => onEmojiClick({ emoji })}
          className="p-2 hover:bg-gray-700 rounded transition-colors hover:scale-110"
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

export default function InteractivePostCreator({ onSubmit, initialContent = '', recipeData = null }) {
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recipe, setRecipe] = useState(recipeData);
  const [recipeURL, setRecipeURL] = useState('');
  const [showRecipeSearch, setShowRecipeSearch] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;
  const { user } = useAuth();
  const emojiPickerRef = useRef(null);
  const contentRef = useRef(null);

  // Handle content change and calculate character count
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharacterCount(newContent.length);
    }
  };

  // Handle file drops for images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 4,
    onDrop: acceptedFiles => {
      if (images.length + acceptedFiles.length > 4) {
        alert('Maximum 4 images allowed');
        return;
      }
      
      setImages(prev => [...prev, ...acceptedFiles]);
    }
  });

  // Convert uploaded images to URLs for preview
  useEffect(() => {
    if (images.length > 0) {
      const newImageURLs = images.map(image => URL.createObjectURL(image));
      setImageURLs(prev => [...prev, ...newImageURLs]);
      
      // Cleanup function to revoke the URLs to avoid memory leaks
      return () => {
        newImageURLs.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [images]);

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setContent(prev => prev + emoji);
    setCharacterCount(prev => prev + emoji.length);
    
    // Focus back on textarea after emoji is added
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Remove image
  const handleRemoveImage = (index) => {
    setImageURLs(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove recipe
  const handleRemoveRecipe = () => {
    setRecipe(null);
    setRecipeURL('');
  };

  // Search for recipe
  const handleRecipeSearch = () => {
    // This would be implemented with actual recipe search functionality
    // For now we'll just show a mock recipe based on the URL
    if (recipeURL.trim()) {
      const mockRecipe = {
        title: "Pancakes with Maple Syrup",
        description: "Fluffy homemade pancakes served with pure maple syrup",
        image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=300&h=200&fit=crop",
        url: recipeURL
      };
      
      setRecipe(mockRecipe);
      setShowRecipeSearch(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0 && !recipe) {
      return; // Don't submit empty posts
    }
    
    setSubmitting(true);
    
    try {
      // In a real implementation, you'd upload images to cloud storage
      // and get back URLs to store in the database
      
      // Prepare the post data
      const postData = {
        content: content.trim(),
        tags,
        visibility,
        location: location.trim() || null,
        // In a real app, images would be uploaded and their URLs stored
        image: imageURLs.length > 0 ? imageURLs[0] : null, // Just use the first image for mock
        recipe,
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
      setImages([]);
      setImageURLs([]);
      setTags([]);
      setInputTag('');
      setVisibility('public');
      setLocation('');
      setRecipe(null);
      setRecipeURL('');
      setCharacterCount(0);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Visibility options
  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: FaGlobeAmericas, description: 'Anyone can see this post' },
    { id: 'friends', label: 'Friends Only', icon: FaUserFriends, description: 'Only your friends can see this post' },
    { id: 'private', label: 'Private', icon: FaLock, description: 'Only you can see this post' },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h3 className="text-white font-medium">Create Post</h3>
          
          {/* Visibility Selector */}
          <div className="relative">
            <button 
              type="button"
              className="flex items-center gap-2 text-sm py-1 px-3 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"
              onClick={() => {/* Toggle visibility dropdown */}}
            >
              {visibilityOptions.find(opt => opt.id === visibility)?.icon({ className: "text-blue-400" })}
              <span>{visibilityOptions.find(opt => opt.id === visibility)?.label}</span>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{user?.displayName?.charAt(0) || 'A'}</span>
              )}
            </div>
            
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                ref={contentRef}
                value={content}
                onChange={handleContentChange}
                placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0] || 'there'}?`}
                className="w-full min-h-[100px] bg-transparent text-white border-none focus:outline-none focus:ring-0 placeholder-gray-500 resize-none"
              />
              
              {/* Character Counter */}
              <div className="flex justify-end mb-2">
                <span className={`text-xs ${characterCount > MAX_CHARS * 0.8 ? (characterCount > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                  {characterCount}/{MAX_CHARS}
                </span>
              </div>
              
              {/* Image Previews */}
              {imageURLs.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {imageURLs.map((url, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                      <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 bg-red-500 rounded-full text-white"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Recipe Preview */}
              {recipe && (
                <div className="mt-3 bg-gray-700/30 rounded-lg overflow-hidden border border-gray-600/50 relative group">
                  <div className="flex">
                    {recipe.image && (
                      <div className="w-1/4">
                        <img 
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FaUtensils className="text-green-400" />
                        <h4 className="font-medium text-white">{recipe.title}</h4>
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-gray-300 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveRecipe}
                      className="absolute top-2 right-2 p-1 bg-gray-700/70 rounded-full text-gray-300 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              )}
              
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
          
          {/* Recipe Search Form */}
          <AnimatePresence>
            {showRecipeSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 p-3 bg-gray-700/30 rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FaUtensils className="text-green-400" />
                  <h4 className="text-white font-medium">Add Recipe</h4>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recipeURL}
                    onChange={(e) => setRecipeURL(e.target.value)}
                    placeholder="Paste recipe URL or search..."
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleRecipeSearch}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Image Upload Dropzone */}
          <AnimatePresence>
            {isDragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-10 flex items-center justify-center border-2 border-dashed border-blue-400 rounded-xl"
              >
                <div className="text-white text-center">
                  <FaImage className="text-4xl mx-auto mb-2 text-blue-400" />
                  <p className="font-medium">Drop images here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
          
          {/* Location Input */}
          <AnimatePresence>
            {location === '' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 relative"
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">
                  <FaMapMarkerAlt />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Emoji Picker */}
          <div className="relative">
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-16 right-0 z-10"
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h4 className="text-gray-400 text-sm mr-2">Add to your post:</h4>
            
            {/* Image Upload Button */}
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button
                type="button"
                className="p-2 rounded-full text-green-400 hover:bg-gray-700/50 transition-colors relative"
                disabled={images.length >= 4}
              >
                <FaImage />
                {images.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
                    {images.length}
                  </span>
                )}
              </button>
            </div>
            
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
            
            {/* Recipe Button */}
            <button
              type="button"
              onClick={() => setShowRecipeSearch(!showRecipeSearch)}
              className={`p-2 rounded-full ${showRecipeSearch ? 'text-white bg-green-500' : 'text-green-400 hover:bg-gray-700/50'} transition-colors`}
              disabled={recipe !== null}
            >
              <FaUtensils />
            </button>
            
            {/* Location Button */}
            <button
              type="button"
              onClick={() => setLocation(location ? '' : ' ')}
              className={`p-2 rounded-full ${location ? 'text-white bg-red-500' : 'text-red-400 hover:bg-gray-700/50'} transition-colors`}
            >
              <FaMapMarkerAlt />
            </button>
            
            {/* Camera Button */}
            <button
              type="button"
              className="p-2 rounded-full text-purple-400 hover:bg-gray-700/50 transition-colors"
            >
              <FaCamera />
            </button>
            
            {/* Link Button */}
            <button
              type="button"
              className="p-2 rounded-full text-blue-400 hover:bg-gray-700/50 transition-colors"
            >
              <FaLink />
            </button>
          </div>
          
          {/* Preview Button */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              className="flex items-center gap-2 text-sm py-1 px-3 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <FaEye />
              <span>Preview</span>
            </button>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (!content.trim() && images.length === 0 && !recipe)}
              className={`
                px-4 py-2 rounded-lg font-medium flex items-center gap-2
                ${(!content.trim() && images.length === 0 && !recipe)
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
