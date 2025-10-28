import React, { useEffect, useState } from 'react';
import { addComment, fetchComments } from '../../services/communityService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommentSection({ postId, initialComments = [], onCommentAdded }) {
  const { user } = useAuth() || {};
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await fetchComments(postId, 1, 50);
      if (res?.comments) setComments(res.comments);
    } catch (err) {
      console.error('fetch comments', err);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((!initialComments || initialComments.length === 0) && postId) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addComment(postId, text.trim(), null);
      setComments(prev => [created, ...prev]);
      setText('');
      if (typeof onCommentAdded === 'function') onCommentAdded(created);
      toast.success('💬 Comment added!', { autoClose: 1000 });
    } catch (err) {
      console.error('add comment', err);
      toast.error(err?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full px-6 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50">
        <motion.div 
          className="p-2 rounded-xl backdrop-blur-sm border border-gray-700/30"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <MessageCircle className="w-5 h-5 text-blue-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">
          Comments
          {comments.length > 0 && (
            <motion.span 
              className="ml-2 text-sm font-normal text-gray-400"
              key={comments.length}
              initial={{ scale: 1.3, color: "#60a5fa" }}
              animate={{ scale: 1, color: "#9ca3af" }}
              transition={{ duration: 0.3 }}
            >
              ({comments.length})
            </motion.span>
          )}
        </h3>
      </div>

      {/* Comment Input */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex gap-3 items-start">
          {user?.photoURL && (
            <motion.div 
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 blur-sm opacity-50" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-[2px]">
                <img
                  src={user.photoURL}
                  alt="Your avatar"
                  className="w-full h-full rounded-full object-cover bg-gray-900"
                />
              </div>
              <motion.div 
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-gray-900 shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}

          <div className="flex-1 relative">
            <motion.div 
              className={`relative transition-all duration-200  rounded-xl`}
            >
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setText(e.target.value);
                }}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onKeyDown={handleKeyDown}
                placeholder={user ? 'Share your thoughts...' : 'Sign in to comment'}
                className="w-full p-4 pr-14 rounded-xl bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-800/60 backdrop-blur-sm text-white border border-gray-700/50 focus:border-blue-500/50 focus:outline-none transition-all resize-none placeholder:text-gray-500"
                rows={focusedInput ? 3 : 2}
                disabled={submitting || !user}
                maxLength={500}
              />
              
              {/* Send Button */}
              <motion.button
                onClick={handleSubmit}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                  text.trim() && !submitting
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
                disabled={submitting || !text.trim() || !user}
                whileHover={text.trim() && !submitting ? { scale: 1.05 } : {}}
                whileTap={text.trim() && !submitting ? { scale: 0.95 } : {}}
              >
                {submitting ? (
                  <motion.div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </motion.div>

            {/* Character counter and hint */}
            <AnimatePresence>
              {(text.length > 0 || focusedInput) && (
                <motion.div 
                  className="flex justify-between items-center mt-2 px-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className={`text-xs transition-colors ${text.length >= 450 ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
                    {text.length}/500
                  </span>
                  {text.trim() && (
                    <motion.span 
                      className="text-xs text-gray-400"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      Press Enter to send
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative">
              <motion.div 
                className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"></div>
            </div>
            <p className="text-gray-400 mt-4">Loading comments...</p>
          </motion.div>
        ) : comments.length === 0 ? (
          <motion.div 
            className="text-center py-16 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="inline-flex p-4 bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-800/50 rounded-full mb-4 backdrop-blur-sm border border-gray-700/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="w-12 h-12 text-gray-600" />
            </motion.div>
            <p className="text-gray-300 text-lg font-medium">No comments yet</p>
            <p className="text-sm text-gray-500 mt-2">Be the first to share your thoughts!</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {comments.map((c, index) => (
              <motion.div
                key={c._id || c.id}
                className="group p-4 bg-gradient-to-br from-gray-800/40 via-gray-800/20 to-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-gray-600/50 hover:from-gray-800/60 hover:to-gray-800/40 transition-all duration-200"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
                layout
              >
                <div className="flex items-start gap-3">
                  {c.authorImage && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 blur-sm opacity-30" />
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-[2px]">
                        <img
                          src={c.authorImage}
                          alt={c.author?.name || c.author}
                          className="w-full h-full rounded-full object-cover bg-gray-900"
                        />
                      </div>
                    </motion.div>
                  )}
                  <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between flex-wrap mb-2">
                      {/* Author Name */}
                      <motion.strong
                        className="text-lg font-semibold text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 transition-all cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        {c.author?.name || c.author}
                      </motion.strong>

                      {/* Date/Time */}
                      <span className="text-xs text-gray-400 hover:text-gray-300 transition-colors">
                        {new Date(c.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-gray-200 text-sm leading-relaxed break-words">
                      {c.content || c.body}
                    </p>
                    {c.likes > 0 && (
                      <motion.div 
                        className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-700/30"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <motion.button 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-red-500/10 via-pink-500/10 to-red-500/10 hover:from-red-500/20 hover:via-pink-500/20 hover:to-red-500/20 transition-all backdrop-blur-sm border border-red-500/10 group/like"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.span 
                            className="group-hover/like:scale-110 transition-transform"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.3 }}
                          >
                            ❤️
                          </motion.span>
                          <span className="text-xs font-medium text-red-400">{c.likes}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.5));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.7), rgba(147, 51, 234, 0.7));
        }
      `}</style>
    </div>
  );
}