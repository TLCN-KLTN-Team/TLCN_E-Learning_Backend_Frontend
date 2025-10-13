import { toast } from "react-toastify";
import { AppError } from "./appError";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastType?: string;
  customMessage?: string;
  onError?: (error: AppError) => void;
  redirectOnAuth?: boolean;
}

export const handleApiError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError => {
  const {
    showToast = true,
    toastType,
    customMessage,
    onError,
    redirectOnAuth = true,
  } = options;

  let appError: AppError;

  // Convert to AppError if needed
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError({
      code: "SYS_9999",
      message:
        error.message ||
        "Đã có lỗi không xác định xảy ra. Kiểm tra thao tác của bạn.",
    });
  } else {
    appError = new AppError({
      code: "SYS_9999",
      message: "Lỗi không xác định",
    });
  }

  // Handle special cases
  if (appError.isTokenExpired() && redirectOnAuth) {
    localStorage.clear();
    window.location.href = "/login";
    return appError;
  }

  // Show toast notification
  if (showToast) {
    const message = customMessage || appError.getDisplayMessage();
    const type = toastType || appError.getErrorType();

    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      case "info":
        toast.info(message);
        break;
      default:
        toast.error(message);
    }
  }

  // Custom error callback
  if (onError) {
    onError(appError);
  }

  return appError;
};
