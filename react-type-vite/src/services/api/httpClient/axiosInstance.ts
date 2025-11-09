import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ErrorCodes, type ErrorResponse } from "@/types/error/ErrorResponse";

import { getAccessToken, getRefreshToken } from "@/utils/localStorageVariables";
import { AppError } from "@/errors";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - Tự động thêm access token vào headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý errors và refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Thực hiện refresh token khi:
    // 1. Status là 401 (Unauthorized)
    // 2. Chưa retry lần nào
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      return await refreshToken(originalRequest);
    }

    // Kiểm tra xem có error data từ backend không.
    // Nếu có error data, có nghĩa là backend đã xử lý và trả về lỗi cụ thể
    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse;
      const appError = new AppError(errorData);
      return Promise.reject(appError);
    }

    // Fallback error cho các trường hợp không có response data
    const fallbackError = new AppError({
      code: ErrorCodes.NETWORK_ERROR,
      message: error.message || "Network error occurred",
    });
    return Promise.reject(fallbackError);
  }
);

const refreshToken = async (originalRequest: InternalAxiosRequestConfig) => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("Không có refresh token");
    }

    // Tạo một instance axios mới để tránh circular call
    const refreshResponse = await axios.post(
      `${
        import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1"
      }/identity/auth/refresh`,
      { refreshToken: refreshToken }
    );

    if (refreshResponse?.status === 200) {
      const newAuthData = refreshResponse.data.result;

      // Cập nhật tokens trong localStorage
      localStorage.setItem("accessToken", newAuthData);

      // Cập nhật header cho request ban đầu
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAuthData.accessToken}`;
      }

      // Retry request ban đầu
      return axiosInstance(originalRequest);
    }
  } catch (refreshError) {
    // Clear tất cả dữ liệu authentication
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roles");
    window.location.href = "/login";
    return Promise.reject(refreshError);
  }
};

export default axiosInstance;
