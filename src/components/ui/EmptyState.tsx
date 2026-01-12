import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Inbox, Search, AlertCircle, FileQuestion, Plus } from 'lucide-react';

type EmptyStateVariant = 'default' | 'search' | 'error' | 'no-permission';

interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Primary action button variant */
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  /** Primary action icon */
  actionIcon?: React.ReactNode;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Custom illustration image URL */
  illustration?: string;
  /** Additional class name */
  className?: string;
  /** Preset variant for common empty states */
  variant?: EmptyStateVariant;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const variantConfig: Record<EmptyStateVariant, { icon: React.ReactNode; iconBg: string }> = {
  default: {
    icon: <Inbox className="w-8 h-8" />,
    iconBg: 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
  },
  search: {
    icon: <Search className="w-8 h-8" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400',
  },
  error: {
    icon: <AlertCircle className="w-8 h-8" />,
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
  },
  'no-permission': {
    icon: <FileQuestion className="w-8 h-8" />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400',
  },
};

const sizeConfig = {
  sm: {
    container: 'min-h-48 py-6',
    iconSize: 'w-12 h-12',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'min-h-72 py-10',
    iconSize: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-base',
  },
  lg: {
    container: 'min-h-96 py-12',
    iconSize: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  className,
  variant = 'default',
  size = 'md',
}) => {
  const variantStyles = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        sizeStyles.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className={cn('mb-6 opacity-80', size === 'sm' ? 'w-32 h-32' : size === 'md' ? 'w-40 h-40' : 'w-48 h-48')}
          aria-hidden="true"
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center mb-4',
            sizeStyles.iconSize,
            icon ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' : variantStyles.iconBg
          )}
          aria-hidden="true"
        >
          {icon || variantStyles.icon}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          sizeStyles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-400 max-w-md mb-6',
            sizeStyles.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <Button
              variant={actionVariant}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={onAction}
              icon={actionIcon || (variant === 'default' ? <Plus className="w-4 h-4" /> : undefined)}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Preset empty states for common scenarios
 */
export const NoResultsState: React.FC<{
  searchQuery?: string;
  onClear?: () => void;
}> = ({ searchQuery, onClear }) => (
  <EmptyState
    variant="search"
    title={searchQuery ? `No results for "${searchQuery}"` : 'No results found'}
    description="Try adjusting your search or filters to find what you're looking for."
    actionLabel={onClear ? 'Clear search' : undefined}
    onAction={onClear}
    actionVariant="outline"
    size="md"
  />
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={message || 'We encountered an error loading this data. Please try again.'}
    actionLabel={onRetry ? 'Try again' : undefined}
    onAction={onRetry}
    actionVariant="primary"
    size="md"
  />
);

export const NoPermissionState: React.FC<{
  resource?: string;
}> = ({ resource }) => (
  <EmptyState
    variant="no-permission"
    title="Access restricted"
    description={`You don't have permission to view ${resource || 'this content'}. Contact your administrator for access.`}
    size="md"
  />
);

export default EmptyState;
