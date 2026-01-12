import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

// Pre-built skeleton patterns for common use cases

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
      role="status"
      aria-label="Loading table data"
    >
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" animation="none" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface CardSkeletonProps {
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showImage = false,
  lines = 3,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      {showImage && <Skeleton className="w-full h-32 mb-4" />}
      <Skeleton className="h-6 w-3/4 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 mb-2', i === lines - 1 ? 'w-1/2' : 'w-full')}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const StatsCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
      role="status"
      aria-label="Loading stats"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showAvatar = true,
  className,
}) => {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {showAvatar && <Skeleton variant="circular" className="w-10 h-10" />}
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const FormSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading form"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Page skeleton - full page loading state
 */
export const PageSkeleton: React.FC<{
  hasHeader?: boolean;
  hasStats?: boolean;
  statsCount?: number;
  hasTable?: boolean;
  tableRows?: number;
  tableColumns?: number;
  className?: string;
}> = ({
  hasHeader = true,
  hasStats = true,
  statsCount = 4,
  hasTable = true,
  tableRows = 8,
  tableColumns = 6,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {hasHeader && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      )}

      {hasStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: statsCount }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {hasTable && <TableSkeleton rows={tableRows} columns={tableColumns} />}
    </div>
  );
};

/**
 * Avatar skeleton - circular placeholder
 */
export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return <Skeleton variant="circular" className={cn(sizeClasses[size], className)} />;
};

export default Skeleton;
