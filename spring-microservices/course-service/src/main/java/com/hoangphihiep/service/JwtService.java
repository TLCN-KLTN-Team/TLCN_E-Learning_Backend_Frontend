package com.hoangphihiep.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Value("${jwt.valid-duration:3600}")
    private long validDuration;

    // Cache để lưu token, tránh generate liên tục
    private final ConcurrentMap<String, TokenInfo> tokenCache = new ConcurrentHashMap<>();

    private static class TokenInfo {
        String token;
        Instant expiration;

        TokenInfo(String token, Instant expiration) {
            this.token = token;
            this.expiration = expiration;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiration.minus(300, ChronoUnit.SECONDS)); // Refresh 5 minutes before expiry
        }
    }

    public String generateServiceToken() {
        String cacheKey = "course-management-service";
        TokenInfo cachedToken = tokenCache.get(cacheKey);

        // Return cached token if still valid
        if (cachedToken != null && !cachedToken.isExpired()) {
            return cachedToken.token;
        }

        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

            Instant now = Instant.now();
            Instant expiration = now.plus(validDuration, ChronoUnit.SECONDS);

            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject("course-management-service")
                    .issuer("devteria.com") // Match identity-service issuer
                    .issueTime(new Date())
                    .expirationTime(Date.from(expiration))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("token_type", "access")
                    .claim("scope", "ROLE_ADMIN") // Make sure this matches identity service expectations
                    .build();

            Payload payload = new Payload(jwtClaimsSet.toJSONObject());
            JWSObject jwsObject = new JWSObject(header, payload);

            jwsObject.sign(new MACSigner(signerKey.getBytes()));

            String token = jwsObject.serialize();

            // Cache the token
            tokenCache.put(cacheKey, new TokenInfo(token, expiration));

            log.debug("Generated and cached new service token for course-management");
            return token;

        } catch (JOSEException e) {
            log.error("Cannot create service token", e);
            throw new RuntimeException("Failed to generate service token", e);
        }
    }

    public boolean isTokenValid(String token) {
        try {
            return token != null && !token.isEmpty();
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return false;
        }
    }

    // Method to clear cache if needed
    public void clearTokenCache() {
        tokenCache.clear();
        log.debug("Token cache cleared");
    }
}
