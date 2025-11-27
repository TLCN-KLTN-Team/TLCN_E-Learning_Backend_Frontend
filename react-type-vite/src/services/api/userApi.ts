import type {
  ApiResponse,
  PaginatedResponse,
} from "@/services/api/response/apiResponse";
import axiosInstance from "./httpClient/axiosInstance";
import type { UserResponse } from "./response/userResponse";

export const getUsers = async (
  page: number = 0,
  size: number = 10
): Promise<PaginatedResponse<UserResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<UserResponse>>
  >(`/identity/users?page=${page}&size=${size}`);
  return response.data.result;
};

export const getUserById = async (userId: string): Promise<UserResponse> => {
  const response = await axiosInstance.get<ApiResponse<UserResponse>>(
    `/identity/users/${userId}`
  );
  return response.data.result;
};

export const verifyEmailBySuperAdmin = async (email: string): Promise<void> => {
  const formData = new FormData();
  formData.append("email", email);

  const response = await axiosInstance.put<ApiResponse<void>>(
    "/identity/users/verify-email-by-super-admin",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.result;
};
