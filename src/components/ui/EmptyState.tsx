import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 px-4 py-12">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          {icon}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>

      <p className="text-gray-600 text-center mb-8 max-w-md">{description}</p>

      {actionLabel && onAction && (
        <Button variant={actionVariant} size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
