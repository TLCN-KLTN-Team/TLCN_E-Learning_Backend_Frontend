import axios from "axios";
import type { AxiosError } from "axios";
import { ErrorCodes, type ErrorResponse } from "@/types/error/ErrorResponse";
import { AppError } from "@/errors";

/**
 * Public Axios Instance - For endpoints that don't require authentication
 * No token will be attached to requests
 */
const publicAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor - Only handle errors, no token refresh
publicAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Kiểm tra xem có error data từ backend không
    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse;

      // Nếu backend trả về error với code và message cụ thể
      if (errorData.code && errorData.message) {
        throw new AppError(errorData);
      }
    }

    // Nếu không có error data cụ thể, throw error chung
    if (error.response) {
      const status = error.response.status;
      let errorResponse: ErrorResponse;

      switch (status) {
        case 400:
          errorResponse = {
            code: ErrorCodes.BAD_REQUEST,
            message: "Yêu cầu không hợp lệ",
          };
          break;
        case 404:
          errorResponse = {
            code: ErrorCodes.NOT_FOUND,
            message: "Không tìm thấy tài nguyên",
          };
          break;
        case 500:
          errorResponse = {
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: "Lỗi máy chủ nội bộ",
          };
          break;
        default:
          errorResponse = {
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: `Lỗi không xác định: ${status}`,
          };
      }

      throw new AppError(errorResponse);
    }

    // Network error hoặc timeout
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new AppError({
        code: ErrorCodes.NETWORK_ERROR,
        message: "Yêu cầu hết thời gian chờ",
      });
    }

    if (error.code === "ERR_NETWORK") {
      throw new AppError({
        code: ErrorCodes.NETWORK_ERROR,
        message: "Không thể kết nối đến máy chủ",
      });
    }

    // Throw the original error if we can't categorize it
    throw error;
  }
);

export default publicAxiosInstance;
