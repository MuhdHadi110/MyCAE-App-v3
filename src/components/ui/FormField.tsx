import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
  hint?: string;
  className?: string;
}

/**
 * Accessible form field wrapper that handles:
 * - Label association via htmlFor
 * - Error announcements via aria-describedby
 * - aria-invalid for validation states
 * - Required field indicators
 * - Help text/hints
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required = false,
  children,
  hint,
  className = '',
}) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const hintId = hint ? `${inputId}-hint` : undefined;

  // Clone child element to add accessibility attributes
  const enhancedChild = React.cloneElement(children, {
    id: inputId,
    name: name,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [error ? errorId : null, hintId].filter(Boolean).join(' ') || undefined,
    'aria-required': required ? 'true' : undefined,
    className: `${children.props.className || ''} ${error ? 'border-red-500' : ''}`.trim(),
  });

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>

      {enhancedChild}

      {hint && !error && (
        <p id={hintId} className="text-gray-500 text-xs mt-1">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-red-500 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
