import type {
  ApiResponse,
  PaginatedResponse,
} from "@/services/api/response/apiResponse";
import axiosInstance from "./httpClient/axiosInstance";
import type { UserResponse } from "./response/userResponse";
import type { ChangePasswordData } from "@/types/profile.types";

export const getUsers = async (
  page: number = 0,
  size: number = 10,
  keyword: string = "",
  role: string = "",
  status: string = ""
): Promise<PaginatedResponse<UserResponse>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    keyword: keyword.trim(),
    role: role === "all" ? "" : role,
    status: status === "all" ? "" : status,
  });

  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<UserResponse>>
  >(`/identity/users?${params.toString()}`);
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

export const changeUserStatus = async (
  userId: string,
  status: string
): Promise<void> => {
  const response = await axiosInstance.put<ApiResponse<void>>(
    `/identity/users/change-status?userId=${userId}&status=${status}`
  );
  return response.data.result;
};

const changePassword = async (request: ChangePasswordData): Promise<void> => {
  const response = await axiosInstance.put<ApiResponse<void>>(
    "/identity/users/change-password",
    request
  );
  return response.data.result;
};

export default {
  changePassword,
};
