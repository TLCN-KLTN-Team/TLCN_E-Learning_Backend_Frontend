import type { RegisterData, User } from "@/context/auth-context/types";
import axiosInstance from "./httpClient/axiosInstance";
import type { ApiResponse } from "./response/apiResponse";

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  expiryTime?: number;
  refreshExpiryTime?: number;
  roles?: string[];
}

export const doLogin = async (
  username: string,
  password: string
): Promise<AuthenticationResponse> => {
  const request: LoginRequest = {
    username,
    password,
  };

  const response = await axiosInstance.post<
    ApiResponse<AuthenticationResponse>
  >("/identity/auth/login", request);

  // Debug: Log the response to see what backend returns
  console.log("Login response:", response.data);

  // Lưu tokens vào localStorage (KHÔNG lưu roles vì lấy từ JWT)
  const authData = response.data.result;
  localStorage.setItem("accessToken", authData.accessToken);
  localStorage.setItem("refreshToken", authData.refreshToken);

  // Handle case where expiryTime might be undefined
  if (authData.expiryTime) {
    localStorage.setItem("expiryTime", authData.expiryTime.toString());
  }

  if (authData.refreshExpiryTime) {
    localStorage.setItem(
      "refreshExpiryTime",
      authData.refreshExpiryTime.toString()
    );
  }

  // Debug: Verify token is saved
  console.log("Saved accessToken:", localStorage.getItem("accessToken"));

  return authData;
};

export const doSocialLogin = async (
  code: string,
  provider: string
): Promise<string> => {
  const response = await axiosInstance.post<
    ApiResponse<AuthenticationResponse>
  >(`/identity/auth/outbound/authenticate?code=${code}&provider=${provider}`);

  const authData = response.data.result;

  // Lưu tokens vào localStorage (KHÔNG lưu roles vì lấy từ JWT)
  localStorage.setItem("accessToken", authData.accessToken);
  localStorage.setItem("refreshToken", authData.refreshToken);

  // Handle case where expiryTime might be undefined
  if (authData.expiryTime) {
    localStorage.setItem("expiryTime", authData.expiryTime.toString());
  }

  if (authData.refreshExpiryTime) {
    localStorage.setItem(
      "refreshExpiryTime",
      authData.refreshExpiryTime.toString()
    );
  }

  return authData.accessToken;
};

export const getProviderOAuthUrl = async (
  provider: string
): Promise<string> => {
  const response = await axiosInstance.get<ApiResponse<string>>(
    `/identity/auth/outbound/social-login`,
    { params: { provider } }
  );
  return response.data.result;
};

export const doRegister = async (userData: RegisterData): Promise<string> => {
  const response = await axiosInstance.post<ApiResponse<string>>(
    "/identity/users/registration",
    userData
  );
  return response.data.result;
};

export const doLogout = async (): Promise<void> => {
  try {
    // Có thể gọi API logout nếu backend hỗ trợ
    // await axiosInstance.post("/identity/auth/logout");
  } finally {
    // Clear tất cả dữ liệu authentication
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiryTime");
    localStorage.removeItem("refreshExpiryTime");
  }
};

export const getMe = async (): Promise<User> => {
  console.log("Calling getMe API...");
  const response = await axiosInstance.get<ApiResponse<User>>(
    "/identity/users/me"
  );
  console.log("getMe response:", response.data);
  return response.data.result;
};
