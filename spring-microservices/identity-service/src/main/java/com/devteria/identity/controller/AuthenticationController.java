package com.devteria.identity.controller;

import java.text.ParseException;

import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.*;
import com.devteria.identity.dto.response.AuthenticationResponse;
import com.devteria.identity.dto.response.IntrospectResponse;
import com.devteria.identity.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;
    RefreshTokenService refreshTokenService;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

//    @GetMapping("/outbound/social-login")
//    ApiResponse<String> socialLogin(@RequestParam("provider") String provider) {
//        return ApiResponse.success(
//                "Redirect to social login URL",
//                authenticationService.getProviderOAuthUrl(provider));
//    }

    @PostMapping("/outbound/authenticate")
    ApiResponse<AuthenticationResponse> outboundAuthenticate(@RequestParam("code") String code,
                                                             @RequestParam("provider") String provider) {
        var result = authenticationService.outboundAuthenticate(code, provider);
        return ApiResponse.<AuthenticationResponse>builder()
                .message("Authentication successful")
                .result(result)
                .build();
    }

    @PostMapping("/login")
    ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationRequest request,
                                                     HttpServletResponse response) throws ParseException, JOSEException {
        AuthenticationService.AuthorizationData data = authenticationService.authenticate(request);

        refreshTokenService.saveRefreshToken(
                CreateRefreshTokenRequest.builder()
                        .token(data.refreshToken())
                        .ipAddress(null)
                        .build()
        );

        ResponseCookie cookie = ResponseCookie.from("refreshToken", data.refreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(REFRESHABLE_DURATION) // 7 days
                .sameSite("Strict")
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        var result = AuthenticationResponse.builder()
                .accessToken(data.accessToken())
                .expiryTime(data.accessTokenExpiry().toEpochMilli())
                .roles(data.roles())
                .build();

        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request) {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refreshToken(HttpServletRequest request,
                                                     HttpServletResponse response) throws ParseException, JOSEException {
        String refreshToken = getCookieValue(request, "refreshToken");
        if (refreshToken == null) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        RefreshRequest refreshRequest = RefreshRequest.builder()
                .token(refreshToken)
                .build();

        var result = authenticationService.refreshToken(refreshRequest);

        return ApiResponse.<AuthenticationResponse>builder()
                .message("Token refreshed successfully")
                .result(result)
                .build();
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

    @PostMapping("/logout")
    ApiResponse<Void> logout(HttpServletRequest request,
                             HttpServletResponse response) throws ParseException, JOSEException {
        authenticationService.logout(request,response);
        return ApiResponse.<Void>builder().build();
    }
}
