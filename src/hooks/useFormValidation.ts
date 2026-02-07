import { useState, useCallback } from 'react';
import type { z } from 'zod';

interface UseFormValidationOptions<T> {
  schema: z.ZodType<T>;
  onSubmit: (data: T) => void | Promise<void>;
}

interface UseFormValidationReturn<_T> {
  errors: Partial<Record<string, string>>;
  touched: Record<string, boolean>;
  isValid: boolean;
  validate: (data: unknown) => boolean;
  validateField: (field: string, data: unknown) => string | undefined;
  handleBlur: (field: string, data: unknown) => void;
  handleSubmit: (e: React.FormEvent, data: unknown) => Promise<void>;
  clearErrors: () => void;
  setFieldError: (field: string, message: string) => void;
}

export function useFormValidation<T>({
  schema,
  onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const extractErrors = useCallback(
    (data: unknown): Partial<Record<string, string>> => {
      const result = schema.safeParse(data);
      if (result.success) return {};

      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return fieldErrors;
    },
    [schema]
  );

  const validate = useCallback(
    (data: unknown): boolean => {
      const newErrors = extractErrors(data);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [extractErrors]
  );

  const validateField = useCallback(
    (field: string, data: unknown): string | undefined => {
      const allErrors = extractErrors(data);
      const fieldError = allErrors[field];
      setErrors((prev) => {
        const next = { ...prev };
        if (fieldError) {
          next[field] = fieldError;
        } else {
          delete next[field];
        }
        return next;
      });
      return fieldError;
    },
    [extractErrors]
  );

  const handleBlur = useCallback(
    (field: string, data: unknown) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, data);
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent, data: unknown) => {
      e.preventDefault();

      // Mark all fields as touched
      const result = schema.safeParse(data);
      if (!result.success) {
        const allFields: Record<string, boolean> = {};
        for (const issue of result.error.issues) {
          allFields[issue.path.join('.')] = true;
        }
        setTouched((prev) => ({ ...prev, ...allFields }));
      }

      if (validate(data)) {
        await onSubmit(result.data as T);
      }
    },
    [schema, validate, onSubmit]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    touched,
    isValid,
    validate,
    validateField,
    handleBlur,
    handleSubmit,
    clearErrors,
    setFieldError,
  };
}
