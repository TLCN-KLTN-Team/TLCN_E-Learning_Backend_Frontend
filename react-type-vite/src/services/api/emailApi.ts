import type { RegisterData } from "@/context/auth-context/types";
import axiosInstance from "./httpClient/axiosInstance";
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "./request/forgotPasswordRequest";
import type { ApiResponse } from "./response/apiResponse";
import type {
  ForgotPasswordResponse,
  OtpVerificationResponse,
  ResetPasswordResponse,
} from "./response/forgotPasswordResponse";

// Send reset password email
export const sendResetPasswordEmail = async (
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<ForgotPasswordResponse>
  >("/identity/forgot-password/send-email", request);
  return response.data.result;
};

// Verify OTP code
export const verifyOtp = async (
  email: string,
  otpCode: string
): Promise<OtpVerificationResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<OtpVerificationResponse>
  >(
    `/identity/forgot-password/verify-otp?email=${encodeURIComponent(
      email
    )}&otpCode=${encodeURIComponent(otpCode)}`
  );
  return response.data.result;
};

// Resend OTP code
export const resendOtp = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<ForgotPasswordResponse>
  >(`/identity/forgot-password/resend-otp?email=${encodeURIComponent(email)}`);
  return response.data.result;
};

// Reset password with token
export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await axiosInstance.post<ApiResponse<ResetPasswordResponse>>(
    "/identity/forgot-password/reset-password",
    request
  );
  return response.data.result;
};

export const verifyEmail = async (
  email: string,
  otpCode: string
): Promise<void> => {
  const response = await axiosInstance.post<ApiResponse<void>>(
    `/identity/forgot-password/verify-email?email=${encodeURIComponent(
      email
    )}&otpCode=${encodeURIComponent(otpCode)}`
  );
  return response.data.result;
};

export const sendVerificationCode = async (
  registrationData: RegisterData
): Promise<void> => {
  const response = await axiosInstance.post<ApiResponse<void>>(
    `/identity/users/registration/send-verification`,
    registrationData
  );
  return response.data.result;
};

export const verifyAccount = async (
  email: string,
  otpCode: string
): Promise<void> => {
  const response = await axiosInstance.post<ApiResponse<void>>(
    `/identity/users/registration/verify-account?email=${encodeURIComponent(
      `${email}`
    )}&otpCode=${encodeURIComponent(otpCode)}`
  );
  return response.data.result;
};

export default {
  sendResetPasswordEmail,
  verifyOtp,
  resendOtp,
  resetPassword,
  verifyEmail,
  sendVerificationCode,
  verifyAccount,
};
