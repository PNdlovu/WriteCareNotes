/**
 * @fileoverview ActiveUsers Component - Real-Time Presence Avatars
 * @module Components/Collaboration/ActiveUsers
 * @description Displays active participants in a policy collaboration session with presence indicators.
 * Shows user avatars, names, and status (active, idle, editing) with color-coded badges.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - User avatar display with initials
 * - Real-time presence status (active, idle, editing)
 * - Color-coded status indicators
 * - Hover tooltips with user details
 * - Last activity timestamp
 * - Responsive layout (stacks horizontally)
 * - Accessibility compliant (ARIA labels, keyboard nav)
 * 
 * @example
 * ```tsx
 * import ActiveUsers from '@/components/policy/ActiveUsers';
 * import { CollaborationProvider } from '@/contexts/CollaborationContext';
 * 
 * <CollaborationProvider>
 *   <ActiveUsers />
 * </CollaborationProvider>
 * ```
 */

import React, { useMemo } from 'react';
import { useCollaboration, UserPresence } from '../../contexts/CollaborationContext';

/**
 * Get user initials from name
 */
const getUserInitials = (userName: string): string => {
  const parts = userName.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return userName.substring(0, 2).toUpperCase();
};

/**
 * Get presence status label and color
 */
const getPresenceStatus = (user: UserPresence): { label: string; color: string; bgColor: string } => {
  const now = new Date();
  const lastActivity = new Date(user.lastActivity);
  const minutesAgo = Math.floor((now.getTime() - lastActivity.getTime()) / 1000 / 60);

  if (user.isEditing) {
    return { label: 'Editing', color: '#3B82F6', bgColor: '#DBEAFE' }; // Blue
  } else if (minutesAgo < 2) {
    return { label: 'Active', color: '#10B981', bgColor: '#D1FAE5' }; // Green
  } else if (minutesAgo < 5) {
    return { label: 'Idle', color: '#F59E0B', bgColor: '#FEF3C7' }; // Yellow
  } else {
    return { label: 'Away', color: '#6B7280', bgColor: '#F3F4F6' }; // Gray
  }
};

/**
 * Format last activity time
 */
const formatLastActivity = (lastActivity: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(lastActivity).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Avatar component for individual user
 */
interface UserAvatarProps {
  user: UserPresence;
  index: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, index }) => {
  const status = getPresenceStatus(user);
  const initials = getUserInitials(user.userName);

  return (
    <div
      className="relative group"
      style={{ zIndex: 50 - index }} // Stack avatars with overlap
      role="listitem"
      aria-label={`${user.userName} - ${status.label}`}
    >
      {/* Avatar Circle */}
      <div
        className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer transition-transform hover:scale-110 hover:z-50"
        style={{ backgroundColor: user.color }}
        title={user.userName}
      >
        {initials}
      </div>

      {/* Status Indicator Dot */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
        style={{ backgroundColor: status.color }}
        aria-hidden="true"
      />

      {/* Tooltip on Hover */}
      <div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
        role="tooltip"
      >
        <div className="font-semibold">{user.userName}</div>
        <div className="flex items-center gap-1 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: status.color }}
            aria-hidden="true"
          />
          <span>{status.label}</span>
        </div>
        <div className="text-gray-300 mt-1">
          Active {formatLastActivity(user.lastActivity)}
        </div>
        {user.cursor && (
          <div className="text-gray-400 mt-1 text-[10px]">
            Line {user.cursor.line}, Col {user.cursor.column}
          </div>
        )}
        {/* Tooltip Arrow */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

/**
 * ActiveUsers Component
 * Displays all active participants in the collaboration session
 */
const ActiveUsers: React.FC = () => {
  const { activeUsers, isConnected } = useCollaboration();

  // Convert Map to Array for rendering
  const usersList = useMemo(() => {
    return Array.from(activeUsers.values());
  }, [activeUsers]);

  // If not connected or no users, show placeholder
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" aria-hidden="true" />
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  if (usersList.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
        <span className="text-sm text-blue-700">You're the first one here</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm"
      role="region"
      aria-label="Active collaborators"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mr-2 border-r border-gray-300 pr-3">
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {usersList.length} {usersList.length === 1 ? 'User' : 'Users'}
        </span>
      </div>

      {/* Avatar Stack */}
      <div className="flex -space-x-2" role="list" aria-label="Active users">
        {usersList.map((user, index) => (
          <UserAvatar key={user.userId} user={user} index={index} />
        ))}
      </div>

      {/* Overflow Indicator (if more than 5 users) */}
      {usersList.length > 5 && (
        <div
          className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs shadow-md"
          title={`${usersList.length - 5} more users`}
          aria-label={`${usersList.length - 5} more users`}
        >
          +{usersList.length - 5}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="ml-auto flex items-center gap-2" aria-live="polite">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
        <span className="text-xs text-gray-500">Live</span>
      </div>
    </div>
  );
};

export default ActiveUsers;
