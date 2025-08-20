package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        configuration = FeignClientConfig.class
)
public interface TeacherRepository {
    @PostMapping("/teachers")
    ApiResponse<TeacherResponse> createTeacher(@RequestBody TeacherRequest teacherRequest);
}
