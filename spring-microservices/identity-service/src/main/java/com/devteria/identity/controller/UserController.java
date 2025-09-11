package com.devteria.identity.controller;

import java.util.List;

import com.devteria.identity.dto.request.ChangePasswordRequest;
import com.devteria.identity.dto.response.PaginatedResponse;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.service.UserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;

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
            @RequestParam(defaultValue = "ASC") String sortDirection
    ) {
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
        userService.updateProfileSuperAdmin(request);
        return ApiResponse.success(
                userService.getMyInfo(),
                "Update profile successfully"
        );
    }

    @PutMapping(value = "/update-avatar", consumes = "multipart/form-data")
    ApiResponse<String> updateProfileSuperAdmin(@RequestPart("file") MultipartFile file) {
        String url = userService.uploadAvatar(file);
        return ApiResponse.success(
                url,
                "Update profile successfully"
        );
    }

    @PutMapping("/change-password")
    ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<Void>success(
                null,
                "Password changed successfully"
        );
    }

    //    @PutMapping("/roles")
    //    ApiResponse<UserResponse> updateRoles(@RequestBody RoleUpdateRequest request){
    //        return ApiResponse.<UserResponse>builder()
    //                .result(userService.updateUserRoles(request))
    //                .build();
    //    }
}
