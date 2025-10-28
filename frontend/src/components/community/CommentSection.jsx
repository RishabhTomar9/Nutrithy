import React, { useEffect, useState } from 'react';
import { addComment, fetchComments } from '../../services/communityService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

export default function CommentSection({ postId, initialComments = [], onCommentAdded }) {
  const { user } = useAuth() || {};
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addComment(postId, text.trim(), null);
      // If backend returns the created comment, prepend it
      setComments(prev => [created, ...prev]);
      setText('');
      if (typeof onCommentAdded === 'function') onCommentAdded(created);
    } catch (err) {
      console.error('add comment', err);
      toast.error(err?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 p-2 rounded-md bg-gray-800 text-white"
          rows={2}
          disabled={submitting}
        />
        <button type="submit" className="px-3 py-2 bg-green-500 rounded-md text-white" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>

      <div className="mt-3 space-y-2 max-h-60 overflow-auto">
        {loading ? <div className="text-gray-400">Loading comments...</div> : comments.length === 0 ? <div className="text-sm text-gray-400">No comments yet</div> : comments.map((c) => (
          <div key={c._id || c.id} className="p-2 bg-gray-800/60 rounded-md">
            <div className="text-sm text-gray-300"><strong>{c.author?.name || c.author}</strong> <span className="text-xs text-gray-400">· {new Date(c.createdAt).toLocaleString()}</span></div>
            <div className="text-gray-200 text-sm mt-1">{c.content || c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
