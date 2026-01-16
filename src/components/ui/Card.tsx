import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'stat' | 'clickable';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white',
          {
            // Base styles
            'rounded-lg shadow-sm': variant === 'default',
            'rounded-lg border border-gray-200': variant === 'bordered',
            'rounded-lg shadow-md': variant === 'elevated',
            'rounded-2xl shadow-sm border border-gray-100': variant === 'stat',
            'rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]': variant === 'clickable',

            // Active state for clickable cards
            'ring-2 ring-primary-500 ring-offset-2': active,

            // Padding
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4 md:p-6': padding === 'md',
            'p-6 md:p-8': padding === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-sm text-gray-500 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('mt-4 flex items-center gap-2', className)} {...props}>
    {children}
  </div>
);

// Stat Card variant for dashboard stats
export const StatCard: React.FC<{
  title: string;
  value: number | string;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'red';
  onClick?: () => void;
  active?: boolean;
}> = ({ title, value, color = 'gray', onClick, active }) => {
  const colorClasses = {
    gray: 'text-gray-900',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    red: 'text-red-600',
  };

  const ringColorClasses = {
    gray: 'ring-gray-500',
    blue: 'ring-blue-500',
    green: 'ring-green-500',
    yellow: 'ring-yellow-500',
    purple: 'ring-purple-500',
    indigo: 'ring-indigo-500',
    red: 'ring-red-500',
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
          active ? `ring-2 ${ringColorClasses[color]} ring-offset-2` : ''
        }`}
      >
        <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
        <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  );
};

// Page Header Card
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        {icon && <div className="hidden md:flex text-primary-600">{icon}</div>}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </div>
);
