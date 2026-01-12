import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    fullWidth,
    icon,
    iconPosition = 'left',
    loading = false,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
          'min-h-[44px]', // Touch target

          // Disabled states
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',

          // Hover/Active effects (only when not disabled)
          !isDisabled && 'hover:scale-[1.02] active:scale-[0.98]',

          // Focus styles - high contrast for accessibility
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',

          // Variant styles
          {
            // Primary
            'bg-primary-600 text-white shadow-sm': variant === 'primary',
            'hover:bg-primary-700 hover:shadow-md': variant === 'primary' && !isDisabled,
            'focus-visible:ring-primary-500': variant === 'primary',

            // Secondary
            'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100': variant === 'secondary',
            'hover:bg-gray-200 dark:hover:bg-gray-600': variant === 'secondary' && !isDisabled,
            'focus-visible:ring-gray-500': variant === 'secondary',

            // Outline
            'border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 bg-transparent': variant === 'outline',
            'hover:bg-primary-50 dark:hover:bg-primary-900/20': variant === 'outline' && !isDisabled,
            'focus-visible:ring-primary-500': variant === 'outline',

            // Ghost
            'text-gray-700 dark:text-gray-300 bg-transparent': variant === 'ghost',
            'hover:bg-gray-100 dark:hover:bg-gray-800': variant === 'ghost' && !isDisabled,
            'focus-visible:ring-gray-500': variant === 'ghost',

            // Danger
            'bg-red-600 text-white shadow-sm': variant === 'danger',
            'hover:bg-red-700 hover:shadow-md': variant === 'danger' && !isDisabled,
            'focus-visible:ring-red-500': variant === 'danger',

            // Success
            'bg-green-600 text-white shadow-sm': variant === 'success',
            'hover:bg-green-700 hover:shadow-md': variant === 'success' && !isDisabled,
            'focus-visible:ring-green-500': variant === 'success',

            // Sizes (all maintain 44px minimum for touch targets)
            'px-2 py-2 text-xs': size === 'xs',
            'px-3 py-2 text-sm': size === 'sm',
            'px-4 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg min-h-[52px]': size === 'lg',
            'px-8 py-4 text-xl min-h-[60px]': size === 'xl',

            // Full width
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0" aria-hidden="true">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0" aria-hidden="true">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - A button that only contains an icon
 * Ensures proper touch target size and accessibility
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconPosition'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', icon, ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-8 h-8',
      sm: 'w-9 h-9',
      md: 'w-11 h-11',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    const iconSizes = {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(
          'p-0',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className={iconSizes[size]} aria-hidden="true">
          {icon}
        </span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
