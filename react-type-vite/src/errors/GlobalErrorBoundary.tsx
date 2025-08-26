import React, { type ReactNode, type ErrorInfo } from "react";
import { GlobalErrorHandler } from "./GlobalErrorHandler";
import { AppError, ErrorCode } from "./index";

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

/**
 * Enhanced Error Boundary với tích hợp GlobalErrorHandler
 * Tự động catch React errors và xử lý với system error handling
 */
export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert React error to AppError
    const appError = new AppError({
      code: ErrorCode.SYSTEM_ERROR,
      status: 500,
      message: `React Error: ${error.message}`,
    });

    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group("🚨 GlobalErrorBoundary caught error");
    console.error("React Error:", error);
    console.error("Error Info:", errorInfo);

    // Create AppError for consistent handling
    const appError = new AppError({
      code: ErrorCode.SYSTEM_ERROR,
      status: 500,
      message: `React Component Error: ${error.message}`,
    });

    // Handle with GlobalErrorHandler (will show toast)
    GlobalErrorHandler.handle(appError);

    // Call custom error handler if provided
    this.props.onError?.(appError, errorInfo);

    console.groupEnd();
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Đã xảy ra lỗi
            </h1>

            <p className="text-gray-600 text-center mb-6">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc
              liên hệ hỗ trợ.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Tải lại trang
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Về trang chủ
              </button>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Chi tiết lỗi (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 text-xs overflow-auto rounded">
                  {JSON.stringify(this.state.error.toJSON(), null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC để wrap component với GlobalErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: AppError) => ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};
