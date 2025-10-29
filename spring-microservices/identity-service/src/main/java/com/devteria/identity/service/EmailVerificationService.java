package com.devteria.identity.service;

import org.springframework.stereotype.Service;

import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.entity.OtpData;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final InMemoryOtpStorageService otpStorageService;
    private final UserRepository userRepository;

    public Object verifyOtp(String email, String otpCode) {
        if (email == null || email.trim().isEmpty()) {
            log.error("Email is null or empty");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (otpCode == null || otpCode.trim().isEmpty()) {
            log.error("OTP code is null or empty");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Normalize email to lowercase
        email = email.toLowerCase().trim();
        otpCode = otpCode.trim();

        try {
            // Get OTP data from storage
            OtpData otpData = otpStorageService.getOtp(email);

            if (otpData == null) {
                log.error("No OTP found for email: {}", email);
                throw new AppException(ErrorCode.OTP_NOT_FOUND);
            }

            if (otpData.isExpired()) {
                log.error("OTP expired for email: {}. Expiration time: {}", email, otpData.getExpirationTime());
                otpStorageService.removeOtp(email);
                throw new AppException(ErrorCode.OTP_EXPIRED);
            }

            if (!otpData.canAttempt()) {
                log.error("Maximum OTP attempts ({}) exceeded for email: {}", otpData.getMaxAttempts(), email);
                otpStorageService.removeOtp(email);
                throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
            }

            // Increment attempt count before validation
            otpData.incrementAttempt();
            log.info("OTP attempt {}/{} for email: {}", otpData.getAttemptCount(), otpData.getMaxAttempts(), email);

            if (!otpData.getOtpCode().equalsIgnoreCase(otpCode)) {
                log.error(
                        "Invalid OTP for email: {}. Attempts remaining: {}",
                        email,
                        otpData.getMaxAttempts() - otpData.getAttemptCount());

                if (!otpData.canAttempt()) {
                    otpStorageService.removeOtp(email);
                    throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
                }

                throw new AppException(ErrorCode.OTP_INVALID);
            }

            Object result = processVerificationByType(otpData);
            // Remove OTP after successful verification
            otpStorageService.removeOtp(email);

            return result;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error verifying OTP for email: {}: {}", email, e.getMessage(), e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }

    private Object processVerificationByType(OtpData otpData) {
        try {
            switch (otpData.getType()) {
                case EMAIL_VERIFICATION:
                    RegisterRequest registerRequest = (RegisterRequest) otpData.getContextData();

                    if (registerRequest == null) {
                        log.error("No registration data found for email verification: {}", otpData.getEmail());
                        throw new AppException(ErrorCode.SYSTEM_ERROR);
                    }

                    if (!registerRequest.getEmail().equalsIgnoreCase(otpData.getEmail())) {
                        log.error("Email mismatch in registration data for: {}", otpData.getEmail());
                        throw new AppException(ErrorCode.SYSTEM_ERROR);
                    }

                case PASSWORD_RESET:
                    log.info("Email verified for password reset: {}", otpData.getEmail());
                    return "EMAIL_VERIFIED_FOR_PASSWORD_RESET";

                default:
                    log.error("Unknown OTP type: {} for email: {}", otpData.getType(), otpData.getEmail());
                    throw new AppException(ErrorCode.SYSTEM_ERROR);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error(
                    "Error processing verification by type {} for email {}: {}",
                    otpData.getType(),
                    otpData.getEmail(),
                    e.getMessage(),
                    e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }
}
