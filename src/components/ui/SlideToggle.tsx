import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlideToggleProps {
  /** Current state - true for dark mode, false for light mode */
  isDark: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

export const SlideToggle: React.FC<SlideToggleProps> = ({
  isDark,
  onToggle,
  size = 'sm',
  className,
}) => {
  const sizeClasses = {
    sm: {
      container: 'w-12 h-6',
      circle: 'w-5 h-5',
      icon: 'w-3 h-3',
      translate: 'translate-x-6',
    },
    md: {
      container: 'w-16 h-8',
      circle: 'w-7 h-7',
      icon: 'w-4 h-4',
      translate: 'translate-x-8',
    },
  };

  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      className={cn(
        'relative rounded-full transition-colors duration-250 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
        sizeClasses[size].container,
        isDark ? 'bg-gray-700' : 'bg-gray-200',
        className
      )}
    >
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <Sun
          className={cn(
            sizeClasses[size].icon,
            'text-amber-500 transition-opacity duration-200',
            isDark ? 'opacity-30' : 'opacity-100'
          )}
        />
        <Moon
          className={cn(
            sizeClasses[size].icon,
            'text-indigo-400 transition-opacity duration-200',
            isDark ? 'opacity-100' : 'opacity-30'
          )}
        />
      </div>

      {/* Sliding circle */}
      <div
        className={cn(
          'absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm transition-transform duration-250 ease-in-out',
          sizeClasses[size].circle,
          isDark ? sizeClasses[size].translate : 'translate-x-0'
        )}
      />
    </button>
  );
};

export default SlideToggle;
