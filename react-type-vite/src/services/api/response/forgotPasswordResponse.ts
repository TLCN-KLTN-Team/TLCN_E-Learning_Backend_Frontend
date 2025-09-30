export interface ForgotPasswordResponse {
  success: boolean
  message: string
  email: string
}

export interface OtpVerificationResponse {
  success: boolean
  message: string
  resetToken?: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}
