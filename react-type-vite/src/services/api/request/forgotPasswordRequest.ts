export interface ForgotPasswordRequest {
  email: string
}

export interface OtpVerificationRequest {
  email: string
  otpCode: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}
