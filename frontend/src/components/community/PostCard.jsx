import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import ImagePreview from './ImagePreview';
import CommentSection from './CommentSection';

export default function PostCard({ post, onLike, onShare, userInteractions = {}, onInteraction }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? post.comments?.length ?? 0);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(userInteractions?.bookmark ?? false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? post.comments?.length ?? 0);
    setLikes(post.likes ?? 0);
    setIsLiked(post.isLiked ?? false);
  }, [post]);

  const handleCommentAdded = () => setCommentCount(c => c + 1);

  const handleLike = async () => {
    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikes(prev => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
      if (typeof onLike === 'function') {
        const updated = await onLike(post._id);
        if (updated?.likes !== undefined) setLikes(updated.likes);
        if (typeof updated?.isLiked === 'boolean') setIsLiked(updated.isLiked);
      }
    } catch (err) {
      console.error('like failed', err);
    }
  };

  const handleSave = () => {
    setIsSaved(s => !s);
    if (typeof onInteraction === 'function') onInteraction(post._id, 'bookmark');
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

  return (
    <article className="bg-gray-900 text-gray-100 border border-gray-800 rounded-lg overflow-hidden mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 flex items-center justify-center overflow-hidden shrink-0">
            {post.authorImage ? (
              <img src={post.authorImage} alt={post.author} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {post.author?.[0]?.toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{post.author}</h3>
            <time className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</time>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-200" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg py-2 z-20 min-w-[200px] text-sm">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400 font-semibold">Report</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Unfollow</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Add to favorites</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Go to post</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Share to...</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Copy link</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-700">Embed</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="relative bg-black">
          <div className="relative w-full" style={{ paddingBottom: post.media.length === 1 ? '56%' : '100%' }}>
            {post.media.map((m, i) => (
              <div
                key={m.public_id || m.url || i}
                className={`absolute inset-0 transition-opacity duration-300 ${i === currentMediaIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSelectedImageIndex(i)}
              >
                {m.resource_type?.startsWith('video') ? (
                  <div className="relative w-full h-full">
                    <video src={m.url} className="w-full h-full object-cover" muted playsInline loop />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={m.url} alt={`media-${i}`} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>

          {/* Arrows for wide screens */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={() => setCurrentMediaIndex(idx => Math.max(0, idx - 1))}
                className={`hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-800/70 items-center justify-center text-white z-10`}
                aria-label="previous"
              >
                ‹
              </button>

              <button
                onClick={() => setCurrentMediaIndex(idx => Math.min(post.media.length - 1, idx + 1))}
                className={`hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-800/70 items-center justify-center text-white z-10`}
                aria-label="next"
              >
                ›
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {post.media.map((_, i) => (
                  <button key={i} onClick={() => setCurrentMediaIndex(i)} className={`w-2 h-2 rounded-full ${i === currentMediaIndex ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}

          {/* Thumbnails for small screens */}
          {hasMultipleMedia && (
            <div className="md:hidden flex gap-2 p-2 bg-gray-900 overflow-x-auto">
              {post.media.map((m, i) => (
                <button key={i} onClick={() => { setCurrentMediaIndex(i); setSelectedImageIndex(i); }} className={`w-20 h-12 rounded-md overflow-hidden border ${i === currentMediaIndex ? 'border-white' : 'border-transparent'}`}>
                  {m.resource_type?.startsWith('video') ? (
                    <video src={m.url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover" alt={`thumb-${i}`} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions & Meta */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`transition-transform ${isLiked ? 'scale-110' : ''}`} aria-label="like">
              <Heart className={`w-7 h-7 ${isLiked ? 'text-red-500' : 'text-gray-200'}`} />
            </button>

            <button onClick={() => setShowComments(s => !s)} aria-label="comments">
              <MessageCircle className="w-7 h-7 text-gray-200" />
            </button>

            <button onClick={() => onShare?.(post)} aria-label="share">
              <Send className="w-7 h-7 text-gray-200" />
            </button>
          </div>

          <button onClick={handleSave} aria-label="save">
            <Bookmark className={`w-6 h-6 ${isSaved ? 'text-yellow-400' : 'text-gray-300'}`} />
          </button>
        </div>

        {likes > 0 && <div className="mb-2"><span className="font-semibold text-sm">{likes.toLocaleString()} {likes === 1 ? 'like' : 'likes'}</span></div>}

        {/* Caption */}
        {post.content && (
          <div className="mb-2 text-sm leading-snug">
            <span className="font-semibold mr-2">{post.author}</span>
            <span className="text-gray-300">{truncateText(post.content)}</span>
            {post.content.length > 150 && (
              <button onClick={() => setShowFullText(v => !v)} className="text-xs text-gray-400 ml-2">{showFullText ? 'less' : 'more'}</button>
            )}
          </div>
        )}

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
      {showComments && <div className="border-t border-gray-800"><CommentSection postId={post._id} initialComments={post.comments || []} onCommentAdded={handleCommentAdded} /></div>}

      {/* Fullscreen preview */}
      {selectedImageIndex !== null && (
        <ImagePreview images={post.media} startIndex={selectedImageIndex} onClose={() => setSelectedImageIndex(null)} post={post} />
      )}
    </article>
  );
}