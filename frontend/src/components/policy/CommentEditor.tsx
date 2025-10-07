/**
 * @fileoverview CommentEditor Component - Rich Comment Input with @Mentions
 * @module Components/Collaboration/CommentEditor
 * @description Text editor for creating policy comments with @mention autocomplete support.
 * Supports threaded replies, comment types, character limits, and position annotations.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - Rich text input with character count (10-10000 chars)
 * - @mention autocomplete with user search
 * - Comment type selector (general, suggestion, question, etc.)
 * - Threaded reply support
 * - Position selector for annotations
 * - Keyboard shortcuts (Ctrl+Enter to submit)
 * - Real-time typing indicators
 * - Accessibility compliant (ARIA labels, keyboard nav)
 * 
 * @example
 * ```tsx
 * import CommentEditor from '@/components/policy/CommentEditor';
 * 
 * <CommentEditor
 *   policyId="uuid-123"
 *   currentUserId="user-456"
 *   onSubmit={(content, type) => handleComment(content, type)}
 *   placeholder="Add a comment or annotation..."
 * />
 * ```
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';

interface CommentEditorProps {
  policyId: string;
  currentUserId: string;
  currentUserName: string;
  parentCommentId?: string;
  placeholder?: string;
  onSubmit: (content: string, commentType: string, positionSelector?: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * Comment type options
 */
const COMMENT_TYPES = [
  { value: 'general', label: 'General', icon: '💬', color: '#6B7280' },
  { value: 'suggestion', label: 'Suggestion', icon: '💡', color: '#3B82F6' },
  { value: 'question', label: 'Question', icon: '❓', color: '#8B5CF6' },
  { value: 'approval', label: 'Approval', icon: '✅', color: '#10B981' },
  { value: 'rejection', label: 'Rejection', icon: '❌', color: '#EF4444' },
  { value: 'annotation', label: 'Annotation', icon: '📝', color: '#F59E0B' },
];

/**
 * Mock user list for @mention autocomplete
 * TODO: Replace with actual API call to fetch organization users
 */
const MOCK_USERS = [
  { id: 'user-1', name: 'John Smith', email: 'john.smith@example.com' },
  { id: 'user-2', name: 'Jane Doe', email: 'jane.doe@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob.johnson@example.com' },
  { id: 'user-4', name: 'Alice Williams', email: 'alice.williams@example.com' },
  { id: 'user-5', name: 'Charlie Brown', email: 'charlie.brown@example.com' },
];

/**
 * CommentEditor Component
 */
const CommentEditor: React.FC<CommentEditorProps> = ({
  policyId,
  currentUserId,
  currentUserName,
  parentCommentId,
  placeholder = 'Add a comment or annotation...',
  onSubmit,
  onCancel,
  autoFocus = false,
}) => {
  const { startTyping, stopTyping } = useCollaboration();
  const [content, setContent] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typePickerRef = useRef<HTMLDivElement>(null);
  const mentionPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedType = COMMENT_TYPES.find(t => t.value === commentType) || COMMENT_TYPES[0];

  // Filter users based on mention search
  const filteredUsers = mentionSearch
    ? MOCK_USERS.filter(user =>
        user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(mentionSearch.toLowerCase())
      )
    : MOCK_USERS;

  // Auto-focus textarea
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typePickerRef.current && !typePickerRef.current.contains(event.target as Node)) {
        setShowTypePicker(false);
      }
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(event.target as Node)) {
        setShowMentionPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    startTyping();

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [startTyping, stopTyping]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    handleTyping();

    // Check for @mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length < 30) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtSymbol);
        setShowMentionPicker(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionPicker(false);
      }
    } else {
      setShowMentionPicker(false);
    }
  };

  // Insert @mention
  const insertMention = (user: typeof MOCK_USERS[0]) => {
    if (!textareaRef.current) return;

    const before = content.substring(0, mentionPosition);
    const after = content.substring(textareaRef.current.selectionStart);
    const newContent = `${before}@[${user.id}]${after}`;

    setContent(newContent);
    setShowMentionPicker(false);
    setMentionSearch('');

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionPosition + `@[${user.id}]`.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Navigate mention picker
    if (showMentionPicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && filteredUsers.length > 0) {
        e.preventDefault();
        insertMention(filteredUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentionPicker(false);
      }
    }
  };

  // Submit comment
  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit(content.trim(), commentType);
    setContent('');
    setCommentType('general');
    stopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Cancel editing
  const handleCancelClick = () => {
    setContent('');
    setCommentType('general');
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onCancel?.();
  };

  const charCount = content.length;
  const isOverLimit = charCount > 10000;
  const isUnderMin = charCount < 10;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* Header with Comment Type Selector */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="relative" ref={typePickerRef}>
          <button
            onClick={() => setShowTypePicker(!showTypePicker)}
            className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: selectedType.color }}
            aria-label="Select comment type"
            aria-expanded={showTypePicker}
          >
            <span>{selectedType.icon}</span>
            <span className="font-medium">{selectedType.label}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Type Picker Dropdown */}
          {showTypePicker && (
            <div
              className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              role="menu"
              aria-label="Comment types"
            >
              {COMMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setCommentType(type.value);
                    setShowTypePicker(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                  style={{ color: type.value === commentType ? type.color : '#6B7280' }}
                  role="menuitem"
                >
                  <span>{type.icon}</span>
                  <span className={type.value === commentType ? 'font-medium' : ''}>
                    {type.label}
                  </span>
                  {type.value === commentType && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {parentCommentId && (
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
            Replying to comment
          </span>
        )}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm border-none focus:ring-0 focus:outline-none resize-none"
          rows={4}
          maxLength={10100} // Allow slight overflow for UX
          aria-label="Comment content"
          aria-describedby="char-count"
        />

        {/* @Mention Picker */}
        {showMentionPicker && filteredUsers.length > 0 && (
          <div
            ref={mentionPickerRef}
            className="absolute left-4 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
            role="listbox"
            aria-label="Mention suggestions"
          >
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-blue-50 transition-colors text-left ${
                  index === selectedMentionIndex ? 'bg-blue-50' : ''
                }`}
                role="option"
                aria-selected={index === selectedMentionIndex}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Character Count */}
          <span
            id="char-count"
            className={charCount > 10000 ? 'text-red-600 font-medium' : ''}
            aria-live="polite"
          >
            {charCount.toLocaleString()} / 10,000
          </span>

          {/* Tip */}
          <span className="hidden sm:inline text-gray-400">
            Tip: Use @ to mention users • Ctrl+Enter to submit
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={handleCancelClick}
              className="px-4 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isOverLimit || isUnderMin || !content.trim()}
            className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={
              isOverLimit
                ? 'Comment exceeds 10,000 characters'
                : isUnderMin
                ? 'Comment must be at least 10 characters'
                : 'Post comment'
            }
          >
            {parentCommentId ? 'Post Reply' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
