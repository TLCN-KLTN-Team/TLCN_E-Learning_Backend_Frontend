import type { RegisterData, User } from "@/context/auth-context/types";
import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse } from "../shared/apiResponse";

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  expiryTime: number;
  refreshExpiryTime: number;
  roles: string[];
}

interface IntrospectRequest {
  token: string;
}

interface IntrospectResponse {
  valid: boolean;
  userId?: string;
  username?: string;
  scope?: string;
  iat?: number;
  exp?: number;
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
  >("/identity/auth/token", request);

  // Lưu tokens vào localStorage
  const authorizationData = response.data.result;

  localStorage.setItem("authorizationData", JSON.stringify(authorizationData));

  return {
    token: authorizationData.accessToken,
    expiryTime: new Date(authorizationData.accessToken),
  } as any;
};

export const doRegister = async (userData: RegisterData): Promise<User> => {
  const response = await axiosInstance.post<ApiResponse<User>>(
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
    localStorage.clear();
  }
};

export const getMe = async (): Promise<User> => {
  const response = await axiosInstance.get<ApiResponse<User>>(
    "/identity/users/me"
  );
  return response.data.result;
};

export const introspectToken = async (
  token: string
): Promise<IntrospectResponse> => {
  const request: IntrospectRequest = { token };
  const response = await axiosInstance.post<ApiResponse<IntrospectResponse>>(
    "/identity/auth/introspect",
    request
  );
  return response.data.result;
};

export const refreshAuthToken = async (
  refreshToken: string
): Promise<AuthenticationResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<AuthenticationResponse>
  >("/identity/auth/refresh", { token: refreshToken });

  const authorizationData = response.data.result;
  localStorage.setItem("authorizationData", JSON.stringify(authorizationData));

  return response.data.result;
};
