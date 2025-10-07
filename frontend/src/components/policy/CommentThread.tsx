/**
 * @fileoverview CommentThread Component - Threaded Policy Comments Display
 * @module Components/Collaboration/CommentThread
 * @description Displays policy comments with threading, replies, and interactive actions.
 * Supports @mentions, likes, resolution workflow, and nested replies.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - Threaded comment display (parent + replies)
 * - @mention highlighting with user links
 * - Like/unlike comments
 * - Resolve/reopen comments
 * - Pin important comments
 * - Edit comments (15-minute window)
 * - Delete comments (soft delete)
 * - Reply to comments
 * - Comment metadata (author, time, status)
 * - Accessibility compliant (ARIA, keyboard nav)
 * 
 * @example
 * ```tsx
 * import CommentThread from '@/components/policy/CommentThread';
 * 
 * <CommentThread 
 *   policyId="uuid-123" 
 *   currentUserId="user-456"
 *   onReply={(parentId, content) => handleReply(parentId, content)}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { useCollaboration, Comment } from '../../contexts/CollaborationContext';

interface CommentThreadProps {
  policyId: string;
  currentUserId: string;
  currentUserName: string;
  onReply?: (parentCommentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onPin?: (commentId: string) => void;
}

/**
 * Format timestamp to relative time
 */
const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const commentDate = new Date(timestamp);
  const diffMs = now.getTime() - commentDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return commentDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Parse @mentions in comment content
 */
const parseCommentContent = (content: string): React.ReactNode => {
  const mentionRegex = /@\[([a-f0-9-]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    // Add mention as highlighted span
    parts.push(
      <span
        key={match.index}
        className="bg-blue-100 text-blue-700 px-1 rounded font-medium"
        title={`Mentioned user: ${match[1]}`}
      >
        @user
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

/**
 * Get comment type badge
 */
const getCommentTypeBadge = (type: string): { label: string; color: string; bgColor: string } => {
  const types: Record<string, { label: string; color: string; bgColor: string }> = {
    general: { label: 'General', color: '#6B7280', bgColor: '#F3F4F6' },
    suggestion: { label: 'Suggestion', color: '#3B82F6', bgColor: '#DBEAFE' },
    question: { label: 'Question', color: '#8B5CF6', bgColor: '#EDE9FE' },
    approval: { label: 'Approval', color: '#10B981', bgColor: '#D1FAE5' },
    rejection: { label: 'Rejection', color: '#EF4444', bgColor: '#FEE2E2' },
    annotation: { label: 'Annotation', color: '#F59E0B', bgColor: '#FEF3C7' },
  };
  return types[type] || types.general;
};

/**
 * Individual Comment Component
 */
interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  currentUserName: string;
  isReply?: boolean;
  onReply?: (content: string) => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onLike?: () => void;
  onResolve?: () => void;
  onPin?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  currentUserName,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onResolve,
  onPin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = comment.userId === currentUserId;
  const typeBadge = getCommentTypeBadge(comment.commentType);

  // Check if comment can be edited (15-minute window)
  const canEdit = useMemo(() => {
    if (!isAuthor) return false;
    const commentAge = Date.now() - new Date(comment.createdAt).getTime();
    return commentAge < 15 * 60 * 1000; // 15 minutes
  }, [isAuthor, comment.createdAt]);

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleSubmitReply = () => {
    if (onReply && replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div
      className={`border-l-2 pl-4 py-3 ${
        isReply ? 'ml-8 border-gray-200' : 'border-blue-400'
      } ${comment.isPinned ? 'bg-yellow-50' : ''} ${
        comment.status === 'resolved' ? 'opacity-60' : ''
      }`}
      role="article"
      aria-label={`Comment by ${comment.userName}`}
    >
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
            aria-hidden="true"
          >
            {comment.userName.substring(0, 2).toUpperCase()}
          </div>
          {/* User Name & Time */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">{comment.userName}</span>
              {isAuthor && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">You</span>
              )}
              {comment.isPinned && (
                <span
                  className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded flex items-center gap-1"
                  aria-label="Pinned comment"
                >
                  📌 Pinned
                </span>
              )}
              {comment.status === 'resolved' && (
                <span
                  className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1"
                  aria-label="Resolved comment"
                >
                  ✓ Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <time dateTime={comment.createdAt}>{formatTimestamp(comment.createdAt)}</time>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ color: typeBadge.color, backgroundColor: typeBadge.bgColor }}
              >
                {typeBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit comment"
                aria-label="Edit comment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {isAuthor && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete comment"
                aria-label="Delete comment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={3}
            maxLength={10000}
            aria-label="Edit comment content"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              disabled={!editContent.trim()}
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <span className="text-xs text-gray-500 ml-auto">
              {editContent.length} / 10000
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-800 text-sm mb-3 whitespace-pre-wrap leading-relaxed">
          {parseCommentContent(comment.content)}
        </div>
      )}

      {/* Comment Actions */}
      {!isEditing && comment.status !== 'deleted' && (
        <div className="flex items-center gap-4 text-xs">
          {/* Like Button */}
          <button
            onClick={onLike}
            className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
            aria-label={`Like comment (${comment.likeCount} likes)`}
          >
            <svg className="w-4 h-4" fill={comment.likeCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{comment.likeCount || 0}</span>
          </button>

          {/* Reply Button */}
          {!isReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              aria-label="Reply to comment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Reply</span>
            </button>
          )}

          {/* Resolve/Reopen Button */}
          {!isReply && (
            <button
              onClick={onResolve}
              className={`flex items-center gap-1 transition-colors ${
                comment.status === 'resolved'
                  ? 'text-green-600 hover:text-green-700'
                  : 'text-gray-500 hover:text-green-600'
              }`}
              aria-label={comment.status === 'resolved' ? 'Reopen comment' : 'Resolve comment'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{comment.status === 'resolved' ? 'Reopen' : 'Resolve'}</span>
            </button>
          )}

          {/* Pin Button */}
          {!isReply && (
            <button
              onClick={onPin}
              className={`flex items-center gap-1 transition-colors ${
                comment.isPinned
                  ? 'text-yellow-600 hover:text-yellow-700'
                  : 'text-gray-500 hover:text-yellow-600'
              }`}
              aria-label={comment.isPinned ? 'Unpin comment' : 'Pin comment'}
            >
              <span>{comment.isPinned ? '📌' : '📍'}</span>
              <span>{comment.isPinned ? 'Unpin' : 'Pin'}</span>
            </button>
          )}

          {/* Reply Count */}
          {comment.replies && comment.replies.length > 0 && (
            <span className="text-gray-500 ml-auto">
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-3 ml-8">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to ${comment.userName}...`}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={2}
            maxLength={10000}
            aria-label="Reply content"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSubmitReply}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              disabled={!replyContent.trim()}
            >
              Post Reply
            </button>
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <span className="text-xs text-gray-500 ml-auto">
              {replyContent.length} / 10000
            </span>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isReply={true}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CommentThread Component
 * Main component for displaying all comments
 */
const CommentThread: React.FC<CommentThreadProps> = ({
  policyId,
  currentUserId,
  currentUserName,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onResolve,
  onPin,
}) => {
  const { comments } = useCollaboration();

  // Filter comments for this policy and group by parent/child
  const policyComments = useMemo(() => {
    return comments
      .filter((c) => c.policyId === policyId && !c.parentCommentId)
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [comments, policyId]);

  if (policyComments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm">No comments yet</p>
        <p className="text-xs mt-1">Be the first to add a comment or annotation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="feed" aria-label="Policy comments">
      {policyComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onReply={(content) => onReply?.(comment.id, content)}
          onEdit={(content) => onEdit?.(comment.id, content)}
          onDelete={() => onDelete?.(comment.id)}
          onLike={() => onLike?.(comment.id)}
          onResolve={() => onResolve?.(comment.id)}
          onPin={() => onPin?.(comment.id)}
        />
      ))}
    </div>
  );
};

export default CommentThread;
