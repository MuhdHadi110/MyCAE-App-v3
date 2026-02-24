import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={`/assets/avatars/${src}.svg`}
        alt={alt || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover bg-gray-100 ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-primary-100 flex items-center justify-center ${className}`}>
      <User className="w-1/2 h-1/2 text-primary-600" />
    </div>
  );
};
