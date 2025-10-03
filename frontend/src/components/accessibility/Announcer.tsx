import React, { useEffect, useState } from 'react';

interface AnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

/**
 * Screen Reader Announcer Component
 * Provides announcements for screen readers
 */
export const Announcer: React.FC<AnnouncerProps> = ({
  message,
  priority = 'polite',
  className = '',
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear the announcement after a short delay
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!announcement) return null;

  return (
    <div
      className={`screen-reader-announcer ${className}`}
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      {announcement}
    </div>
  );
};

export default Announcer;