package com.devteria.identity.service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.devteria.identity.dto.response.*;
import com.devteria.identity.repository.httpclient.FacebookGraphApi;
import com.devteria.identity.utils.CookiesUtils;
import com.devteria.identity.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.*;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;

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
    FacebookGraphApi facebookGraphApi;
    RestTemplate restTemplate = new RestTemplate();
    JwtUtils jwtUtils;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${outbound.google.client-id}")
    private String GOOGLE_CLIENT_ID;

    @NonFinal
    @Value("${outbound.google.client-secret}")
    private String GOOGLE_CLIENT_SECRET;

    @NonFinal
    private String GRANT_TYPE = "authorization_code";

    @NonFinal
    @Value("${outbound.google.callback-url}")
    private String GOOGLE_CALLBACK_URL;

    @NonFinal
    @Value("${outbound.facebook.client-id}")
    private String FACEBOOK_CLIENT_ID;

    @NonFinal
    @Value("${outbound.facebook.client-secret}")
    private String FACEBOOK_CLIENT_SECRET;

    @NonFinal
    @Value("${outbound.facebook.callback-url}")
    private String FACEBOOK_CALLBACK_URL;

    // logic check if exist token. it's used to verify token when access secure API
    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            return IntrospectResponse.builder().valid(jwtUtils.verifyToken(request.getToken())).build();
        } catch (JOSEException | ParseException e) {
            throw new RuntimeException(e);
        }
    }

    // refresh token logic
    public String refreshToken(Map request) throws ParseException, JOSEException {
        String refreshToken = (String) request.get("refreshToken");
        // validate refresh token
        if (refreshToken == null || refreshToken.isEmpty() || !jwtUtils.verifyToken(refreshToken)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }
        // new access token
        String userId = jwtUtils.extractUserId(refreshToken);
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return jwtUtils.generateToken(
                user,
                Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS),
                roles,
                "access"
        );
    }
    // end refresh token

    // logic login and onboard user with social login
    public AuthenticationResponse outboundAuthenticate(String code, String provider) {
        provider = provider.trim().toLowerCase();
        User user = null;
        switch (provider){
            case "google":
                ExchangeTokenResponse accessToken =
                        outboundAuthenticationClient.exchangeGoogleAccessToken(ExchangeTokenRequest.builder()
                                .code(code)
                                .clientId(GOOGLE_CLIENT_ID)
                                .clientSecret(GOOGLE_CLIENT_SECRET)
                                .grantType(GRANT_TYPE)
                                .redirectUri(GOOGLE_CALLBACK_URL)
                                .build());
                GoogleUserInfoResponse userInfo = outboundUserInfoClient.getUserInfo("json", accessToken.getAccessToken());
                                user = userRepository.findByEmail(userInfo.getEmail()).orElseGet(() -> {
                    User newUser = User.builder()
                            .email(userInfo.getEmail())
                            .firstName(userInfo.getGivenName())
                            .lastName(userInfo.getFamilyName())
                            .avatarUrl(userInfo.getPicture())
                            .isEmailVerified(true)
                            .roles(Collections.singleton(
                                    Role.builder().name(PredefinedRole.USER_ROLE).build()))
                            .build();
                    log.info("NEW USER: {}", newUser);
                    return userRepository.save(newUser);
                });
                break;
            case "facebook":
                var fbAccessToken =
                        facebookGraphApi.exchangeToken(ExchangeTokenRequest.builder()
                                .code(code)
                                .clientId(FACEBOOK_CLIENT_ID)
                                .clientSecret(FACEBOOK_CLIENT_SECRET)
                                .grantType(GRANT_TYPE)
                                .redirectUri(FACEBOOK_CALLBACK_URL)
                                .build());
                String userInfoUrl = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=" + fbAccessToken.getAccessToken();
                FacebookUserInfoResponse fbUserInfo = restTemplate.getForObject(userInfoUrl, FacebookUserInfoResponse.class);

                String username = fbUserInfo.getName();

                user = userRepository.findByEmail(username).orElseGet(() -> {
                    User newUser = User.builder()
                            .email(username)
                            .firstName(fbUserInfo.getName())
                            .avatarUrl(fbUserInfo.getPicture().getData().getUrl())
                            .roles(Collections.singleton(
                                    Role.builder().name(PredefinedRole.USER_ROLE).build()))
                            .isEmailVerified(true)
                            .build();
                    return userRepository.save(newUser);
                });
                break;
            default:
                throw new AppException(ErrorCode.AUTH_PROVIDER_NOT_SUPPORTED);
        }

        return getAuthorizationData(user);
    }
    // end social login

    // logic authen & login with username, not social login
    public AuthenticationResponse authenticate(AuthenticationRequest request) throws ParseException, JOSEException {
        var userByEmail = userRepository.findByEmail(request.getUsername())
                .orElse(null);

        var userByUsername = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        User user = userByEmail != null ? userByEmail : userByUsername;

        if (user == null)
            throw new AppException(ErrorCode.USER_NOT_FOUND);

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS);

        if (!user.isEmailVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }

        return getAuthorizationData(user);
    }

    public void logout(String refreshToken) throws ParseException, JOSEException {
        // add refresh token to invalidated list
        if (refreshToken != null && !refreshToken.isEmpty() && jwtUtils.verifyToken(refreshToken)) {
            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jwtUtils.extractUserId(refreshToken))
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);
        }
    }

    // get authorization data for user. it's used to save to App
    private AuthenticationResponse getAuthorizationData(User user) {
        Instant now = Instant.now();
        Instant accessTokenExpiry = now.plus(VALID_DURATION, ChronoUnit.SECONDS);
        Instant refreshTokenExpiry = now.plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS);
        Set<String> roles = new HashSet<>();
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> roles.add(role.getName()));
        }

        String accessToken = jwtUtils.generateToken(user, accessTokenExpiry, roles, "access");
        String refreshToken = jwtUtils.generateToken(user, refreshTokenExpiry, roles, "refresh");

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .roles(roles)
                .build();
    }

    // build scope for user
    //    private String buildScope(User user) {
    //        StringJoiner stringJoiner = new StringJoiner(" ");
    //
    //        if (!CollectionUtils.isEmpty(user.getRoles()))
    //            user.getRoles().forEach(role -> {
    //                stringJoiner.add("ROLE_" + role.getName());
    //                if (!CollectionUtils.isEmpty(role.getPermissions()))
    //                    role.getPermissions().forEach(permission -> stringJoiner.add(permission.getName()));
    //            });
    //
    //        return stringJoiner.toString();
    //    }

    // record to hold authorization data. record in new Java version is immutable and provides a concise way to define
    // data classes.
    private record AuthorizationData(
            String accessToken,
            String refreshToken,
            Instant accessTokenExpiry,
            Instant refreshTokenExpiry,
            Set<String> roles) {}
}
