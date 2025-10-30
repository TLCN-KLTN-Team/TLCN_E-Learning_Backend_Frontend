package com.devteria.identity.controller;

import java.text.ParseException;
import java.util.Map;

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

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticateToken(@RequestBody IntrospectRequest request) {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PostMapping("/outbound/authenticate")
    ApiResponse<AuthenticationResponse> loginBySocial(@RequestParam("code") String code,
                                                             @RequestParam("provider") String provider) {
        var result = authenticationService.outboundAuthenticate(code, provider);
        return ApiResponse.<AuthenticationResponse>builder()
                .message("Authentication successful")
                .result(result)
                .build();
    }

    @PostMapping("/login")
    ApiResponse<AuthenticationResponse> loginByUsernameOrEmail(@RequestBody AuthenticationRequest request,
                                                               HttpServletRequest httpRequest,
                                                               HttpServletResponse response) throws ParseException, JOSEException {

        AuthenticationResponse result = authenticationService.authenticate(request);

        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<String> refreshToken(@RequestBody Map refreshToken) throws ParseException, JOSEException {

        var result = authenticationService.refreshToken(refreshToken);

        return ApiResponse.<String>builder()
                .message("Token refreshed successfully")
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestParam("refreshToken") String refreshToken) throws ParseException, JOSEException {
        authenticationService.logout(refreshToken);
        return ApiResponse.<Void>builder().build();
    }
}
