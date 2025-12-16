package com.devteria.identity.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.ForgotPasswordRequest;
import com.devteria.identity.dto.request.ResetPasswordRequest;
import com.devteria.identity.dto.response.ForgotPasswordResponse;
import com.devteria.identity.dto.response.OtpVerificationResponse;
import com.devteria.identity.dto.response.ResetPasswordResponse;
import com.devteria.identity.service.EmailVerificationService;
import com.devteria.identity.service.ForgotPasswordService;
import com.devteria.identity.service.OTPService;
import com.devteria.identity.service.ResetTokenService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/forgot-password")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ForgotPasswordController {

    ForgotPasswordService forgotPasswordService;
    EmailVerificationService emailVerificationService;
    ResetTokenService resetTokenService;
    OTPService otpService;

    @PostMapping("/send-email")
    public ApiResponse<ForgotPasswordResponse> sendResetPasswordEmail(
            @Valid @RequestBody ForgotPasswordRequest request) {

        log.info("Received forgot password request for email: {}", request.getEmail());

        ForgotPasswordResponse response = forgotPasswordService.sendResetPasswordEmail(request);

        return ApiResponse.<ForgotPasswordResponse>builder().result(response).build();
    }

    @PostMapping("/verify-otp")
    public ApiResponse<OtpVerificationResponse> verifyOtp(@RequestParam String email, @RequestParam String otpCode) {

        log.info("Received OTP verification request for email: {}", email);

        try {
            Object result = emailVerificationService.verifyOtp(email, otpCode);

            if ("EMAIL_VERIFIED_FOR_PASSWORD_RESET".equals(result)) {
                String resetToken = resetTokenService.generateResetToken(email);

                return ApiResponse.<OtpVerificationResponse>builder()
                        .result(OtpVerificationResponse.builder()
                                .success(true)
                                .message("OTP xác thực thành công. Sử dụng token để đặt lại mật khẩu.")
                                .resetToken(resetToken)
                                .build())
                        .build();
            } else {
                return ApiResponse.<OtpVerificationResponse>builder()
                        .result(OtpVerificationResponse.builder()
                                .success(true)
                                .message("OTP xác thực thành công.")
                                .build())
                        .build();
            }
        } catch (Exception e) {
            log.error("Error verifying OTP for password reset: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/reset-password")
    public ApiResponse<ResetPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {

        log.info("Received reset password request with token: {}", request.getToken());
        log.info(
                "Password length: {}, Confirm password length: {}",
                request.getNewPassword() != null ? request.getNewPassword().length() : 0,
                request.getConfirmPassword() != null
                        ? request.getConfirmPassword().length()
                        : 0);

        ResetPasswordResponse response = forgotPasswordService.resetPassword(request);

        return ApiResponse.<ResetPasswordResponse>builder().result(response).build();
    }

    @PostMapping("/resend-otp")
    public ApiResponse<ForgotPasswordResponse> resendOtp(@RequestParam String email) {
        log.info("Received resend OTP request for email: {}", email);

        try {
            otpService.resendPasswordResetOtp(email);

            return ApiResponse.<ForgotPasswordResponse>builder()
                    .result(ForgotPasswordResponse.builder()
                            .success(true)
                            .message("Mã OTP mới đã được gửi đến email của bạn")
                            .email(email)
                            .build())
                    .build();
        } catch (Exception e) {
            log.error("Error resending OTP: {}", e.getMessage());
            throw e;
        }
    }
}
