/**
 * @fileoverview CollaborationNotifications Component - Toast Notification System
 * @module Components/Collaboration/CollaborationNotifications
 * @description Toast notification system for real-time collaboration events.
 * Displays dismissible toast messages for user activity, comments, mentions, and connection status.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Features:
 * - Toast notification queue with auto-dismiss
 * - Multiple notification types (info, success, warning, error)
 * - Auto-close timer (5 seconds for most, manual for important)
 * - Manual dismiss button
 * - Notification icons based on type
 * - Smooth enter/exit animations
 * - Position: Fixed top-right corner
 * - Stacked notifications (max 5 visible)
 * - Accessibility compliant (ARIA live regions)
 * - Optional sound effects
 * 
 * Notification Types:
 * - user_joined: Info, auto-close (User joined collaboration)
 * - user_left: Info, auto-close (User left collaboration)
 * - comment_added: Info, auto-close (New comment added)
 * - mention: Warning, manual dismiss (@mention received)
 * - comment_resolved: Success, auto-close (Comment resolved)
 * - conflict: Error, manual dismiss (Edit conflict detected)
 * - connection_status: Info/Error (Connection status change)
 * 
 * @example
 * ```tsx
 * import CollaborationNotifications from '@/components/policy/CollaborationNotifications';
 * import { CollaborationProvider } from '@/contexts/CollaborationContext';
 * 
 * <CollaborationProvider>
 *   <CollaborationNotifications enableSounds={true} />
 *   <YourApp />
 * </CollaborationProvider>
 * ```
 */

import React, { useEffect, useState } from 'react';
import { useCollaboration, CollaborationNotification, NotificationType } from '../../contexts/CollaborationContext';

interface CollaborationNotificationsProps {
  enableSounds?: boolean;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Get notification style based on type
 */
const getNotificationStyle = (
  type: NotificationType
): { icon: string; bgColor: string; borderColor: string; iconColor: string } => {
  switch (type) {
    case 'user_joined':
      return {
        icon: '👋',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
      };
    case 'user_left':
      return {
        icon: '👋',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600',
      };
    case 'comment_added':
      return {
        icon: '💬',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        iconColor: 'text-indigo-600',
      };
    case 'mention':
      return {
        icon: '📢',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        iconColor: 'text-yellow-700',
      };
    case 'comment_resolved':
      return {
        icon: '✅',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
      };
    case 'conflict':
      return {
        icon: '⚠️',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        iconColor: 'text-red-700',
      };
    case 'connection_status':
      return {
        icon: '🔌',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-600',
      };
    default:
      return {
        icon: 'ℹ️',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600',
      };
  }
};

/**
 * Get position classes based on position prop
 */
const getPositionClasses = (position: string): string => {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4';
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    default:
      return 'top-4 right-4';
  }
};

/**
 * Play notification sound (optional)
 */
const playNotificationSound = (type: NotificationType, enableSounds: boolean) => {
  if (!enableSounds) return;

  try {
    // Create audio context for beep sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different notification types
    const frequencies: Record<NotificationType, number> = {
      user_joined: 440, // A4
      user_left: 330, // E4
      comment_added: 523, // C5
      mention: 659, // E5 (higher pitch for mentions)
      comment_resolved: 587, // D5
      conflict: 293, // D4 (lower for warnings)
      connection_status: 392, // G4
    };

    oscillator.frequency.value = frequencies[type] || 440;
    oscillator.type = 'sine';

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

/**
 * Individual Toast Notification Component
 */
interface ToastNotificationProps {
  notification: CollaborationNotification;
  onDismiss: (id: string) => void;
  enableSounds: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onDismiss, enableSounds }) => {
  const [isExiting, setIsExiting] = useState(false);
  const style = getNotificationStyle(notification.type);

  // Auto-close timer
  useEffect(() => {
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [notification.autoClose, notification.id]);

  // Play sound on mount
  useEffect(() => {
    playNotificationSound(notification.type, enableSounds);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match animation duration
  };

  return (
    <div
      className={`
        ${style.bgColor} ${style.borderColor}
        border-l-4 rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-md
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live={notification.autoClose ? 'polite' : 'assertive'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 text-2xl ${style.iconColor}`} aria-hidden="true">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <p className="text-sm font-medium text-gray-900 mb-1">
            {notification.message}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-gray-500">
            {new Date(notification.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * CollaborationNotifications Component
 * Main notification container
 */
const CollaborationNotifications: React.FC<CollaborationNotificationsProps> = ({
  enableSounds = false,
  maxVisible = 5,
  position = 'top-right',
}) => {
  const { notifications, dismissNotification } = useCollaboration();

  // Limit visible notifications
  const visibleNotifications = notifications.slice(0, maxVisible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const positionClasses = getPositionClasses(position);

  return (
    <div
      className={`fixed ${positionClasses} z-[9999] pointer-events-none`}
      aria-label="Collaboration notifications"
      role="region"
    >
      <div className="pointer-events-auto space-y-0">
        {visibleNotifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
            enableSounds={enableSounds}
          />
        ))}
      </div>

      {/* Overflow Indicator */}
      {notifications.length > maxVisible && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500 bg-white rounded-full px-3 py-1 shadow-sm">
            +{notifications.length - maxVisible} more
          </span>
        </div>
      )}
    </div>
  );
};

export default CollaborationNotifications;
