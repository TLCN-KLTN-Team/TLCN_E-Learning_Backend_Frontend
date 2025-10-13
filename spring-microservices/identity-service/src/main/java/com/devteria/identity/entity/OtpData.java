package com.devteria.identity.entity;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class OtpData {
    private String email;
    private String otpCode;
    private LocalDateTime expirationTime;
    private LocalDateTime createdTime;
    private int attemptCount;
    private int maxAttempts;
    private int resendCount;
    private int maxResends;
    private LocalDateTime resendLockUntil;
    private OtpType type;
    private Object contextData;

    public OtpData(String email, String otpCode, OtpType type) {
        this.email = email.toLowerCase().trim();
        this.otpCode = otpCode;
        this.type = type;
        this.createdTime = LocalDateTime.now();
        this.expirationTime = LocalDateTime.now().plusSeconds(90); // 1 minute 30 seconds
        this.attemptCount = 0;
        this.maxAttempts = 5;
        this.resendCount = 0;
        this.maxResends = 3;
        this.resendLockUntil = null;
    }

    public boolean isExpired() {
        if (expirationTime == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(expirationTime);
    }

    public boolean canAttempt() {
        return attemptCount < maxAttempts && !isExpired();
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public int getRemainingAttempts() {
        return Math.max(0, maxAttempts - attemptCount);
    }

    public boolean isValid() {
        return !isExpired() && canAttempt();
    }

    public boolean canResend() {
        // Check if locked due to too many resends
        if (resendLockUntil != null && LocalDateTime.now().isBefore(resendLockUntil)) {
            return false;
        }
        return resendCount < maxResends;
    }

    public void incrementResend() {
        this.resendCount++;
        if (resendCount >= maxResends) {
            // Lock for 5 minutes after 3 resends
            this.resendLockUntil = LocalDateTime.now().plusMinutes(5);
        }
    }

    public boolean isResendLocked() {
        return resendLockUntil != null && LocalDateTime.now().isBefore(resendLockUntil);
    }

    public long getResendLockRemainingSeconds() {
        if (resendLockUntil == null || LocalDateTime.now().isAfter(resendLockUntil)) {
            return 0;
        }
        return java.time.Duration.between(LocalDateTime.now(), resendLockUntil).getSeconds();
    }

    public int getRemainingResends() {
        return Math.max(0, maxResends - resendCount);
    }
}
