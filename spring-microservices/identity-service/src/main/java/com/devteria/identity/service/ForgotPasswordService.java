package com.devteria.identity.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.devteria.identity.dto.request.ForgotPasswordRequest;
import com.devteria.identity.dto.request.ResetPasswordRequest;
import com.devteria.identity.dto.response.ForgotPasswordResponse;
import com.devteria.identity.dto.response.ResetPasswordResponse;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final OTPService otpService;
    private final PasswordEncoder passwordEncoder;
    private final ResetTokenService resetTokenService;

    public ForgotPasswordResponse sendResetPasswordEmail(ForgotPasswordRequest request) {
        try {
            boolean emailExists = userRepository.existsByEmail(request.getEmail());

            if (!emailExists) {
                log.info("Reset password requested for non-existent email: {}", request.getEmail());
                throw new AppException(ErrorCode.EMAIL_NOT_FOUND);
            }

            // Send OTP if email exists
            otpService.sendPasswordResetOtp(request.getEmail());
            log.info("Reset password OTP sent to existing email: {}", request.getEmail());

            return ForgotPasswordResponse.builder()
                    .success(true)
                    .message("Mã OTP đã được gửi đến email của bạn")
                    .email(request.getEmail())
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error sending reset password email: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }

    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        try {
            // Validate password match
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
            }

            if (!isValidPassword(request.getNewPassword())) {
                throw new AppException(ErrorCode.PASSWORD_WEAK);
            }

            String email = resetTokenService.validateAndGetEmail(request.getToken());

            // Find user by email
            User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            String encodedPassword = passwordEncoder.encode(request.getNewPassword());
            user.setPassword(encodedPassword);
            userRepository.save(user);

            resetTokenService.markTokenAsUsed(request.getToken());

            log.info("Password reset successfully for email: {}", email);

            return ResetPasswordResponse.builder()
                    .success(true)
                    .message("Đặt lại mật khẩu thành công")
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error resetting password: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }

    private boolean isValidPassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            return false;
        }

        // At least one digit, one lowercase letter, one uppercase letter, one special character, no whitespace, at
        // least 6 characters
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{6,}$";
        return password.matches(regex);
    }
}
