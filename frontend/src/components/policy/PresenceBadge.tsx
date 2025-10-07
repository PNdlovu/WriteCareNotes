/**
 * @fileoverview PresenceBadge Component - User Status Indicator
 * @module Components/Collaboration/PresenceBadge
 * @description Small badge component showing user's real-time presence status.
 * Displays active, idle, editing, or away status with color-coded indicators.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - Color-coded status indicators (green=active, yellow=idle, blue=editing, gray=away)
 * - Animated pulse for active status
 * - Tooltip with detailed status info
 * - Last activity timestamp
 * - Accessible (ARIA labels, semantic HTML)
 * 
 * @example
 * ```tsx
 * import PresenceBadge from '@/components/policy/PresenceBadge';
 * 
 * <PresenceBadge 
 *   isEditing={true}
 *   lastActivity={new Date()}
 *   showLabel={true}
 * />
 * ```
 */

import React from 'react';

interface PresenceBadgeProps {
  isEditing?: boolean;
  lastActivity?: Date;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Get presence status based on activity
 */
const getPresenceStatus = (
  isEditing: boolean,
  lastActivity?: Date
): { label: string; color: string; animate: boolean } => {
  if (isEditing) {
    return { label: 'Editing', color: '#3B82F6', animate: true }; // Blue
  }

  if (!lastActivity) {
    return { label: 'Offline', color: '#9CA3AF', animate: false }; // Gray
  }

  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - lastActivity.getTime()) / 1000 / 60);

  if (minutesAgo < 2) {
    return { label: 'Active', color: '#10B981', animate: true }; // Green
  } else if (minutesAgo < 5) {
    return { label: 'Idle', color: '#F59E0B', animate: false }; // Yellow
  } else {
    return { label: 'Away', color: '#6B7280', animate: false }; // Gray
  }
};

/**
 * Get badge size dimensions
 */
const getSizeDimensions = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'w-2 h-2';
    case 'md':
      return 'w-3 h-3';
    case 'lg':
      return 'w-4 h-4';
    default:
      return 'w-3 h-3';
  }
};

/**
 * Format last activity time
 */
const formatLastActivity = (lastActivity?: Date): string => {
  if (!lastActivity) return 'Never';

  const now = new Date();
  const diff = now.getTime() - lastActivity.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return lastActivity.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * PresenceBadge Component
 */
const PresenceBadge: React.FC<PresenceBadgeProps> = ({
  isEditing = false,
  lastActivity,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const status = getPresenceStatus(isEditing, lastActivity);
  const dimensions = getSizeDimensions(size);

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-label={`${status.label} - Active ${formatLastActivity(lastActivity)}`}
    >
      {/* Status Dot */}
      <div
        className={`rounded-full ${dimensions} ${status.animate ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: status.color }}
        aria-hidden="true"
        title={`${status.label} - Last active ${formatLastActivity(lastActivity)}`}
      />

      {/* Status Label (Optional) */}
      {showLabel && (
        <span
          className="text-sm font-medium"
          style={{ color: status.color }}
        >
          {status.label}
        </span>
      )}
    </div>
  );
};

export default PresenceBadge;
