import type { RegisterData, User } from "@/context/auth-context/types";
import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse } from "../shared/apiResponse";

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthenticationResponse {
  token: string;
  expiryTime: Date;
}

export const doLogin = async (
  username: string,
  password: string
): Promise<AuthenticationResponse> => {
  try {
    const request: LoginRequest = {
      username,
      password,
    };

    const response = await axiosInstance.post<
      ApiResponse<AuthenticationResponse>
    >("/identity/auth/token", request);
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(error.response?.data?.result.message || "Login failed");
  }
};

export const doRegister = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await axiosInstance.post<ApiResponse<User>>(
      "/identity/users/registration",
      userData
    );
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(error.response?.data?.result || "Registration failed");
  }
};

export const doLogout = async (): Promise<void> => {
  localStorage.clear();
};

export const getMe = async (): Promise<User> => {
  try {
    const response = await axiosInstance.get<ApiResponse<User>>(
      "/identity/users/me",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      }
    );
    return response.data.result;
  } catch (error: any) {
    // Bạn có thể log hoặc xử lý error chi tiết hơn ở đây
    throw new Error(
      error.response?.data?.result || "Failed to fetch user data"
    );
  }
};
