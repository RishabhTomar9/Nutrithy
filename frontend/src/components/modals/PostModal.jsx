import React, { useRef, useState } from 'react';
import { createPost } from '../../services/communityService';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaUtensils, FaTags } from 'react-icons/fa';

export default function PostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth() || {};
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // data URLs
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  // Handle file selection and preview
  const handleFiles = (fileList) => {
    const arr = Array.from(fileList).slice(0, 5); // limit to 5 files
    setFiles(arr);
    const p = arr.map((f) => {
      return URL.createObjectURL(f);
    });
    setPreviews(p);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    if (!user) return setError('You must be signed in');
    if (!content.trim() && files.length === 0) return setError('Add content or media');

    setUploading(true);
    setProgress(0);
    try {
      const postData = {
        uid: user.uid || user.id,
        author: user.displayName || user.name || 'Unknown',
        content: content.trim(),
        media: files
      };

      const created = await createPost(postData, (pct) => setProgress(pct));
      setUploading(false);
      setProgress(100);
      setContent('');
      setFiles([]);
      setPreviews([]);
      if (typeof onPostCreated === 'function') onPostCreated(created);
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error('Post create error', err);
      setError(err.message || 'Failed to create post');
      setUploading(false);
      setProgress(0);
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
                
                {/* Image/Video Preview */}
                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={src} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-full h-auto max-h-60 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFiles(files.filter((_, i) => i !== idx));
                            setPreviews(previews.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-2 right-2 bg-gray-800/80 text-white p-1 rounded-full hover:bg-red-500/80 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
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
                    <span>Add Image/Video</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !content.trim()}
                  className={`px-4 py-2 rounded-lg font-medium ${uploading || !content.trim() 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all'}`}
                >
                  {uploading ? 'Posting...' : 'Post'}
                </button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="p-4">
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {progress}%
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}