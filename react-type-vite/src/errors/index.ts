/**
 * Centralized Error Handling System
 *
 * Tái tổ chức việc bắt exception, được rõ ràng, tái sử dụng
 * Tương ứng với GlobalExceptionHandler ở backend
 *
 * Features:
 * - Exception chỉ cần throw 1 lần ở backend
 * - Error handling được tự động hóa hoàn toàn
 * - Toast hiển thị ngay lập tức mà không cần component xử lý thủ công
 * - User experience mượt mà với thông báo lỗi rõ ràng
 * - Timeline thực tế chỉ mất khoảng 200ms từ lúi user click cho đến khi thấy thông báo lỗi
 */

// Core exports
export {
  ErrorCode,
  AUTH_ERROR_CODES,
  REDIRECT_TO_LOGIN_CODES,
} from "./ErrorCode";
export type { ErrorCodeType } from "./ErrorCode";

export { AppError } from "./AppError";
export type { ApiResponse, ErrorResponse } from "./AppError";

export { GlobalErrorHandler } from "./GlobalErrorHandler";

// Enhanced axios instance
export { default as axiosInstance, api, apiCall } from "./axiosInstance";

// Hooks
export {
  useGlobalErrorHandler,
  useAsyncOperation,
  useFormSubmission,
} from "./useGlobalErrorHandler";

// Error Boundary
export { GlobalErrorBoundary, withErrorBoundary } from "./GlobalErrorBoundary";

/**
 * Quick start guide:
 *
 * 1. Setup trong App.tsx:
 * ```typescript
 * import { useGlobalErrorHandler } from "@/errors";
 *
 * function App() {
 *   const { setupErrorHandler } = useGlobalErrorHandler();
 *
 *   useEffect(() => {
 *     setupErrorHandler();
 *   }, [setupErrorHandler]);
 * }
 * ```
 *
 * 2. Sử dụng trong components:
 * ```typescript
 * import { useAsyncOperation, api } from "@/errors";
 *
 * function MyComponent() {
 *   const { executeAsync } = useAsyncOperation();
 *
 *   const handleSubmit = () => {
 *     executeAsync(
 *       () => api.post("/users", userData),
 *       {
 *         successMessage: "Tạo user thành công!",
 *         onSuccess: (result) => console.log(result)
 *       }
 *     );
 *   };
 * }
 * ```
 *
 * 3. Sử dụng cho form submission:
 * ```typescript
 * import { useFormSubmission } from "@/errors";
 *
 * function LoginForm() {
 *   const { submitForm } = useFormSubmission();
 *
 *   const handleLogin = () => {
 *     submitForm(
 *       () => api.post("/auth/login", credentials),
 *       {
 *         successMessage: "Đăng nhập thành công!",
 *         onValidationError: setFieldErrors,
 *         onSuccess: () => navigate("/dashboard")
 *       }
 *     );
 *   };
 * }
 * ```
 */
