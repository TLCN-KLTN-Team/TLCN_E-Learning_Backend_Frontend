package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.request.UserRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        contextId = "identityServiceClient1",
        configuration = FeignClientConfig.class
)
public interface UserRepository {
    @PostMapping("/admin")
    ApiResponse<UserResponse> createUser(@RequestBody UserRequest request);

}
