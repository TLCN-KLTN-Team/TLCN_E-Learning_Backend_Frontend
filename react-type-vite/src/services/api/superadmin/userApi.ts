import axiosInstance from "../httpClient/axiosInstance";

const PREFIX = "/identity/users";

export interface UserUpdateRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
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

export const changePassword = async (
  data: ChangePasswordRequest
): Promise<void> => {
  await axiosInstance.put(`${PREFIX}/change-password`, data);
};
