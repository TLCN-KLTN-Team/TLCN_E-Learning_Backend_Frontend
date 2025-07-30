import type { User } from "@/context/auth-context/types";
import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse } from "../shared/apiResponse";

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (request: LoginRequest): Promise<User> => {
  try {
    const response = await axiosInstance.post<ApiResponse<User>>(
      "/identity/auth/login",
      request
    );
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(error.response?.data?.result.message || "Login failed");
  }
};

export const register = async (userData: User): Promise<User> => {
  try {
    const response = await axiosInstance.post<ApiResponse<User>>(
      "/identity/auth/register",
      userData
    );
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(
      error.response?.data?.result.message || "Registration failed"
    );
  }
};

export const logout = async (): Promise<void> => {
  localStorage.clear();
};

export const getMe = async (): Promise<User> => {
  try {
    const response = await axiosInstance.get<ApiResponse<User>>(
      "/identity/auth/me"
    );
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(
      error.response?.data?.result.message || "Failed to fetch user data"
    );
  }
};
