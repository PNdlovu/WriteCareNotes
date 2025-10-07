/**
 * @fileoverview LiveCursors Component - Real-Time Cursor Overlay
 * @module Components/Collaboration/LiveCursors
 * @description Displays other users' cursor positions as floating labels on the document.
 * Shows real-time cursor movements with smooth animations and color-coded indicators.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - Real-time cursor position tracking
 * - Color-coded cursor labels (matches user avatar colors)
 * - Smooth cursor movement animations
 * - User name display with cursor
 * - Automatic cursor hiding after 3 seconds of inactivity
 * - Pointer icon with user identification
 * - Responsive and performant (CSS transforms)
 * 
 * @example
 * ```tsx
 * import LiveCursors from '@/components/policy/LiveCursors';
 * import { CollaborationProvider } from '@/contexts/CollaborationContext';
 * 
 * <CollaborationProvider>
 *   <div className="relative">
 *     <LiveCursors />
 *     <PolicyEditor />
 *   </div>
 * </CollaborationProvider>
 * ```
 */

import React, { useMemo } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';

/**
 * Check if cursor is recent (within 3 seconds)
 */
const isCursorRecent = (lastActivity: Date): boolean => {
  const now = new Date();
  const diff = now.getTime() - new Date(lastActivity).getTime();
  return diff < 3000; // 3 seconds
};

/**
 * Individual cursor component
 */
interface CursorProps {
  userId: string;
  userName: string;
  color: string;
  position: { line: number; column: number; selector?: string };
  lastActivity: Date;
}

const Cursor: React.FC<CursorProps> = ({ userId, userName, color, position, lastActivity }) => {
  const isRecent = isCursorRecent(lastActivity);

  // Don't show old cursors
  if (!isRecent) {
    return null;
  }

  // Calculate approximate position (this is a simplified version)
  // In a real implementation, you'd need to calculate exact pixel positions
  // based on the editor's DOM structure and the line/column values
  const top = position.line * 20; // Approximate line height
  const left = position.column * 8; // Approximate character width

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-200 ease-out"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
      role="img"
      aria-label={`${userName}'s cursor at line ${position.line}, column ${position.column}`}
    >
      {/* Cursor Pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M3 3L17 10L10 11L8 17L3 3Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User Name Label */}
      <div
        className="absolute top-5 left-5 px-2 py-1 rounded-md text-white text-xs font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
};

/**
 * LiveCursors Component
 * Overlay showing all active users' cursors
 */
const LiveCursors: React.FC = () => {
  const { activeUsers, isConnected } = useCollaboration();

  // Filter users with cursor positions
  const usersWithCursors = useMemo(() => {
    return Array.from(activeUsers.values()).filter(
      (user) => user.cursor && isCursorRecent(user.lastActivity)
    );
  }, [activeUsers]);

  if (!isConnected || usersWithCursors.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      role="presentation"
      aria-label="Live cursors overlay"
    >
      {usersWithCursors.map((user) => (
        <Cursor
          key={user.userId}
          userId={user.userId}
          userName={user.userName}
          color={user.color}
          position={user.cursor!}
          lastActivity={user.lastActivity}
        />
      ))}
    </div>
  );
};

export default LiveCursors;
