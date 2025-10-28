import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Play, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Copy, 
  Flag, 
  UserMinus, 
  Star,
  Clock,
  Users,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImagePreview from './ImagePreview';
import CommentSection from './CommentSection';
import { toast } from 'react-toastify';

export default function PostCard({ 
  post, 
  onLike, 
  onShare, 
  userInteractions = {}, 
  onInteraction,
  currentUser 
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? post.comments?.length ?? 0);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(userInteractions?.bookmark ?? false);
  const [shares, setShares] = useState(post.shares ?? 0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // touch/swipe refs for mobile carousels
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isSwiping = useRef(false);

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchDeltaX.current = 0;
    isSwiping.current = false;
  };

  const onTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!t || touchStartX.current == null) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchDeltaX.current = dx;

    // Only treat as a horizontal swipe when horizontal movement dominates vertical.
    // Prevent default to stop page from vertically scrolling only when user is intentionally swiping horizontally.
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true;
      // prevent the page from vertically scrolling while performing horizontal swipe
      e.preventDefault?.();
    }
  };

  const onTouchEnd = () => {
    const delta = touchDeltaX.current;
    const threshold = 50; // swipe threshold
    if (isSwiping.current) {
      if (delta > threshold) {
        setCurrentMediaIndex(i => Math.max(0, i - 1));
      } else if (delta < -threshold) {
        setCurrentMediaIndex(i => Math.min((post.media?.length ?? 1) - 1, i + 1));
      }
    }
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchDeltaX.current = 0;
    isSwiping.current = false;
  };

  // lock body scroll when modals / fullscreen preview are open to avoid page jank
  useEffect(() => {
    const locked = showShareModal || selectedImageIndex !== null;
    const prev = document.body.style.overflow;
    if (locked) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, [showShareModal, selectedImageIndex]);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? post.comments?.length ?? 0);
    setLikes(post.likes ?? 0);
    setIsLiked(post.isLiked ?? false);
    setShares(post.shares ?? 0);
  }, [post]);

  const handleCommentAdded = (newComment) => {
    setCommentCount(c => c + 1);
  };

  const handleLike = async () => {
    try {
      const newIsLiked = !isLiked;
      const optimisticLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1);
      
      // Optimistic update
      setIsLiked(newIsLiked);
      setLikes(optimisticLikes);
      
      if (typeof onLike === 'function') {
        const updated = await onLike(post._id);
        if (updated?.likes !== undefined) setLikes(updated.likes);
        if (typeof updated?.isLiked === 'boolean') setIsLiked(updated.isLiked);
      }
      
      // Show visual feedback
      if (newIsLiked) {
        toast.success('❤️ Post liked!', { autoClose: 1000 });
      }
    } catch (err) {
      console.error('like failed', err);
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikes(likes);
      toast.error('Failed to like post');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
    setShares(prev => prev + 1);
  };

  const handleSave = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    if (typeof onInteraction === 'function') onInteraction(post._id, 'bookmark');
    toast.success(newSaved ? '🔖 Post saved!' : 'Post unsaved', { autoClose: 1000 });
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/community/post/${post._id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('📋 Link copied!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
    setShowMenu(false);
  };

  const handleReport = () => {
    toast.info('Report functionality will be implemented soon');
    setShowMenu(false);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed user' : 'Following user');
    setShowMenu(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return showFullText ? text : text.substring(0, maxLength) + '...';
  };

  const hasMultipleMedia = post.media && post.media.length > 1;
  const isOwner = currentUser && currentUser.uid === post.uid;

  return (
    <>
    <motion.article 
      className="relative bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-gray-900/98 backdrop-blur-2xl text-gray-100 border border-gray-700/60 rounded-3xl overflow-hidden mb-8 shadow-2xl transition-all duration-500 group"
    >
      
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-5  to-transparent">
        <div className="flex items-center gap-4">
          <motion.div 
            className="relative"
          >
            <div className="absolute inset-0 rounded-full blur-sm" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                {post.authorImage ? (
                  <img 
                    src={post.authorImage} 
                    alt={post.author} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <span className="text-white font-bold text-lg bg-gradient-to-br from-green-400 to-blue-500 bg-clip-text text-transparent">
                    {post.author?.[0]?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>
            </div>
            <motion.div 
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-gray-900 shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <motion.h3 
                className="font-bold text-base text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-green-400 hover:to-blue-500 transition-all cursor-pointer"
              >
                {post.author}
              </motion.h3>
              {post.verified && (
                <motion.div 
                  className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ type: "spring" }}
                >
                  <span className="text-white text-[10px] font-bold">✓</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <time className="hover:text-gray-300 transition-colors">{formatTimeAgo(post.createdAt)}</time>
              {post.location && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="hover:text-green-400 transition-colors cursor-pointer">{post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <motion.div className="relative">
          <motion.button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2.5 hover:bg-gray-700/50 rounded-full transition-all backdrop-blur-sm border border-transparent hover:border-gray-600/50"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-300 group-hover:text-white" />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div 
                  className="absolute right-0 mt-2 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-xl py-2 z-20 min-w-[220px] text-sm shadow-2xl"
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                >
                  {currentUser && currentUser.uid !== post.uid && (
                    <button 
                      onClick={handleFollow}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                  <button 
                    onClick={handleCopyLink}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy link
                  </button>
                  <button 
                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
                    onClick={() => { setShowMenu(false); toast.info('Coming soon!'); }}
                  >
                    <Star className="w-4 h-4" />
                    Add to favorites
                  </button>
                  {currentUser && currentUser.uid !== post.uid && (
                    <button 
                      onClick={handleReport}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 text-red-400 font-medium flex items-center gap-3 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div
          className="relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden"
          role="region"
          aria-label="post media carousel"
        >
          {/* Responsive aspect box: uses padding-bottom technique for consistent aspect ratio */}
          <div
            className="relative w-full max-h-[70vh] mx-auto"
            style={{ paddingBottom: '56.25%' }} /* 16:9 */
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            tabIndex={0}
            onKeyDown={(e) => {
              if (!post.media || post.media.length <= 1) return;
              if (e.key === 'ArrowLeft') setCurrentMediaIndex(i => Math.max(0, i - 1));
              if (e.key === 'ArrowRight') setCurrentMediaIndex(i => Math.min(post.media.length - 1, i + 1));
              if (e.key === 'Escape') setSelectedImageIndex(null);
            }}
          >
            {post.media.map((m, i) => (
              <div
                key={m.public_id || m.url || i}
                className={`absolute inset-0 transition-opacity duration-300 ${i === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
                onClick={() => setSelectedImageIndex(i)}
              >
                {m.resource_type?.startsWith('video') ? (
                  <div className="relative w-full h-full bg-black">
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop
                      aria-label={`video ${i + 1} of ${post.media.length}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={m.url}
                    alt={m.alt || `media-${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop arrows (visible on md+) */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={() => setCurrentMediaIndex(idx => Math.max(0, idx - 1))}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-gray-800/70 items-center justify-center text-white z-20 transition"
                aria-label="previous media"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentMediaIndex(idx => Math.min(post.media.length - 1, idx + 1))}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-gray-800/70 items-center justify-center text-white z-20 transition"
                aria-label="next media"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots centered, slightly above thumbnails on small screens */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {post.media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentMediaIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentMediaIndex ? 'bg-white scale-110' : 'bg-white/40'}`}
                    aria-label={`go to media ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Thumbnails for small screens: improved scroll + snap and hidden scrollbar */}
          {hasMultipleMedia && (
            <div className="md:hidden flex gap-2 p-2 bg-gray-900 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {post.media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentMediaIndex(i); setSelectedImageIndex(i); }}
                  className={`w-24 h-14 rounded-md overflow-hidden border snap-start flex-shrink-0 ${i === currentMediaIndex ? 'border-white' : 'border-transparent'}`}
                  aria-label={`thumbnail ${i + 1}`}
                >
                  {m.resource_type?.startsWith('video') ? (
                    <video src={m.url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover" alt={`thumb-${i + 1}`} loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      
      {/* Actions & Meta */}
      <div className="relative px-6 py-5">
         {/* Caption */}
        {post.content && (
          <div className="mb-2 text-xl p-3 leading-snug">
            <span className="text-gray-300">{truncateText(post.content)}</span>
            {post.content.length > 150 && (
              <button onClick={() => setShowFullText(v => !v)} className="text-xs text-gray-400 ml-2">{showFullText ? 'less' : 'more'}</button>
            )}
          </div>
        )}
        {/* Action buttons with glassmorphism */}
        <div className="flex items-center justify-between mb-5 p-3 rounded-2xl bg-gradient-to-r from-gray-800/30 via-gray-800/20 to-gray-800/30 backdrop-blur-sm border border-gray-700/30">
          <div className="flex items-center gap-8">
            <motion.button 
              onClick={handleLike} 
              className="flex items-center gap-2.5 group relative"
              aria-label="like"
            >
              <div className="relative">
                {isLiked && (
                  <motion.div
                    className="absolute inset-0 bg-red-500/30 rounded-full blur-lg"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <Heart 
                  className={`relative w-8 h-8 transition-all duration-300 ${
                    isLiked 
                      ? 'text-red-500 fill-current drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                      : 'text-gray-400 group-hover:text-red-400 group-hover:scale-110'
                  }`} 
                />
              </div>
              {likes > 0 && (
                <motion.span 
                  className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors"
                  key={likes}
                  initial={{ scale: 1.5, color: "#ef4444" }}
                  animate={{ scale: 1, color: "#d1d5db" }}
                  transition={{ duration: 0.3 }}
                >
                  {likes.toLocaleString()}
                </motion.span>
              )}
            </motion.button>

            <motion.button 
              onClick={() => setShowComments(s => !s)} 
              className="flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="comments"
            >
              <MessageCircle className="w-7 h-7 text-gray-300 group-hover:text-blue-400 transition-colors" />
              {commentCount > 0 && (
                <span className="text-sm font-medium text-gray-300">
                  {commentCount}
                </span>
              )}
            </motion.button>

            <motion.button 
              onClick={handleShare} 
              className="flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="share"
            >
              <Share2 className="w-6 h-6 text-gray-300 group-hover:text-green-400 transition-colors" />
              {shares > 0 && (
                <span className="text-sm font-medium text-gray-300">
                  {shares}
                </span>
              )}
            </motion.button>
          </div>

          <motion.button 
            onClick={handleSave} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="save"
          >
            <Bookmark 
              className={`w-6 h-6 transition-colors ${
                isSaved ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-400'
              }`} 
            />
          </motion.button>
        </div>

       

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.slice(0, 4).map(tag => <span key={tag} className="text-xs text-blue-300">#{tag}</span>)}
            {post.tags.length > 4 && <span className="text-xs text-gray-400">+{post.tags.length - 4}</span>}
          </div>
        )}

        {commentCount > 0 && !showComments && <button onClick={() => setShowComments(true)} className="text-sm text-gray-400 mb-2">View all {commentCount} comments</button>}

        <div className="text-xs text-gray-500 uppercase">{formatTimeAgo(post.createdAt)}</div>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="border-t border-gray-700/50 bg-black/60"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CommentSection 
              postId={post._id} 
              initialComments={post.comments || []} 
              onCommentAdded={handleCommentAdded} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen preview */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <ImagePreview 
            images={post.media} 
            startIndex={selectedImageIndex} 
            onClose={() => setSelectedImageIndex(null)} 
            post={post} 
          />
        )}
      </AnimatePresence>
    </motion.article>

    {/* Share Modal */}
    <AnimatePresence>
      {showShareModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-400" />
                <span className="text-white">Copy Link</span>
              </button>
              
              <button 
                onClick={() => { setShowShareModal(false); toast.info('Coming soon!'); }}
                className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-400" />
                <span className="text-white">Share to Social Media</span>
              </button>
              
              <button 
                onClick={() => { setShowShareModal(false); toast.info('Coming soon!'); }}
                className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5 text-gray-400" />
                <span className="text-white">Send Message</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
