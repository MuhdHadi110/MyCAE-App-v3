import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { flattenErrors } from '../lib/validation';

interface UseFormValidationOptions<T extends z.ZodSchema> {
  /** The Zod schema to validate against */
  schema: T;
  /** Initial form values */
  initialValues: z.infer<T>;
  /** Callback when form is submitted successfully */
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  /** Validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Validate on change (default: false) */
  validateOnChange?: boolean;
}

interface FieldState {
  touched: boolean;
  dirty: boolean;
}

export function useFormValidation<T extends z.ZodSchema>({
  schema,
  initialValues,
  onSubmit,
  validateOnBlur = true,
  validateOnChange = false,
}: UseFormValidationOptions<T>) {
  type FormData = z.infer<T>;

  const [values, setValues] = useState<FormData>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const result = schema.safeParse(values);

    if (result.success) {
      setErrors({});
      return true;
    }

    setErrors(flattenErrors(result.error));
    return false;
  }, [schema, values]);

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: unknown): string | undefined => {
      // Create a partial schema for just this field
      try {
        const partialData = { ...values, [name]: value };
        const result = schema.safeParse(partialData);

        if (result.success) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
          return undefined;
        }

        const fieldError = result.error.errors.find(
          (err) => err.path.join('.') === name
        );

        if (fieldError) {
          setErrors((prev) => ({ ...prev, [name]: fieldError.message }));
          return fieldError.message;
        }

        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return undefined;
      } catch {
        return undefined;
      }
    },
    [schema, values]
  );

  // Set a single field value
  const setValue = useCallback(
    (name: keyof FormData, value: FormData[keyof FormData]) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setFieldStates((prev) => ({
        ...prev,
        [name as string]: { ...prev[name as string], dirty: true },
      }));

      if (validateOnChange || hasSubmitted) {
        validateField(name as string, value);
      }
    },
    [validateOnChange, hasSubmitted, validateField]
  );

  // Set multiple field values at once
  const setFieldValues = useCallback((newValues: Partial<FormData>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
    const newFieldStates: Record<string, FieldState> = {};
    for (const key of Object.keys(newValues)) {
      newFieldStates[key] = { touched: true, dirty: true };
    }
    setFieldStates((prev) => ({ ...prev, ...newFieldStates }));
  }, []);

  // Handle field blur
  const handleBlur = useCallback(
    (name: string) => {
      setFieldStates((prev) => ({
        ...prev,
        [name]: { ...prev[name], touched: true },
      }));

      if (validateOnBlur) {
        validateField(name, values[name as keyof FormData]);
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setHasSubmitted(true);
      setSubmitError(null);

      // Mark all fields as touched
      const allTouched: Record<string, FieldState> = {};
      for (const key of Object.keys(values)) {
        allTouched[key] = { touched: true, dirty: fieldStates[key]?.dirty ?? false };
      }
      setFieldStates(allTouched);

      const isValid = validateForm();

      if (!isValid) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, fieldStates, validateForm, onSubmit]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setFieldStates({});
    setHasSubmitted(false);
    setSubmitError(null);
  }, [initialValues]);

  // Reset to new values
  const resetTo = useCallback((newValues: FormData) => {
    setValues(newValues);
    setErrors({});
    setFieldStates({});
    setHasSubmitted(false);
    setSubmitError(null);
  }, []);

  // Get props for a form field
  const getFieldProps = useCallback(
    (name: keyof FormData) => ({
      name: name as string,
      value: values[name] as string | number | readonly string[] | undefined,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const newValue =
          e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        setValue(name, newValue as FormData[keyof FormData]);
      },
      onBlur: () => handleBlur(name as string),
    }),
    [values, setValue, handleBlur]
  );

  // Computed state
  const isDirty = useMemo(
    () => Object.values(fieldStates).some((s) => s.dirty),
    [fieldStates]
  );

  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  // Get error for a specific field (only show if touched or submitted)
  const getError = useCallback(
    (name: string): string | undefined => {
      const state = fieldStates[name];
      if (!hasSubmitted && !state?.touched) {
        return undefined;
      }
      return errors[name];
    },
    [errors, fieldStates, hasSubmitted]
  );

  return {
    // Form values
    values,
    setValue,
    setFieldValues,

    // Validation
    errors,
    getError,
    validateForm,
    validateField,

    // Field states
    fieldStates,
    handleBlur,

    // Form state
    isSubmitting,
    isDirty,
    isValid,
    hasErrors,
    hasSubmitted,
    submitError,

    // Form actions
    handleSubmit,
    reset,
    resetTo,

    // Helper to get field props
    getFieldProps,
  };
}

export default useFormValidation;
