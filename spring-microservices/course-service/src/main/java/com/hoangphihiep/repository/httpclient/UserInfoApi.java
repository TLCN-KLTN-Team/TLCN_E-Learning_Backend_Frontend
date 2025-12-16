package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.AuthenticationRequestInterceptor;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-info", url = "${app.services.identity}",
        configuration = {AuthenticationRequestInterceptor.class}
)
public interface UserInfoApi {
    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUserInfo(@PathVariable String userId);
    
    @GetMapping("/teachers/count-by-educational-unit/{educationalUnitId}")
    ApiResponse<Long> countTeachersByEducationalUnit(@PathVariable Integer educationalUnitId);
    
    @GetMapping("/students/count-by-educational-unit/{educationalUnitId}")
    ApiResponse<Long> countStudentsByEducationalUnit(@PathVariable Integer educationalUnitId);
    
    @GetMapping("/students/{studentId}/educational-unit")
    ApiResponse<Integer> getStudentEducationalUnit(@PathVariable String studentId);
}
