/**
 * @fileoverview CollaborationContext - Real-Time Collaboration WebSocket Context
 * @module Contexts/CollaborationContext
 * @description React Context Provider for managing WebSocket connections and real-time collaboration state.
 * Provides WebSocket event handling, presence tracking, and comment management for policy collaboration.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - WebSocket connection management with auto-reconnect
 * - Real-time presence tracking (active users, cursors, editing status)
 * - Live comment updates and notifications
 * - Typing indicators
 * - Connection status monitoring
 * - Room-based isolation per policy document
 * 
 * WebSocket Events (Incoming):
 * - user_joined: User joined the collaboration session
 * - user_left: User left the session
 * - cursor_update: User's cursor position changed
 * - document_updated: Document content changed
 * - comment_added: New comment added
 * - typing_indicator: User is typing
 * - presence_update: Presence data updated
 * 
 * WebSocket Events (Outgoing):
 * - join_policy: Join a policy collaboration session
 * - leave_policy: Leave the session
 * - cursor_move: Update cursor position
 * - text_change: Document content changed
 * - add_comment: Create new comment
 * - typing_start/stop: Typing status
 * 
 * @example
 * ```tsx
 * import { CollaborationProvider, useCollaboration } from '@/contexts/CollaborationContext';
 * 
 * // Wrap app or specific routes
 * <CollaborationProvider>
 *   <PolicyEditor />
 * </CollaborationProvider>
 * 
 * // In component
 * const { activeUsers, joinPolicy, addComment } = useCollaboration();
 * ```
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ===========================
// TypeScript Interfaces
// ===========================

/**
 * User presence information
 */
export interface UserPresence {
  userId: string;
  userName: string;
  isEditing: boolean;
  cursor?: CursorPosition;
  lastActivity: Date;
  color: string; // Color for cursor/avatar
}

/**
 * Cursor position in document
 */
export interface CursorPosition {
  line: number;
  column: number;
  selector?: string;
}

/**
 * Selection range in document
 */
export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

/**
 * Comment data structure
 */
export interface Comment {
  id: string;
  policyId: string;
  userId: string;
  userName: string;
  content: string;
  positionSelector?: {
    selector: string;
    textContent: string;
    startOffset: number;
    endOffset: number;
  };
  parentCommentId?: string;
  status: 'active' | 'resolved' | 'deleted';
  commentType: 'general' | 'suggestion' | 'question' | 'approval' | 'rejection' | 'annotation';
  mentionedUsers: string[];
  likeCount: number;
  isPinned: boolean;
  createdAt: string;
  replies?: Comment[];
}

/**
 * Typing indicator
 */
export interface TypingUser {
  userId: string;
  userName: string;
}

/**
 * Collaboration state
 */
interface CollaborationState {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  currentPolicyId: string | null;
  activeUsers: Map<string, UserPresence>;
  comments: Comment[];
  typingUsers: TypingUser[];
  notifications: CollaborationNotification[];
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'user_joined'
  | 'user_left'
  | 'comment_added'
  | 'mention'
  | 'comment_resolved'
  | 'conflict'
  | 'connection_status';

/**
 * Collaboration notification
 */
export interface CollaborationNotification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  autoClose?: boolean;
}

/**
 * State actions
 */
type CollaborationAction =
  | { type: 'SOCKET_CONNECTED'; payload: Socket }
  | { type: 'SOCKET_DISCONNECTED' }
  | { type: 'SOCKET_RECONNECTING' }
  | { type: 'SOCKET_ERROR'; payload: string }
  | { type: 'JOIN_POLICY'; payload: string }
  | { type: 'LEAVE_POLICY' }
  | { type: 'USER_JOINED'; payload: UserPresence }
  | { type: 'USER_LEFT'; payload: string }
  | { type: 'UPDATE_PRESENCE'; payload: { userId: string; presence: Partial<UserPresence> } }
  | { type: 'UPDATE_CURSOR'; payload: { userId: string; cursor: CursorPosition } }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'UPDATE_COMMENT'; payload: { commentId: string; updates: Partial<Comment> } }
  | { type: 'SET_COMMENTS'; payload: Comment[] }
  | { type: 'TYPING_START'; payload: TypingUser }
  | { type: 'TYPING_STOP'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: CollaborationNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// ===========================
// Initial State
// ===========================

const initialState: CollaborationState = {
  socket: null,
  isConnected: false,
  isReconnecting: false,
  connectionError: null,
  currentPolicyId: null,
  activeUsers: new Map(),
  comments: [],
  typingUsers: [],
  notifications: [],
};

// ===========================
// Reducer
// ===========================

const collaborationReducer = (state: CollaborationState, action: CollaborationAction): CollaborationState => {
  switch (action.type) {
    case 'SOCKET_CONNECTED':
      return {
        ...state,
        socket: action.payload,
        isConnected: true,
        isReconnecting: false,
        connectionError: null,
      };

    case 'SOCKET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        connectionError: 'Disconnected from server',
      };

    case 'SOCKET_RECONNECTING':
      return {
        ...state,
        isReconnecting: true,
      };

    case 'SOCKET_ERROR':
      return {
        ...state,
        connectionError: action.payload,
        isReconnecting: false,
      };

    case 'JOIN_POLICY':
      return {
        ...state,
        currentPolicyId: action.payload,
        activeUsers: new Map(),
        comments: [],
      };

    case 'LEAVE_POLICY':
      return {
        ...state,
        currentPolicyId: null,
        activeUsers: new Map(),
        comments: [],
        typingUsers: [],
      };

    case 'USER_JOINED': {
      const newUsers = new Map(state.activeUsers);
      newUsers.set(action.payload.userId, action.payload);
      return {
        ...state,
        activeUsers: newUsers,
      };
    }

    case 'USER_LEFT': {
      const newUsers = new Map(state.activeUsers);
      newUsers.delete(action.payload);
      return {
        ...state,
        activeUsers: newUsers,
        typingUsers: state.typingUsers.filter(u => u.userId !== action.payload),
      };
    }

    case 'UPDATE_PRESENCE': {
      const newUsers = new Map(state.activeUsers);
      const existingUser = newUsers.get(action.payload.userId);
      if (existingUser) {
        newUsers.set(action.payload.userId, {
          ...existingUser,
          ...action.payload.presence,
        });
      }
      return {
        ...state,
        activeUsers: newUsers,
      };
    }

    case 'UPDATE_CURSOR': {
      const newUsers = new Map(state.activeUsers);
      const existingUser = newUsers.get(action.payload.userId);
      if (existingUser) {
        newUsers.set(action.payload.userId, {
          ...existingUser,
          cursor: action.payload.cursor,
          lastActivity: new Date(),
        });
      }
      return {
        ...state,
        activeUsers: newUsers,
      };
    }

    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [action.payload, ...state.comments],
      };

    case 'UPDATE_COMMENT': {
      const updatedComments = state.comments.map(comment =>
        comment.id === action.payload.commentId
          ? { ...comment, ...action.payload.updates }
          : comment
      );
      return {
        ...state,
        comments: updatedComments,
      };
    }

    case 'SET_COMMENTS':
      return {
        ...state,
        comments: action.payload,
      };

    case 'TYPING_START': {
      const isAlreadyTyping = state.typingUsers.some(u => u.userId === action.payload.userId);
      if (isAlreadyTyping) return state;
      return {
        ...state,
        typingUsers: [...state.typingUsers, action.payload],
      };
    }

    case 'TYPING_STOP':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u.userId !== action.payload),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
};

// ===========================
// Context
// ===========================

interface CollaborationContextType extends CollaborationState {
  joinPolicy: (policyId: string, userId: string, userName: string) => void;
  leavePolicy: () => void;
  updateCursor: (cursor: CursorPosition) => void;
  updateSelection: (selection: SelectionRange) => void;
  sendTextChange: (content: string, changeType: string) => void;
  addComment: (content: string, positionSelector?: any, commentType?: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  dismissNotification: (notificationId: string) => void;
  clearNotifications: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

// ===========================
// Provider Component
// ===========================

interface CollaborationProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
}

/**
 * Color palette for user avatars and cursors
 */
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C41A',
];

let colorIndex = 0;
const getNextColor = (): string => {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
};

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ 
  children, 
  wsUrl = 'http://localhost:5000' // TODO: Use env variable
}) => {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string>('');
  const currentUserNameRef = useRef<string>('');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===========================
  // WebSocket Setup
  // ===========================

  useEffect(() => {
    // Initialize socket connection
    const socket = io(wsUrl, {
      path: '/collaboration',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      dispatch({ type: 'SOCKET_CONNECTED', payload: socket });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `conn-${Date.now()}`,
          type: 'connection_status',
          message: 'Connected to collaboration server',
          timestamp: new Date(),
          autoClose: true,
        },
      });
    });

    socket.on('disconnect', () => {
      console.warn('⚠️  WebSocket disconnected');
      dispatch({ type: 'SOCKET_DISCONNECTED' });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `disconn-${Date.now()}`,
          type: 'connection_status',
          message: 'Disconnected from server',
          timestamp: new Date(),
        },
      });
    });

    socket.on('reconnecting', (attemptNumber: number) => {
      console.log(`🔄 Reconnecting... (attempt ${attemptNumber})`);
      dispatch({ type: 'SOCKET_RECONNECTING' });
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error);
      dispatch({ type: 'SOCKET_ERROR', payload: error.message });
    });

    // Collaboration events
    socket.on('user_joined', (data: { userId: string; userName: string }) => {
      console.log('👤 User joined:', data.userName);
      const presence: UserPresence = {
        userId: data.userId,
        userName: data.userName,
        isEditing: false,
        lastActivity: new Date(),
        color: getNextColor(),
      };
      dispatch({ type: 'USER_JOINED', payload: presence });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `join-${Date.now()}`,
          type: 'user_joined',
          message: `${data.userName} joined the collaboration`,
          timestamp: new Date(),
          userId: data.userId,
          userName: data.userName,
          autoClose: true,
        },
      });
    });

    socket.on('user_left', (data: { userId: string; userName: string }) => {
      console.log('👋 User left:', data.userName);
      dispatch({ type: 'USER_LEFT', payload: data.userId });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `leave-${Date.now()}`,
          type: 'user_left',
          message: `${data.userName} left the collaboration`,
          timestamp: new Date(),
          userId: data.userId,
          userName: data.userName,
          autoClose: true,
        },
      });
    });

    socket.on('cursor_update', (data: { userId: string; userName: string; cursor: CursorPosition }) => {
      dispatch({ type: 'UPDATE_CURSOR', payload: { userId: data.userId, cursor: data.cursor } });
    });

    socket.on('document_updated', (data: { userId: string; content: string; changeType: string }) => {
      console.log('📝 Document updated by:', data.userId);
      dispatch({ 
        type: 'UPDATE_PRESENCE', 
        payload: { userId: data.userId, presence: { isEditing: true } } 
      });
    });

    socket.on('comment_added', (data: { comment: Comment }) => {
      console.log('💬 Comment added:', data.comment);
      dispatch({ type: 'ADD_COMMENT', payload: data.comment });
      
      // Check if current user is mentioned
      if (data.comment.mentionedUsers.includes(currentUserIdRef.current)) {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `mention-${Date.now()}`,
            type: 'mention',
            message: `${data.comment.userName} mentioned you in a comment`,
            timestamp: new Date(),
            userId: data.comment.userId,
            userName: data.comment.userName,
          },
        });
      } else {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `comment-${Date.now()}`,
            type: 'comment_added',
            message: `${data.comment.userName} added a comment`,
            timestamp: new Date(),
            userId: data.comment.userId,
            userName: data.comment.userName,
            autoClose: true,
          },
        });
      }
    });

    socket.on('typing_indicator', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        dispatch({ type: 'TYPING_START', payload: { userId: data.userId, userName: data.userName } });
      } else {
        dispatch({ type: 'TYPING_STOP', payload: data.userId });
      }
    });

    socket.on('presence_update', (data: { users: UserPresence[] }) => {
      console.log('👥 Presence update:', data.users.length, 'users');
      data.users.forEach(user => {
        dispatch({ type: 'USER_JOINED', payload: { ...user, color: getNextColor() } });
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsUrl]);

  // ===========================
  // Context Methods
  // ===========================

  const joinPolicy = useCallback((policyId: string, userId: string, userName: string) => {
    if (!socketRef.current) return;

    currentUserIdRef.current = userId;
    currentUserNameRef.current = userName;

    socketRef.current.emit('join_policy', {
      policyId,
      userId,
      userName,
    });

    dispatch({ type: 'JOIN_POLICY', payload: policyId });
    console.log(`📋 Joined policy: ${policyId}`);
  }, []);

  const leavePolicy = useCallback(() => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('leave_policy', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
    });

    dispatch({ type: 'LEAVE_POLICY' });
    console.log('👋 Left policy collaboration');
  }, [state.currentPolicyId]);

  const updateCursor = useCallback((cursor: CursorPosition) => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('cursor_move', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
      cursor,
    });
  }, [state.currentPolicyId]);

  const updateSelection = useCallback((selection: SelectionRange) => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('selection_change', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
      selection,
    });
  }, [state.currentPolicyId]);

  const sendTextChange = useCallback((content: string, changeType: string) => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('text_change', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
      content,
      changeType,
    });
  }, [state.currentPolicyId]);

  const addComment = useCallback((
    content: string, 
    positionSelector?: any, 
    commentType: string = 'general'
  ) => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('add_comment', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
      userName: currentUserNameRef.current,
      content,
      positionSelector,
      commentType,
    });
  }, [state.currentPolicyId]);

  const startTyping = useCallback(() => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('typing_start', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
      userName: currentUserNameRef.current,
    });
  }, [state.currentPolicyId]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !state.currentPolicyId) return;

    socketRef.current.emit('typing_stop', {
      policyId: state.currentPolicyId,
      userId: currentUserIdRef.current,
    });
  }, [state.currentPolicyId]);

  const dismissNotification = useCallback((notificationId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // ===========================
  // Context Value
  // ===========================

  const value: CollaborationContextType = {
    ...state,
    joinPolicy,
    leavePolicy,
    updateCursor,
    updateSelection,
    sendTextChange,
    addComment,
    startTyping,
    stopTyping,
    dismissNotification,
    clearNotifications,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

// ===========================
// Custom Hook
// ===========================

/**
 * useCollaboration Hook
 * Access collaboration context in any component
 * 
 * @throws Error if used outside CollaborationProvider
 * @returns CollaborationContextType
 */
export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
};

export default CollaborationContext;
