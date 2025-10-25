package com.devteria.identity.service;

import com.devteria.identity.dto.request.CreateRefreshTokenRequest;
import com.devteria.identity.entity.RefreshToken;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.RefreshTokenRepository;
import com.devteria.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public void saveRefreshToken(CreateRefreshTokenRequest request) {
        String tokenHash = hashToken(request.getToken());

        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .ipAddress(request.getIpAddress())
                .createdAt(java.time.LocalDateTime.now())
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            // Encode để lưu trữ gọn hơn trong DB
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing refresh token", e);
        }
    }
}
