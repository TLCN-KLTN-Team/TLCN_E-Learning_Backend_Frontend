package com.devteria.identity.service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.*;
import com.devteria.identity.dto.response.AuthenticationResponse;
import com.devteria.identity.dto.response.ExchangeTokenResponse;
import com.devteria.identity.dto.response.GoogleUserInfoResponse;
import com.devteria.identity.dto.response.IntrospectResponse;
import com.devteria.identity.entity.InvalidatedToken;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.InvalidatedTokenRepository;
import com.devteria.identity.repository.UserRepository;
import com.devteria.identity.repository.httpclient.OutboundAuthenticationClient;
import com.devteria.identity.repository.httpclient.OutboundUserInfoClient;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    OutboundAuthenticationClient outboundAuthenticationClient;
    OutboundUserInfoClient outboundUserInfoClient;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${outbound.identity.client-id}")
    private String CLIENT_ID;

    @NonFinal
    @Value("${outbound.identity.client-secret}")
    private String CLIENT_SECRET;

    @NonFinal
    private String GRANT_TYPE = "authorization_code";

    @NonFinal
    @Value("${outbound.identity.redirect-url}")
    private String REDIRECT_URI;

    // logic refresh token
    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (AppException | JOSEException | ParseException e) {
            isValid = false;
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }
    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyRefreshToken(request.getToken());

        var jit = signedJWT.getJWTClaimsSet().getJWTID();
        var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken =
                InvalidatedToken.builder().id(jit).expiryTime(expiryTime).build();

        invalidatedTokenRepository.save(invalidatedToken);

        var userId = signedJWT.getJWTClaimsSet().getSubject();

        var user =
                userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        return toAuthenticationResponse(getAuthorizationData(user));
    }
    // end refresh token

    // logic login and onboard user
    public AuthenticationResponse outboundAuthenticate(String code) {
        ExchangeTokenResponse accessToken =
                outboundAuthenticationClient.exchangeAccessToken(ExchangeTokenRequest.builder()
                        .code(code)
                        .clientId(CLIENT_ID)
                        .clientSecret(CLIENT_SECRET)
                        .grantType(GRANT_TYPE)
                        .redirectUri(REDIRECT_URI)
                        .build());
        log.info("EXCHANGE TOKEN RESPONSE: {}", accessToken);

        GoogleUserInfoResponse userInfo = outboundUserInfoClient.getUserInfo("json", accessToken.getAccessToken());
        log.info("EXCHANGE USER INFO RESPONSE: {}", userInfo);

        User user = userRepository.findByUsername(userInfo.getEmail()).orElseGet(() -> {
            User newUser = User.builder()
                    .username(userInfo.getEmail())
                    .emailVerified(userInfo.isVerifiedEmail())
                    .roles(Collections.singleton(
                            Role.builder().name(PredefinedRole.USER_ROLE).build()))
                    .build();
            log.info("NEW USER: {}", newUser);
            return userRepository.save(newUser);
        });

        return toAuthenticationResponse(getAuthorizationData(user));
    }

    // logic authen & login with username, not social login
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = userRepository
                .findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) throw new AppException(ErrorCode.INVALID_CREDENTIALS);

        return toAuthenticationResponse(getAuthorizationData(user));
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try {
            var signToken = verifyToken(request.getToken(), true);

            String jit = signToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken =
                    InvalidatedToken.builder().id(jit).expiryTime(expiryTime).build();

            invalidatedTokenRepository.save(invalidatedToken);
        } catch (AppException exception) {
            log.info("Token already expired");
        }
    }

    // convert data to response
    private AuthenticationResponse toAuthenticationResponse(AuthorizationData data){
        return AuthenticationResponse.builder()
                .accessToken(data.accessToken())
                .refreshToken(data.refreshToken())
                .expiryTime(data.accessTokenExpiry().toEpochMilli())
                .refreshExpiryTime(data.refreshTokenExpiry().toEpochMilli())
                .roles(data.roles())
                .build();
    }

    // get authorization data for user. it's used to save to App
    private AuthorizationData getAuthorizationData(User user) {
        Instant now = Instant.now();
        Instant accessTokenExpiry = now.plus(VALID_DURATION, ChronoUnit.SECONDS);
        Instant refreshTokenExpiry = now.plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS);

        String accessToken = generateToken(user, accessTokenExpiry, "access");
        String refreshToken = generateToken(user, refreshTokenExpiry, "refresh");

        Set<String> roles = new HashSet<>();
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> roles.add(role.getName()));
        }

        return new AuthorizationData(accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry, roles);
    }

    // generate token for user
    private String generateToken(User user, Instant expiry, String tokenType) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("devteria.com")
                .issueTime(new Date())
                .expirationTime(Date.from(expiry))
                .jwtID(UUID.randomUUID().toString())
                .claim("token_type", tokenType);

        // Chỉ thêm scope cho access token
        if ("access".equals(tokenType)) {
            claimsBuilder.claim("scope", buildScope(user));
        }

        JWTClaimsSet jwtClaimsSet = claimsBuilder.build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    // verify refresh token
    private SignedJWT verifyRefreshToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Verify signature
        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Check if token is expired
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (expiryTime.before(new Date())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Check if token is refresh token
        String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("token_type");
        if (!"refresh".equals(tokenType)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Check if token is invalidated
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    // verify token for access token
    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT
                        .getJWTClaimsSet()
                        .getIssueTime()
                        .toInstant()
                        .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                        .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

    // build scope for user
    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions()))
                    role.getPermissions().forEach(permission -> stringJoiner.add(permission.getName()));
            });

        return stringJoiner.toString();
    }

    // record to hold authorization data. record in new Java version is immutable and provides a concise way to define data classes.
    private record AuthorizationData(String accessToken, String refreshToken, Instant accessTokenExpiry, Instant refreshTokenExpiry, Set<String> roles) {}
}
