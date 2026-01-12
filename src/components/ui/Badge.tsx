import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isClickable?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', size = 'md', isClickable = false, children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        {
          // Variants
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': variant === 'default',
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',

          // Sizes (clickable badges maintain 44px minimum)
          'px-2.5 py-2 text-xs': size === 'sm' && isClickable,
          'px-3 py-2 text-sm': size === 'md' && isClickable,
          'px-4 py-2.5 text-base': size === 'lg' && isClickable,

          // Non-clickable sizes (standard display sizes)
          'px-2 py-0.5 text-xs': size === 'sm' && !isClickable,
          'px-2.5 py-1 text-sm': size === 'md' && !isClickable,
          'px-3 py-1.5 text-base': size === 'lg' && !isClickable,

          // Interactive styles
          'cursor-pointer hover:shadow-md transition-shadow': isClickable,
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
