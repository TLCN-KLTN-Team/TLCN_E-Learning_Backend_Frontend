package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.request.UserRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        contextId = "identityServiceClient1",
        configuration = FeignClientConfig.class
)
public interface UserRepository {
    @PostMapping("/admin")
    ApiResponse<UserResponse> createUser(@RequestBody UserRequest request);

    @GetMapping("/users/me")
    ApiResponse<UserResponse> getCurrentUser();

    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUserById(@PathVariable("userId") String userId);

    @GetMapping("/users/countUsers")
    ApiResponse<Integer> countUsersByRole(@RequestParam("role") String role);

    @GetMapping("/users/by-role")
    ApiResponse<List<UserResponse>> getUsersByRole(@RequestParam("role") String role);

}
