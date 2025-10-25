package com.devteria.identity.service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import com.devteria.identity.dto.response.*;
import com.devteria.identity.repository.httpclient.FacebookGraphApi;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
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
    private final PasswordEncoder passwordEncoder;
    FacebookGraphApi facebookGraphApi;
    RestTemplate restTemplate = new RestTemplate();
    RefreshTokenService refreshTokenService;

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

    @NonFinal
    private String FACEBOOK_GRANT_TYPE = "authorization_code";

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

        var user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.AUTH_REQUIRED));

        return toAuthenticationResponse(getAuthorizationData(user));
    }
    // end refresh token

    // logic login and onboard user
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
                                user = userRepository.findByUsername(userInfo.getEmail()).orElseGet(() -> {
                    User newUser = User.builder()
                            .username(userInfo.getEmail())
                            .email(userInfo.getEmail())
                            .firstName(userInfo.getGivenName())
                            .lastName(userInfo.getFamilyName())
                            .avatarUrl(userInfo.getPicture())
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
                                .grantType(FACEBOOK_GRANT_TYPE)
                                .redirectUri(FACEBOOK_CALLBACK_URL)
                                .build());
                String userInfoUrl = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=" + fbAccessToken.getAccessToken();
                FacebookUserInfoResponse fbUserInfo = restTemplate.getForObject(userInfoUrl, FacebookUserInfoResponse.class);

                String username = fbUserInfo.getName();

                user = userRepository.findByUsername(username).orElseGet(() -> {
                    User newUser = User.builder()
                            .username(username)
                            .firstName(fbUserInfo.getName())
                            .avatarUrl(fbUserInfo.getPicture().getData().getUrl())
                            .roles(Collections.singleton(
                                    Role.builder().name(PredefinedRole.USER_ROLE).build()))
                            .build();
                    return userRepository.save(newUser);
                });
                break;
            default:
                throw new AppException(ErrorCode.AUTH_PROVIDER_NOT_SUPPORTED);
        }

        return toAuthenticationResponse(getAuthorizationData(user));
    }

    // logic authen & login with username, not social login
    public AuthorizationData authenticate(AuthenticationRequest request) {
        var userByUsername = userRepository
                .findByUsername(request.getUsername())
                .orElse(null);
        var userByEmail = userRepository.findByEmail(request.getUsername())
                .orElse(null);

        if (userByUsername == null && userByEmail == null)
            throw new AppException(ErrorCode.USER_NOT_FOUND);

        var user = (userByUsername != null) ? userByUsername : userByEmail;
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS);

//        if (!user.isEmailVerified()) {
//            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
//        }

        return getAuthorizationData(user);
    }

    public void logout(HttpServletRequest request,
                       HttpServletResponse response) throws ParseException, JOSEException {
        String refreshToken = getCookieValue(request, "refreshToken");
        if (refreshToken != null) {
            //Claims c = jwtService.parseRefreshToken(refreshToken);
            //refreshTokenService.revokeAllForUser(c.getSubject());
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true).secure(true).path("/auth").maxAge(0).build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    // convert data to response
    private AuthenticationResponse toAuthenticationResponse(AuthorizationData data) {
        return AuthenticationResponse.builder()
                .accessToken(data.accessToken())
                .expiryTime(data.accessTokenExpiry().toEpochMilli())
                .roles(data.roles())
                .build();
    }

    // get authorization data for user. it's used to save to App
    private AuthorizationData getAuthorizationData(User user) {
        Instant now = Instant.now();
        Instant accessTokenExpiry = now.plus(VALID_DURATION, ChronoUnit.SECONDS);
        Instant refreshTokenExpiry = now.plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS);
        Set<String> roles = new HashSet<>();
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> roles.add(role.getName()));
        }

        String accessToken = generateToken(user, accessTokenExpiry, "access", roles);
        String refreshToken = generateToken(user, refreshTokenExpiry, "refresh", roles);


        return new AuthorizationData(accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry, roles);
    }

    // generate token for user
    private String generateToken(User user, Instant expiry, String tokenType, Set<String> roles) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        System.out.println("JWSHeader: " + header.toJSONObject());

        JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("devteria.com")
                .issueTime(new Date())
                .expirationTime(Date.from(expiry))
                .jwtID(UUID.randomUUID().toString())
                .claim("token_type", tokenType)
                .claim("roles", roles);

        // Chỉ thêm scope cho access token
        //        if ("access".equals(tokenType)) {
        //            claimsBuilder.claim("scope", buildScope(user));
        //        }

        JWTClaimsSet jwtClaimsSet = claimsBuilder.build();
        System.out.println("JWTClaimsSet: " + jwtClaimsSet.toJSONObject());

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        System.out.println("JWSObject trước khi ký: " + jwsObject.getPayload());

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            String serializedToken = jwsObject.serialize();
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    // verify refresh token
    private SignedJWT verifyRefreshToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Verify signature
        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Check if token is expired
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (expiryTime.before(new Date())) {
            throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED);
        }

        // Check if token is refresh token
        String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("token_type");
        if (!"refresh".equals(tokenType)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Check if token is invalidated
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
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

        if (!(verified && expiryTime.after(new Date()))) throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);

        return signedJWT;
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
    public record AuthorizationData(
            String accessToken,
            String refreshToken,
            Instant accessTokenExpiry,
            Instant refreshTokenExpiry,
            Set<String> roles) {}
}
