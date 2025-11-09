package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import org.springframework.data.domain.Page;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        configuration = FeignClientConfig.class
)
public interface TeacherRepository {
    @PostMapping("/teachers")
    ApiResponse<TeacherResponse> createTeacher(@RequestBody TeacherRequest teacherRequest);

    @GetMapping("/teachers/by-teacher-id/{teacherId}")
    ApiResponse<TeacherResponse> getTeacherByTeacherId(@PathVariable String teacherId);

    @GetMapping("/teachers/by-educationalUnit/{educationalUnitId}")
    ApiResponse<Page<TeacherResponse>> getTeachersByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search);

    @PutMapping("/teachers/{id}")
    ApiResponse<TeacherResponse> updateTeacher(@PathVariable String id, @RequestBody TeacherRequest request);

    @DeleteMapping("/teachers/{id}")
    ApiResponse<Void> deleteTeacher(@PathVariable String id);

    @GetMapping("/teachers/by-user-id/{userId}")
    ApiResponse<TeacherResponse> getTeacherByUserId(@PathVariable String userId);

    @PutMapping("/teachers/{id}/status")
    ApiResponse<TeacherResponse> updateTeacherAccountStatus(
            @PathVariable String id,
            @RequestParam String status);
}
