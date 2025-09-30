package com.devteria.identity.service;

import com.devteria.identity.entity.ResetToken;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ResetTokenService {

    private final ConcurrentHashMap<String, ResetToken> tokenStorage = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateResetToken(String email) {
        // Tạo token an toàn
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Lưu token
        ResetToken resetToken = new ResetToken(token, email);
        tokenStorage.put(token, resetToken);

        log.info("Generated reset token for email: {} (Total tokens: {})", email, tokenStorage.size());
        return token;
    }

    public String validateAndGetEmail(String token) {
        ResetToken resetToken = tokenStorage.get(token);

        if (resetToken == null) {
            log.error("Reset token not found: {}", token);
            throw new AppException(ErrorCode.INVALID_RESET_TOKEN);
        }

        if (!resetToken.isValid()) {
            log.error("Reset token expired or already used: {}", token);
            tokenStorage.remove(token);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }

        return resetToken.getEmail();
    }

    public void markTokenAsUsed(String token) {
        ResetToken resetToken = tokenStorage.get(token);
        if (resetToken != null) {
            resetToken.markAsUsed();
            tokenStorage.remove(token); // Remove immediately after use
            log.info("Reset token marked as used and removed: {}", token);
        }
    }

    public void removeToken(String token) {
        ResetToken removed = tokenStorage.remove(token);
        if (removed != null) {
            log.info("Reset token removed: {} (Remaining: {})", token, tokenStorage.size());
        }
    }

    @Scheduled(fixedRate = 300000) // Chạy mỗi 5 phút
    public void cleanupExpiredTokens() {
        int initialSize = tokenStorage.size();
        tokenStorage.entrySet().removeIf(entry -> !entry.getValue().isValid());
        int removedCount = initialSize - tokenStorage.size();

        if (removedCount > 0) {
            log.info("Cleaned up {} expired reset tokens. Remaining: {}", removedCount, tokenStorage.size());
        }
    }

    public int getTokenCount() {
        return tokenStorage.size();
    }
}
