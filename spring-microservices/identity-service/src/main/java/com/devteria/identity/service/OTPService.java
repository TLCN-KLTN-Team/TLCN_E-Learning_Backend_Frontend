package com.devteria.identity.service;

import com.devteria.identity.dto.request.OtpRequest;
import com.devteria.identity.entity.OtpData;
import com.devteria.identity.entity.OtpType;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.httpclient.SendEmailApi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class OTPService {

    private final InMemoryOtpStorageService inMemoryOtpStorageService;
    private final SendEmailApi sendEmailApi;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1000000));
    }

    public void sendEmailVerificationOtp(String email, Object contextData) {
        validateEmailAndContext(email, contextData, OtpType.EMAIL_VERIFICATION);
        sendOtp(email, OtpType.EMAIL_VERIFICATION, contextData, false);
    }

    public void sendPasswordResetOtp(String email) {
        validateEmailAndContext(email, null, OtpType.PASSWORD_RESET);
        sendOtp(email, OtpType.PASSWORD_RESET, null, false);
    }

    public void resendPasswordResetOtp(String email) {
        validateEmailAndContext(email, null, OtpType.PASSWORD_RESET);
        sendOtp(email, OtpType.PASSWORD_RESET, null, true);
    }

    private void validateEmailAndContext(String email, Object contextData, OtpType type) {
        // Validate email
        if (email == null || email.trim().isEmpty()) {
            log.error("Email is null or empty for OTP type: {}", type);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String normalizedEmail = email.toLowerCase().trim();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            log.error("Invalid email format: {} for OTP type: {}", normalizedEmail, type);
            throw new AppException(ErrorCode.INVALID_EMAIL_FORMAT);
        }

        OtpData existingOtp = inMemoryOtpStorageService.getOtp(normalizedEmail);
        if (existingOtp != null && existingOtp.isResendLocked()) {
            long remainingSeconds = existingOtp.getResendLockRemainingSeconds();
            log.warn("Resend locked for email: {}. Remaining time: {} seconds", normalizedEmail, remainingSeconds);
            throw new AppException(ErrorCode.OTP_RESEND_LIMIT_EXCEEDED);
        }

        if (existingOtp != null && existingOtp.isValid() && !existingOtp.isExpired()) {
            log.warn("Valid OTP already exists for email: {} (Type: {}). Remaining time: {} seconds",
                    normalizedEmail, existingOtp.getType(),
                    java.time.Duration.between(java.time.LocalDateTime.now(), existingOtp.getExpirationTime()).getSeconds());
            throw new AppException(ErrorCode.OTP_ALREADY_SENT);
        }

        // Type-specific validation
        if (type == OtpType.EMAIL_VERIFICATION && contextData == null) {
            log.error("Context data is required for email verification OTP");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private void sendOtp(String email, OtpType type, Object contextData, boolean isResend) {
        try {
            String normalizedEmail = email.toLowerCase().trim();

            // Get existing OTP data to preserve resend count
            OtpData existingOtp = inMemoryOtpStorageService.getOtp(normalizedEmail);

            // Generate new OTP
            String otpCode = generateOtp();

            OtpData otpData = new OtpData(normalizedEmail, otpCode, type);
            if (contextData != null) {
                otpData.setContextData(contextData);
            }

            if (isResend && existingOtp != null) {
                otpData.setResendCount(existingOtp.getResendCount());
                otpData.incrementResend();

                // Check if resend limit exceeded
                if (!otpData.canResend() && otpData.isResendLocked()) {
                    log.warn("Resend limit exceeded for email: {}", normalizedEmail);
                    inMemoryOtpStorageService.storeOtp(normalizedEmail, otpData);
                    throw new AppException(ErrorCode.OTP_RESEND_LIMIT_EXCEEDED);
                }

                log.info("Resending OTP to email: {} (Resend count: {}/{})",
                        normalizedEmail, otpData.getResendCount(), otpData.getMaxResends());
            }

            // Store OTP
            inMemoryOtpStorageService.storeOtp(normalizedEmail, otpData);

            OtpRequest otpRequest = new OtpRequest();
            otpRequest.setEmail(normalizedEmail);
            otpRequest.setOtpCode(otpCode);

            try {
                sendEmailApi.sendEmail(otpRequest);
                log.info("OTP sent successfully to email: {} for type: {}", normalizedEmail, type);
            } catch (Exception e) {
                inMemoryOtpStorageService.removeOtp(normalizedEmail);
                log.error("Failed to send OTP email to: {} for type: {}: {}", normalizedEmail, type, e.getMessage());
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
            }

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error sending OTP to email: {} for type: {}: {}", email, type, e.getMessage(), e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }

    public boolean hasValidOtp(String email, OtpType type) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String normalizedEmail = email.toLowerCase().trim();
        OtpData otpData = inMemoryOtpStorageService.getOtp(normalizedEmail);

        return otpData != null &&
                otpData.getType() == type &&
                otpData.isValid();
    }

    public long getOtpRemainingMinutes(String email) {
        if (email == null || email.trim().isEmpty()) {
            return 0;
        }

        String normalizedEmail = email.toLowerCase().trim();
        OtpData otpData = inMemoryOtpStorageService.getOtp(normalizedEmail);

        if (otpData == null || otpData.isExpired()) {
            return 0;
        }

        return java.time.Duration.between(
                java.time.LocalDateTime.now(),
                otpData.getExpirationTime()
        ).toMinutes();
    }
}
