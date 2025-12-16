package com.devteria.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.ChangePasswordRequest;
import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.PaginatedResponse;
import com.devteria.identity.dto.response.UserChatInfo;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.service.UserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;

    @PostMapping("/registration/send-verification")
    ApiResponse<String> sendEmailVerification(@RequestBody @Valid RegisterRequest request) {
        try {
            userService.sendEmailVerification(request);
            return ApiResponse.<String>builder()
                    .result("Mã OTP đã được gửi thành công. Vui lòng kiểm tra email và nhập mã OTP.")
                    .build();
        } catch (Exception e) {
            log.error("Error sending email verification: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/registration/verify-account")
    ApiResponse<Void> verifyAccount(@RequestParam String email, @RequestParam String otpCode) {
        userService.verifyAccount(email, otpCode);
        return ApiResponse.success(null, "Xác thực email thành công. Tài khoản của bạn đã được kích hoạt.");
    }

    @PostMapping("/registration")
    ApiResponse<String> registerUser(@RequestBody @Valid RegisterRequest request) {
        return ApiResponse.<String>builder()
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping
    ApiResponse<PaginatedResponse<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String keyword,
            @RequestParam String role,
            @RequestParam String status) {
        return ApiResponse.<PaginatedResponse<UserResponse>>builder()
                .result(userService.getUsers(page, size, keyword, role, status))
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/me")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @GetMapping("/student/ids")
    ApiResponse<?> getUserByStudentIds(@RequestParam String keyword) {
        return ApiResponse.<List<UserChatInfo>>builder()
                .result(userService.getUserIdsByStudentIds(keyword))
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    @PutMapping("/{userId}/inactivate")
    ApiResponse<Void> inactivateUser(@PathVariable String userId) {
        userService.softDeleteUser(userId);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

    @PutMapping("/update-profile")
    ApiResponse<UserResponse> updateProfile(@RequestBody UserUpdateRequest request) {
        userService.updateProfile(request);
        return ApiResponse.success(userService.getMyInfo(), "Update profile successfully");
    }

    @PutMapping(value = "/update-avatar", consumes = "multipart/form-data")
    ApiResponse<String> updateProfile(@RequestPart("file") MultipartFile file) {
        String url = userService.uploadAvatar(file);
        return ApiResponse.success(url, "Update profile successfully");
    }

    @PutMapping("/change-password")
    ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<Void>success(null, "Password changed successfully");
    }

    @PutMapping(value = "/verify-email-by-super-admin", consumes = "multipart/form-data")
    ApiResponse<Void> verifyEmailBySuperAdmin(@RequestPart("email") String email) {
        userService.adminVerifyAccount(email);
        return ApiResponse.<Void>success(null, "Email verified successfully by Super Admin");
    }

    @PutMapping("change-status")
    ApiResponse<Void> changeUserStatus(@RequestParam String userId, @RequestParam String status) {
        userService.changeAccountStatus(userId, status);
        return ApiResponse.<Void>success(null, "User status changed successfully");
    }
}
