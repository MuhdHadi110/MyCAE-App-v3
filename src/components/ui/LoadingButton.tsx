import React from 'react';
import { Button, ButtonProps } from './Button';
import { Loader2 } from 'lucide-react';

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading = false, loadingText, children, disabled, icon, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {...props}
      >
        {isLoading ? (loadingText || 'Loading...') : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
