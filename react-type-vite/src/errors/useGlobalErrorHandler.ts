import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalErrorHandler } from "./GlobalErrorHandler";
import { AppError } from "./AppError";
import { useAuth } from "@/context/auth-context/useAuth";

/**
 * Hook để setup Global Error Handler với callbacks
 */
export const useGlobalErrorHandler = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Setup callbacks khi component mount
  const setupErrorHandler = useCallback(() => {
    GlobalErrorHandler.setCallbacks({
      onLogout: () => {
        console.log("🚪 Executing logout callback");
        logout();
      },
      onRedirectToLogin: () => {
        console.log("🔄 Executing redirect to login callback");
        // Delay để user đọc toast message
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      },
    });
  }, [logout, navigate]);

  // Wrapper function để handle errors trong components
  const handleError = useCallback((error: unknown): AppError => {
    return GlobalErrorHandler.handle(error);
  }, []);

  // Utility functions
  const showSuccess = useCallback((message: string) => {
    GlobalErrorHandler.showSuccess(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    GlobalErrorHandler.showWarning(message);
  }, []);

  const showError = useCallback((message: string) => {
    GlobalErrorHandler.showError(message);
  }, []);

  const clearAllToasts = useCallback(() => {
    GlobalErrorHandler.clearAll();
  }, []);

  return {
    setupErrorHandler,
    handleError,
    showSuccess,
    showWarning,
    showError,
    clearAllToasts,
  };
};

/**
 * Hook để tự động handle async operations với error handling
 */
export const useAsyncOperation = () => {
  const { handleError } = useGlobalErrorHandler();

  const executeAsync = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: AppError) => void;
        showSuccessToast?: boolean;
        successMessage?: string;
      }
    ): Promise<T | null> => {
      try {
        const result = await operation();

        // Show success toast if requested
        if (options?.showSuccessToast && options?.successMessage) {
          GlobalErrorHandler.showSuccess(options.successMessage);
        }

        // Call success callback
        options?.onSuccess?.(result);

        return result;
      } catch (error) {
        // Handle error automatically
        const appError = handleError(error);

        // Call error callback if provided
        options?.onError?.(appError);

        return null;
      }
    },
    [handleError]
  );

  return { executeAsync };
};

/**
 * Hook để handle form submission với validation
 */
export const useFormSubmission = () => {
  const { executeAsync } = useAsyncOperation();

  const submitForm = useCallback(
    async <T>(
      submitFunction: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onValidationError?: (errors: Record<string, string>) => void;
        successMessage?: string;
        resetForm?: () => void;
      }
    ): Promise<boolean> => {
      const result = await executeAsync(submitFunction, {
        onSuccess: (result) => {
          options?.onSuccess?.(result);
          options?.resetForm?.();
        },
        onError: (error) => {
          // Handle validation errors specifically
          if (error.isValidationError() && error.getFieldErrors()) {
            options?.onValidationError?.(error.getFieldErrors());
          }
        },
        showSuccessToast: !!options?.successMessage,
        successMessage: options?.successMessage,
      });

      return result !== null;
    },
    [executeAsync]
  );

  return { submitForm };
};
