/**
 * @fileoverview Separator Component
 * @description Simple horizontal or vertical separator line
 * @version 1.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-07
 * @lastModified 2025-10-07
 */

import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ 
  orientation = 'horizontal', 
  className = '' 
}) => {
  const baseClasses = orientation === 'horizontal'
    ? 'w-full h-px bg-gray-200'
    : 'h-full w-px bg-gray-200';

  return <div className={`${baseClasses} ${className}`} role="separator" aria-orientation={orientation} />;
};
