import { toast } from "react-toastify";
import { AppError } from "./AppError";
import { ErrorCode } from "./ErrorCode";

/**
 * Toast configuration cho các loại error khác nhau
 */
const TOAST_CONFIG = {
  error: {
    position: "top-right" as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light" as const,
  },
  warning: {
    position: "top-right" as const,
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light" as const,
  },
  success: {
    position: "top-right" as const,
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light" as const,
  },
};

/**
 * Callback functions for special error handling
 */
interface ErrorHandlerCallbacks {
  onLogout?: () => void;
  onRedirectToLogin?: () => void;
  onTokenRefresh?: () => Promise<void>;
}

/**
 * Global Error Handler - Tự động xử lý tất cả lỗi từ backend
 * Tương ứng với GlobalExceptionHandler ở backend
 */
export class GlobalErrorHandler {
  private static callbacks: ErrorHandlerCallbacks = {};

  /**
   * Đăng ký callbacks cho các trường hợp đặc biệt
   */
  public static setCallbacks(callbacks: ErrorHandlerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Xử lý error chính - entry point cho tất cả errors
   */
  public static handle(error: unknown): AppError {
    console.group("🚨 GlobalErrorHandler.handle");
    console.log("Raw error:", error);

    const appError = this.normalizeError(error);
    console.log("Normalized AppError:", appError.toJSON());

    // Thực hiện auto-handling
    this.autoHandle(appError);

    console.groupEnd();
    return appError;
  }

  /**
   * Normalize bất kỳ error nào thành AppError
   */
  private static normalizeError(error: unknown): AppError {
    // Đã là AppError
    if (error instanceof AppError) {
      return error;
    }

    // Axios error với response data
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return AppError.networkError();
    }

    // Fallback cho unknown errors
    return AppError.fromUnknown(error);
  }

  /**
   * Auto-handling dựa trên error code
   */
  private static autoHandle(appError: AppError): void {
    console.log(`🤖 Auto-handling error: ${appError.getErrorCode()}`);

    // 1. Hiển thị toast tự động
    this.showToast(appError);

    // 2. Xử lý logout nếu cần
    if (appError.requiresLogout()) {
      console.log("🚪 Auto-logout triggered");
      this.handleLogout();
      return; // Không redirect nếu logout
    }

    // 3. Xử lý redirect nếu cần
    if (appError.requiresLoginRedirect()) {
      console.log("🔄 Auto-redirect to login triggered");
      this.handleLoginRedirect();
    }
  }

  /**
   * Hiển thị toast dựa trên loại error
   */
  private static showToast(appError: AppError): void {
    const message = appError.getDisplayMessage();

    if (appError.isAuthError()) {
      toast.warning(message, TOAST_CONFIG.warning);
    } else if (appError.isValidationError()) {
      toast.error(message, TOAST_CONFIG.error);
    } else if (appError.isSystemError()) {
      toast.error(message, TOAST_CONFIG.error);
    } else {
      toast.error(message, TOAST_CONFIG.error);
    }

    console.log(`📱 Toast shown: ${message}`);
  }

  /**
   * Xử lý logout
   */
  private static handleLogout(): void {
    if (this.callbacks.onLogout) {
      this.callbacks.onLogout();
    } else {
      // Fallback logout
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  }

  /**
   * Xử lý redirect về login
   */
  private static handleLoginRedirect(): void {
    if (this.callbacks.onRedirectToLogin) {
      this.callbacks.onRedirectToLogin();
    } else {
      // Fallback redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000); // Delay để user đọc toast
    }
  }

  /**
   * Xử lý Axios errors
   */
  private static handleAxiosError(error: unknown): AppError {
    const axiosError = error as {
      response?: {
        data?: {
          code?: string;
          status?: number;
          message?: string;
          errors?: Record<string, string>;
        };
        status?: number;
      };
      message?: string;
      config?: unknown;
    };

    const response = axiosError.response;

    if (response?.data) {
      // Backend trả về error response theo format chuẩn
      const { code, message, errors } = response.data;
      return new AppError({
        code: code || ErrorCode.SYSTEM_ERROR,
        status: response.status || 500,
        message: message || "Đã xảy ra lỗi từ server",
        errors,
      });
    }

    // Xử lý HTTP status codes
    const status = response?.status;
    switch (status) {
      case 401:
        return new AppError({
          code: ErrorCode.AUTH_REQUIRED,
          status: 401,
          message: "Phiên đăng nhập đã hết hạn",
        });
      case 403:
        return new AppError({
          code: ErrorCode.AUTH_PERMISSION_DENIED,
          status: 403,
          message: "Bạn không có quyền truy cập",
        });
      case 404:
        return new AppError({
          code: ErrorCode.BIZ_RESOURCE_NOT_FOUND,
          status: 404,
          message: "Không tìm thấy tài nguyên",
        });
      case 500:
        return new AppError({
          code: ErrorCode.SYSTEM_ERROR,
          status: 500,
          message: "Lỗi hệ thống, vui lòng thử lại sau",
        });
      default:
        return new AppError({
          code: ErrorCode.SYSTEM_ERROR,
          status: response?.status || 500,
          message: axiosError.message || "Đã xảy ra lỗi không xác định",
        });
    }
  }

  /**
   * Kiểm tra có phải Axios error không
   */
  private static isAxiosError(error: unknown): boolean {
    const axiosError = error as {
      isAxiosError?: boolean;
      response?: unknown;
      config?: unknown;
    };
    return (
      axiosError?.isAxiosError === true ||
      (axiosError?.response && axiosError?.config)
    );
  }

  /**
   * Kiểm tra có phải network error không
   */
  private static isNetworkError(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      const networkError = error as {
        code?: string;
        message?: string;
        response?: unknown;
      };
      return (
        networkError.code === "NETWORK_ERROR" ||
        networkError.code === "ECONNABORTED" ||
        networkError.message?.includes("Network Error") ||
        networkError.message?.includes("timeout") ||
        !networkError.response
      );
    }
    return false;
  }

  /**
   * Method để component có thể gọi trực tiếp khi cần
   */
  public static showSuccess(message: string): void {
    toast.success(message, TOAST_CONFIG.success);
  }

  public static showWarning(message: string): void {
    toast.warning(message, TOAST_CONFIG.warning);
  }

  public static showError(message: string): void {
    toast.error(message, TOAST_CONFIG.error);
  }

  /**
   * Clear tất cả toast hiện tại
   */
  public static clearAll(): void {
    toast.dismiss();
  }
}
