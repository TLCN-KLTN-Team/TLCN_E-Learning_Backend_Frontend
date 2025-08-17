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

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Value("${jwt.valid-duration:3600}")
    private long validDuration;

    public String generateServiceToken() {
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
                    .claim("token_type", "access") // Match identity-service token type
                    .claim("scope", "ROLE_ADMIN") // Match identity-service scope format
                    .build();

            Payload payload = new Payload(jwtClaimsSet.toJSONObject());
            JWSObject jwsObject = new JWSObject(header, payload);

            jwsObject.sign(new MACSigner(signerKey.getBytes()));

            String token = jwsObject.serialize();
            log.debug("Generated service token for course-management with ROLE_ADMIN scope");
            return token;

        } catch (JOSEException e) {
            log.error("Cannot create service token", e);
            throw new RuntimeException("Failed to generate service token", e);
        }
    }

    public boolean isTokenValid(String token) {
        try {
            // Basic validation - in production, should verify signature and expiration
            return token != null && !token.isEmpty();
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return false;
        }
    }
}
