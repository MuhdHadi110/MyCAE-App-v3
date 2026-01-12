import React from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    headerBg: 'from-red-50 to-red-100',
    confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    headerBg: 'from-yellow-50 to-yellow-100',
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    headerBg: 'from-blue-50 to-blue-100',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  const variantConfig = variantStyles[variant];
  const Icon = variantConfig.icon;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
    if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r', variantConfig.headerBg)}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', variantConfig.iconBg)}>
              <Icon className={cn('w-6 h-6', variantConfig.iconColor)} />
            </div>
            <h2 id="confirm-dialog-title" className="text-xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="confirm-dialog-description" className="text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2.5 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2',
              variantConfig.confirmButton,
              isLoading && 'cursor-wait'
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
