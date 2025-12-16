package com.devteria.identity.utils;

import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.InvalidatedTokenRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtUtils {
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Value("${jwt.valid-duration}")
    private long EXPIRATION_TIME;

    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    public boolean validateToken(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        long currentTime = System.currentTimeMillis();
        return signedJWT.getJWTClaimsSet().getExpirationTime().getTime() >= currentTime;
    }

    public String extractUserId(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        return signedJWT.getJWTClaimsSet().getSubject();
    }

    public String generateToken(User user, Instant expiry, String role, String tokenType){
        // A jwt contains three parts: Header, Payload, and Signature
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issueTime(Date.from(Instant.now()))
                .expirationTime(Date.from(expiry))
                .issuer("devzeus.com")
                .claim("token_type", tokenType)
                .claim("scope", role)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (KeyLengthException e) {
            throw new RuntimeException(e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    public String generateServiceToken(String serviceName, Instant expiry) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(serviceName)
                .issueTime(Date.from(Instant.now()))
                .expirationTime(Date.from(expiry))
                .issuer("devzeus.com")
                .claim("token_type", serviceName)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (KeyLengthException e) {
            throw new RuntimeException(e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    public boolean verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Verify signature
        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Check token type - support both user tokens and service tokens
        String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("token_type");
        String type = signedJWT.getJWTClaimsSet().getStringClaim("type");
        
        // If it's a service token, only verify signature and expiration
        if ("service-token".equals(type)) {
            Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expiryTime.before(new Date())) {
                return false;
            }
            return true;
        }
        
        // For user tokens, check token_type
        if (!"refresh".equals(tokenType) && !"access".equals(tokenType)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Check if token is invalidated
        if ("refresh".equals(tokenType) && invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getSubject())) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Check if token is expired
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (expiryTime.before(new Date())) {
            return false;
        }

        return true;
    }
    
    public boolean isServiceToken(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        String type = signedJWT.getJWTClaimsSet().getStringClaim("type");
        return "service-token".equals(type);
    }
}
