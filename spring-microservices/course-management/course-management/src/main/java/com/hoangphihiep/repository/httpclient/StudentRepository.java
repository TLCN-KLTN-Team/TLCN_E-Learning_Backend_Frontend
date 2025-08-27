package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        contextId = "identityServiceClient",
        configuration = FeignClientConfig.class
)
public interface StudentRepository {

    @PostMapping("/students")
    ApiResponse<StudentResponse> createStudent(@RequestBody StudentRequest studentRequest);

    @GetMapping("/students/by-student-id/{studentId}")
    ApiResponse<StudentResponse> getStudentByStudentId(@PathVariable String studentId);

    @GetMapping("/students/by-institution/{institutionId}")
    ApiResponse<Page<StudentResponse>> getStudentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search);

    @PutMapping("/students/{id}")
    ApiResponse<StudentResponse> updateStudent(@PathVariable String id, @RequestBody StudentRequest request);

    @DeleteMapping("/students/{id}")
    ApiResponse<Void> deleteStudent(@PathVariable String id);
}
