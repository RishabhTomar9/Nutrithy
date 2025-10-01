import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaUtensils, FaTags } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

export default function PostModal({ isOpen, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tag input
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please add some content to your post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('image', image);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 500
      }
    },
    exit: { 
      y: 50, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div 
            className="bg-gray-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border border-gray-700/50"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Create Post</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{user?.displayName || 'User'}</h4>
                  </div>
                </div>
                
                {/* Post Content */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-gray-700/50 text-white rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {content.length}/500
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-auto max-h-60 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-gray-800/80 text-white p-1 rounded-full hover:bg-red-500/80 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {/* Tags Input */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTags className="text-gray-400" />
                    <span className="text-sm text-gray-300">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-700/70 text-green-400 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button 
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTag}
                      placeholder="Add up to 5 tags (press Enter)"
                      className="flex-1 bg-gray-700/50 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      disabled={tags.length >= 5}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {tags.length}/5 tags
                  </p>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-white text-sm">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-700/50 flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 px-3 py-2 rounded-lg transition-colors"
                  >
                    <FaImage />
                    <span>Add Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className={`px-4 py-2 rounded-lg font-medium ${isSubmitting || !content.trim() 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all'}`}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}