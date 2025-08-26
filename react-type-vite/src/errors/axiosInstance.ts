import axios from "axios";
import type {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { GlobalErrorHandler } from "./GlobalErrorHandler";
import { AppError } from "./AppError";
import { ErrorCode } from "./ErrorCode";

/**
 * Enhanced Axios Instance với tích hợp GlobalErrorHandler
 * Tự động xử lý tất cả errors và hiển thị toast
 */
const axiosInstance = axios.create({
  baseURL: "http://localhost:8888/api/v1",
  timeout: 30000, // 30 seconds timeout
});

// Biến để track việc refresh token
let isRefreshing = false;
let refreshTokenPromise: Promise<string> | null = null;

/**
 * Request interceptor - Tự động thêm token vào headers
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authorizationData = localStorage.getItem("authorizationData");
    const token = authorizationData
      ? JSON.parse(authorizationData).accessToken
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Tự động xử lý errors với GlobalErrorHandler
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - ${response.status}`
    );
    return response;
  },
  async (error: AxiosError) => {
    console.log(
      `❌ API Error: ${error.config?.method?.toUpperCase()} ${
        error.config?.url
      } - ${error.response?.status}`
    );

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Xử lý token expired với retry logic
    if (error.response?.data) {
      const errorData = error.response.data as {
        code?: string;
        message?: string;
        errors?: Record<string, string>;
      };

      // Nếu token hết hạn và chưa retry
      if (
        errorData.code === ErrorCode.AUTH_TOKEN_EXPIRED &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log("🔄 Retrying request with new token");
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
          // Refresh token thất bại - sẽ được xử lý bởi GlobalErrorHandler
          const appError = new AppError({
            code: ErrorCode.AUTH_TOKEN_EXPIRED,
            status: 401,
            message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          });

          // Không gọi GlobalErrorHandler.handle() ở đây vì sẽ gây duplicate toast
          // Để cho component gọi handle() khi catch error
          return Promise.reject(appError);
        }
      }
    }

    // Tạo AppError và reject - component sẽ catch và gọi GlobalErrorHandler
    const appError = GlobalErrorHandler.handle(error);
    return Promise.reject(appError);
  }
);

/**
 * Hàm refresh token
 */
const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return refreshTokenPromise;
  }

  isRefreshing = true;
  console.log("🔄 Refreshing token...");

  refreshTokenPromise = (async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post<{
        code: string;
        result: {
          accessToken: string;
          refreshToken: string;
          expiryTime: number;
          refreshExpiryTime: number;
        };
      }>(`${axiosInstance.defaults.baseURL}/identity/auth/refresh`, {
        token: refreshTokenValue,
      });

      const authorizationData = response.data.result;
      localStorage.setItem(
        "authorizationData",
        JSON.stringify(authorizationData)
      );
      localStorage.setItem("refreshToken", authorizationData.refreshToken);

      console.log("✅ Token refreshed successfully");
      return authorizationData.accessToken;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      localStorage.clear();
      throw error;
    } finally {
      isRefreshing = false;
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

/**
 * Wrapper function cho API calls với tự động error handling
 */
export const apiCall = async <T>(
  apiFunction: () => Promise<AxiosResponse<T>>
): Promise<T> => {
  const response = await apiFunction();
  return response.data;
};

/**
 * Helper functions cho các HTTP methods
 */
export const api = {
  get: <T>(url: string, config?: object) =>
    apiCall<T>(() => axiosInstance.get(url, config)),
  post: <T>(url: string, data?: unknown, config?: object) =>
    apiCall<T>(() => axiosInstance.post(url, data, config)),
  put: <T>(url: string, data?: unknown, config?: object) =>
    apiCall<T>(() => axiosInstance.put(url, data, config)),
  patch: <T>(url: string, data?: unknown, config?: object) =>
    apiCall<T>(() => axiosInstance.patch(url, data, config)),
  delete: <T>(url: string, config?: object) =>
    apiCall<T>(() => axiosInstance.delete(url, config)),
};

export default axiosInstance;
