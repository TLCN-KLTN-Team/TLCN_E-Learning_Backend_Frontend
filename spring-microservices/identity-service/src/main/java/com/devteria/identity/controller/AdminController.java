package com.devteria.identity.controller;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.UserRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.service.AdminService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminController {

    AdminService adminService;
    @PostMapping
    public ApiResponse<UserResponse> createAdmin(@Valid @RequestBody UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(adminService.createAdmin(request))
                .build();
    }
}
