import React from 'react';
import { cn } from '../../lib/utils';
import { Check, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  hint?: string;
  onValidate?: (value: string) => string | undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, icon, fullWidth, type = 'text', hint, id, onValidate, ...props }, ref) => {
    const inputId = id || `input-${props.name || Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const successId = success ? `${inputId}-success` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedBy = [errorId, successId, hintId].filter(Boolean).join(' ') || undefined;

    const isValid = !error && success;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px]',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all',
              'dark:focus:ring-offset-gray-900',
              'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400',
              icon && 'pl-10',
              !error && !success && 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400',
              error && 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
              isValid && 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400',
              (error || isValid) && 'pr-10',
              className
            )}
            {...props}
          />
          {(error || isValid) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error && <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" aria-hidden="true" />}
              {isValid && <Check className="w-5 h-5 text-green-500 dark:text-green-400" aria-hidden="true" />}
            </div>
          )}
        </div>
        {hint && !error && !success && (
          <span id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </span>
        )}
        {error && (
          <span
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {error}
          </span>
        )}
        {success && (
          <span
            id={successId}
            className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <Check className="w-3 h-3" aria-hidden="true" />
            {success}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  fullWidth?: boolean;
  hint?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, success, fullWidth, hint, id, maxLength, showCharCount, value, ...props }, ref) => {
    const textareaId = id || `textarea-${props.name || Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const successId = success ? `${textareaId}-success` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const describedBy = [errorId, successId, hintId].filter(Boolean).join(' ') || undefined;
    const charCount = typeof value === 'string' ? value.length : 0;
    const isValid = !error && success;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor={textareaId}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-lg border px-3 py-2.5 text-sm',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all',
            'dark:focus:ring-offset-gray-900',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400',
            !error && !success && 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400',
            error && 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
            isValid && 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center">
          <div>
            {hint && !error && !success && (
              <span id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
                {hint}
              </span>
            )}
            {error && (
              <span
                id={errorId}
                className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {error}
              </span>
            )}
            {success && (
              <span
                id={successId}
                className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
              >
                <Check className="w-3 h-3" aria-hidden="true" />
                {success}
              </span>
            )}
          </div>
          {showCharCount && maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount >= maxLength
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
