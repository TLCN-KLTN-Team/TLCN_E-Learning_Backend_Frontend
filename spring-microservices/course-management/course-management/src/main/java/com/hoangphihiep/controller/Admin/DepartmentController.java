package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.DepartmentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.DepartmentResponse;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class DepartmentController {

    private final CourseService adminCourseService;

    @GetMapping("/departments")
    public ApiResponse<Page<DepartmentResponse>> getDepartmentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting departments for institution: {}", institutionId);

        Page<DepartmentResponse> departments = adminCourseService.getDepartmentsByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<DepartmentResponse>>builder()
                .result(departments)
                .build();
    }

    @PostMapping("/departments")
    public ApiResponse<DepartmentResponse> createDepartment(
            @PathVariable int institutionId,
            @Valid @RequestBody DepartmentRequest request) {

        log.info("Admin creating department for institution: {}", institutionId);

        DepartmentResponse response = adminCourseService.createDepartmentForInstitution(institutionId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> updateDepartment(
            @PathVariable int institutionId,
            @PathVariable int departmentId,
            @Valid @RequestBody DepartmentRequest request) {

        log.info("Admin updating department {} for institution: {}", departmentId, institutionId);

        DepartmentResponse response = adminCourseService.updateDepartmentForInstitution(institutionId, departmentId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> getDepartmentById(
            @PathVariable int institutionId,
            @PathVariable int departmentId) {

        log.info("Admin getting department {} for institution: {}", departmentId, institutionId);

        DepartmentResponse response = adminCourseService.getDepartmentByIdForInstitution(institutionId, departmentId);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }
}
