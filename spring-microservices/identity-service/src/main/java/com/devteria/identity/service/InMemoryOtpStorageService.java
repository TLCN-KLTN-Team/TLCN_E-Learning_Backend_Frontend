package com.devteria.identity.service;

import com.devteria.identity.entity.OtpData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class InMemoryOtpStorageService {

    private final ConcurrentHashMap<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    public void storeOtp(String email, OtpData otpData) {
        if (email == null || email.trim().isEmpty()) {
            log.error("Cannot store OTP: email is null or empty");
            return;
        }

        if (otpData == null) {
            log.error("Cannot store OTP: otpData is null for email: {}", email);
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();

        if (otpStorage.containsKey(normalizedEmail)) {
            log.info("Replacing existing OTP for email: {}", normalizedEmail);
        }

        otpStorage.put(normalizedEmail, otpData);
        log.info("Stored OTP for email: {} (Type: {}, Total: {})",
                normalizedEmail, otpData.getType(), otpStorage.size());
    }

    public OtpData getOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.error("Cannot get OTP: email is null or empty");
            return null;
        }

        String normalizedEmail = email.toLowerCase().trim();
        OtpData otpData = otpStorage.get(normalizedEmail);

        if (otpData != null) {
            if (otpData.isExpired()) {
                log.info("Auto-removing expired OTP for email: {}", normalizedEmail);
                otpStorage.remove(normalizedEmail);
                return null;
            }
        }

        return otpData;
    }

    public void removeOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.error("Cannot remove OTP: email is null or empty");
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();
        OtpData removed = otpStorage.remove(normalizedEmail);

        if (removed != null) {
            log.info("Removed OTP for email: {} (Type: {}, Remaining: {})",
                    normalizedEmail, removed.getType(), otpStorage.size());
        } else {
            log.debug("No OTP found to remove for email: {}", normalizedEmail);
        }
    }

    public int getStorageSize() {
        return otpStorage.size();
    }

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void cleanupExpiredOtps() {
        int initialSize = otpStorage.size();
        LocalDateTime now = LocalDateTime.now();

        int expiredCount = 0;
        int maxAttemptsCount = 0;

        var iterator = otpStorage.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            OtpData otpData = entry.getValue();

            if (otpData.isExpired()) {
                expiredCount++;
                iterator.remove();
            } else if (!otpData.canAttempt()) {
                maxAttemptsCount++;
                iterator.remove();
            }
        }

        int totalRemoved = expiredCount + maxAttemptsCount;

        if (totalRemoved > 0) {
            log.info("Cleanup completed: {} expired, {} max attempts exceeded. Total removed: {}. Remaining: {}",
                    expiredCount, maxAttemptsCount, totalRemoved, otpStorage.size());
        }
    }

    public String getStorageStatistics() {
        return String.format("Total OTPs: %d", otpStorage.size());
    }
}
