import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaPaperPlane, FaSpinner, FaTrash, FaEllipsisV, FaReply, FaHeart, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import * as communityService from '../../services/communityService';

export default function CommentSection({ postId, initialComments = [], onCommentAdded }) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const { user } = useAuth();

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await communityService.fetchComments(postId, page);
        
        setComments(prev => 
          page === 1 ? response.comments : [...prev, ...response.comments]
        );
        setHasMore(response.hasMore);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [postId, page]);

  // Handle submitting a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const parentId = replyingTo ? replyingTo.id : null;
      const response = await communityService.addComment(postId, newComment.trim(), parentId);
      
      if (replyingTo) {
        // If it's a reply, add it to the replies of the parent comment
        const parentComment = comments.find(c => c._id === replyingTo.id);
        if (parentComment) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.unshift(response.comment);
          setComments([...comments]);
        }
        setReplyingTo(null);
      } else {
        // Add the new comment to the list
        setComments(prev => [response.comment, ...prev]);
      }
      
      setNewComment('');
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(response.comment);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await communityService.deleteComment(commentId);
      
      // Remove the deleted comment from the list
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };
  
  // Handle liking a comment
  const handleLikeComment = async (commentId) => {
    if (!user) return;
    
    try {
      const response = await communityService.likeComment(commentId);
      
      // Update the comment with new like count
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likes: response.likes,
            isLiked: response.isLiked
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment');
    }
  };
  
  // Handle loading replies for a comment
  const handleLoadReplies = async (commentId) => {
    if (loadingReplies[commentId]) return;
    
    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      
      const response = await communityService.fetchCommentReplies(commentId);
      
      // Update the comment with its replies
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: response.replies
          };
        }
        return comment;
      }));
      
      // Show the replies
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) {
      console.error('Error loading replies:', err);
      setError('Failed to load replies');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };
  
  // Toggle showing replies
  const toggleReplies = (commentId) => {
    const hasReplies = comments.find(c => c._id === commentId)?.replies?.length > 0;
    
    if (!hasReplies) {
      handleLoadReplies(commentId);
    } else {
      setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    }
  };
  
  // Handle replying to a comment
  const handleReplyTo = (comment) => {
    setReplyingTo({ id: comment._id, author: comment.author });
    // Focus the comment input
    document.querySelector('input[type="text"]').focus();
  };

  // Load more comments
  const loadMoreComments = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Format date
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
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800/80 rounded-lg p-4 mt-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.displayName?.charAt(0) || <FaUserCircle />}
        </div>
        <div className="flex-1 relative">
          {replyingTo && (
            <div className="absolute -top-6 left-0 text-xs text-gray-300 flex items-center">
              <span>Replying to {replyingTo.author}</span>
              <button 
                onClick={() => setReplyingTo(null)} 
                className="ml-2 text-gray-400 hover:text-white"
              >
                <FaTimes size={10} />
              </button>
            </div>
          )}
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Write a comment..."}
            className="w-full bg-gray-700/50 text-white rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            disabled={submitting || !user}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim() || !user}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors disabled:text-gray-600"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-sm mb-3">
          {error}
        </div>
      )}

      {/* Comments List */}
      <AnimatePresence>
        {comments.length > 0 ? (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {comments.map((comment) => (
              <motion.div 
                key={comment._id} 
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm flex-shrink-0">
                  {comment.author?.charAt(0) || <FaUserCircle />}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-700/40 rounded-lg p-2 px-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-white text-sm">{comment.author}</span>
                      {user && (comment.uid === user.uid || user.isAdmin) && (
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-white p-1 text-xs">
                            <FaEllipsisV size={12} />
                          </button>
                          <div className="absolute right-0 mt-1 w-24 bg-gray-800 rounded-md shadow-lg z-10 invisible group-hover:visible">
                            <button 
                              onClick={() => handleDeleteComment(comment._id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md flex items-center gap-2"
                            >
                              <FaTrash size={12} />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-200 text-sm mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 ml-1">
                    <span>{formatDate(comment.createdAt)}</span>
                    
                    {/* Like button */}
                    <button 
                      onClick={() => handleLikeComment(comment._id)}
                      className={`flex items-center gap-1 ${comment.isLiked ? 'text-red-400' : 'hover:text-red-400'}`}
                    >
                      <FaHeart size={10} />
                      <span>{comment.likes || 0}</span>
                    </button>
                    
                    {/* Reply button */}
                    <button 
                      onClick={() => handleReplyTo(comment)}
                      className="flex items-center gap-1 hover:text-blue-400"
                    >
                      <FaReply size={10} />
                      <span>Reply</span>
                    </button>
                    
                    {/* Show replies button (only if comment has replies or can have replies) */}
                    {(comment.commentCount > 0 || comment.replies?.length > 0) && (
                      <button 
                        onClick={() => toggleReplies(comment._id)}
                        className="flex items-center gap-1 hover:text-green-400"
                      >
                        {loadingReplies[comment._id] ? (
                          <FaSpinner size={10} className="animate-spin" />
                        ) : (
                          <span>
                            {showReplies[comment._id] ? 'Hide' : 'Show'} {comment.commentCount || comment.replies?.length} replies
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Replies section */}
                  <AnimatePresence>
                    {showReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                      <motion.div 
                        className="pl-4 mt-2 space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {comment.replies.map(reply => (
                          <motion.div 
                            key={reply._id} 
                            className="flex gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs flex-shrink-0">
                              {reply.author?.charAt(0) || <FaUserCircle size={12} />}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-700/20 rounded-lg p-2 px-3">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-white text-xs">{reply.author}</span>
                                  {user && (reply.uid === user.uid || user.isAdmin) && (
                                    <div className="relative group">
                                      <button className="text-gray-400 hover:text-white p-1 text-xs">
                                        <FaEllipsisV size={10} />
                                      </button>
                                      <div className="absolute right-0 mt-1 w-24 bg-gray-800 rounded-md shadow-lg z-10 invisible group-hover:visible">
                                        <button 
                                          onClick={() => handleDeleteComment(reply._id)}
                                          className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-gray-700 rounded-md flex items-center gap-2"
                                        >
                                          <FaTrash size={10} />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-200 text-xs mt-1">{reply.content}</p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 ml-1">
                                <span>{formatDate(reply.createdAt)}</span>
                                <button 
                                  onClick={() => handleLikeComment(reply._id)}
                                  className={`flex items-center gap-1 ${reply.isLiked ? 'text-red-400' : 'hover:text-red-400'}`}
                                >
                                  <FaHeart size={8} />
                                  <span>{reply.likes || 0}</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-2">
                <button 
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load more comments'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        ) : !loading ? (
          <motion.div 
            className="text-center py-2 text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No comments yet. Be the first to comment!
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Loading Indicator */}
      {loading && comments.length === 0 && (
        <div className="flex justify-center py-4">
          <FaSpinner className="animate-spin text-green-400" />
        </div>
      )}
    </div>
  );
}