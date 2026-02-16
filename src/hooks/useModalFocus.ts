import { useEffect, useRef } from 'react';

/**
 * Hook to manage focus in modals
 * - Sets focus to first input when modal opens
 * - Returns focus to trigger element when modal closes
 *
 * Usage:
 * const { firstInputRef, closeButtonRef } = useModalFocus(isOpen);
 *
 * Then use refs on first input and trigger button
 */
export const useModalFocus = (isOpen: boolean) => {
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 0);
    } else {
      // Return focus to close button when modal closes
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  return { firstInputRef, closeButtonRef };
};
