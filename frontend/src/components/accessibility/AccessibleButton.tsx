import React, { forwardRef, useCallback } from 'react';
import { Button } from '../ui/Button';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
  ariaCurrent?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Accessible Button Component
 * Provides full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    ariaCurrent,
    onKeyDown,
    onClick,
    className = '',
    ...props
  }, ref) => {
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space key activation
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (onClick && !disabled && !loading) {
          onClick(event as any);
        }
      }
      
      // Call custom onKeyDown handler
      if (onKeyDown) {
        onKeyDown(event);
      }
    }, [onClick, onKeyDown, disabled, loading]);

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }
      
      if (onClick) {
        onClick(event);
      }
    }, [onClick, disabled, loading]);

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`accessible-button ${className}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        aria-current={ariaCurrent}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {loading && (
          <span className="sr-only" aria-live="polite">
            Loading, please wait
          </span>
        )}
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;