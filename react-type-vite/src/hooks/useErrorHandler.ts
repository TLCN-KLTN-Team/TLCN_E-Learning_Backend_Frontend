import { AppError } from "@/errors/appError";
import { useState, useCallback } from "react";

interface UseErrorHandlerReturn {
  error: string | null;
  errors: Record<string, string> | null;
  setError: (error: string | null) => void;
  handleError: (error: unknown) => void;
  clearErrors: () => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string> | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof AppError) {
      setError(error.getDisplayMessage());
      setErrors(error.errors || null);
    } else if (error instanceof Error) {
      setError(error.message);
      setErrors(null);
    } else {
      setError("An unexpected error occurred");
      setErrors(null);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
    setErrors(null);
  }, []);

  return {
    error,
    errors,
    setError,
    handleError,
    clearErrors,
  };
};
