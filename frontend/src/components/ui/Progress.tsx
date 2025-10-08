/**
 * @fileoverview Progress Component
 * @module Progress
 * @category UI Components
 * @version 1.0.0
 */

import React from 'react';

export interface ProgressProps {
  value: number;
  className?: string;
  max?: number;
}

/**
 * Progress bar component
 */
export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  className = '', 
  max = 100 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default Progress;
