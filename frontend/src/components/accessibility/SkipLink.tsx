import React, { useEffect, useRef } from 'react';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip Link Component
 * Provides keyboard navigation shortcut to main content
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children,
  className = '',
}) => {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey) {
        // Focus the skip link when Tab is pressed
        if (skipLinkRef.current) {
          skipLinkRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      ref={skipLinkRef}
      href={`#${targetId}`}
      onClick={handleClick}
      className={`skip-link ${className}`}
      tabIndex={1}
    >
      {children}
    </a>
  );
};

export default SkipLink;