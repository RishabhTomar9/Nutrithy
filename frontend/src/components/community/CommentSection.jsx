import React, { useEffect, useState } from 'react';
import { Heart, Loader2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  addComment,
  fetchComments as fetchCommentsService,
  deleteComment as deleteCommentService,
  likeComment as likeCommentService
} from '../../services/communityService';

export default function CommentSection({ postId, initialComments = [], onCommentAdded }) {
  const { user } = useAuth() || {};
  const [comments, setComments] = useState(initialComments || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [likedComments, setLikedComments] = useState({});
  const [showMenu, setShowMenu] = useState(null);

  useEffect(() => {
    const stored = {};
    try {
      const keys = Object.keys(window).filter(k => k.startsWith('liked_'));
      keys.forEach(k => (stored[k.replace('liked_', '')] = true));
    } catch (e) {}
    setLikedComments(stored);
  }, []);

  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments]);

  useEffect(() => {
    if (!initialComments || initialComments.length === 0) {
      loadComments(1);
    }
  }, [postId]);

  async function loadComments(p = 1) {
    try {
      setLoading(true);
      const res = await fetchCommentsService(postId, p, 10);
      const fetched = res?.comments || res || [];
      setComments(prev => (p === 1 ? fetched : [...prev, ...fetched]));
      setHasMore(Boolean(res?.hasMore));
      setPage(p);
    } catch (err) {
      console.error('Failed to load comments', err);
      setError(err?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!user) return setError('You must be signed in to post a comment.');
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const created = await addComment(postId, newComment, replyTo?.id || null);
      const commentObj = created?.id || created?._id
        ? created
        : {
            id: created?.id || created?._id || `tmp-${Date.now()}`,
            content: created?.content || newComment.trim(),
            author: created?.author || (user?.displayName || user?.name || 'You'),
            createdAt: created?.createdAt || new Date().toISOString(),
            parentId: replyTo?.id || null,
          };
      setComments(prev => [commentObj, ...prev]);
      setNewComment('');
      setReplyTo(null);
      if (typeof onCommentAdded === 'function') onCommentAdded(commentObj);
    } catch (err) {
      setError(err?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(comment) {
    setReplyTo(comment);
    const mention = `@${comment.author?.name || comment.author || 'user'}`;
    setNewComment(mention + ' ');
  }

  async function handleDelete(commentId) {
    try {
      await deleteCommentService(commentId);
      setComments(prev => prev.filter(c => (c.id || c._id) !== commentId));
      setShowMenu(null);
    } catch (err) {
      console.error('Failed to delete comment', err);
      setError(err?.message || 'Delete failed');
    }
  }

  async function handleLike(commentId) {
    if (likedComments[commentId]) return;
    try {
      await likeCommentService(commentId);
      window[`liked_${commentId}`] = true;
      setLikedComments(prev => ({ ...prev, [commentId]: true }));
      setComments(prev =>
        prev.map(c => {
          const id = c.id || c._id;
          if (id !== commentId) return c;
          const likes =
            (c.likes && (typeof c.likes === 'number' ? c.likes : c.likes.count)) || 0;
          return { ...c, likes: likes + 1 };
        })
      );
    } catch (err) {
      console.error('Failed to like comment', err);
    }
  }

  const formatTimeAgo = date => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
    return past.toLocaleDateString();
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full text-gray-100">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>

      {/* Comments List */}
      <div className="border-t border-gray-800">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-gray-500 text-sm font-semibold">No comments yet</p>
            <p className="text-gray-600 text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          <div>
            {comments.map((c, idx) => {
              const id = c.id || c._id;
              const likes =
                (c.likes && (typeof c.likes === 'number' ? c.likes : c.likes.count)) || 0;
              const isLiked = likedComments[id];
              return (
                <div
                  key={id}
                  className="px-4 py-2.5 hover:bg-gray-900 transition-colors animate-slide-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 via-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                      {(c.author?.name || c.author || 'A')[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="inline-block">
                            <span className="font-semibold text-sm text-white mr-2">
                              {c.author?.name || c.author || 'Anonymous'}
                            </span>
                            <span className="text-sm text-gray-300 break-words">
                              {c.content || c.body || c.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-500 font-medium">
                              {formatTimeAgo(c.createdAt || Date.now())}
                            </span>
                            {likes > 0 && (
                              <span className="text-xs text-gray-400 font-semibold">
                                {likes} {likes === 1 ? 'like' : 'likes'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleReply(c)}
                              className="text-xs text-gray-400 font-semibold hover:text-gray-300 transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* Like & Menu */}
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => handleLike(id)}
                            className="hover:opacity-80 transition"
                          >
                            <Heart
                              className={`w-4 h-4 transition-all ${
                                isLiked
                                  ? 'fill-pink-500 text-pink-500 scale-110'
                                  : 'text-gray-300 hover:text-pink-400'
                              }`}
                            />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowMenu(showMenu === id ? null : id)}
                              className="hover:opacity-80 transition"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>

                            {showMenu === id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowMenu(null)}
                                />
                                <div className="absolute right-0 mt-1 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1 z-20 min-w-[140px]">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 font-semibold hover:bg-gray-800 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full py-3 text-sm text-gray-400 font-semibold hover:text-gray-300 transition-colors"
              >
                View more comments ↓
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-800 px-4 py-3 bg-[#0b0b0b90] sticky bottom-0">
        {error && (
          <div className="mb-2 text-xs text-red-400 animate-slide-in">{error}</div>
        )}

        {replyTo && (
          <div className="mb-2 text-xs text-gray-500 flex items-center justify-between animate-slide-in">
            <span>
              Replying to{' '}
              <span className="font-semibold text-gray-300">
                {replyTo.author?.name || replyTo.author}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setNewComment('');
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-xs">
            {user?.name?.[0]?.toUpperCase() || 'Y'}
          </div>

          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment..."
            className="flex-1 text-sm outline-none placeholder-gray-500 bg-transparent text-gray-100"
            disabled={submitting}
          />

          {newComment.trim() && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
