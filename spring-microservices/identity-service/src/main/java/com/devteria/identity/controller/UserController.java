package com.devteria.identity.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.ChangePasswordRequest;
import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.PaginatedResponse;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.service.EmailVerificationService;
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
    EmailVerificationService emailVerificationService;

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

    @PostMapping("/registration/verify-email")
    ApiResponse<UserResponse> verifyEmailAndRegister(@RequestParam String email, @RequestParam String otpCode) {
        try {
            Object result = emailVerificationService.verifyOtp(email, otpCode);

            if (result instanceof UserResponse) {
                return ApiResponse.<UserResponse>builder()
                        .result((UserResponse) result)
                        .build();
            } else {
                throw new RuntimeException("Unexpected verification result type");
            }
        } catch (Exception e) {
            log.error("Error verifying email and registering user: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/registration")
    ApiResponse<UserResponse> registerUser(@RequestBody @Valid RegisterRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    //    ApiResponse<UserResponse> createUser()

    @GetMapping
    ApiResponse<PaginatedResponse<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ApiResponse.<PaginatedResponse<UserResponse>>builder()
                .result(userService.getUsers(page, size, sortBy, sortDirection))
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

    //    @PutMapping("/roles")
    //    ApiResponse<UserResponse> updateRoles(@RequestBody RoleUpdateRequest request){
    //        return ApiResponse.<UserResponse>builder()
    //                .result(userService.updateUserRoles(request))
    //                .build();
    //    }
}
