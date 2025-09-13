import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

const PREFIX = "/identity/users";

export interface UserUpdateRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dob?: Date;
  bio?: string;
  avatar?: File;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const updateProfile = async (data: UserUpdateRequest): Promise<void> => {
  await axiosInstance.put(`${PREFIX}/update-profile`, data);
};

export const updateAvatar = async (avatar: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", avatar);
  const response = await axiosInstance.put<ApiResponse<string>>(
    `${PREFIX}/update-avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.result; // Giả sử API trả về URL của ảnh đã tải lên
};

export const changePassword = async (
  data: ChangePasswordRequest
): Promise<void> => {
  await axiosInstance.put(`${PREFIX}/change-password`, data);
};
