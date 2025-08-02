import axios from "axios";
import type {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, ErrorResponse } from "./apiResponse";
import { AppError } from "./AppError";
import { ErrorCodes } from "./apiResponse";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8888/api/v1",
});

// Biến để track việc refresh token
let isRefreshing = false;
let refreshTokenPromise: Promise<string> | null = null;

// Request interceptor - Tự động thêm token vào headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authorizationData = localStorage.getItem("authorizationData");
    const token = authorizationData
      ? JSON.parse(authorizationData).accessToken
      : null;
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

    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse;

      // Nếu token hết hạn và chưa retry
      if (
        errorData.code === ErrorCodes.TOKEN_EXPIRED &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch {
          // Refresh token thất bại - logout user
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(new AppError(errorData));
        }
      }

      // Throw custom error
      throw new AppError(errorData);
    }

    // Fallback error
    throw new AppError({
      code: 9999,
      message: error.message || "Network error occurred",
    });
  }
);

// Hàm refresh token
const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return refreshTokenPromise;
  }

  isRefreshing = true;

  refreshTokenPromise = (async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post<
        ApiResponse<{
          accessToken: string;
          refreshToken: string;
          expiryTime: number;
          refreshExpiryTime: number;
        }>
      >(`${axiosInstance.defaults.baseURL}/identity/auth/refresh`, {
        token: refreshTokenValue,
      });

      const authorizationData = response.data.result;
      localStorage.setItem(
        "authorizationData",
        JSON.stringify(authorizationData)
      );
      return authorizationData.accessToken;
    } catch (error) {
      localStorage.clear();
      throw error;
    } finally {
      isRefreshing = false;
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

export default axiosInstance;
