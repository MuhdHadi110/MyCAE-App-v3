import React from 'react';
import { ALL_AVATARS, getAvatarPath } from '../../constants/avatars';
import { cn } from '../../lib/utils';

interface AvatarPickerProps {
  selectedAvatar?: string;
  onSelect: (avatarId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar,
  onSelect,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className="avatar-picker">
      {/* Scrollable Avatar Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {ALL_AVATARS.map(avatar => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              className={cn(
                'rounded-full border-4 transition-all hover:scale-110 flex-shrink-0',
                selectedAvatar === avatar.id
                  ? 'border-blue-500 ring-2 ring-blue-300'
                  : 'border-gray-200 hover:border-gray-400'
              )}
            >
              <img
                src={getAvatarPath(avatar.id)}
                alt={avatar.alt}
                className={cn('rounded-full', sizeClasses[size])}
              />
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Scroll right to see more avatars →</p>
    </div>
  );
};
