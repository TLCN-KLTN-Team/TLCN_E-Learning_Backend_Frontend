package com.devteria.identity.configuration;

import java.text.ParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CustomJwtDecoder implements JwtDecoder {
    
    @Value("${jwt.signerKey}")
    private String signerKey;
    
    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            
            // Verify signature
            JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
            if (!signedJWT.verify(verifier)) {
                throw new JwtException("Invalid token signature");
            }
            
            Map<String, Object> claims = new HashMap<>(signedJWT.getJWTClaimsSet().getClaims());
            String type = signedJWT.getJWTClaimsSet().getStringClaim("type");
            
            // If it's a service token, add service authorities
            if ("service-token".equals(type)) {
                log.debug("Processing service token from issuer: {}", signedJWT.getJWTClaimsSet().getIssuer());
                // Grant service tokens full access by adding ADMIN role
                claims.put("roles", List.of("ADMIN", "SERVICE"));
            }

            return new Jwt(
                    token,
                    signedJWT.getJWTClaimsSet().getIssueTime().toInstant(),
                    signedJWT.getJWTClaimsSet().getExpirationTime().toInstant(),
                    signedJWT.getHeader().toJSONObject(),
                    claims);

        } catch (ParseException e) {
            throw new JwtException("Invalid token", e);
        } catch (JOSEException e) {
            throw new JwtException("Token verification failed", e);
        }
    }

}
