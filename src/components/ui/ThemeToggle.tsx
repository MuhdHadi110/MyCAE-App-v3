import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean;
  /** Component size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Show all three options (light, dark, system) or just toggle */
  showSystemOption?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  size = 'md',
  className,
  showSystemOption = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Simple toggle button
  if (!showSystemOption) {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'rounded-lg transition-colors',
          'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
          sizeClasses[size],
          className
        )}
        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="flex items-center gap-2">
          {resolvedTheme === 'light' ? (
            <Moon className={iconSizes[size]} />
          ) : (
            <Sun className={iconSizes[size]} />
          )}
          {showLabel && (
            <span className="text-sm font-medium">
              {resolvedTheme === 'light' ? 'Dark' : 'Light'}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Three-option selector
  const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className={iconSizes[size]} />, label: 'Light' },
    { value: 'dark', icon: <Moon className={iconSizes[size]} />, label: 'Dark' },
    { value: 'system', icon: <Monitor className={iconSizes[size]} />, label: 'System' },
  ];

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md transition-all',
            sizeClasses[size],
            theme === option.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
          title={`${option.label} mode`}
          aria-label={`${option.label} mode`}
          aria-pressed={theme === option.value}
        >
          {option.icon}
          {showLabel && <span className="text-sm font-medium">{option.label}</span>}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
