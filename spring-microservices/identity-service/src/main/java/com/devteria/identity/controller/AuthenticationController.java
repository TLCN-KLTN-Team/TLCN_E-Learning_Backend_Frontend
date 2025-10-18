package com.devteria.identity.controller;

import java.text.ParseException;

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

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request) {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .message("Token refreshed successfully")
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder().build();
    }
}
