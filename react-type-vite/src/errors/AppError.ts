import { ErrorCode } from "./ErrorCode";

/**
 * Interface cho API Response từ backend tương ứng với ApiResponse class
 */
export interface ApiResponse<T = unknown> {
  code: string;
  status: number;
  message: string;
  result?: T;
  errors?: Record<string, string>;
}

/**
 * Interface cho Error Response từ backend
 */
export interface ErrorResponse {
  code: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}

/**
 * Enhanced AppError class tương ứng với backend GlobalExceptionHandler
 * Tự động xử lý toast và redirect dựa trên error code
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly errors?: Record<string, string>;
  public readonly originalMessage: string;

  constructor(errorResponse: ErrorResponse | string) {
    // Xử lý nếu chỉ truyền vào string message
    if (typeof errorResponse === "string") {
      super(errorResponse);
      this.code = ErrorCode.SYSTEM_ERROR;
      this.status = 500;
      this.originalMessage = errorResponse;
      this.name = "AppError";
      return;
    }

    // Xử lý error response từ backend
    const { code, status, message, errors } = errorResponse;
    super(message);

    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.errors = errors;
    this.originalMessage = message;
  }

  /**
   * Kiểm tra có phải authentication error không
   */
  public isAuthError(): boolean {
    return this.code.startsWith("AUTH_");
  }

  /**
   * Kiểm tra có phải validation error không
   */
  public isValidationError(): boolean {
    return this.code.startsWith("VALID_");
  }

  /**
   * Kiểm tra có phải system error không
   */
  public isSystemError(): boolean {
    return this.code.startsWith("SYS_");
  }

  /**
   * Kiểm tra có phải business logic error không
   */
  public isBusinessError(): boolean {
    return this.code.startsWith("BIZ_");
  }

  /**
   * Kiểm tra token có hết hạn không
   */
  public isTokenExpired(): boolean {
    return this.code === ErrorCode.AUTH_TOKEN_EXPIRED;
  }

  /**
   * Kiểm tra có cần logout không
   */
  public requiresLogout(): boolean {
    const logoutCodes = [
      ErrorCode.AUTH_TOKEN_EXPIRED,
      ErrorCode.AUTH_TOKEN_INVALID,
      ErrorCode.AUTH_REQUIRED,
    ] as string[];
    return logoutCodes.includes(this.code);
  }

  /**
   * Kiểm tra có cần redirect về login không
   */
  public requiresLoginRedirect(): boolean {
    return this.requiresLogout();
  }

  /**
   * Lấy display message cho toast
   * Sử dụng message từ backend, ưu tiên field errors nếu có
   */
  public getDisplayMessage(): string {
    if (this.errors && Object.keys(this.errors).length > 0) {
      // Nếu có nhiều field errors, chỉ hiển thị error đầu tiên
      const firstError = Object.values(this.errors)[0];
      return firstError;
    }

    // Trả về message từ backend - backend đã xử lý message đầy đủ
    return this.originalMessage || this.message;
  }

  /**
   * Lấy tất cả field errors để hiển thị trong form
   */
  public getFieldErrors(): Record<string, string> {
    return this.errors || {};
  }

  /**
   * Lấy error code để component có thể xử lý riêng nếu cần
   */
  public getErrorCode(): string {
    return this.code;
  }

  /**
   * Lấy HTTP status code
   */
  public getStatusCode(): number {
    return this.status;
  }

  /**
   * Convert về plain object để serialize
   */
  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      originalMessage: this.originalMessage,
      errors: this.errors,
    };
  }

  /**
   * Tạo AppError từ unknown error (fallback)
   */
  public static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message);
    }

    if (typeof error === "string") {
      return new AppError(error);
    }

    return new AppError("Đã xảy ra lỗi không xác định");
  }

  /**
   * Tạo AppError cho network error
   */
  public static networkError(message?: string): AppError {
    return new AppError({
      code: ErrorCode.SYSTEM_ERROR,
      status: 0,
      message:
        message || "Không thể kết nối tới server. Vui lòng kiểm tra mạng.",
    });
  }

  /**
   * Tạo AppError cho timeout error
   */
  public static timeoutError(): AppError {
    return new AppError({
      code: ErrorCode.SYSTEM_ERROR,
      status: 408,
      message: "Kết nối bị timeout. Vui lòng thử lại.",
    });
  }
}
