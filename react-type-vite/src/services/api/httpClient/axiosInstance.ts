import axios from "axios";
import type {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "../response/apiResponse";
import { ErrorCodes, type ErrorResponse } from "@/types/error/ErrorResponse";
import { AppError } from "@/errors";

const axiosInstance = axios.create({
  baseURL: "https://external-metadata-andrea-soccer.trycloudflare.com/api/v1",
  withCredentials: true, // Tự động gửi cookies (bao gồm refresh token)
  timeout: 30000, // Timeout 30 giây
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Biến để track việc refresh token
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token || undefined)
  );
  failedQueue = [];
};

// Request interceptor - Tự động thêm token vào headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authorizationData = localStorage.getItem("authorizationData");
    const token = authorizationData
      ? JSON.parse(authorizationData).accessToken
      : null;

    console.log("Making request:", {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      withCredentials: config.withCredentials,
    });

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý errors và refresh token
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    console.log("Response error:", {
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest?.url,
    });

    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse;
      const appError = new AppError(errorData);

      // Nếu token hết hạn và chưa retry
      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Nếu đang refresh, thêm request vào queue
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token thất bại - logout user
          processQueue(refreshError, null);
          handleLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Throw custom error
      throw appError;
    }

    // Fallback error
    throw new AppError({
      code: ErrorCodes.NETWORK_ERROR,
      message: error.message || "Network error occurred",
    });
  }
);

// Hàm refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    // Tạo instance riêng cho refresh để tránh loop interceptor
    const refreshAxios = axios.create({
      baseURL: axiosInstance.defaults.baseURL,
      withCredentials: true,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const response = await refreshAxios.post<
      ApiResponse<{
        accessToken: string;
        expiryTime: number;
      }>
    >("/identity/auth/refresh", {});

    console.log("Refresh token response:", response.data);

    const authorizationData = response.data.result;
    if (authorizationData) {
      // Lưu access token mới vào localStorage
      localStorage.setItem(
        "authorizationData",
        JSON.stringify(authorizationData)
      );
      return authorizationData.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Refresh token failed:", error);
    // Nếu refresh thất bại, xóa localStorage và logout
    handleLogout();
    throw error;
  }
};

// Hàm logout
const handleLogout = () => {
  localStorage.clear();
  // Redirect to login page hoặc dispatch logout action
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Export function để test refresh token
export const testRefreshToken = async () => {
  try {
    const result = await refreshToken();
    console.log("Test refresh token result:", result);
    return result;
  } catch (error) {
    console.error("Test refresh token error:", error);
    throw error;
  }
};

export default axiosInstance;
