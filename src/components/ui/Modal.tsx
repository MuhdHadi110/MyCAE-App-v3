import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type HeaderVariant = 'gradient' | 'white' | 'dark';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  isLoading?: boolean;
  /** Prevent closing when clicking backdrop */
  preventBackdropClose?: boolean;
  /** Show warning when trying to close with unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Custom class name for the modal container */
  className?: string;
  /** Header style variant */
  headerVariant?: HeaderVariant;
  /** Loading text to display */
  loadingText?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[95vw] h-[90vh]',
};

const headerVariantClasses: Record<HeaderVariant, string> = {
  gradient: 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700',
  white: 'bg-white dark:bg-gray-800',
  dark: 'bg-gray-900 text-white dark:bg-gray-950',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'lg',
  icon,
  footer,
  showCloseButton = true,
  isLoading = false,
  preventBackdropClose = false,
  hasUnsavedChanges = false,
  className,
  headerVariant = 'gradient',
  loadingText = 'Processing...',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const titleId = `modal-title-${React.useId()}`;
  const descriptionId = description ? `modal-description-${React.useId()}` : undefined;

  // Attempt to close - check for unsaved changes first
  const attemptClose = useCallback(() => {
    if (isLoading) return;

    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [isLoading, hasUnsavedChanges, onClose]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        attemptClose();
      }
    },
    [attemptClose]
  );

  // Focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal or first focusable element (only if no element currently has focus inside modal)
      setTimeout(() => {
        // Check if any input already has focus
        const activeElement = document.activeElement;
        const isInputFocused = modalRef.current?.contains(activeElement as Node) &&
          (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'SELECT' || activeElement?.tagName === 'TEXTAREA');

        // Only focus first input if nothing is currently focused
        if (!isInputFocused) {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'input, select, textarea, button'
          );
          const firstInput = Array.from(focusableElements || []).find(
            el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
          );
          if (firstInput) {
            firstInput.focus();
          } else {
            modalRef.current?.focus();
          }
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';

      // Return focus to previously focused element
      if (!isOpen && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, handleTabKey]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !preventBackdropClose) {
      attemptClose();
    }
  };

  // Reset warning when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowUnsavedWarning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDarkHeader = headerVariant === 'dark';

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in',
          'max-w-[95vw]',
          `md:${sizeClasses[size]}`,
          size === 'full' && 'h-[90vh]',
          className
        )}
      >
        {/* Unsaved Changes Warning */}
        {showUnsavedWarning && (
          <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Unsaved Changes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">You have unsaved changes that will be lost.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUnsavedWarning(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedWarning(false);
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700',
          headerVariantClasses[headerVariant]
        )}>
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isDarkHeader ? 'bg-white/10' : 'bg-primary-100 dark:bg-primary-900/30'
                )}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <div>
              <h2
                id={titleId}
                className={cn(
                  'text-lg md:text-xl font-bold',
                  isDarkHeader ? 'text-white' : 'text-gray-900 dark:text-white'
                )}
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descriptionId}
                  className={cn(
                    'text-sm',
                    isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          {showCloseButton && !isLoading && (
            <button
              onClick={attemptClose}
              className={cn(
                'p-2 md:p-3 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center',
                isDarkHeader
                  ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                  : 'hover:bg-primary-200 dark:hover:bg-gray-700'
              )}
              aria-label="Close dialog"
            >
              <X
                className={cn(
                  'w-5 h-5',
                  isDarkHeader ? '' : 'text-gray-600 dark:text-gray-400'
                )}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          {children}
          {isLoading && (
            <div className="absolute inset-0 bg-white/75 dark:bg-gray-800/75 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{loadingText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SimpleModal - A simplified version for basic use cases
 * Use this when you don't need the full feature set
 */
export interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      headerVariant="white"
    >
      <div className="p-6">{children}</div>
    </Modal>
  );
};

export default Modal;
